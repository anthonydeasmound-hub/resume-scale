// ResumeGenie LinkedIn Job Saver Content Script

(function() {
  console.log('[ResumeGenie] Content script loaded on:', window.location.href);

  let lastSentJobKey = '';

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
      console.log('[ResumeGenie] Found from page title:', jobTitle, 'at', companyName);
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
            console.log('[ResumeGenie] Found job title via DOM scan:', jobTitle, 'fontSize:', fontSize, 'fontWeight:', fontWeight, 'rect.left:', rect.left);
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
          console.log('[ResumeGenie] Found company via link:', companyName);
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

    // Method 1: Try modern LinkedIn selectors (2024-2025 structure)
    jobDescription = document.querySelector('.jobs-description-content__text')?.innerText?.trim()
      || document.querySelector('.jobs-description__content')?.innerText?.trim()
      || document.querySelector('.jobs-box__html-content')?.innerText?.trim()
      || document.querySelector('#job-details')?.innerText?.trim()
      || document.querySelector('[data-job-details-content]')?.innerText?.trim()
      || '';

    // Method 2: Look for article or div with "About the job" heading nearby
    if (!jobDescription) {
      // Find "About the job" heading
      const headings = document.querySelectorAll('h2, h3, span, div');
      for (const heading of headings) {
        const headingText = heading.textContent?.trim().toLowerCase() || '';
        if (headingText === 'about the job' || headingText === 'about this job' || headingText === 'job description') {
          // Try to find the content after this heading
          // Method 2a: Check next siblings
          let sibling = heading.nextElementSibling;
          while (sibling) {
            const text = sibling.innerText?.trim() || '';
            if (text.length > 100) {
              jobDescription = text;
              console.log('[ResumeGenie] Found description via sibling of heading, length:', text.length);
              break;
            }
            sibling = sibling.nextElementSibling;
          }

          if (jobDescription) break;

          // Method 2b: Check parent container
          let parent = heading.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            const text = parent.innerText?.trim() || '';
            // Look for substantial content that's not just the heading
            if (text.length > 200 && text.length < 15000) {
              // Remove the heading text from the beginning if present
              let desc = text;
              if (desc.toLowerCase().startsWith('about the job')) {
                desc = desc.substring('about the job'.length).trim();
              }
              if (desc.length > 100) {
                jobDescription = desc;
                console.log('[ResumeGenie] Found description via parent of heading, length:', desc.length);
                break;
              }
            }
            parent = parent.parentElement;
          }

          if (jobDescription) break;
        }
      }
    }

    // Method 3: Find the job details container by class patterns
    if (!jobDescription) {
      const possibleContainers = document.querySelectorAll('[class*="description"], [class*="details"], [class*="job-view"]');
      for (const container of possibleContainers) {
        const rect = container.getBoundingClientRect();
        // Skip small or hidden elements
        if (rect.width < 300 || rect.height < 100) continue;

        const text = container.innerText?.trim() || '';
        // Look for substantial text that includes job-related content
        if (text.length > 300 && text.length < 15000) {
          // Check if it looks like a job description (has keywords like responsibilities, requirements, etc.)
          const looksLikeDescription = text.match(/(responsibilities|requirements|qualifications|experience|skills|about|you will|we are|the role|join|team|looking for)/i);
          if (looksLikeDescription) {
            jobDescription = text;
            console.log('[ResumeGenie] Found description via class pattern, length:', text.length);
            break;
          }
        }
      }
    }

    // Method 4: Find any large text block in the right panel (fallback)
    if (!jobDescription) {
      const textBlocks = document.querySelectorAll('div, section, article');
      for (const el of textBlocks) {
        const rect = el.getBoundingClientRect();
        // Must be in the visible area
        if (rect.width < 300 || rect.height < 100) continue;
        // Prefer content on the right side of the page (job details panel)
        if (rect.left < 300) continue;

        const text = el.innerText?.trim() || '';
        // Description should be substantial text
        if (text.length > 300 && text.length < 15000) {
          // Check it's not just navigation or other UI
          if (!text.match(/^(easy apply|save|share|show|hide|premium|people you|recent searches)/i)) {
            // Verify it looks like a job description
            if (text.match(/(responsibilities|requirements|qualifications|experience|about|the role|join us|looking for|we are)/i)) {
              jobDescription = text;
              console.log('[ResumeGenie] Found job description via text block scan, length:', text.length);
              break;
            }
          }
        }
      }
    }

    // Method 5: Last resort - find the largest text block on the page that looks like a description
    if (!jobDescription) {
      let bestCandidate = { text: '', score: 0 };
      const allDivs = document.querySelectorAll('div, article, section');

      for (const el of allDivs) {
        const text = el.innerText?.trim() || '';
        if (text.length < 200 || text.length > 20000) continue;

        // Score based on description-like keywords
        let score = 0;
        if (text.match(/responsibilities/i)) score += 3;
        if (text.match(/requirements/i)) score += 3;
        if (text.match(/qualifications/i)) score += 3;
        if (text.match(/experience/i)) score += 2;
        if (text.match(/skills/i)) score += 2;
        if (text.match(/about the (job|role|position)/i)) score += 4;
        if (text.match(/you will|you'll/i)) score += 2;
        if (text.match(/we are looking|we're looking/i)) score += 2;
        if (text.match(/\$\d+|\d+k/i)) score += 1; // salary mention

        // Penalize if it looks like navigation or repeated elements
        if (text.match(/sign in|log in|create account/i)) score -= 5;
        if (text.match(/people also viewed|similar jobs/i)) score -= 3;

        if (score > bestCandidate.score && score >= 3) {
          bestCandidate = { text, score };
        }
      }

      if (bestCandidate.text) {
        jobDescription = bestCandidate.text;
        console.log('[ResumeGenie] Found description via scoring, score:', bestCandidate.score, 'length:', jobDescription.length);
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
      posted_date: postedDate,
      source: 'linkedin'
    };
  }

  function sendJobToSidePanel() {
    const jobData = extractJobData();
    console.log('[ResumeGenie] Extracted job data:', {
      title: jobData.job_title,
      company: jobData.company_name,
      hasDescription: jobData.job_description.length > 0
    });

    if (jobData.job_title && jobData.job_title.length > 0) {
      const jobKey = `${jobData.job_title}|${jobData.company_name}`;

      // Only send if it's a new/different job
      if (jobKey !== lastSentJobKey) {
        lastSentJobKey = jobKey;
        console.log('[ResumeGenie] Sending job to side panel:', jobData.job_title);
        chrome.runtime.sendMessage({
          type: 'JOB_DETECTED',
          source: 'linkedin',
          data: jobData
        }).catch(() => {
          // Side panel or background may not be ready
        });
      }
    } else {
      if (lastSentJobKey !== '') {
        lastSentJobKey = '';
        chrome.runtime.sendMessage({
          type: 'NO_JOB',
          source: 'linkedin'
        }).catch(() => {});
      }
      console.log('[ResumeGenie] No job title found. Page title:', document.title);
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

  const debouncedSend = debounce(sendJobToSidePanel, 500);

  // Watch for DOM changes (LinkedIn is a SPA)
  const observer = new MutationObserver(() => {
    debouncedSend();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial check after page loads
  console.log('[ResumeGenie] Will check for job in 1.5 seconds...');
  setTimeout(() => {
    console.log('[ResumeGenie] Running initial job check');
    sendJobToSidePanel();
  }, 1500);

  // Listen for messages from the side panel (via background)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobData') {
      const jobData = extractJobData();
      sendResponse(jobData);
    }
    if (request.action === 'scanForJob') {
      sendJobToSidePanel();
      sendResponse({ status: 'scanning' });
    }
    return true; // Keep the message channel open for async response
  });
})();
