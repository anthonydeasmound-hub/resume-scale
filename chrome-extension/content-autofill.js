// ResumeGenie Autofill Content Script
// Runs on career/application pages to auto-fill forms and detect submission

(function() {
  console.log('[ResumeGenie Autofill] Content script loaded on:', window.location.href);

  let autofillData = null;
  let hasAutoFilled = false;
  let isMonitoring = false;

  // Common field mappings for auto-fill
  const FIELD_MAPPINGS = {
    // First name
    firstName: ['first_name', 'firstname', 'first-name', 'fname', 'given_name', 'givenname'],
    // Last name
    lastName: ['last_name', 'lastname', 'last-name', 'lname', 'family_name', 'familyname', 'surname'],
    // Full name
    fullName: ['full_name', 'fullname', 'name', 'your_name', 'applicant_name', 'candidate_name'],
    // Email
    email: ['email', 'e-mail', 'email_address', 'emailaddress', 'user_email', 'applicant_email'],
    // Phone
    phone: ['phone', 'telephone', 'phone_number', 'phonenumber', 'mobile', 'cell', 'tel', 'contact_number'],
    // LinkedIn
    linkedin: ['linkedin', 'linkedin_url', 'linkedinurl', 'linkedin_profile', 'social_linkedin'],
    // Location/City
    location: ['location', 'city', 'address', 'current_location', 'hometown'],
  };

  // Success page indicators
  const SUCCESS_INDICATORS = [
    // URL patterns
    /thank[-_]?you/i,
    /success/i,
    /confirmation/i,
    /confirmed/i,
    /submitted/i,
    /complete/i,
    /received/i,
    /applied/i,
  ];

  // Success message patterns in page content
  const SUCCESS_MESSAGES = [
    /application.*(?:submitted|received|complete)/i,
    /thank\s*you\s*for\s*(?:applying|your\s*application)/i,
    /we\s*(?:have\s*)?received\s*your\s*application/i,
    /your\s*application\s*(?:has\s*been\s*)?(?:submitted|received)/i,
    /successfully\s*(?:applied|submitted)/i,
  ];

  // Load autofill data from storage
  async function loadAutofillData() {
    try {
      // Try chrome.storage first (extension context)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve) => {
          chrome.storage.local.get(['autofillData'], (result) => {
            resolve(result.autofillData || null);
          });
        });
      }
    } catch (e) {
      console.log('[ResumeGenie Autofill] Could not access chrome.storage');
    }
    return null;
  }

  // Find input field by various attributes
  function findInputField(fieldNames) {
    for (const fieldName of fieldNames) {
      // Check by name attribute
      let input = document.querySelector(`input[name*="${fieldName}" i]`);
      if (input) return input;

      // Check by id attribute
      input = document.querySelector(`input[id*="${fieldName}" i]`);
      if (input) return input;

      // Check by placeholder
      input = document.querySelector(`input[placeholder*="${fieldName}" i]`);
      if (input) return input;

      // Check by aria-label
      input = document.querySelector(`input[aria-label*="${fieldName}" i]`);
      if (input) return input;

      // Check by associated label
      const labels = document.querySelectorAll('label');
      for (const label of labels) {
        if (label.textContent.toLowerCase().includes(fieldName.toLowerCase())) {
          const forId = label.getAttribute('for');
          if (forId) {
            input = document.getElementById(forId);
            if (input) return input;
          }
          // Check for input inside label
          input = label.querySelector('input');
          if (input) return input;
        }
      }
    }
    return null;
  }

  // Fill a single field
  function fillField(input, value) {
    if (!input || !value) return false;

    // Focus the field
    input.focus();

    // Set the value
    input.value = value;

    // Trigger events to notify frameworks
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    console.log('[ResumeGenie Autofill] Filled field:', input.name || input.id, 'with:', value.substring(0, 20) + '...');
    return true;
  }

  // Auto-fill the form
  function autoFillForm(profile) {
    if (!profile || hasAutoFilled) return;

    console.log('[ResumeGenie Autofill] Starting auto-fill with profile:', profile);
    let filledCount = 0;

    // Parse name into first/last
    const nameParts = (profile.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Fill first name
    const firstNameField = findInputField(FIELD_MAPPINGS.firstName);
    if (fillField(firstNameField, firstName)) filledCount++;

    // Fill last name
    const lastNameField = findInputField(FIELD_MAPPINGS.lastName);
    if (fillField(lastNameField, lastName)) filledCount++;

    // Fill full name (if no separate first/last fields)
    if (!firstNameField && !lastNameField) {
      const fullNameField = findInputField(FIELD_MAPPINGS.fullName);
      if (fillField(fullNameField, profile.name)) filledCount++;
    }

    // Fill email
    const emailField = findInputField(FIELD_MAPPINGS.email);
    if (fillField(emailField, profile.email)) filledCount++;

    // Fill phone
    const phoneField = findInputField(FIELD_MAPPINGS.phone);
    if (fillField(phoneField, profile.phone)) filledCount++;

    // Fill LinkedIn
    const linkedinField = findInputField(FIELD_MAPPINGS.linkedin);
    if (fillField(linkedinField, profile.linkedin)) filledCount++;

    // Fill location
    const locationField = findInputField(FIELD_MAPPINGS.location);
    if (fillField(locationField, profile.location)) filledCount++;

    hasAutoFilled = true;
    console.log('[ResumeGenie Autofill] Auto-filled', filledCount, 'fields');

    return filledCount;
  }

  // Check if current page is a success page
  function isSuccessPage() {
    // Check URL
    const url = window.location.href.toLowerCase();
    for (const pattern of SUCCESS_INDICATORS) {
      if (pattern.test(url)) {
        console.log('[ResumeGenie Autofill] Success detected via URL pattern');
        return true;
      }
    }

    // Check page content
    const bodyText = document.body?.innerText || '';
    for (const pattern of SUCCESS_MESSAGES) {
      if (pattern.test(bodyText)) {
        console.log('[ResumeGenie Autofill] Success detected via page content');
        return true;
      }
    }

    return false;
  }

  // Handle successful application submission
  function handleApplicationSuccess() {
    if (!autofillData || !autofillData.returnUrl) {
      console.log('[ResumeGenie Autofill] No return URL configured');
      return;
    }

    console.log('[ResumeGenie Autofill] Application submitted! Redirecting to:', autofillData.returnUrl);

    // Clear the autofill data
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['autofillData']);
    }

    // Redirect back to ResumeGenie
    window.location.href = autofillData.returnUrl;
  }

  // Monitor for form submission
  function monitorFormSubmission() {
    if (isMonitoring) return;
    isMonitoring = true;

    // Listen for form submit events
    document.addEventListener('submit', (e) => {
      console.log('[ResumeGenie Autofill] Form submitted');
      // Wait a moment for the page to process, then check for success
      setTimeout(() => {
        if (isSuccessPage()) {
          handleApplicationSuccess();
        }
      }, 2000);
    }, true);

    // Monitor URL changes (for SPA applications)
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[ResumeGenie Autofill] URL changed to:', lastUrl);
        setTimeout(() => {
          if (isSuccessPage()) {
            handleApplicationSuccess();
          }
        }, 1000);
      }
    });

    urlObserver.observe(document.body, { childList: true, subtree: true });

    // Also check periodically for success indicators
    const successCheckInterval = setInterval(() => {
      if (isSuccessPage()) {
        clearInterval(successCheckInterval);
        handleApplicationSuccess();
      }
    }, 3000);

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(successCheckInterval);
    }, 5 * 60 * 1000);
  }

  // Initialize
  async function init() {
    // Skip LinkedIn pages
    if (window.location.hostname.includes('linkedin.com')) {
      return;
    }

    // Load autofill data
    autofillData = await loadAutofillData();

    if (autofillData && autofillData.profile) {
      console.log('[ResumeGenie Autofill] Found autofill data for job:', autofillData.jobId);

      // Wait for page to fully load
      if (document.readyState === 'complete') {
        autoFillForm(autofillData.profile);
        monitorFormSubmission();
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => {
            autoFillForm(autofillData.profile);
            monitorFormSubmission();
          }, 1000);
        });
      }

      // Also try after a delay (for dynamic content)
      setTimeout(() => {
        if (!hasAutoFilled) {
          autoFillForm(autofillData.profile);
        }
        monitorFormSubmission();
      }, 2000);
    }

    // Check if we're already on a success page
    if (autofillData && isSuccessPage()) {
      handleApplicationSuccess();
    }
  }

  // Listen for messages from the extension
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'AUTOFILL_DATA') {
        autofillData = message.data;
        console.log('[ResumeGenie Autofill] Received autofill data:', autofillData);
        autoFillForm(autofillData.profile);
        monitorFormSubmission();
        sendResponse({ success: true });
      }
    });
  }

  // Start
  init();
})();
