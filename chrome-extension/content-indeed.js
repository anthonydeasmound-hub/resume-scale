// ResumeGenie Indeed Job Content Script

(function () {
  console.log('[ResumeGenie] Indeed content script loaded on:', window.location.href);

  let lastSentJobKey = '';

  function extractJobData() {
    let jobTitle = '';
    let companyName = '';
    let jobDescription = '';
    let location = '';
    let salary = '';
    let employmentType = '';

    // Job title
    jobTitle = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.textContent?.trim()
      || document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim()
      || document.querySelector('h1[class*="JobTitle"]')?.textContent?.trim()
      || document.querySelector('.jobsearch-JobInfoHeader-title-container h1')?.textContent?.trim()
      || '';

    // Fallback: extract from page title (format: "Job Title - Company - Location | Indeed.com")
    if (!jobTitle) {
      const pageTitle = document.title;
      const match = pageTitle.match(/^(.+?)\s*[-–]\s*(.+?)\s*[-–]/);
      if (match) {
        jobTitle = match[1].trim();
        if (!companyName) companyName = match[2].trim();
      }
    }

    // Company name
    if (!companyName) {
      companyName = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.textContent?.trim()
        || document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim()
        || document.querySelector('.jobsearch-CompanyInfoContainer a')?.textContent?.trim()
        || document.querySelector('.jobsearch-InlineCompanyRating a')?.textContent?.trim()
        || document.querySelector('[class*="CompanyName"] a')?.textContent?.trim()
        || '';
    }

    // Job description
    jobDescription = document.querySelector('#jobDescriptionText')?.innerText?.trim()
      || document.querySelector('[id="jobDescriptionText"]')?.innerText?.trim()
      || document.querySelector('.jobsearch-JobComponent-description')?.innerText?.trim()
      || document.querySelector('[class*="jobDescription"]')?.innerText?.trim()
      || '';

    // Location
    location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim()
      || document.querySelector('[data-testid="job-location"]')?.textContent?.trim()
      || document.querySelector('.jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-locationText')?.textContent?.trim()
      || document.querySelector('[class*="CompanyLocation"]')?.textContent?.trim()
      || '';

    // Salary
    const salaryEl = document.querySelector('#salaryInfoAndJobType')
      || document.querySelector('[data-testid="attribute_snippet_testid"]')
      || document.querySelector('.jobsearch-JobMetadataHeader-item');
    if (salaryEl) {
      const text = salaryEl.textContent?.trim() || '';
      if (text.includes('$') || text.toLowerCase().includes('year') || text.toLowerCase().includes('hour')) {
        salary = text;
      }
    }

    // Also check salary container
    if (!salary) {
      const salaryContainer = document.querySelector('.salary-snippet-container')
        || document.querySelector('[class*="SalarySnippet"]');
      if (salaryContainer) {
        salary = salaryContainer.textContent?.trim() || '';
      }
    }

    // Employment type
    const metaItems = document.querySelectorAll('.jobsearch-JobMetadataHeader-item, [class*="JobMetadata"]');
    for (const item of metaItems) {
      const text = item.textContent?.trim() || '';
      if (text.includes('Full-time') || text.includes('Part-time') || text.includes('Contract') || text.includes('Temporary') || text.includes('Internship')) {
        employmentType = text;
        break;
      }
    }

    return {
      job_title: jobTitle,
      company_name: companyName,
      job_description: jobDescription,
      source_url: window.location.href,
      location: location,
      salary: salary,
      employment_type: employmentType,
      source: 'indeed'
    };
  }

  function sendJobToSidePanel() {
    const jobData = extractJobData();
    console.log('[ResumeGenie] Indeed extracted:', {
      title: jobData.job_title,
      company: jobData.company_name,
      hasDescription: jobData.job_description.length > 0
    });

    if (jobData.job_title && jobData.job_title.length > 0) {
      const jobKey = `${jobData.job_title}|${jobData.company_name}`;
      if (jobKey !== lastSentJobKey) {
        lastSentJobKey = jobKey;
        chrome.runtime.sendMessage({
          type: 'JOB_DETECTED',
          source: 'indeed',
          data: jobData
        }).catch(() => {});
      }
    } else {
      if (lastSentJobKey !== '') {
        lastSentJobKey = '';
        chrome.runtime.sendMessage({
          type: 'NO_JOB',
          source: 'indeed'
        }).catch(() => {});
      }
    }
  }

  // Debounce
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const debouncedSend = debounce(sendJobToSidePanel, 500);

  // MutationObserver for SPA-like navigation
  const observer = new MutationObserver(() => {
    debouncedSend();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial check
  setTimeout(sendJobToSidePanel, 1500);

  // Listen for messages from side panel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobData') {
      sendResponse(extractJobData());
    }
    if (request.action === 'scanForJob') {
      sendJobToSidePanel();
      sendResponse({ status: 'scanning' });
    }
    return true;
  });
})();
