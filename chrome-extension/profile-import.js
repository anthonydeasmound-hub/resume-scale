// ResumeGenie LinkedIn Profile Import Content Script
// Version 4.0 - Uses AI to parse entire page HTML

(function() {
  // Check if this is an auto-import request
  const urlParams = new URLSearchParams(window.location.search);
  const isAutoImport = urlParams.get('resumegenie_import') === 'auto';

  if (!isAutoImport) {
    return; // Not an import request, do nothing
  }

  console.log('[ResumeGenie] Auto-import detected, starting profile capture...');

  // Show loading overlay
  function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'resumegenie-import-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          padding: 32px 48px;
          border-radius: 16px;
          text-align: center;
          max-width: 400px;
        ">
          <div style="
            width: 48px;
            height: 48px;
            border: 4px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          "></div>
          <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">Importing Profile</h2>
          <p id="resumegenie-status" style="margin: 0; color: #64748b; font-size: 14px;">Loading your profile...</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(overlay);
  }

  function updateStatus(message) {
    const status = document.getElementById('resumegenie-status');
    if (status) status.textContent = message;
  }

  function showError(message) {
    const overlay = document.getElementById('resumegenie-import-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: white;
            padding: 32px 48px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
          ">
            <div style="
              width: 48px;
              height: 48px;
              background: #fee2e2;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
            ">
              <svg width="24" height="24" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">Import Failed</h2>
            <p style="margin: 0 0 16px; color: #64748b; font-size: 14px;">${message}</p>
            <button onclick="window.close()" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
            ">Close</button>
          </div>
        </div>
      `;
    }
  }

  async function getSettings() {
    return chrome.storage.local.get(['serverUrl', 'token']);
  }

  // Main import function
  async function runImport() {
    showLoadingOverlay();

    try {
      // Check if extension is connected
      const settings = await getSettings();
      if (!settings.token || !settings.serverUrl) {
        showError('Extension not connected. Please connect ResumeGenie extension first via the popup.');
        return;
      }

      // Wait for page to load - LinkedIn loads content dynamically
      updateStatus('Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Scroll down slowly to trigger lazy loading of ALL sections
      updateStatus('Loading profile sections...');

      // Multiple scroll passes to ensure everything loads
      for (let pass = 0; pass < 2; pass++) {
        const scrollHeight = document.body.scrollHeight;
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
          window.scrollTo(0, (scrollHeight / steps) * i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        // Wait at bottom for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Scroll back to top
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the entire page HTML (don't click any links that might navigate away)
      updateStatus('Capturing profile data...');
      const pageHtml = document.documentElement.outerHTML;

      console.log('[ResumeGenie] Captured HTML length:', pageHtml.length);

      // Capture profile photo as base64 (since server can't download from LinkedIn)
      let profilePhotoBase64 = '';
      try {
        updateStatus('Capturing profile photo...');

        // Find profile photo - LinkedIn uses various selectors
        const photoSelectors = [
          '.pv-top-card-profile-picture__image',
          '.profile-photo-edit__preview',
          'img.pv-top-card__photo',
          'img[class*="profile-photo"]',
          'img[class*="pv-top-card"]',
          '.pv-top-card__photo-wrapper img',
          'button[aria-label*="photo"] img',
          'img[alt*="profile photo"]',
        ];

        let photoImg = null;
        for (const selector of photoSelectors) {
          photoImg = document.querySelector(selector);
          if (photoImg && photoImg.src && photoImg.complete) {
            console.log('[ResumeGenie] Found profile photo with selector:', selector);
            break;
          }
          photoImg = null;
        }

        // Fallback: find any LinkedIn CDN image that looks like a profile photo
        if (!photoImg) {
          const allImages = document.querySelectorAll('img[src*="licdn.com"]');
          for (const img of allImages) {
            if (img.src.includes('profile') || img.src.includes('shrink_400') || img.src.includes('shrink_800')) {
              if (img.complete && img.naturalWidth > 50) {
                photoImg = img;
                console.log('[ResumeGenie] Found profile photo via CDN pattern');
                break;
              }
            }
          }
        }

        if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = photoImg.naturalWidth;
          canvas.height = photoImg.naturalHeight;
          const ctx = canvas.getContext('2d');

          // Handle CORS by creating a new image with crossorigin
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';

          await new Promise((resolve, reject) => {
            tempImg.onload = () => {
              ctx.drawImage(tempImg, 0, 0);
              try {
                profilePhotoBase64 = canvas.toDataURL('image/jpeg', 0.9);
                console.log('[ResumeGenie] Captured profile photo, size:', profilePhotoBase64.length);
              } catch (e) {
                console.log('[ResumeGenie] Canvas toDataURL failed (CORS):', e.message);
                // Try with original image anyway
                try {
                  ctx.drawImage(photoImg, 0, 0);
                  profilePhotoBase64 = canvas.toDataURL('image/jpeg', 0.9);
                  console.log('[ResumeGenie] Captured profile photo (direct), size:', profilePhotoBase64.length);
                } catch (e2) {
                  console.log('[ResumeGenie] Direct capture also failed:', e2.message);
                }
              }
              resolve();
            };
            tempImg.onerror = () => {
              // Try direct capture
              try {
                ctx.drawImage(photoImg, 0, 0);
                profilePhotoBase64 = canvas.toDataURL('image/jpeg', 0.9);
                console.log('[ResumeGenie] Captured profile photo (fallback), size:', profilePhotoBase64.length);
              } catch (e) {
                console.log('[ResumeGenie] Fallback capture failed:', e.message);
              }
              resolve();
            };
            tempImg.src = photoImg.src;

            // Timeout after 3 seconds
            setTimeout(resolve, 3000);
          });
        } else {
          console.log('[ResumeGenie] No profile photo found or not loaded');
        }
      } catch (photoError) {
        console.error('[ResumeGenie] Error capturing profile photo:', photoError);
      }

      // Try to get the actual profile URL (not /in/me/)
      let profileUrl = window.location.href.split('?')[0];

      // Check for canonical URL which has the real profile URL
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink && canonicalLink.href && canonicalLink.href.includes('/in/')) {
        profileUrl = canonicalLink.href;
        console.log('[ResumeGenie] Found canonical URL:', profileUrl);
      }

      // Also try to find it from the page's meta tags or profile link
      if (profileUrl.includes('/in/me')) {
        const profileLink = document.querySelector('a[href*="/in/"][href*="linkedin.com"]');
        if (profileLink && !profileLink.href.includes('/in/me')) {
          profileUrl = profileLink.href.split('?')[0];
          console.log('[ResumeGenie] Found profile link:', profileUrl);
        }
      }

      // Send HTML to server for AI parsing
      updateStatus('Processing with AI...');
      const response = await fetch(`${settings.serverUrl}/api/linkedin/parse-html`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: pageHtml,
          profile_url: profileUrl,
          profile_photo_base64: profilePhotoBase64
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details
          ? `${result.error}: ${result.details}`
          : (result.error || 'Failed to parse profile data');
        throw new Error(errorMsg);
      }

      updateStatus('Import successful! Redirecting...');

      // Open the onboarding success page and close this tab
      setTimeout(() => {
        // Open onboarding page with success parameter
        window.open(`${settings.serverUrl}/onboarding?linkedin_import=success`, '_blank');
        // Close this LinkedIn tab
        window.close();
      }, 1000);

    } catch (error) {
      console.error('[ResumeGenie] Import error:', error);
      showError(error.message || 'An error occurred during import');
    }
  }

  // Start import when page is ready
  if (document.readyState === 'complete') {
    runImport();
  } else {
    window.addEventListener('load', runImport);
  }
})();
