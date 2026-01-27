// ResumeGenie Glassdoor Job Content Script

(function () {
  console.log('[ResumeGenie] Glassdoor content script loaded on:', window.location.href);

  let lastSentJobKey = '';

  function extractJobData() {
    let jobTitle = '';
    let companyName = '';
    let jobDescription = '';
    let location = '';
    let salary = '';
    let employmentType = '';

    // Job title
    jobTitle = document.querySelector('[data-test="job-title"]')?.textContent?.trim()
      || document.querySelector('[data-test="jobTitle"]')?.textContent?.trim()
      || document.querySelector('.JobDetails_jobTitle__Rw_gn')?.textContent?.trim()
      || document.querySelector('h1[class*="jobTitle"]')?.textContent?.trim()
      || '';

    // Fallback: scan for heading elements that look like job titles
    if (!jobTitle) {
      const headings = document.querySelectorAll('h1, h2');
      for (const h of headings) {
        const text = h.textContent?.trim() || '';
        if (text.length > 3 && text.length < 100 && !text.match(/^(glassdoor|reviews|salaries|jobs|interview|benefits|photos|company)/i)) {
          jobTitle = text;
          break;
        }
      }
    }

    // Fallback: page title (format: "Job Title | Company | Glassdoor")
    if (!jobTitle) {
      const pageTitle = document.title;
      const match = pageTitle.match(/^(.+?)\s*[|\-–]\s*(.+?)\s*[|\-–]/);
      if (match) {
        jobTitle = match[1].trim();
        if (!companyName) companyName = match[2].trim();
      }
    }

    // Company name
    if (!companyName) {
      companyName = document.querySelector('[data-test="employer-name"]')?.textContent?.trim()
        || document.querySelector('[data-test="employerName"]')?.textContent?.trim()
        || document.querySelector('.EmployerProfile_companyName__XjFUD')?.textContent?.trim()
        || document.querySelector('[class*="employerName"]')?.textContent?.trim()
        || '';

      // Clean up rating numbers appended to company name (e.g. "Google4.3")
      if (companyName) {
        companyName = companyName.replace(/\d+\.\d+$/, '').trim();
      }
    }

    // Job description
    jobDescription = document.querySelector('.jobDescriptionContent')?.innerText?.trim()
      || document.querySelector('[class*="JobDescription"]')?.innerText?.trim()
      || document.querySelector('[data-test="job-description"]')?.innerText?.trim()
      || document.querySelector('.desc')?.innerText?.trim()
      || '';

    // If the description element contains "Show More", try to find the full content
    if (!jobDescription || jobDescription.length < 50) {
      const descContainers = document.querySelectorAll('div[class*="description"], div[class*="Description"]');
      for (const el of descContainers) {
        const text = el.innerText?.trim() || '';
        if (text.length > 100) {
          jobDescription = text;
          break;
        }
      }
    }

    // Location
    location = document.querySelector('[data-test="location"]')?.textContent?.trim()
      || document.querySelector('[data-test="emp-location"]')?.textContent?.trim()
      || document.querySelector('[class*="location"]')?.textContent?.trim()
      || '';

    // Salary
    const salaryEl = document.querySelector('[data-test="detailSalary"]')
      || document.querySelector('[class*="SalaryEstimate"]')
      || document.querySelector('[class*="salary"]');
    if (salaryEl) {
      salary = salaryEl.textContent?.trim() || '';
    }

    // Employment type
    const detailItems = document.querySelectorAll('[data-test="detailText"], [class*="JobDetail"]');
    for (const item of detailItems) {
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
      source: 'glassdoor'
    };
  }

  function sendJobToSidePanel() {
    const jobData = extractJobData();
    console.log('[ResumeGenie] Glassdoor extracted:', {
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
          source: 'glassdoor',
          data: jobData
        }).catch(() => {});
      }
    } else {
      if (lastSentJobKey !== '') {
        lastSentJobKey = '';
        chrome.runtime.sendMessage({
          type: 'NO_JOB',
          source: 'glassdoor'
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

  // MutationObserver for SPA navigation
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
