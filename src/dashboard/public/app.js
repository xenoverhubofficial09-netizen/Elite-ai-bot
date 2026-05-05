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

  // ─── Init ──────────────────────────────────────────────
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
    guildsData = await api('/api/settings/guilds'); // Simple endpoint to verify key
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

  // Simplified UI Logic
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
