// ResumeGenie Background Service Worker

// Open side panel when the extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Track the latest job data per tab
const tabJobData = new Map();

// Track pending apply URL captures
let pendingApplyCapture = null;

// Relay messages between content scripts and the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JOB_DETECTED') {
    // Content script detected a job — store it and forward to side panel
    const tabId = sender.tab?.id;
    if (tabId) {
      tabJobData.set(tabId, message.data);
    }
    // Forward to side panel (it listens for this)
    chrome.runtime.sendMessage({
      type: 'JOB_UPDATE',
      data: message.data,
      source: message.source,
      tabId: tabId
    }).catch(() => {
      // Side panel may not be open yet — that's fine
    });
  }

  if (message.type === 'NO_JOB') {
    const tabId = sender.tab?.id;
    if (tabId) {
      tabJobData.delete(tabId);
    }
    chrome.runtime.sendMessage({
      type: 'JOB_UPDATE',
      data: null,
      source: message.source,
      tabId: tabId
    }).catch(() => {});
  }

  if (message.type === 'GET_JOB_DATA') {
    // Side panel is requesting job data for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        sendResponse({ data: null });
        return;
      }
      // Try cached data first
      const cached = tabJobData.get(tab.id);
      if (cached) {
        sendResponse({ data: cached, source: 'cache' });
        return;
      }
      // Ask the content script directly
      chrome.tabs.sendMessage(tab.id, { action: 'getJobData' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.job_title) {
          sendResponse({ data: null });
        } else {
          tabJobData.set(tab.id, response);
          sendResponse({ data: response, source: 'content' });
        }
      });
    });
    return true; // async response
  }

  if (message.type === 'REQUEST_JOB_SCAN') {
    // Side panel asks content script to re-scan the page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'scanForJob' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ data: null });
          } else {
            sendResponse(response || { data: null });
          }
        });
      } else {
        sendResponse({ data: null });
      }
    });
    return true;
  }

  // Handle request to capture apply URL by clicking the Apply button
  if (message.type === 'CAPTURE_APPLY_URL') {
    console.log('[ResumeGenie BG] Starting apply URL capture');
    const jobData = message.jobData;

    // Set up pending capture - we'll listen for new tabs
    pendingApplyCapture = {
      jobData: jobData,
      sourceTabId: null,
      timestamp: Date.now(),
      sendResponse: sendResponse
    };

    // Get the active LinkedIn tab and tell content script to click Apply
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url?.includes('linkedin.com')) {
        pendingApplyCapture.sourceTabId = tab.id;
        console.log('[ResumeGenie BG] Sending click command to tab', tab.id);
        chrome.tabs.sendMessage(tab.id, { action: 'clickApplyButton' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('[ResumeGenie BG] Error clicking apply:', chrome.runtime.lastError);
            pendingApplyCapture = null;
            sendResponse({ success: false, error: 'Could not click Apply button' });
          } else if (response && response.clicked) {
            console.log('[ResumeGenie BG] Apply button clicked, waiting for new tab...');
            // Wait for new tab to be created (handled by onCreated listener)
            // Set a timeout in case no new tab opens
            setTimeout(() => {
              if (pendingApplyCapture) {
                console.log('[ResumeGenie BG] Timeout waiting for new tab');
                pendingApplyCapture = null;
                sendResponse({ success: false, error: 'No application page opened. This might be an Easy Apply job.' });
              }
            }, 5000);
          } else {
            pendingApplyCapture = null;
            sendResponse({ success: false, error: response?.error || 'Apply button not found' });
          }
        });
      } else {
        pendingApplyCapture = null;
        sendResponse({ success: false, error: 'Not on a LinkedIn job page' });
      }
    });
    return true; // async response
  }
});

// When user switches tabs, notify the side panel
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    const cached = tabJobData.get(activeInfo.tabId);
    chrome.runtime.sendMessage({
      type: 'TAB_CHANGED',
      tabId: activeInfo.tabId,
      url: tab.url,
      data: cached || null
    }).catch(() => {});
  });
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabJobData.delete(tabId);
});

// Listen for new tabs being created (to capture apply URL)
chrome.tabs.onCreated.addListener((tab) => {
  if (!pendingApplyCapture) return;

  console.log('[ResumeGenie BG] New tab created:', tab.id, tab.pendingUrl || tab.url);

  // Check if this tab was opened from our source tab (LinkedIn)
  if (tab.openerTabId === pendingApplyCapture.sourceTabId) {
    const url = tab.pendingUrl || tab.url;
    console.log('[ResumeGenie BG] Tab opened from LinkedIn, URL:', url);

    // If URL is available and not LinkedIn, capture it
    if (url && !url.includes('linkedin.com') && url !== 'about:blank') {
      const capturedUrl = url;
      const response = pendingApplyCapture.sendResponse;
      const jobData = pendingApplyCapture.jobData;
      const sourceTabId = pendingApplyCapture.sourceTabId;

      // Clear pending capture
      pendingApplyCapture = null;

      console.log('[ResumeGenie BG] Captured apply URL:', capturedUrl);

      // Close the new tab and refocus on LinkedIn
      chrome.tabs.remove(tab.id).catch(() => {});

      // Refocus the LinkedIn tab
      if (sourceTabId) {
        chrome.tabs.update(sourceTabId, { active: true }).catch(() => {});
      }

      // Send success response with the captured URL
      response({
        success: true,
        applyUrl: capturedUrl,
        jobData: { ...jobData, apply_url: capturedUrl }
      });
    } else if (url === 'about:blank' || !url) {
      // Tab is loading, wait for URL to be available
      console.log('[ResumeGenie BG] Tab loading, waiting for URL...');
    }
  }
});

// Also listen for tab updates to catch the URL if it wasn't available on create
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!pendingApplyCapture) return;

  // Check if this is the tab we're waiting for
  if (tab.openerTabId === pendingApplyCapture.sourceTabId && changeInfo.url) {
    const url = changeInfo.url;
    console.log('[ResumeGenie BG] Tab URL updated:', url);

    if (url && !url.includes('linkedin.com') && url !== 'about:blank') {
      const capturedUrl = url;
      const response = pendingApplyCapture.sendResponse;
      const jobData = pendingApplyCapture.jobData;
      const sourceTabId = pendingApplyCapture.sourceTabId;

      // Clear pending capture
      pendingApplyCapture = null;

      console.log('[ResumeGenie BG] Captured apply URL on update:', capturedUrl);

      // Close the new tab and refocus on LinkedIn
      chrome.tabs.remove(tabId).catch(() => {});
      if (sourceTabId) {
        chrome.tabs.update(sourceTabId, { active: true }).catch(() => {});
      }

      response({
        success: true,
        applyUrl: capturedUrl,
        jobData: { ...jobData, apply_url: capturedUrl }
      });
    }
  }

  // Original tab update logic
  if (changeInfo.status === 'loading') {
    tabJobData.delete(tabId);
  }
  if (changeInfo.status === 'complete' && !pendingApplyCapture) {
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId: tabId,
      url: tab.url,
      data: null
    }).catch(() => {});
  }
});
