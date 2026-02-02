// ResumeGenie Content Script
// Runs on ResumeGenie pages to capture autofill data for One-Click Apply

(function() {
  console.log('[ResumeGenie Extension] Content script loaded on ResumeGenie page');

  // Listen for postMessage from the web app (more reliable than custom events)
  window.addEventListener('message', async (event) => {
    // Only accept messages from the same origin
    if (event.source !== window) return;

    if (event.data && event.data.type === 'RESUMEGENIE_AUTOFILL') {
      const autofillData = event.data.payload;
      console.log('[ResumeGenie Extension] Received autofill data via postMessage:', autofillData);

      if (autofillData && autofillData.applicationUrl) {
        try {
          await chrome.storage.local.set({ autofillData: autofillData });
          console.log('[ResumeGenie Extension] Stored autofill data for:', autofillData.applicationUrl);

          // Send confirmation back to the page
          window.postMessage({ type: 'RESUMEGENIE_AUTOFILL_STORED', success: true }, '*');
        } catch (err) {
          console.error('[ResumeGenie Extension] Failed to store autofill data:', err);
          window.postMessage({ type: 'RESUMEGENIE_AUTOFILL_STORED', success: false, error: err.message }, '*');
        }
      }
    }
  });

  // Also listen for the custom event as a backup
  window.addEventListener('resumegenie-apply', async (event) => {
    const autofillData = event.detail;
    console.log('[ResumeGenie Extension] Received autofill data via custom event:', autofillData);

    if (autofillData && autofillData.applicationUrl) {
      try {
        await chrome.storage.local.set({ autofillData: autofillData });
        console.log('[ResumeGenie Extension] Stored autofill data');
      } catch (err) {
        console.error('[ResumeGenie Extension] Failed to store autofill data:', err);
      }
    }
  });

  // Inject a flag so the page knows the extension is installed
  const script = document.createElement('script');
  script.textContent = 'window.RESUMEGENIE_EXTENSION_INSTALLED = true;';
  document.documentElement.appendChild(script);
  script.remove();
})();
