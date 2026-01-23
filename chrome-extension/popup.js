document.addEventListener('DOMContentLoaded', async () => {
  const connectedView = document.getElementById('connected-view');
  const disconnectedView = document.getElementById('disconnected-view');
  const serverUrlInput = document.getElementById('server-url');
  const tokenInput = document.getElementById('token');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const linkedinJobsBtn = document.getElementById('linkedin-jobs-btn');
  const jobImportSection = document.getElementById('job-import-section');
  const importJobBtn = document.getElementById('import-job-btn');
  const importBtnText = document.getElementById('import-btn-text');
  const userInfo = document.getElementById('user-info');
  const message = document.getElementById('message');

  let currentJobData = null;

  // LinkedIn Jobs button
  linkedinJobsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
  });

  // Load saved settings
  const settings = await chrome.storage.local.get(['serverUrl', 'token', 'user']);

  if (settings.serverUrl) {
    serverUrlInput.value = settings.serverUrl;
  }

  if (settings.token && settings.user) {
    showConnected(settings.user);
  } else {
    showDisconnected();
  }

  // Check if we're on a LinkedIn job page
  checkForLinkedInJob();

  function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
    setTimeout(() => {
      message.className = '';
      message.style.display = 'none';
    }, 3000);
  }

  function showConnected(user) {
    connectedView.style.display = 'block';
    disconnectedView.style.display = 'none';
    userInfo.textContent = `Logged in as ${user.name || user.email}`;
  }

  function showDisconnected() {
    connectedView.style.display = 'none';
    disconnectedView.style.display = 'block';
  }

  async function checkForLinkedInJob() {
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url || !tab.url.includes('linkedin.com/jobs')) {
        jobImportSection.style.display = 'none';
        return;
      }

      // Send message to content script to get job data
      chrome.tabs.sendMessage(tab.id, { action: 'getJobData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not connect to content script:', chrome.runtime.lastError.message);
          jobImportSection.style.display = 'none';
          return;
        }

        if (response && response.job_title) {
          currentJobData = response;
          importBtnText.textContent = `Import: ${response.job_title}`;
          jobImportSection.style.display = 'block';
        } else {
          jobImportSection.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error checking for job:', error);
      jobImportSection.style.display = 'none';
    }
  }

  // Import job button
  importJobBtn.addEventListener('click', async () => {
    if (!currentJobData) {
      showMessage('No job data found', 'error');
      return;
    }

    const settings = await chrome.storage.local.get(['serverUrl', 'token']);

    if (!settings.token || !settings.serverUrl) {
      showMessage('Please connect first', 'error');
      return;
    }

    const originalText = importBtnText.textContent;
    importJobBtn.disabled = true;
    importBtnText.textContent = 'Importing...';

    try {
      const response = await fetch(`${settings.serverUrl}/api/extension/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentJobData)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message || 'Job imported!', 'success');
        // Change button to "Review resume for [Job Title]"
        const jobTitle = currentJobData.job_title;
        importBtnText.textContent = `Review resume for ${jobTitle}`;
        importJobBtn.classList.remove('btn-import');
        importJobBtn.classList.add('btn-review');

        // Change click handler to open review page
        importJobBtn.onclick = () => {
          chrome.tabs.create({ url: `${settings.serverUrl}/review` });
        };
      } else {
        showMessage(data.error || 'Failed to import', 'error');
        importBtnText.textContent = originalText;
      }
    } catch (error) {
      showMessage('Could not connect to server', 'error');
      importBtnText.textContent = originalText;
    } finally {
      importJobBtn.disabled = false;
    }
  });

  connectBtn.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim().replace(/\/$/, '');
    const token = tokenInput.value.trim();

    if (!serverUrl) {
      showMessage('Please enter a server URL', 'error');
      return;
    }

    if (!token) {
      showMessage('Please enter your token', 'error');
      return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';

    try {
      const response = await fetch(`${serverUrl}/api/extension/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        await chrome.storage.local.set({
          serverUrl,
          token,
          user: data.user
        });
        showMessage('Connected successfully!', 'success');
        showConnected(data.user);
      } else {
        showMessage(data.error || 'Invalid token', 'error');
      }
    } catch (error) {
      showMessage('Could not connect to server', 'error');
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect';
    }
  });

  disconnectBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove(['token', 'user']);
    tokenInput.value = '';
    showMessage('Disconnected', 'success');
    showDisconnected();
  });
});
