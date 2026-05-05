/* ═══════════════════════════════════════════════════════════
   Elite AI Bot — Dashboard Client Logic
   Manual Admin Key Login · Secure Bearer Auth
   ═══════════════════════════════════════════════════════════ */

'use strict';

(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen       = $('#login-screen');
  const dashScreen        = $('#dashboard-screen');
  const loginError        = $('#login-error');
  const adminKeyInput     = $('#admin-key-input');
  const loginBtnManual    = $('#login-btn-manual');

  const userAvatar        = $('#user-avatar');
  const userName          = $('#user-name');
  const guildSelect       = $('#guild-select');
  const guildNameDisplay  = $('#current-guild-name');
  const navItems          = $$('.nav-item');
  const tabContents       = $$('.tab-content');
  const aiToggleBtn       = $('#ai-toggle-btn');
  const aiStatusLabel     = $('#ai-status-label');
  const embedForm         = $('#embed-form');
  const toastContainer    = $('#toast-container');

  let currentGuildId = null;
  let guildsData     = [];

  init();

  function init() {
    if (localStorage.getItem('admin_key')) {
      loadDashboard();
    } else {
      showScreen('login');
    }
  }

  loginBtnManual.addEventListener('click', async () => {
    const key = adminKeyInput.value.trim();
    if (!key) return showLoginError('Admin Key is required');
    
    localStorage.setItem('admin_key', key);
    loginBtnManual.disabled = true;
    loginBtnManual.textContent = 'Verifying...';

    try {
      await loadDashboard();
    } catch (e) {
      localStorage.removeItem('admin_key');
      showLoginError('Invalid Key or Connection Error');
      loginBtnManual.disabled = false;
      loginBtnManual.textContent = 'Unlock Dashboard';
    }
  });

  function showScreen(name) {
    loginScreen.classList.toggle('active', name === 'login');
    dashScreen.classList.toggle('active', name === 'dashboard');
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
  }

  async function loadDashboard() {
    guildsData = await api('/api/settings/guilds');
    showScreen('dashboard');
    userAvatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    userName.textContent = 'Elite Admin';
    populateGuildSelect(guildsData);
  }

  function populateGuildSelect(guilds) {
    guildSelect.innerHTML = '<option value="" disabled selected>Select a server…</option>';
    guilds.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      guildSelect.appendChild(opt);
    });
  }

  guildSelect.addEventListener('change', () => selectGuild(guildSelect.value));

  async function selectGuild(guildId) {
    currentGuildId = guildId;
    const guild = guildsData.find(g => g.id === guildId);
    guildNameDisplay.textContent = guild ? guild.name : 'Unknown';
    aiToggleBtn.disabled = false;
    
    await Promise.all([
      loadChannels(guildId),
      loadRoles(guildId),
      loadSettings()
    ]);
  }

  async function loadChannels(guildId) {
    try {
      const channels = await api(`/api/settings/${guildId}/channels`);
      const dropdowns = $$('.channel-select');
      dropdowns.forEach(dd => {
        dd.innerHTML = '<option value="" disabled selected>------- SELECT CHANNEL -------</option>';
        channels.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `# ${c.name}`;
          dd.appendChild(opt);
        });
      });
    } catch (e) {
      toast('Failed to load channels', 'error');
    }
  }

  async function loadRoles(guildId) {
    try {
      const roles = await api(`/api/settings/${guildId}/roles`);
      const container = $('.roles-list-container');
      container.innerHTML = '';
      roles.forEach(role => {
        const div = document.createElement('div');
        div.className = 'role-item';
        div.innerHTML = `
          <input type="checkbox" id="role-${role.id}" value="${role.id}">
          <label for="role-${role.id}">${role.name}</label>
        `;
        container.appendChild(div);
      });
    } catch (e) {
      toast('Failed to load roles', 'error');
    }
  }

  async function loadSettings() {
    if (!currentGuildId) return;
    const data = await api(`/api/settings?guildId=${currentGuildId}`);
    setAIState(data.aiEnabled);
  }

  function setAIState(enabled) {
    aiToggleBtn.classList.toggle('active', enabled);
    aiStatusLabel.textContent = enabled ? 'AI Status: Online' : 'AI Status: Offline';
    aiStatusLabel.className = 'ai-status-label ' + (enabled ? 'on' : 'off');
  }

  aiToggleBtn.addEventListener('click', async () => {
    if (!currentGuildId) return;
    try {
      const data = await api('/api/settings/toggle', { method: 'POST', body: { guildId: currentGuildId } });
      setAIState(data.aiEnabled);
      toast(data.aiEnabled ? 'AI Activated' : 'AI Deactivated', 'success');
    } catch (e) {
      toast('Toggle failed', 'error');
    }
  });

  async function api(url, opts = {}) {
    const key = localStorage.getItem('admin_key');
    const config = {
      method: opts.method || 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      }
    };
    if (opts.body) config.body = JSON.stringify(opts.body);

    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unauthorized');
    return data;
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      navItems.forEach(n => n.classList.toggle('active', n === btn));
      tabContents.forEach(c => c.classList.toggle('active', c.id === tabId));
    });
  });

  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
})();
