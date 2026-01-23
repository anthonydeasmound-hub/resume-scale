// ResumeScale LinkedIn Job Saver Content Script

(function() {
  console.log('[ResumeScale] Content script loaded on:', window.location.href);

  let notifiedJobs = new Set();
  let lastCheckedUrl = '';

  // Load previously notified jobs from Chrome storage
  chrome.storage.local.get(['notifiedJobs'], (result) => {
    if (result.notifiedJobs && Array.isArray(result.notifiedJobs)) {
      notifiedJobs = new Set(result.notifiedJobs);
      console.log('[ResumeScale] Loaded', notifiedJobs.size, 'previously notified jobs');
    }
  });

  // Save notified jobs to Chrome storage
  function saveNotifiedJobs() {
    chrome.storage.local.set({ notifiedJobs: Array.from(notifiedJobs) });
  }

  function extractJobData() {
    // Job title - LinkedIn uses obfuscated classes, need multiple strategies
    let jobTitle = '';
    let companyName = '';

    // Method 1: Get from page title (format is "Job Title at Company | LinkedIn")
    const pageTitle = document.title;
    const titleMatch = pageTitle.match(/^(.+?)\s+(?:at|-)\s+(.+?)\s*[|\-–]/);
    if (titleMatch) {
      jobTitle = titleMatch[1].trim();
      companyName = titleMatch[2].trim();
      console.log('[ResumeScale] Found from page title:', jobTitle, 'at', companyName);
    }

    // Method 2: Find the job details panel and extract from there
    if (!jobTitle) {
      // The job details are in the RIGHT side panel (typically x > 500px on desktop)
      // Look for large text that looks like a job title
      const allElements = document.querySelectorAll('h1, h2, h3, a, span, div, p');

      for (const el of allElements) {
        const rect = el.getBoundingClientRect();

        // Skip if element is hidden or very small
        if (rect.width === 0 || rect.height === 0) continue;

        // IMPORTANT: Only look at elements on the RIGHT side (job details panel)
        // The left panel (job list) typically ends around x=500-600
        if (rect.left < 400) continue;

        const text = el.textContent?.trim() || '';

        // Skip if text is too short, too long, or has line breaks
        if (text.length < 5 || text.length > 80 || text.includes('\n')) continue;

        // Skip common non-title text
        if (text.match(/^(easy apply|save|share|show|hide|apply|report|follow|see more|message|jobs based|results|premium)/i)) continue;
        if (text.match(/^\d+\s*(applicant|view|connection|follower)/i)) continue;
        if (text.match(/(your preferences|how promoted)/i)) continue;

        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight) || 400;

        // Job titles are typically large (18px+) and often bold
        if (fontSize >= 18 && fontWeight >= 400 && rect.top < 400) {
          // Check if it looks like a job title (contains role-like words or is in title case)
          const looksLikeTitle = text.match(/(engineer|developer|manager|director|analyst|designer|specialist|executive|lead|senior|junior|associate|coordinator|consultant|architect|scientist|administrator|representative|account|sales|marketing|intern|officer|head|vp|president|chief)/i)
            || (text[0] === text[0].toUpperCase() && !text.match(/^(the|a|an|and|or|but|in|on|at|to|for|jobs|about|people|premium)\b/i));

          if (looksLikeTitle) {
            jobTitle = text;
            console.log('[ResumeScale] Found job title via DOM scan:', jobTitle, 'fontSize:', fontSize, 'fontWeight:', fontWeight, 'rect.left:', rect.left);
            break;
          }
        }
      }
    }

    // Method 3: Look for company name if not found yet
    if (!companyName) {
      // Company names often appear as links or near company logos
      const companyLinks = document.querySelectorAll('a[href*="/company/"]');
      for (const link of companyLinks) {
        const text = link.textContent?.trim();
        if (text && text.length > 1 && text.length < 60 && !text.match(/^(follow|see|view|show)/i)) {
          companyName = text;
          console.log('[ResumeScale] Found company via link:', companyName);
          break;
        }
      }
    }

    // Method 4: Legacy selectors as final fallback
    if (!jobTitle) {
      jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim()
        || document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim()
        || document.querySelector('h1.t-24')?.textContent?.trim()
        || '';
    }

    if (!companyName) {
      companyName = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim()
        || document.querySelector('.jobs-unified-top-card__company-name a')?.textContent?.trim()
        || document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a')?.textContent?.trim()
        || '';
    }

    // Job description - look for "About the job" section or similar
    let jobDescription = '';

    // Method 1: Try legacy selectors
    jobDescription = document.querySelector('.jobs-description__content')?.innerText?.trim()
      || document.querySelector('.jobs-box__html-content')?.innerText?.trim()
      || document.querySelector('#job-details')?.innerText?.trim()
      || document.querySelector('.jobs-description-content__text')?.innerText?.trim()
      || '';

    // Method 2: Find "About the job" section by scanning the page
    if (!jobDescription) {
      const allElements = document.querySelectorAll('h2, h3, div, section');
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        if (text.toLowerCase().startsWith('about the job') || text.toLowerCase().startsWith('about this job')) {
          // Get the parent or next sibling content
          const parent = el.closest('section') || el.closest('div') || el.parentElement;
          if (parent) {
            const desc = parent.innerText?.trim() || '';
            if (desc.length > 100) {
              jobDescription = desc;
              console.log('[ResumeScale] Found job description via "About the job" section, length:', desc.length);
              break;
            }
          }
        }
      }
    }

    // Method 3: Find any large text block in the right panel that looks like a description
    if (!jobDescription) {
      const textBlocks = document.querySelectorAll('div, section, article');
      for (const el of textBlocks) {
        const rect = el.getBoundingClientRect();
        // Must be in the right panel and below the header
        if (rect.left < 400 || rect.top < 300) continue;

        const text = el.innerText?.trim() || '';
        // Description should be substantial text
        if (text.length > 200 && text.length < 10000) {
          // Check it's not just navigation or other UI
          if (!text.match(/^(easy apply|save|share|show|hide|premium|people you)/i)) {
            jobDescription = text;
            console.log('[ResumeScale] Found job description via text block scan, length:', text.length);
            break;
          }
        }
      }
    }

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
    console.log('[ResumeScale] showJobNotification called with:', jobTitle);

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
    console.log('[ResumeScale] Checking for new job...');
    const jobData = extractJobData();
    console.log('[ResumeScale] Extracted job data:', {
      title: jobData.job_title,
      company: jobData.company_name,
      hasDescription: jobData.job_description.length > 0
    });

    if (jobData.job_title && jobData.job_title.length > 0) {
      // Create a unique key for this job
      const jobKey = `${jobData.job_title}|${jobData.company_name}`;
      console.log('[ResumeScale] Job key:', jobKey, 'Already notified:', notifiedJobs.has(jobKey));

      if (!notifiedJobs.has(jobKey)) {
        notifiedJobs.add(jobKey);
        saveNotifiedJobs(); // Persist to Chrome storage
        console.log('[ResumeScale] Showing notification for:', jobData.job_title);
        showJobNotification(jobData.job_title);
      }
    } else {
      console.log('[ResumeScale] No job title found. Page title:', document.title);
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
  console.log('[ResumeScale] Will check for job in 1.5 seconds...');
  setTimeout(() => {
    console.log('[ResumeScale] Running initial job check');
    checkForNewJob();
  }, 1500);

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobData') {
      const jobData = extractJobData();
      sendResponse(jobData);
    }
    return true; // Keep the message channel open for async response
  });
})();
