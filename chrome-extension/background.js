// ResumeGenie Background Service Worker

// Open side panel when the extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Track the latest job data per tab
const tabJobData = new Map();

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

// When a tab navigates, clear cached data and notify side panel
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    tabJobData.delete(tabId);
  }
  if (changeInfo.status === 'complete') {
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId: tabId,
      url: tab.url,
      data: null
    }).catch(() => {});
  }
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabJobData.delete(tabId);
});
