document.addEventListener('DOMContentLoaded', async () => {
  const connectedView = document.getElementById('connected-view');
  const disconnectedView = document.getElementById('disconnected-view');
  const serverUrlInput = document.getElementById('server-url');
  const tokenInput = document.getElementById('token');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const userInfo = document.getElementById('user-info');
  const message = document.getElementById('message');

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
