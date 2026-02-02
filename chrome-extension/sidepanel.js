// ResumeGenie Side Panel - Dashboard Version

(function () {
  // DOM Elements
  const loadingState = document.getElementById('loading-state');
  const notConnectedState = document.getElementById('not-connected-state');
  const dashboardState = document.getElementById('dashboard-state');
  const welcomeCard = document.getElementById('welcome-card');
  const welcomeClose = document.getElementById('welcome-close');
  const weekRange = document.getElementById('week-range');
  const recentJobsContainer = document.getElementById('recent-jobs');
  const currentJobSection = document.getElementById('current-job-section');
  const jobTitle = document.getElementById('job-title');
  const jobCompany = document.getElementById('job-company');
  const jobLocation = document.getElementById('job-location');
  const jobSalary = document.getElementById('job-salary');
  const jobSource = document.getElementById('job-source');
  const saveBtn = document.getElementById('save-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const messageEl = document.getElementById('message');
  const menuBtn = document.getElementById('menu-btn');
  const menuDropdown = document.getElementById('menu-dropdown');
  const settingsModal = document.getElementById('settings-modal');
  const serverUrlInput = document.getElementById('server-url');
  const tokenInput = document.getElementById('token');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const closePanelBtn = document.getElementById('close-panel-btn');
  const searchBtn = document.getElementById('search-btn');

  // Goal elements
  const jobsRing = document.getElementById('jobs-ring');
  const jobsValue = document.getElementById('jobs-value');
  const reviewsRing = document.getElementById('reviews-ring');
  const reviewsValue = document.getElementById('reviews-value');
  const applicationsRing = document.getElementById('applications-ring');
  const applicationsValue = document.getElementById('applications-value');

  // Settings modal elements
  const goalJobsInput = document.getElementById('goal-jobs');
  const goalReviewsInput = document.getElementById('goal-reviews');
  const goalApplicationsInput = document.getElementById('goal-applications');
  const settingsUserEmail = document.getElementById('settings-user-email');

  // Add Job modal elements
  const addJobModal = document.getElementById('add-job-modal');
  const manualJobTitle = document.getElementById('manual-job-title');
  const manualCompany = document.getElementById('manual-company');
  const manualLocation = document.getElementById('manual-location');
  const manualJobUrl = document.getElementById('manual-job-url');

  // Edit Goal modal elements
  const editGoalModal = document.getElementById('edit-goal-modal');
  const editGoalTitle = document.getElementById('edit-goal-title');
  const editGoalLabel = document.getElementById('edit-goal-label');
  const editGoalValue = document.getElementById('edit-goal-value');

  // State
  let currentJobData = null;
  let isSaved = false;
  let savedJobId = null; // Store the ID of the saved job for navigation
  let serverUrl = '';
  let currentUser = null;
  let currentGoals = { jobsSaved: 10, resumesReviewed: 5, applicationsSent: 5 };
  let editingGoalType = null; // 'jobs', 'reviews', or 'applications'

  // App URL for shortcuts
  const APP_URL = 'https://resumegenie.careers';

  // --- Initialization ---
  init();

  async function init() {
    showState('loading');
    const settings = await chrome.storage.local.get(['serverUrl', 'token', 'user', 'showWelcomeCard']);

    if (settings.serverUrl) {
      serverUrlInput.value = settings.serverUrl;
      serverUrl = settings.serverUrl;
    }

    if (settings.token && settings.user) {
      currentUser = settings.user;
      await loadDashboard();
      showState('dashboard');

      // Show/hide welcome card
      if (settings.showWelcomeCard === false) {
        welcomeCard.style.display = 'none';
      }
    } else {
      showState('not-connected');
    }

    // Request job data from current tab
    requestJobData();
    setupEventListeners();
  }

  function showState(state) {
    loadingState.style.display = state === 'loading' ? 'flex' : 'none';
    notConnectedState.style.display = state === 'not-connected' ? 'block' : 'none';
    dashboardState.style.display = state === 'dashboard' ? 'block' : 'none';
  }

  // --- Dashboard Data Loading ---
  async function loadDashboard() {
    const settings = await chrome.storage.local.get(['serverUrl', 'token']);
    if (!settings.serverUrl || !settings.token) return;

    try {
      // Fetch stats and recent jobs in parallel
      const [statsRes, jobsRes] = await Promise.all([
        fetch(`${settings.serverUrl}/api/extension/stats`, {
          headers: { 'Authorization': `Bearer ${settings.token}` }
        }),
        fetch(`${settings.serverUrl}/api/extension/jobs?limit=5`, {
          headers: { 'Authorization': `Bearer ${settings.token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        updateStats(statsData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        renderRecentJobs(jobsData.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  }

  function updateStats(data) {
    if (data.weekRange) {
      weekRange.textContent = data.weekRange;
    }

    if (data.goals) {
      currentGoals = data.goals;
      goalJobsInput.value = data.goals.jobsSaved;
      goalReviewsInput.value = data.goals.resumesReviewed;
      goalApplicationsInput.value = data.goals.applicationsSent;
    }

    if (data.stats) {
      updateGoalRing('jobs', data.stats.jobsSaved, data.goals.jobsSaved);
      updateGoalRing('reviews', data.stats.resumesReviewed, data.goals.resumesReviewed);
      updateGoalRing('applications', data.stats.applicationsSent, data.goals.applicationsSent);
    }

    if (data.user) {
      currentUser = data.user;
      settingsUserEmail.textContent = data.user.email || 'Connected';
    }

    if (data.showWelcomeCard === false) {
      welcomeCard.style.display = 'none';
    }
  }

  function updateGoalRing(type, current, goal) {
    const percentage = Math.min((current / goal) * 100, 100);
    const ring = document.getElementById(`${type}-ring`);
    const value = document.getElementById(`${type}-value`);

    if (ring) {
      ring.setAttribute('stroke-dasharray', `${percentage}, 100`);
    }
    if (value) {
      value.textContent = `${current}/${goal}`;
    }
  }

  function renderRecentJobs(jobs) {
    if (!jobs || jobs.length === 0) {
      recentJobsContainer.innerHTML = `
        <div class="empty-jobs">
          <p>No saved jobs yet</p>
        </div>
      `;
      return;
    }

    recentJobsContainer.innerHTML = jobs.map(job => `
      <div class="recent-job-item" data-job-id="${job.id}">
        <div class="recent-job-title">${escapeHtml(job.title)}</div>
        <div class="recent-job-meta">${escapeHtml(job.company)}</div>
      </div>
    `).join('');

    // Add click handlers to open job in app
    recentJobsContainer.querySelectorAll('.recent-job-item').forEach(item => {
      item.addEventListener('click', () => {
        const jobId = item.dataset.jobId;
        chrome.tabs.create({ url: `${serverUrl}/review/${jobId}` });
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Job Display ---
  function showJob(data, source) {
    currentJobData = data;
    isSaved = false;
    savedJobId = null; // Reset saved job ID when showing a new job

    // Debug: log the apply URL status
    console.log('[ResumeGenie Sidepanel] Job data received:', {
      title: data.job_title,
      company: data.company_name,
      apply_url: data.apply_url || 'NOT FOUND',
      is_easy_apply: data.is_easy_apply,
      source_url: data.source_url
    });

    jobTitle.textContent = data.job_title || 'Untitled Position';
    jobCompany.textContent = data.company_name || '';
    jobLocation.textContent = data.location || '';
    jobSalary.textContent = data.salary || '';
    jobSource.textContent = source ? `via ${source}` : '';

    // Reset save button
    saveBtn.classList.remove('saved');
    saveBtnText.textContent = 'Save to ResumeGenie';
    saveBtn.disabled = false;

    currentJobSection.style.display = 'block';
  }

  function hideJob() {
    currentJobData = null;
    isSaved = false;
    savedJobId = null; // Reset saved job ID when hiding job
    currentJobSection.style.display = 'none';
  }

  // --- Job Data Requests ---
  function requestJobData() {
    chrome.runtime.sendMessage({ type: 'GET_JOB_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        hideJob();
        return;
      }
      if (response && response.data && response.data.job_title) {
        showJob(response.data, response.data.source || response.source);
      } else {
        hideJob();
      }
    });
  }

  // --- Listen for messages from background ---
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'JOB_UPDATE') {
      if (message.data && message.data.job_title) {
        showJob(message.data, message.source);
      } else {
        hideJob();
      }
    }

    if (message.type === 'TAB_CHANGED' || message.type === 'TAB_UPDATED') {
      if (message.data && message.data.job_title) {
        showJob(message.data, message.data.source);
      } else {
        hideJob();
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

    // Check if we need to capture the apply URL first
    const hasApplyUrl = currentJobData.apply_url && !currentJobData.apply_url.includes('linkedin.com');
    const isEasyApply = currentJobData.is_easy_apply;

    if (!hasApplyUrl && !isEasyApply) {
      // Try to capture the apply URL by clicking the Apply button
      saveBtnText.textContent = 'Capturing apply URL...';
      showMessage('Opening application page to capture URL...', 'info');

      try {
        const captureResult = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'CAPTURE_APPLY_URL',
            jobData: currentJobData
          }, (response) => {
            resolve(response);
          });
        });

        console.log('[ResumeGenie] Capture result:', captureResult);

        if (captureResult && captureResult.success) {
          // Update job data with the captured URL
          currentJobData = captureResult.jobData;
          showMessage(`Captured: ${captureResult.applyUrl.substring(0, 50)}...`, 'success');
        } else {
          // Capture failed, but continue saving without the URL
          console.log('[ResumeGenie] Could not capture apply URL:', captureResult?.error);
          showMessage(captureResult?.error || 'Could not capture apply URL, saving anyway...', 'warning');
        }
      } catch (err) {
        console.error('[ResumeGenie] Error capturing apply URL:', err);
        showMessage('Could not capture apply URL, saving anyway...', 'warning');
      }
    }

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
        savedJobId = data.job_id; // Store the saved job ID for navigation
        showMessage(data.message || 'Job saved!', 'success');
        saveBtnText.textContent = 'Saved — Review Resume';
        saveBtn.classList.add('saved');
        saveBtn.disabled = false;

        // Refresh dashboard stats and recent jobs
        loadDashboard();
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to save');
        console.error('[ResumeGenie] Save failed:', JSON.stringify(data, null, 2));
        showMessage(errorMsg, 'error');
        saveBtnText.textContent = 'Save to ResumeGenie';
        saveBtn.disabled = false;
      }
    } catch (error) {
      console.error('[ResumeGenie] Network error:', error);
      showMessage('Could not connect to server', 'error');
      saveBtnText.textContent = 'Save to ResumeGenie';
      saveBtn.disabled = false;
    }
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Save button
    saveBtn.addEventListener('click', async () => {
      if (isSaved && savedJobId) {
        const settings = await chrome.storage.local.get(['serverUrl']);
        chrome.tabs.create({ url: `${settings.serverUrl}/review/${savedJobId}` });
      } else if (!isSaved) {
        handleSave();
      }
    });

    // Menu toggle
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuDropdown.style.display !== 'none';
      menuDropdown.style.display = isOpen ? 'none' : 'block';
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      menuDropdown.style.display = 'none';
    });

    menuDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Menu items - Main Actions
    document.getElementById('menu-dashboard').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      loadDashboard();
    });

    document.getElementById('menu-edit-goals').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      openSettings(); // Opens the full settings modal with all goals
    });

    document.getElementById('menu-add-job').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      openAddJobModal();
    });

    // Menu items - Shortcuts
    document.getElementById('menu-app-dashboard').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      chrome.tabs.create({ url: `${APP_URL}/dashboard` });
    });

    document.getElementById('menu-job-tracker').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      chrome.tabs.create({ url: `${APP_URL}/jobs` });
    });

    document.getElementById('menu-master-resume').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      chrome.tabs.create({ url: `${APP_URL}/resume` });
    });

    // Menu items - Bottom section
    document.getElementById('menu-support').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      chrome.tabs.create({ url: `${APP_URL}/support` });
    });

    document.getElementById('menu-account-settings').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      chrome.tabs.create({ url: `${APP_URL}/settings` });
    });

    document.getElementById('menu-logout').addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      handleDisconnect();
    });

    // Goal ring click handlers (for inline editing)
    document.querySelectorAll('.goal-item').forEach(item => {
      item.addEventListener('click', () => {
        const goalType = item.dataset.goal;
        openEditGoalModal(goalType);
      });
    });

    // Add Job modal
    document.getElementById('add-job-close').addEventListener('click', closeAddJobModal);
    document.getElementById('add-job-cancel').addEventListener('click', closeAddJobModal);
    document.getElementById('add-job-save').addEventListener('click', saveManualJob);

    // Edit Goal modal
    document.getElementById('edit-goal-close').addEventListener('click', closeEditGoalModal);
    document.getElementById('edit-goal-cancel').addEventListener('click', closeEditGoalModal);
    document.getElementById('edit-goal-save').addEventListener('click', saveEditedGoal);

    // Welcome card close
    welcomeClose.addEventListener('click', async () => {
      welcomeCard.style.display = 'none';
      await chrome.storage.local.set({ showWelcomeCard: false });

      // Also update server
      const settings = await chrome.storage.local.get(['serverUrl', 'token']);
      if (settings.serverUrl && settings.token) {
        fetch(`${settings.serverUrl}/api/extension/stats`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${settings.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ showWelcomeCard: false })
        }).catch(() => {});
      }
    });

    // Connect button
    connectBtn.addEventListener('click', handleConnect);

    // Disconnect button
    disconnectBtn.addEventListener('click', handleDisconnect);

    // Settings modal
    document.getElementById('settings-close').addEventListener('click', closeSettings);
    document.getElementById('settings-cancel').addEventListener('click', closeSettings);
    document.getElementById('settings-save').addEventListener('click', saveSettings);

    // Bottom bar
    closePanelBtn.addEventListener('click', () => {
      window.close();
    });

    searchBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
    });
  }

  // --- Connection ---
  async function handleConnect() {
    const url = serverUrlInput.value.trim().replace(/\/$/, '');
    const token = tokenInput.value.trim();

    if (!url) {
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
      const response = await fetch(`${url}/api/extension/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        await chrome.storage.local.set({
          serverUrl: url,
          token,
          user: data.user,
          showWelcomeCard: true
        });
        serverUrl = url;
        currentUser = data.user;
        showMessage('Connected!', 'success');

        await loadDashboard();
        showState('dashboard');
      } else {
        showMessage(data.error || 'Invalid token', 'error');
      }
    } catch (error) {
      showMessage('Could not connect to server', 'error');
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect';
    }
  }

  async function handleDisconnect() {
    await chrome.storage.local.remove(['token', 'user']);
    tokenInput.value = '';
    currentUser = null;
    closeSettings();
    showMessage('Disconnected', 'success');
    showState('not-connected');
  }

  // --- Settings Modal ---
  function openSettings() {
    settingsModal.style.display = 'flex';
    if (currentUser) {
      settingsUserEmail.textContent = currentUser.email || 'Connected';
    }
  }

  function closeSettings() {
    settingsModal.style.display = 'none';
  }

  async function saveSettings() {
    const settings = await chrome.storage.local.get(['serverUrl', 'token']);
    if (!settings.serverUrl || !settings.token) {
      closeSettings();
      return;
    }

    const newGoals = {
      weeklyJobsGoal: parseInt(goalJobsInput.value, 10) || 10,
      weeklyReviewsGoal: parseInt(goalReviewsInput.value, 10) || 5,
      weeklyApplicationsGoal: parseInt(goalApplicationsInput.value, 10) || 5
    };

    try {
      const response = await fetch(`${settings.serverUrl}/api/extension/stats`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${settings.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoals)
      });

      if (response.ok) {
        showMessage('Settings saved!', 'success');
        closeSettings();
        loadDashboard();
      } else {
        showMessage('Failed to save settings', 'error');
      }
    } catch (error) {
      showMessage('Could not save settings', 'error');
    }
  }

  // --- Add Job Modal ---
  function openAddJobModal() {
    // Clear form
    manualJobTitle.value = '';
    manualCompany.value = '';
    manualLocation.value = '';
    manualJobUrl.value = '';
    addJobModal.style.display = 'flex';
    manualJobTitle.focus();
  }

  function closeAddJobModal() {
    addJobModal.style.display = 'none';
  }

  async function saveManualJob() {
    const title = manualJobTitle.value.trim();
    const company = manualCompany.value.trim();
    const location = manualLocation.value.trim();
    const jobUrl = manualJobUrl.value.trim();

    if (!title) {
      showMessage('Please enter a job title', 'error');
      return;
    }
    if (!company) {
      showMessage('Please enter a company name', 'error');
      return;
    }

    const settings = await chrome.storage.local.get(['serverUrl', 'token']);
    if (!settings.token || !settings.serverUrl) {
      showMessage('Please connect first', 'error');
      return;
    }

    const saveBtn = document.getElementById('add-job-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const jobData = {
        job_title: title,
        company_name: company,
        location: location || null,
        job_url: jobUrl || null,
        source: 'manual'
      };

      const response = await fetch(`${settings.serverUrl}/api/extension/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message || 'Job saved!', 'success');
        closeAddJobModal();
        loadDashboard(); // Refresh stats and recent jobs
      } else {
        showMessage(data.error || 'Failed to save job', 'error');
      }
    } catch (error) {
      showMessage('Could not connect to server', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Job';
    }
  }

  // --- Edit Goal Modal ---
  function openEditGoalModal(goalType) {
    editingGoalType = goalType;

    const goalLabels = {
      jobs: { title: 'Edit Jobs Saved Goal', label: 'Weekly jobs to save' },
      reviews: { title: 'Edit Reviews Goal', label: 'Weekly resumes to review' },
      applications: { title: 'Edit Applications Goal', label: 'Weekly applications to send' }
    };

    const currentValues = {
      jobs: currentGoals.jobsSaved || 10,
      reviews: currentGoals.resumesReviewed || 5,
      applications: currentGoals.applicationsSent || 5
    };

    editGoalTitle.textContent = goalLabels[goalType].title;
    editGoalLabel.textContent = goalLabels[goalType].label;
    editGoalValue.value = currentValues[goalType];

    editGoalModal.style.display = 'flex';
    editGoalValue.focus();
    editGoalValue.select();
  }

  function closeEditGoalModal() {
    editGoalModal.style.display = 'none';
    editingGoalType = null;
  }

  async function saveEditedGoal() {
    const newValue = parseInt(editGoalValue.value, 10);
    if (!newValue || newValue < 1) {
      showMessage('Please enter a valid number', 'error');
      return;
    }

    const settings = await chrome.storage.local.get(['serverUrl', 'token']);
    if (!settings.serverUrl || !settings.token) {
      closeEditGoalModal();
      return;
    }

    const goalMapping = {
      jobs: 'weeklyJobsGoal',
      reviews: 'weeklyReviewsGoal',
      applications: 'weeklyApplicationsGoal'
    };

    const updateData = {
      [goalMapping[editingGoalType]]: newValue
    };

    const saveBtn = document.getElementById('edit-goal-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const response = await fetch(`${settings.serverUrl}/api/extension/stats`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${settings.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Update local state
        if (editingGoalType === 'jobs') currentGoals.jobsSaved = newValue;
        if (editingGoalType === 'reviews') currentGoals.resumesReviewed = newValue;
        if (editingGoalType === 'applications') currentGoals.applicationsSent = newValue;

        // Also update settings modal inputs
        if (editingGoalType === 'jobs') goalJobsInput.value = newValue;
        if (editingGoalType === 'reviews') goalReviewsInput.value = newValue;
        if (editingGoalType === 'applications') goalApplicationsInput.value = newValue;

        showMessage('Goal updated!', 'success');
        closeEditGoalModal();
        loadDashboard(); // Refresh to show new progress
      } else {
        showMessage('Failed to update goal', 'error');
      }
    } catch (error) {
      showMessage('Could not save goal', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  }

  // --- Messages ---
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
    setTimeout(() => {
      messageEl.className = 'message';
    }, 4000);
  }
})();
