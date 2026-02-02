// ResumeGenie LinkedIn Job Saver Content Script

(function() {
  console.log('[ResumeGenie] Content script loaded on:', window.location.href);

  let lastSentJobKey = '';

  // Debug function to find apply URLs in page data
  function debugFindApplyUrls() {
    console.log('[ResumeGenie DEBUG] Searching for apply URLs...');

    // Get current job ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentJobId = urlParams.get('currentJobId');
    console.log('[ResumeGenie DEBUG] Current job ID:', currentJobId);

    // Search all scripts for URL patterns
    const scripts = document.querySelectorAll('script:not([src])');
    let foundUrls = [];

    scripts.forEach((script, idx) => {
      const content = script.textContent || '';

      // Look for any external URLs (not linkedin.com)
      const urlMatches = content.match(/https?:\/\/(?!(?:www\.)?linkedin\.com)[^\s"'<>]+/g);
      if (urlMatches) {
        urlMatches.forEach(url => {
          // Filter for job-related URLs
          if (url.includes('job') || url.includes('career') || url.includes('apply') ||
              url.includes('greenhouse') || url.includes('lever') || url.includes('workday') ||
              url.includes('icims') || url.includes('taleo') || url.includes('gem.com') ||
              url.includes('ashby') || url.includes('bamboo') || url.includes('smartrecruiters')) {
            foundUrls.push(url);
          }
        });
      }

      // Also look for the job ID near any URL
      if (currentJobId && content.includes(currentJobId)) {
        console.log('[ResumeGenie DEBUG] Found script containing job ID', currentJobId);
        // Extract surrounding context
        const idIndex = content.indexOf(currentJobId);
        const context = content.substring(Math.max(0, idIndex - 200), Math.min(content.length, idIndex + 500));
        // Look for URLs in this context
        const contextUrls = context.match(/https?:\/\/[^\s"'<>]+/g);
        if (contextUrls) {
          contextUrls.forEach(url => {
            if (!url.includes('linkedin.com')) {
              console.log('[ResumeGenie DEBUG] URL near job ID:', url);
              foundUrls.push(url);
            }
          });
        }
      }
    });

    // Deduplicate
    foundUrls = [...new Set(foundUrls)];
    if (foundUrls.length > 0) {
      console.log('[ResumeGenie DEBUG] Found potential apply URLs:', foundUrls);
    } else {
      console.log('[ResumeGenie DEBUG] No external job URLs found in scripts');
    }

    // Also check the Apply button's attributes and parent elements
    const applyBtn = document.querySelector('button[aria-label*="Apply"], .jobs-apply-button');
    if (applyBtn) {
      console.log('[ResumeGenie DEBUG] Apply button found:', {
        tagName: applyBtn.tagName,
        className: applyBtn.className,
        ariaLabel: applyBtn.getAttribute('aria-label'),
        allAttributes: Array.from(applyBtn.attributes).map(a => `${a.name}="${a.value}"`).join(', ')
      });

      // Check parent elements for data
      let parent = applyBtn.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        const dataAttrs = Array.from(parent.attributes).filter(a => a.name.startsWith('data-'));
        if (dataAttrs.length > 0) {
          console.log('[ResumeGenie DEBUG] Parent', i, 'data attributes:', dataAttrs.map(a => `${a.name}="${a.value}"`).join(', '));
        }
        parent = parent.parentElement;
      }
    }

    return foundUrls;
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

    // Application URL - try to find external apply link
    let applyUrl = '';
    let isEasyApply = false;

    // Check for Easy Apply button (application happens on LinkedIn)
    const easyApplyBtn = document.querySelector('.jobs-apply-button--top-card .jobs-apply-button')
      || document.querySelector('button[aria-label*="Easy Apply"]')
      || document.querySelector('.jobs-s-apply button');

    if (easyApplyBtn) {
      const btnText = easyApplyBtn.textContent?.toLowerCase() || '';
      isEasyApply = btnText.includes('easy apply');
    }

    // Look for external apply link
    if (!isEasyApply) {
      // METHOD 1: Extract from JSON-LD structured data (most reliable)
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          // Check for direct applyUrl
          if (data.directApply === false && data.applyUrl) {
            applyUrl = data.applyUrl;
            console.log('[ResumeGenie] Found apply URL via JSON-LD applyUrl:', applyUrl);
            break;
          }
          // Check for sameAs or url fields that might be external
          if (data.hiringOrganization?.sameAs && !data.hiringOrganization.sameAs.includes('linkedin.com')) {
            // This is company URL, not apply URL, but note it
          }
          // Check for application instructions
          if (data.applicationContact?.url) {
            applyUrl = data.applicationContact.url;
            console.log('[ResumeGenie] Found apply URL via JSON-LD applicationContact:', applyUrl);
            break;
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }

      // METHOD 2: Look in LinkedIn's embedded data (code/data in script tags)
      if (!applyUrl) {
        const allScripts = document.querySelectorAll('script:not([src])');
        for (const script of allScripts) {
          const content = script.textContent || '';
          // Look for applyUrl or companyApplyUrl patterns
          const applyUrlMatch = content.match(/"applyUrl"\s*:\s*"([^"]+)"/);
          if (applyUrlMatch && applyUrlMatch[1] && !applyUrlMatch[1].includes('linkedin.com')) {
            applyUrl = applyUrlMatch[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            console.log('[ResumeGenie] Found apply URL via script content (applyUrl):', applyUrl);
            break;
          }
          const companyApplyMatch = content.match(/"companyApplyUrl"\s*:\s*"([^"]+)"/);
          if (companyApplyMatch && companyApplyMatch[1] && !companyApplyMatch[1].includes('linkedin.com')) {
            applyUrl = companyApplyMatch[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            console.log('[ResumeGenie] Found apply URL via script content (companyApplyUrl):', applyUrl);
            break;
          }
          // Look for externalApplyUrl
          const externalMatch = content.match(/"externalApply(?:Url)?"\s*:\s*"([^"]+)"/i);
          if (externalMatch && externalMatch[1] && !externalMatch[1].includes('linkedin.com')) {
            applyUrl = externalMatch[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            console.log('[ResumeGenie] Found apply URL via script content (externalApply):', applyUrl);
            break;
          }
          // Look for offsite apply URL
          const offsiteMatch = content.match(/"offsiteApply(?:Url)?"\s*:\s*"([^"]+)"/i);
          if (offsiteMatch && offsiteMatch[1] && !offsiteMatch[1].includes('linkedin.com')) {
            applyUrl = offsiteMatch[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
            console.log('[ResumeGenie] Found apply URL via script content (offsiteApply):', applyUrl);
            break;
          }
        }
      }

      // METHOD 3: Check for LinkedIn's job apply redirect URL pattern
      if (!applyUrl) {
        const applyLinks = document.querySelectorAll('a[href*="externalApply"], a[href*="applyUrl"]');
        for (const link of applyLinks) {
          if (link.href) {
            // LinkedIn redirects have the actual URL as a parameter
            try {
              const url = new URL(link.href);
              const redirectUrl = url.searchParams.get('url') || url.searchParams.get('dest');
              if (redirectUrl && !redirectUrl.includes('linkedin.com')) {
                applyUrl = decodeURIComponent(redirectUrl);
                console.log('[ResumeGenie] Found apply URL via redirect param:', applyUrl);
                break;
              }
            } catch (e) {
              // Not a valid URL
            }
          }
        }
      }

      // METHOD 4: Direct apply button that's a link
      if (!applyUrl) {
        const applyLink = document.querySelector('a.jobs-apply-button')
          || document.querySelector('a[data-control-name="jobdetails_topcard_inapply"]')
          || document.querySelector('.jobs-apply-button--top-card a');

        if (applyLink && applyLink.href && !applyLink.href.includes('linkedin.com/jobs')) {
          applyUrl = applyLink.href;
          console.log('[ResumeGenie] Found apply URL via link:', applyUrl);
        }
      }

      // METHOD 5: Look for "Apply on company site" or similar text
      if (!applyUrl) {
        const allLinks = document.querySelectorAll('a');
        for (const link of allLinks) {
          const text = link.textContent?.toLowerCase() || '';
          const ariaLabel = link.getAttribute('aria-label')?.toLowerCase() || '';
          if ((text.includes('apply') && !text.includes('easy')) ||
              ariaLabel.includes('apply') ||
              text.includes('company site') ||
              text.includes('external')) {
            // Make sure it's an external link, not a LinkedIn link
            if (link.href && !link.href.includes('linkedin.com')) {
              applyUrl = link.href;
              console.log('[ResumeGenie] Found external apply URL:', applyUrl);
              break;
            }
          }
        }
      }

      // METHOD 6: Check for data attributes on apply buttons
      if (!applyUrl) {
        const applyButtons = document.querySelectorAll('button[class*="apply"], a[class*="apply"]');
        for (const btn of applyButtons) {
          // Check for data attributes that might contain the URL
          const dataUrl = btn.getAttribute('data-url') ||
                          btn.getAttribute('data-href') ||
                          btn.getAttribute('data-apply-url') ||
                          btn.getAttribute('data-entity-urn');
          if (dataUrl && !dataUrl.includes('linkedin.com')) {
            applyUrl = dataUrl;
            console.log('[ResumeGenie] Found apply URL via data attribute:', applyUrl);
            break;
          }
        }
      }

      // METHOD 7: Look for the apply URL in any element's data attributes
      if (!applyUrl) {
        const elementsWithData = document.querySelectorAll('[data-job-id], [data-entity-urn*="jobPosting"]');
        for (const el of elementsWithData) {
          // Check all data attributes
          for (const attr of el.attributes) {
            if (attr.name.startsWith('data-') && attr.value) {
              // Check if value looks like an external URL
              if (attr.value.startsWith('http') && !attr.value.includes('linkedin.com')) {
                applyUrl = attr.value;
                console.log('[ResumeGenie] Found apply URL via element data attr:', applyUrl);
                break;
              }
            }
          }
          if (applyUrl) break;
        }
      }

      // METHOD 8: Use debug search as last resort
      if (!applyUrl) {
        const debugUrls = debugFindApplyUrls();
        if (debugUrls.length > 0) {
          // Pick the most likely one (prefer greenhouse, lever, gem, etc.)
          const atsUrls = debugUrls.filter(u =>
            u.includes('greenhouse') || u.includes('lever') || u.includes('gem.com') ||
            u.includes('ashby') || u.includes('workday') || u.includes('icims') ||
            u.includes('smartrecruiters') || u.includes('bamboo') || u.includes('taleo')
          );
          applyUrl = atsUrls[0] || debugUrls[0];
          console.log('[ResumeGenie] Found apply URL via debug search:', applyUrl);
        }
      }
    }

    // Log final apply URL status
    if (applyUrl) {
      console.log('[ResumeGenie] Final apply URL:', applyUrl);
    } else if (!isEasyApply) {
      console.log('[ResumeGenie] WARNING: External apply job but no URL found!');
    }

    return {
      job_title: jobTitle,
      company_name: companyName,
      job_description: jobDescription,
      company_url: companyUrl,
      source_url: window.location.href,
      apply_url: applyUrl,
      is_easy_apply: isEasyApply,
      location: location,
      salary: salary,
      benefits: benefits,
      recruiter: recruiter,
      employment_type: employmentType,
      posted_date: postedDate,
      source: 'linkedin'
    };
  }

  // Helper to safely send messages (handles extension context invalidation)
  function safeSendMessage(message) {
    try {
      // Check if chrome.runtime is still available
      if (!chrome.runtime?.id) {
        console.log('[ResumeGenie] Extension context invalidated, skipping message');
        return;
      }
      chrome.runtime.sendMessage(message).catch((err) => {
        // Silently ignore - extension may have been reloaded
        if (err.message?.includes('Extension context invalidated')) {
          console.log('[ResumeGenie] Extension was reloaded, refresh the page to reconnect');
        }
      });
    } catch (err) {
      // Extension context is invalid, stop trying to send messages
      console.log('[ResumeGenie] Extension context invalid');
    }
  }

  function sendJobToSidePanel() {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      return;
    }

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
        safeSendMessage({
          type: 'JOB_DETECTED',
          source: 'linkedin',
          data: jobData
        });
      }
    } else {
      if (lastSentJobKey !== '') {
        lastSentJobKey = '';
        safeSendMessage({
          type: 'NO_JOB',
          source: 'linkedin'
        });
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

  // Function to find and click the Apply button
  function clickApplyButton() {
    console.log('[ResumeGenie] Looking for Apply button...');

    // Look for the Apply button (not Easy Apply)
    // The external Apply button typically has an external link icon
    const applyButtons = document.querySelectorAll('button, a');

    for (const btn of applyButtons) {
      const text = btn.textContent?.trim().toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      const className = btn.className?.toLowerCase() || '';

      // Check if this is an Apply button (but not Easy Apply)
      const isApplyButton = (
        (text === 'apply' || text.startsWith('apply ') || ariaLabel.includes('apply')) &&
        !text.includes('easy') &&
        !ariaLabel.includes('easy')
      );

      // Also check for apply button classes
      const hasApplyClass = className.includes('jobs-apply-button') || className.includes('apply');

      if (isApplyButton || hasApplyClass) {
        // Make sure it's visible
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Check if it's not an Easy Apply button by looking at the text content
          const fullText = btn.textContent?.toLowerCase() || '';
          if (!fullText.includes('easy')) {
            console.log('[ResumeGenie] Found Apply button, clicking...', btn);
            btn.click();
            return { clicked: true };
          }
        }
      }
    }

    // Try more specific selectors
    const specificSelectors = [
      '.jobs-apply-button--top-card button:not([aria-label*="Easy"])',
      '.jobs-s-apply button:not([aria-label*="Easy"])',
      'button[aria-label="Apply"]',
      'a[aria-label="Apply"]',
      '.artdeco-button--primary:not([aria-label*="Easy"])'
    ];

    for (const selector of specificSelectors) {
      try {
        const btn = document.querySelector(selector);
        if (btn) {
          const text = btn.textContent?.toLowerCase() || '';
          if (!text.includes('easy')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log('[ResumeGenie] Found Apply button via selector, clicking...', selector);
              btn.click();
              return { clicked: true };
            }
          }
        }
      } catch (e) {
        // Selector might be invalid
      }
    }

    console.log('[ResumeGenie] Apply button not found');
    return { clicked: false, error: 'Apply button not found' };
  }

  // Listen for messages from the side panel (via background)
  try {
    if (chrome.runtime?.id) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          if (request.action === 'getJobData') {
            const jobData = extractJobData();
            sendResponse(jobData);
          }
          if (request.action === 'scanForJob') {
            sendJobToSidePanel();
            sendResponse({ status: 'scanning' });
          }
          if (request.action === 'clickApplyButton') {
            const result = clickApplyButton();
            sendResponse(result);
          }
        } catch (err) {
          console.log('[ResumeGenie] Error handling message:', err);
          sendResponse({ error: err.message });
        }
        return true; // Keep the message channel open for async response
      });
    }
  } catch (err) {
    console.log('[ResumeGenie] Could not set up message listener');
  }
})();
