// ResumeScale LinkedIn Job Saver Content Script

(function() {
  let notifiedJobs = new Set();
  let lastCheckedUrl = '';

  function extractJobData() {
    // Job title - try multiple selectors
    const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim()
      || document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim()
      || document.querySelector('h1.t-24')?.textContent?.trim()
      || document.querySelector('.jobs-details-top-card__job-title')?.textContent?.trim()
      || document.querySelector('h1[class*="job-title"]')?.textContent?.trim()
      || '';

    // Company name
    const companyName = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim()
      || document.querySelector('.jobs-unified-top-card__company-name a')?.textContent?.trim()
      || document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a')?.textContent?.trim()
      || document.querySelector('.jobs-details-top-card__company-url')?.textContent?.trim()
      || '';

    // Job description
    const jobDescription = document.querySelector('.jobs-description__content')?.innerText?.trim()
      || document.querySelector('.jobs-box__html-content')?.innerText?.trim()
      || document.querySelector('#job-details')?.innerText?.trim()
      || document.querySelector('.jobs-description-content__text')?.innerText?.trim()
      || '';

    // Company URL
    const companyUrl = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.href
      || document.querySelector('.jobs-unified-top-card__company-name a')?.href
      || '';

    // Location
    const location = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container .tvm__text')?.textContent?.trim()
      || document.querySelector('.jobs-unified-top-card__bullet')?.textContent?.trim()
      || document.querySelector('.job-details-jobs-unified-top-card__workplace-type')?.textContent?.trim()
      || '';

    // Salary - LinkedIn shows this in various places
    let salary = '';
    const salarySelectors = [
      '.job-details-jobs-unified-top-card__job-insight span',
      '.jobs-unified-top-card__job-insight span',
      '.compensation__salary',
      '[class*="salary"]'
    ];
    for (const selector of salarySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        if (text.includes('$') || text.toLowerCase().includes('year') || text.toLowerCase().includes('hour')) {
          salary = text;
          break;
        }
      }
      if (salary) break;
    }

    // Also check the job insights section for salary
    const insightItems = document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight');
    for (const item of insightItems) {
      const text = item.textContent?.trim() || '';
      if ((text.includes('$') || text.toLowerCase().includes('/yr') || text.toLowerCase().includes('/hr')) && !salary) {
        salary = text.replace(/\s+/g, ' ');
      }
    }

    // Benefits - look for benefits section
    let benefits = '';
    const benefitsSection = document.querySelector('[class*="benefits"]')
      || document.querySelector('.jobs-description__benefits');
    if (benefitsSection) {
      benefits = benefitsSection.innerText?.trim() || '';
    }
    // Also check in job description for benefits keywords
    if (!benefits && jobDescription) {
      const benefitsMatch = jobDescription.match(/benefits[:\s]*([\s\S]*?)(?=\n\n|requirements|qualifications|$)/i);
      if (benefitsMatch) {
        benefits = benefitsMatch[1]?.trim().substring(0, 500) || '';
      }
    }

    // Hiring manager / Recruiter - LinkedIn shows "Meet the hiring team" section
    let recruiter = '';
    const hiringTeamSection = document.querySelector('.hirer-card__hirer-information')
      || document.querySelector('.jobs-poster__name')
      || document.querySelector('[class*="hiring-team"]')
      || document.querySelector('.job-details-jobs-unified-top-card__hiring-team-member');
    if (hiringTeamSection) {
      const recruiterName = hiringTeamSection.querySelector('a')?.textContent?.trim()
        || hiringTeamSection.querySelector('.hirer-card__hirer-name')?.textContent?.trim()
        || hiringTeamSection.textContent?.trim();
      const recruiterTitle = hiringTeamSection.querySelector('.hirer-card__hirer-job-title')?.textContent?.trim() || '';
      recruiter = recruiterName ? `${recruiterName}${recruiterTitle ? ' - ' + recruiterTitle : ''}` : '';
    }

    // Employment type (Full-time, Part-time, Contract, etc.)
    let employmentType = '';
    for (const item of insightItems) {
      const text = item.textContent?.trim() || '';
      if (text.includes('Full-time') || text.includes('Part-time') || text.includes('Contract') || text.includes('Internship')) {
        employmentType = text.split('·')[0]?.trim() || text;
        break;
      }
    }

    // Posted date
    let postedDate = '';
    const timeElement = document.querySelector('.jobs-unified-top-card__posted-date')
      || document.querySelector('.job-details-jobs-unified-top-card__primary-description-container time');
    if (timeElement) {
      postedDate = timeElement.textContent?.trim() || '';
    }

    return {
      job_title: jobTitle,
      company_name: companyName,
      job_description: jobDescription,
      company_url: companyUrl,
      source_url: window.location.href,
      location: location,
      salary: salary,
      benefits: benefits,
      recruiter: recruiter,
      employment_type: employmentType,
      posted_date: postedDate
    };
  }

  function showJobNotification(jobTitle) {
    // Remove any existing notification
    const existing = document.querySelector('.resumescale-job-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'resumescale-job-notification';
    notification.innerHTML = `
      <div class="resumescale-notif-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      </div>
      <div class="resumescale-notif-content">
        <div class="resumescale-notif-title">Import "${jobTitle}"</div>
        <div class="resumescale-notif-subtitle">Click the ResumeScale extension</div>
      </div>
      <button class="resumescale-notif-close">&times;</button>
    `;

    // Close button handler
    notification.querySelector('.resumescale-notif-close').addEventListener('click', (e) => {
      e.stopPropagation();
      notification.remove();
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('resumescale-notif-fadeout');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    document.body.appendChild(notification);
  }

  function checkForNewJob() {
    const jobData = extractJobData();

    if (jobData.job_title && jobData.job_title.length > 0) {
      // Create a unique key for this job
      const jobKey = `${jobData.job_title}|${jobData.company_name}`;

      if (!notifiedJobs.has(jobKey)) {
        notifiedJobs.add(jobKey);
        showJobNotification(jobData.job_title);
      }
    }
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedCheck = debounce(checkForNewJob, 500);

  // Watch for DOM changes (LinkedIn is a SPA)
  const observer = new MutationObserver(() => {
    debouncedCheck();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial check after page loads
  setTimeout(checkForNewJob, 1500);

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobData') {
      const jobData = extractJobData();
      sendResponse(jobData);
    }
    return true; // Keep the message channel open for async response
  });
})();
