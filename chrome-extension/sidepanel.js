// ResumeGenie Side Panel

(function () {
  const connectionBadge = document.getElementById('connection-badge');
  const connectionText = document.getElementById('connection-text');
  const jobSection = document.getElementById('job-section');
  const noJobSection = document.getElementById('no-job-section');
  const jobTitle = document.getElementById('job-title');
  const jobCompany = document.getElementById('job-company');
  const jobLocation = document.getElementById('job-location');
  const jobSalary = document.getElementById('job-salary');
  const jobSource = document.getElementById('job-source');
  const saveBtn = document.getElementById('save-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const messageEl = document.getElementById('message');
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsBody = document.getElementById('settings-body');
  const settingsChevron = document.getElementById('settings-chevron');
  const serverUrlInput = document.getElementById('server-url');
  const tokenInput = document.getElementById('token');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const linkedinBtn = document.getElementById('linkedin-btn');
  const indeedBtn = document.getElementById('indeed-btn');
  const glassdoorBtn = document.getElementById('glassdoor-btn');

  let currentJobData = null;
  let isSaved = false;

  // --- Initialization ---

  init();

  async function init() {
    await checkConnection();
    requestJobData();
  }

  // --- Connection ---

  async function checkConnection() {
    const settings = await chrome.storage.local.get(['serverUrl', 'token', 'user']);
    if (settings.serverUrl) {
      serverUrlInput.value = settings.serverUrl;
    }
    if (settings.token && settings.user) {
      setConnected(settings.user);
    } else {
      setDisconnected();
    }
  }

  function setConnected(user) {
    connectionBadge.className = 'connection-badge connected';
    connectionText.textContent = user.name || user.email || 'Connected';
    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'block';
    // Collapse settings when connected
    settingsBody.style.display = 'none';
    settingsToggle.classList.remove('open');
  }

  function setDisconnected() {
    connectionBadge.className = 'connection-badge disconnected';
    connectionText.textContent = 'Not connected';
    connectBtn.style.display = 'block';
    disconnectBtn.style.display = 'none';
    // Expand settings when disconnected
    settingsBody.style.display = 'block';
    settingsToggle.classList.add('open');
  }

  // --- Job Display ---

  function showJob(data, source) {
    currentJobData = data;
    isSaved = false;

    jobTitle.textContent = data.job_title || 'Untitled Position';
    jobCompany.textContent = data.company_name || '';
    jobLocation.textContent = data.location || '';
    jobSalary.textContent = data.salary || '';
    jobSource.textContent = source ? `via ${source}` : '';

    // Reset save button
    saveBtn.classList.remove('saved');
    saveBtnText.textContent = 'Save to ResumeGenie';
    saveBtn.disabled = false;
    saveBtn.onclick = handleSave;

    jobSection.style.display = 'block';
    noJobSection.style.display = 'none';
  }

  function showNoJob() {
    currentJobData = null;
    isSaved = false;
    jobSection.style.display = 'none';
    noJobSection.style.display = 'block';
  }

  // --- Job Data Requests ---

  function requestJobData() {
    chrome.runtime.sendMessage({ type: 'GET_JOB_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        showNoJob();
        return;
      }
      if (response && response.data && response.data.job_title) {
        showJob(response.data, response.data.source || response.source);
      } else {
        showNoJob();
      }
    });
  }

  // --- Listen for messages from background ---

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'JOB_UPDATE') {
      if (message.data && message.data.job_title) {
        showJob(message.data, message.source);
      } else {
        showNoJob();
      }
    }

    if (message.type === 'TAB_CHANGED' || message.type === 'TAB_UPDATED') {
      if (message.data && message.data.job_title) {
        showJob(message.data, message.data.source);
      } else {
        // Tab changed — request fresh data after a short delay (content script may need time)
        showNoJob();
        setTimeout(requestJobData, 1000);
      }
    }
  });

  // --- Save Job ---

  async function handleSave() {
    if (!currentJobData || isSaved) return;

    const settings = await chrome.storage.local.get(['serverUrl', 'token']);
    if (!settings.token || !settings.serverUrl) {
      showMessage('Please connect first', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtnText.textContent = 'Saving...';

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
        isSaved = true;
        showMessage(data.message || 'Job saved!', 'success');
        saveBtnText.textContent = 'Saved — Review Resume';
        saveBtn.classList.add('saved');
        saveBtn.disabled = false;
        saveBtn.onclick = () => {
          chrome.tabs.create({ url: `${settings.serverUrl}/review` });
        };
      } else {
        showMessage(data.error || 'Failed to save', 'error');
        saveBtnText.textContent = 'Save to ResumeGenie';
        saveBtn.disabled = false;
      }
    } catch (error) {
      showMessage('Could not connect to server', 'error');
      saveBtnText.textContent = 'Save to ResumeGenie';
      saveBtn.disabled = false;
    }
  }

  // --- Settings ---

  settingsToggle.addEventListener('click', () => {
    const isOpen = settingsBody.style.display !== 'none';
    settingsBody.style.display = isOpen ? 'none' : 'block';
    settingsToggle.classList.toggle('open', !isOpen);
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
        await chrome.storage.local.set({ serverUrl, token, user: data.user });
        showMessage('Connected!', 'success');
        setConnected(data.user);
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
    setDisconnected();
  });

  // --- Quick Links ---

  linkedinBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
  });

  indeedBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.indeed.com/' });
  });

  glassdoorBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.glassdoor.com/Job/index.htm' });
  });

  // --- Messages ---

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
    setTimeout(() => {
      messageEl.className = 'message';
    }, 4000);
  }
})();
