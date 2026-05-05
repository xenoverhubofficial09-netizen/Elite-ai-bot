/* ═══════════════════════════════════════════════════════════
   Elite AI Bot — Dashboard Client Logic
   Vertical Stack Layout · Dynamic Channels · Full Management
   ═══════════════════════════════════════════════════════════ */

'use strict';

(() => {
  // ─── DOM refs ──────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen       = $('#login-screen');
  const dashScreen        = $('#dashboard-screen');
  const loginError        = $('#login-error');

  // Topbar
  const userAvatar        = $('#user-avatar');
  const userName          = $('#user-name');

  // Guild selection
  const backBtn           = $('#back-btn');
  const guildSelect       = $('#guild-select');
  const guildNameDisplay  = $('#current-guild-name');

  // Sidebar Tabs
  const navItems          = $$('.nav-item');
  const tabContents       = $$('.tab-content');

  // AI card
  const aiToggleBtn       = $('#ai-toggle-btn');
  const aiStatusLabel     = $('#ai-status-label');

  // Embed form
  const embedForm         = $('#embed-form');
  const embedTitle        = $('#embed-title');
  const embedDesc         = $('#embed-desc');
  const embedColor        = $('#embed-color');
  const embedChannel      = $('#embed-channel');
  const addButtonRow      = $('#add-button-row');
  const buttonsContainer  = $('#buttons-container');

  // Toast
  const toastContainer    = $('#toast-container');

  // ─── State ─────────────────────────────────────────────
  let currentGuildId = null;
  let userData       = null;
  let guildsData     = [];
  let aiEnabled      = false;
  let embedButtons   = [];

  // ─── Init ──────────────────────────────────────────────
  init();

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      showLoginError('Login failed. Please try again.');
      window.history.replaceState({}, '', '/');
    }

    try {
      userData = await api('/api/user');
      await loadDashboard();
    } catch {
      showScreen('login');
    }
  }

  function showScreen(name) {
    loginScreen.classList.toggle('active', name === 'login');
    dashScreen.classList.toggle('active', name === 'dashboard');
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
  }

  async function loadDashboard() {
    showScreen('dashboard');
    userAvatar.src = userData.avatarUrl;
    userName.textContent = userData.globalName || userData.username;

    try {
      guildsData = await api('/api/guilds');
      populateGuildSelect(guildsData);
    } catch (e) {
      toast('Failed to load servers', 'error');
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
    
    // Reset tabs to first one
    switchTab('card-lock');

    await Promise.all([
      loadSettings(),
      loadChannels(guildId),
      loadRoles(guildId)
    ]);
  }

  // ─── Tab Switching ────────────────────────────────────
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    navItems.forEach(n => {
      n.classList.toggle('active', n.getAttribute('data-tab') === tabId);
    });
    tabContents.forEach(c => {
      c.classList.toggle('active', c.id === tabId);
    });
  }

  async function loadChannels(guildId) {
    try {
      const channels = await api(`/api/guilds/${guildId}/channels`);
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
      const roles = await api(`/api/guilds/${guildId}/roles`);
      const container = $('.roles-list-container');
      container.innerHTML = '';
      
      roles.forEach(role => {
        const div = document.createElement('div');
        div.className = 'role-item';
        div.innerHTML = `
          <input type="checkbox" id="role-${role.id}" value="${role.id}">
          <label for="role-${role.id}" style="color: ${role.color ? '#' + role.color.toString(16) : '#fff'}">
            ${role.name}
          </label>
        `;
        container.appendChild(div);
      });
    } catch (e) {
      toast('Failed to load roles', 'error');
    }
  }

  backBtn.addEventListener('click', () => {
    toast('Returning to servers list...', 'info');
    guildSelect.value = "";
    guildNameDisplay.textContent = "Select a Server";
    currentGuildId = null;
    $$('.channel-select').forEach(dd => dd.innerHTML = '<option>------- SERVER STATS -------</option>');
    $('.roles-list-container').innerHTML = '';
  });

  // ─── AI Toggling ──────────────────────────────────────
  async function loadSettings() {
    if (!currentGuildId) return;
    const data = await api(`/api/settings?guildId=${currentGuildId}`);
    setAIState(data.aiEnabled);
  }

  function setAIState(enabled) {
    aiEnabled = enabled;
    aiToggleBtn.classList.toggle('active', enabled);
    aiStatusLabel.textContent = enabled ? 'AI Status: Online' : 'AI Status: Offline';
    aiStatusLabel.className = 'ai-status-label ' + (enabled ? 'on' : 'off');
  }

  aiToggleBtn.addEventListener('click', async () => {
    if (!currentGuildId) return toast('Select a server first', 'error');
    aiToggleBtn.disabled = true;
    try {
      const data = await api('/api/settings/toggle', { method: 'POST', body: { guildId: currentGuildId } });
      setAIState(data.aiEnabled);
      toast(data.aiEnabled ? 'AI Activated' : 'AI Deactivated', 'success');
    } catch (e) {
      toast('Toggle failed', 'error');
    } finally {
      aiToggleBtn.disabled = false;
    }
  });

  // ─── Channel Management ──────────────────────────────
  // Set Permissions (Lock)
  $('#card-lock .btn-blue').addEventListener('click', async () => {
    const channelId = $('#card-lock .channel-select').value;
    if (!channelId) return toast('Select a channel first', 'error');
    
    const roleIds = [];
    $$('.roles-list-container input:checked').forEach(cb => roleIds.push(cb.value));

    toast('Updating permissions...', 'info');
    try {
      await api('/api/channels/lock', { method: 'POST', body: { guildId: currentGuildId, channelId, roleIds } });
      toast('Permissions updated successfully!', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  // Clear Chat
  $('#card-clear .btn-orange').addEventListener('click', async () => {
    const channelId = $('#card-clear .channel-select').value;
    if (!channelId) return toast('Select a channel first', 'error');
    
    if (!confirm('Are you sure? This will delete all messages in the channel!')) return;

    toast('Clearing chat (Cloning channel)...', 'info');
    try {
      await api('/api/channels/clear', { method: 'POST', body: { guildId: currentGuildId, channelId } });
      toast('Channel cleared and recreated!', 'success');
      loadChannels(currentGuildId);
    } catch (e) {
      toast(e.message, 'error');
    }
  });

  // ─── Embed Builder ─────────────────────────────────────
  addButtonRow.addEventListener('click', () => {
    if (buttonsContainer.children.length >= 5) return toast('Max 5 buttons allowed', 'error');
    
    const div = document.createElement('div');
    div.className = 'button-config-row';
    div.innerHTML = `
      <input type="text" placeholder="Label (e.g. Website)" class="btn-label">
      <input type="url" placeholder="URL (https://...)" class="btn-url">
      <button type="button" class="btn-remove">×</button>
    `;
    
    div.querySelector('.btn-remove').onclick = () => div.remove();
    buttonsContainer.appendChild(div);
  });

  embedForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentGuildId) return toast('Select a server first', 'error');
    if (!embedChannel.value) return toast('Select a channel', 'error');

    // Strict Validation
    if (embedTitle.value && embedTitle.value.length > 256) return toast('Title too long (max 256)', 'error');
    if (embedDesc.value && embedDesc.value.length > 2000) return toast('Description too long (max 2000)', 'error');

    const btn = $('#card-embed .btn-cyan');
    btn.disabled = true;
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Sending...';

    const buttons = [];
    $$('.button-config-row').forEach(row => {
      const label = row.querySelector('.btn-label').value;
      const url = row.querySelector('.btn-url').value;
      if (label && url) buttons.push({ label, url });
    });

    try {
      await api('/api/panel/send', {
        method: 'POST',
        body: {
          guildId: currentGuildId,
          channelId: embedChannel.value,
          title: embedTitle.value,
          description: embedDesc.value,
          color: embedColor.value,
          buttons: buttons
        }
      });
      toast('Panel added to bot queue!', 'success');
      embedForm.reset();
      buttonsContainer.innerHTML = '';
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  });

  // ─── API Helper ──────────────────────────────────────
  async function api(url, opts = {}) {
    // SECURITY: Include the Admin Key in all requests
    const ADMIN_KEY = "elite_secure_123";

    const config = {
      method: opts.method || 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_KEY}` 
      },
      credentials: 'same-origin',
    };
    if (opts.body) config.body = JSON.stringify(opts.body);

    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Unauthorized');
    return data;
  }

  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toast-out .3s forwards';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
})();
