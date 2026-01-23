// ResumeScale LinkedIn Job Saver Content Script

(function() {
  let buttonAdded = false;

  async function getSettings() {
    return chrome.storage.local.get(['serverUrl', 'token']);
  }

  async function saveJob(jobData) {
    const settings = await getSettings();

    if (!settings.token || !settings.serverUrl) {
      showNotification('Please connect ResumeScale extension first', 'error');
      return;
    }

    try {
      const response = await fetch(`${settings.serverUrl}/api/extension/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message || 'Job saved!', 'success');
      } else {
        showNotification(data.error || 'Failed to save job', 'error');
      }
    } catch (error) {
      showNotification('Could not connect to ResumeScale', 'error');
    }
  }

  function showNotification(message, type) {
    const existing = document.querySelector('.resumescale-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `resumescale-notification resumescale-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  function extractJobData() {
    // LinkedIn job page selectors
    const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim()
      || document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim()
      || document.querySelector('h1.t-24')?.textContent?.trim()
      || '';

    const companyName = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim()
      || document.querySelector('.jobs-unified-top-card__company-name a')?.textContent?.trim()
      || document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a')?.textContent?.trim()
      || '';

    const jobDescription = document.querySelector('.jobs-description__content')?.innerText?.trim()
      || document.querySelector('.jobs-box__html-content')?.innerText?.trim()
      || document.querySelector('#job-details')?.innerText?.trim()
      || '';

    const companyUrl = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.href
      || document.querySelector('.jobs-unified-top-card__company-name a')?.href
      || '';

    return {
      job_title: jobTitle,
      company_name: companyName,
      job_description: jobDescription,
      company_url: companyUrl,
      source_url: window.location.href
    };
  }

  function createSaveButton() {
    const button = document.createElement('button');
    button.className = 'resumescale-save-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      Save to ResumeScale
    `;

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      button.disabled = true;
      button.textContent = 'Saving...';

      const jobData = extractJobData();

      if (!jobData.job_description || jobData.job_description.length < 50) {
        showNotification('Could not find job description. Please expand the job details.', 'error');
        button.disabled = false;
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save to ResumeScale
        `;
        return;
      }

      await saveJob(jobData);

      button.disabled = false;
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Save to ResumeScale
      `;
    });

    return button;
  }

  function addButtonToPage() {
    if (buttonAdded) return;

    // Wait for job details to load
    const targetSelectors = [
      '.job-details-jobs-unified-top-card__content--two-pane',
      '.jobs-unified-top-card__content--two-pane',
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-details__main-content'
    ];

    let target = null;
    for (const selector of targetSelectors) {
      target = document.querySelector(selector);
      if (target) break;
    }

    if (!target) return;

    // Check if button already exists
    if (document.querySelector('.resumescale-save-btn')) return;

    const button = createSaveButton();

    // Find a good place to insert the button
    const actionsContainer = document.querySelector('.jobs-unified-top-card__actions')
      || document.querySelector('.job-details-jobs-unified-top-card__top-buttons');

    if (actionsContainer) {
      actionsContainer.prepend(button);
    } else {
      target.appendChild(button);
    }

    buttonAdded = true;
  }

  // Observe for page changes (LinkedIn is a SPA)
  const observer = new MutationObserver(() => {
    buttonAdded = false;
    setTimeout(addButtonToPage, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial attempt
  setTimeout(addButtonToPage, 1000);
})();
