(() => {
  'use strict';

  const WEDDING_DATE = '2026-08-30T11:30:00+05:30';
  const MAPS_URL = 'https://maps.app.goo.gl/E7kseLG7TxHm4TL17';
  const STORAGE_KEY = 'mohamed_badusha_mumthas_nadeera_rsvp';
  const endpoint = String(window.RSVP_CONFIG?.endpoint || '').trim();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!endpoint) {
    console.warn('[Wedding RSVP] No Apps Script /exec endpoint is configured in assets/rsvp-config.js. The invitation remains usable, but responses are saved only in this browser during setup.');
  }

  const gate = document.getElementById('invitationGate');
  const openButton = document.getElementById('openInvitation');
  const main = document.getElementById('mainContent');
  if (main) main.inert = true;
  openButton?.focus({ preventScroll: true });

  openButton?.addEventListener('click', () => {
    document.body.classList.remove('invitation-locked');
    gate?.classList.add('is-open');
    if (main) main.inert = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.setTimeout(() => {
      if (gate) gate.hidden = true;
      if (main) {
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
    }, reduceMotion ? 0 : 760);
  });

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;

  document.querySelectorAll('.reveal').forEach((element) => {
    if (revealObserver && !reduceMotion) revealObserver.observe(element);
    else element.classList.add('is-visible');
  });

  const progress = document.getElementById('pageProgress');
  const story = document.getElementById('story');
  const frames = [...document.querySelectorAll('.story-frame')];
  const storyCounter = document.getElementById('storyCounter');
  const storyKicker = document.getElementById('storyKicker');
  const storyTitle = document.getElementById('storyTitle');
  const storyCopy = document.getElementById('storyCopy');
  let activeFrame = 0;
  let scrollTicking = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateScrollEffects() {
    const root = document.documentElement;
    const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${(root.scrollTop / maxScroll) * 100}%`;

    if (!reduceMotion && story && frames.length) {
      const rect = story.getBoundingClientRect();
      const travel = Math.max(1, story.offsetHeight - window.innerHeight);
      const storyProgress = clamp(-rect.top / travel, 0, 1);
      const rawFrame = storyProgress * (frames.length - 1);
      const nextActive = clamp(Math.round(rawFrame), 0, frames.length - 1);

      frames.forEach((frame, index) => {
        const distance = Math.abs(rawFrame - index);
        const opacity = clamp(1 - distance, 0, 1);
        const direction = clamp(rawFrame - index, -1, 1);
        frame.style.opacity = opacity.toFixed(3);
        frame.style.transform = `scale(${(1.035 - direction * 0.008).toFixed(3)})`;
        frame.classList.toggle('is-active', index === nextActive);
      });

      if (nextActive !== activeFrame) {
        activeFrame = nextActive;
        const frame = frames[activeFrame];
        if (storyCounter) storyCounter.textContent = `${String(activeFrame + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}`;
        if (storyKicker) storyKicker.textContent = frame.dataset.kicker || '';
        if (storyTitle) storyTitle.textContent = frame.dataset.title || '';
        if (storyCopy) storyCopy.textContent = frame.dataset.copy || '';
      }
    }
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollEffects, { passive: true });
  updateScrollEffects();

  const countdown = document.getElementById('countdown');
  let countdownTimer;
  function updateCountdown() {
    if (!countdown) return;
    const difference = Math.max(0, new Date(WEDDING_DATE).getTime() - Date.now());
    const values = [
      Math.floor(difference / 86400000),
      Math.floor(difference / 3600000) % 24,
      Math.floor(difference / 60000) % 60,
      Math.floor(difference / 1000) % 60
    ];
    countdown.querySelectorAll('strong').forEach((element, index) => {
      element.textContent = String(values[index]).padStart(2, '0');
    });
    if (difference === 0 && countdownTimer) window.clearInterval(countdownTimer);
  }
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);

  const form = document.getElementById('rsvpForm');
  const guestCount = document.getElementById('guestCount');
  const guestHelp = document.getElementById('guestHelp');
  const phoneInput = document.getElementById('rsvpPhone');
  const status = document.getElementById('rsvpStatus');
  const submitButton = document.getElementById('rsvpSubmit');

  function selectedAttendance() {
    return form?.querySelector('input[name="attendance"]:checked')?.value || 'Yes';
  }

  function syncGuestCount() {
    if (!guestCount) return;
    const attending = selectedAttendance() === 'Yes';
    guestCount.disabled = !attending;
    guestCount.required = attending;
    guestCount.value = attending ? String(Math.max(1, Number(guestCount.value) || 1)) : '0';
    if (guestHelp) guestHelp.textContent = attending ? 'Include everyone attending in your party.' : 'Guest count is set to 0 for a declined response.';
  }

  form?.querySelectorAll('input[name="attendance"]').forEach((input) => input.addEventListener('change', syncGuestCount));
  syncGuestCount();

  function normalizedName(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function normalizedPhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function upsertLocal(record) {
    let records = [];
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) records = stored;
    } catch (_) {
      records = [];
    }
    const phone = normalizedPhone(record.phone);
    const name = normalizedName(record.name);
    const matchIndex = records.findIndex((existing) => {
      const existingPhone = normalizedPhone(existing.phone);
      const existingName = normalizedName(existing.name);
      return (phone && existingPhone && phone === existingPhone) || (name && name === existingName);
    });
    if (matchIndex >= 0) records[matchIndex] = record;
    else records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  async function sendCentral(record) {
    if (!endpoint) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(record),
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function setFormStatus(message, type = '') {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${type}`.trim();
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFormStatus('');
    const nameInput = document.getElementById('rsvpName');
    const name = String(nameInput?.value || '').trim().replace(/\s+/g, ' ');
    const phone = String(phoneInput?.value || '').trim();
    const phoneDigits = normalizedPhone(phone);
    const attendance = selectedAttendance();
    const guests = attendance === 'Yes' ? Number(guestCount?.value) : 0;

    nameInput?.setCustomValidity(name.length >= 2 ? '' : 'Please enter a name or family name.');
    phoneInput?.setCustomValidity(!phone || (phoneDigits.length >= 7 && phoneDigits.length <= 15) ? '' : 'Please enter a valid phone number or leave it blank.');
    guestCount?.setCustomValidity(attendance === 'No' || (Number.isInteger(guests) && guests >= 1 && guests <= 10) ? '' : 'Please enter a guest count from 1 to 10.');
    if (!form.checkValidity()) {
      form.reportValidity();
      setFormStatus('Please check the highlighted details and try again.', 'error');
      return;
    }

    const record = {
      name,
      attendance,
      guestCount: attendance === 'Yes' ? guests : 0,
      phone,
      timestamp: new Date().toISOString()
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }
    setFormStatus('Sending your reply…');

    try {
      upsertLocal(record);
      await sendCentral(record);
      form.reset();
      syncGuestCount();
      setFormStatus('Thank you — your RSVP has been received.', 'success');
    } catch (error) {
      console.error('[Wedding RSVP] Submission failed:', error);
      setFormStatus('We could not send your reply. Please check your connection and try again.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send RSVP';
      }
    }
  });

  phoneInput?.addEventListener('input', () => phoneInput.setCustomValidity(''));
  guestCount?.addEventListener('input', () => guestCount.setCustomValidity(''));

  const shareButton = document.getElementById('shareInvitation');
  const whatsapp = document.getElementById('whatsappShare');
  const shareStatus = document.getElementById('shareStatus');
  const invitationUrl = (() => {
    const url = new URL(window.location.href);
    url.hash = '';
    return url.href;
  })();
  const shareText = 'You are invited to the wedding reception of Mohamed Badusha & Mumthas Nadeera on Sunday, 30 August 2026, 11:30 AM–2:00 PM at Planet Auditorium.';

  if (whatsapp) {
    const message = `${shareText}\n\nInvitation: ${invitationUrl}\nGoogle Maps: ${MAPS_URL}`;
    whatsapp.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  async function copyInvitationLink() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(invitationUrl);
      return;
    }
    const helper = document.createElement('textarea');
    helper.value = invitationUrl;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand('copy');
    helper.remove();
    if (!copied) throw new Error('Copy unavailable');
  }

  shareButton?.addEventListener('click', async () => {
    if (shareStatus) shareStatus.textContent = '';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mohamed Badusha & Mumthas Nadeera | Wedding Reception', text: shareText, url: invitationUrl });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await copyInvitationLink();
      if (shareStatus) shareStatus.textContent = 'Invitation link copied.';
    } catch (_) {
      if (shareStatus) shareStatus.textContent = 'Please copy the page address from your browser.';
    }
  });
})();
