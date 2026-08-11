(() => {
  'use strict';

  const STORAGE_KEY = 'mohamed_badusha_mumthas_nadeera_rsvp';
  const PREVIEW_AUTH_HASH = '36a4699e';
  const endpoint = String(window.RSVP_CONFIG?.endpoint || '').trim();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let credentials = null;
  let currentRecords = [];

  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const loginError = document.getElementById('loginError');
  const logoutButton = document.getElementById('logoutButton');
  const refreshButton = document.getElementById('refreshButton');
  const exportButton = document.getElementById('exportButton');
  const searchInput = document.getElementById('searchInput');
  const attendanceFilter = document.getElementById('attendanceFilter');

  if (!endpoint) {
    console.warn('[Family RSVP] No Apps Script /exec endpoint is configured. The dashboard is running in local preview mode.');
  }

  function loginHash(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function localRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function jsonpList(url, username, password) {
    return new Promise((resolve, reject) => {
      const callback = `__wedding_rsvp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = window.setTimeout(() => finish(new Error('Dashboard request timed out.')), 12000);
      function finish(error, value) {
        window.clearTimeout(timer);
        delete window[callback];
        script.remove();
        if (error) reject(error);
        else resolve(value);
      }
      window[callback] = (value) => finish(null, value);
      script.onerror = () => finish(new Error('Dashboard request failed.'));
      const separator = url.includes('?') ? '&' : '?';
      script.src = `${url}${separator}action=list&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&callback=${encodeURIComponent(callback)}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function fetchCentral(username, password) {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'list', username, password }),
          signal: controller.signal
        });
      } finally {
        window.clearTimeout(timer);
      }
      const result = await response.json();
      if (!result?.ok) throw new Error(result?.error || 'Sign-in failed.');
      return result;
    } catch (firstError) {
      const result = await jsonpList(endpoint, username, password);
      if (!result?.ok) throw new Error(result?.error || firstError.message || 'Sign-in failed.');
      return result;
    }
  }

  function setLoginLoading(loading) {
    if (!loginButton) return;
    loginButton.disabled = loading;
    loginButton.textContent = loading ? 'Signing in…' : 'Open Dashboard';
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = String(document.getElementById('username')?.value || '').trim();
    const password = String(document.getElementById('password')?.value || '');
    if (loginError) loginError.textContent = '';
    setLoginLoading(true);

    try {
      if (endpoint) {
        const result = await fetchCentral(username, password);
        credentials = { username, password };
        currentRecords = Array.isArray(result.records) ? result.records : [];
        showDashboard('online');
      } else {
        if (loginHash(`${username}|${password}`) !== PREVIEW_AUTH_HASH) throw new Error('Username or password is incorrect.');
        credentials = { username, password };
        currentRecords = localRecords();
        showDashboard('local');
      }
    } catch (error) {
      if (loginError) loginError.textContent = error.message === 'Unauthorized' ? 'Username or password is incorrect.' : (error.message || 'Unable to sign in.');
    } finally {
      setLoginLoading(false);
    }
  });

  function showDashboard(mode) {
    loginView?.classList.add('hidden');
    dashboardView?.classList.remove('hidden');
    logoutButton?.classList.remove('hidden');
    setSyncState(mode);
    render(currentRecords);
  }

  function setSyncState(mode, message) {
    const state = document.getElementById('syncState');
    const text = document.getElementById('syncText');
    const dataNote = document.getElementById('dataNote');
    if (state) state.className = `sync-state ${mode}`;
    if (text) text.textContent = message || (mode === 'online' ? 'Central RSVP' : mode === 'error' ? 'Sync unavailable' : 'Local preview');
    if (dataNote) {
      dataNote.textContent = mode === 'online'
        ? 'Showing centrally collected RSVP responses from all guest devices.'
        : mode === 'error'
          ? 'The central list could not be refreshed; the last available responses remain visible.'
          : 'Central RSVP is not connected yet. Responses saved on this device are shown.';
    }
  }

  logoutButton?.addEventListener('click', () => {
    credentials = null;
    currentRecords = [];
    window.location.reload();
  });

  refreshButton?.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
    try {
      if (endpoint && credentials) {
        setSyncState('', 'Syncing…');
        const result = await fetchCentral(credentials.username, credentials.password);
        currentRecords = Array.isArray(result.records) ? result.records : [];
        setSyncState('online');
      } else {
        currentRecords = localRecords();
        setSyncState('local');
      }
      render(currentRecords);
    } catch (error) {
      console.error('[Family RSVP] Refresh failed:', error);
      if (!currentRecords.length) currentRecords = localRecords();
      setSyncState('error');
      render(currentRecords);
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  });

  searchInput?.addEventListener('input', applyFilters);
  attendanceFilter?.addEventListener('change', applyFilters);

  function guestTotal(record) {
    if (record.attendance !== 'Yes') return 0;
    const value = Number(record.guestCount ?? record.guests ?? 0);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function render(records) {
    const accepted = records.filter((record) => record.attendance === 'Yes').length;
    const declined = records.filter((record) => record.attendance === 'No').length;
    const guests = records.reduce((total, record) => total + guestTotal(record), 0);
    const responses = records.length;
    const average = accepted ? guests / accepted : 0;
    const yesPercent = responses ? Math.round((accepted / responses) * 100) : 0;
    const noPercent = responses ? Math.round((declined / responses) * 100) : 0;

    animateMetric('responses', responses, 0);
    animateMetric('accepted', accepted, 0);
    animateMetric('guests', guests, 0);
    animateMetric('declined', declined, 0);
    animateMetric('average', average, 1);

    window.requestAnimationFrame(() => {
      setWidth('acceptedBar', yesPercent);
      setWidth('declinedBar', noPercent);
      setWidth('averageBar', Math.min(100, (average / 10) * 100));
      setText('acceptedPercent', `${yesPercent}%`);
      setText('declinedPercent', `${noPercent}%`);
      setText('averageValue', average ? average.toFixed(1) : '0');
      const ring = document.getElementById('guestRing');
      if (ring) ring.style.setProperty('--ring', `${yesPercent}%`);
      setText('ringGuests', guests);
      setText('ringNote', responses ? `${accepted} accepted ${accepted === 1 ? 'response' : 'responses'} representing ${guests} expected ${guests === 1 ? 'person' : 'people'}.` : 'RSVP totals will appear here as responses arrive.');
    });

    setText('lastUpdated', `Last refreshed · ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`);
    applyFilters();
  }

  function animateMetric(name, target, decimals) {
    const element = document.querySelector(`[data-metric="${name}"]`);
    if (!element) return;
    if (reduceMotion) {
      element.textContent = decimals ? target.toFixed(decimals) : String(Math.round(target));
      return;
    }
    const start = Number(element.textContent) || 0;
    const started = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - started) / 450);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * eased;
      element.textContent = decimals ? value.toFixed(decimals) : String(Math.round(value));
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  function setWidth(id, percent) {
    const element = document.getElementById(id);
    if (element) element.style.width = `${percent}%`;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  function applyFilters() {
    const query = String(searchInput?.value || '').trim().toLowerCase();
    const attendance = String(attendanceFilter?.value || 'all');
    const filtered = currentRecords.filter((record) => {
      const matchesAttendance = attendance === 'all' || record.attendance === attendance;
      const searchable = `${record.name || ''} ${record.phone || ''}`.toLowerCase();
      return matchesAttendance && (!query || searchable.includes(query));
    });
    renderTable(filtered);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function formattedDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function renderTable(records) {
    const tbody = document.getElementById('responseRows');
    const empty = document.getElementById('emptyState');
    if (!tbody || !empty) return;
    tbody.innerHTML = '';
    empty.classList.toggle('hidden', records.length > 0);
    empty.textContent = currentRecords.length ? 'No responses match this filter.' : 'No RSVP responses yet.';
    [...records].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).forEach((record) => {
      const row = document.createElement('tr');
      const phone = String(record.phone || '').trim();
      const tel = phone.replace(/[^+\d]/g, '');
      const phoneCell = phone ? `<a class="phone-link" href="tel:${escapeHtml(tel)}">${escapeHtml(phone)}</a>` : '—';
      const accepted = record.attendance === 'Yes';
      row.innerHTML = `<td data-label="Name">${escapeHtml(record.name || '—')}</td><td data-label="Attendance"><span class="status-pill ${accepted ? 'yes' : 'no'}">${accepted ? 'Accepted' : 'Declined'}</span></td><td data-label="Guests">${guestTotal(record)}</td><td data-label="Phone">${phoneCell}</td><td data-label="Submitted / Updated">${escapeHtml(formattedDate(record.timestamp || record.updatedAt))}</td>`;
      tbody.appendChild(row);
    });
  }

  function safeSpreadsheetValue(value) {
    const text = String(value ?? '');
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  }

  exportButton?.addEventListener('click', () => {
    const rows = [
      ['Name', 'Attendance', 'Guest Count', 'Phone', 'Submitted / Updated'],
      ...currentRecords.map((record) => [record.name || '', record.attendance || '', guestTotal(record), record.phone || '', record.timestamp || record.updatedAt || ''])
    ];
    const csv = rows.map((row) => row.map((value) => `"${safeSpreadsheetValue(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wedding-rsvp.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  });
})();
