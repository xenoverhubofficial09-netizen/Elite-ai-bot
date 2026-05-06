/* ═══════════════════════════════════════════════════════════
   Elite AI Bot — Dashboard Client Logic
   Manual Admin Key Login · Secure Bearer Auth · Embed Builder
   ═══════════════════════════════════════════════════════════ */

'use strict';

'use strict';

(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen       = $('#login-screen');
  const dashScreen        = $('#dashboard-screen');
  const loginError        = $('#login-error');

  const userAvatar        = $('#user-avatar');
  const userName          = $('#user-name');
  const guildSelect       = $('#guild-select');
  const guildNameDisplay  = $('#current-guild-name');
  const navItems          = $$('.nav-item');
  const tabContents       = $$('.tab-content');
  const aiToggleBtn       = $('#ai-toggle-btn');
  const aiStatusLabel     = $('#ai-status-label');
  const embedForm         = $('#embed-form');
  const addButtonRow      = $('#add-button-row');
  const buttonsContainer  = $('#buttons-container');
  const toastContainer    = $('#toast-container');
  
  const lockBtn           = $('#lock-btn');
  const clearBtn          = $('#clear-btn');

  let currentGuildId = null;
  let guildsData     = [];

  init();

  async function init() {
    try {
      const res = await fetch('/auth/user');
      const data = await res.json();
      
      if (data.authenticated) {
        await loadDashboard(data.user);
      } else {
        showScreen('login');
      }
    } catch (e) {
      showScreen('login');
    }
  }

  function showScreen(name) {
    loginScreen.classList.toggle('active', name === 'login');
    dashScreen.classList.toggle('active', name === 'dashboard');
  }

  async function loadDashboard(user) {
    try {
      guildsData = await api('/api/settings/guilds');
      showScreen('dashboard');
      
      if (user) {
        userAvatar.src = user.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png';
        userName.textContent = user.global_name || user.username;
      }
      
      populateGuildSelect(guildsData);
    } catch (e) {
      console.error('Dashboard load failed', e);
      showScreen('login');
    }
  }

  function populateGuildSelect(guilds) {
    guildSelect.innerHTML = '<option value="" disabled selected>Select a server…</option>';
    guilds.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      guildSelect.appendChild(opt);
    });
    
    // Auto-select if only 1 guild
    if (guilds.length === 1) {
      guildSelect.value = guilds[0].id;
      selectGuild(guilds[0].id);
    }
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
          <input type="checkbox" class="role-checkbox" id="role-${role.id}" value="${role.id}">
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

  // ─── Panel Actions ───────────────────────────────────

  // 1. Send Embed
  addButtonRow.addEventListener('click', () => {
    if (buttonsContainer.children.length >= 5) return toast('Max 5 buttons allowed', 'error');
    const div = document.createElement('div');
    div.className = 'button-config-row';
    div.innerHTML = `
      <input type="text" placeholder="Label" class="btn-label">
      <input type="url" placeholder="URL" class="btn-url">
      <button type="button" class="btn-remove">×</button>
    `;
    div.querySelector('.btn-remove').onclick = () => div.remove();
    buttonsContainer.appendChild(div);
  });

  embedForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentGuildId) return toast('Select a server first', 'error');
    
    const channelId = $('#embed-channel').value;
    const title = $('#embed-title').value;
    const description = $('#embed-desc').value;
    const color = $('#embed-color').value;

    if (!channelId) return toast('Select a channel', 'error');

    const buttons = [];
    $$('.button-config-row').forEach(row => {
      const label = row.querySelector('.btn-label').value;
      const url = row.querySelector('.btn-url').value;
      if (label && url) buttons.push({ label, url });
    });

    try {
      await api('/api/panel/send', {
        method: 'POST',
        body: { guildId: currentGuildId, channelId, title, description, color, buttons }
      });
      toast('Embed added to queue!', 'success');
      embedForm.reset();
      buttonsContainer.innerHTML = '';
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  // 2. Lock Channel
  lockBtn.addEventListener('click', async () => {
    if (!currentGuildId) return toast('Select a server first', 'error');
    const channelId = $('#card-lock .channel-select').value;
    const selectedRoles = Array.from($$('.role-checkbox:checked')).map(cb => cb.value);

    if (!channelId) return toast('Select a channel', 'error');
    if (selectedRoles.length === 0) return toast('Select at least one role', 'error');

    try {
      await api('/api/panel/lock', {
        method: 'POST',
        body: { channelId, roleIds: selectedRoles }
      });
      toast('Permissions updated!', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  // 3. Clear Chat
  clearBtn.addEventListener('click', async () => {
    if (!currentGuildId) return toast('Select a server first', 'error');
    const channelId = $('#card-clear .channel-select').value;

    if (!channelId) return toast('Select a channel', 'error');
    if (!confirm('Are you sure you want to clear this channel? All messages will be deleted.')) return;

    try {
      await api('/api/panel/clear', {
        method: 'POST',
        body: { channelId }
      });
      toast('Channel cleared successfully!', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  // ─── API Helper ──────────────────────────────────────
  async function api(url, opts = {}) {
    const config = {
      method: opts.method || 'GET',
      headers: { 
        'Content-Type': 'application/json'
      }
    };
    
    // Fallback for manual key if still using it for some reason
    const key = localStorage.getItem('admin_key');
    if (key) {
      config.headers['Authorization'] = `Bearer ${key}`;
    }

    if (opts.body) config.body = JSON.stringify(opts.body);

    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    
    if (res.status === 401 || res.status === 403) {
      showScreen('login');
      throw new Error('Unauthorized');
    }
    
    if (!res.ok) throw new Error(data.message || 'API Error');
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
