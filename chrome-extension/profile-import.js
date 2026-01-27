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
          profile_url: window.location.href.split('?')[0]
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse profile data');
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
