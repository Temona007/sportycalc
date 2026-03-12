/**
 * Email capture popup - calculator pages only
 * Shows once per session, 10s after load. Closes on X, overlay click, or ESC.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'sportycalc_email_popup_dismissed';
  const DELAY_MS = 10000;

  // Config: Formspree endpoint (Vercel). Override with window.SPORTYCALC_SUBSCRIBE_URL if needed
  const SUBSCRIBE_URL = typeof window.SPORTYCALC_SUBSCRIBE_URL !== 'undefined'
    ? window.SPORTYCALC_SUBSCRIBE_URL
    : 'https://formspree.io/f/xkoqbwvp';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function createPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'email-popup-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="email-popup-modal" role="dialog" aria-labelledby="email-popup-title" aria-modal="true">
        <button type="button" class="email-popup-close" aria-label="Close">&times;</button>
        <h2 id="email-popup-title" class="email-popup-title">Get updates from our website</h2>
        <p class="email-popup-text">Enter your email to receive updates and new tools.</p>
        <form class="email-popup-form" novalidate>
          <input type="email" name="email" class="email-popup-input" placeholder="Email address" required autocomplete="email">
          <span class="email-popup-error" aria-live="polite"></span>
          <button type="submit" class="email-popup-btn">Subscribe</button>
        </form>
        <p class="email-popup-disclaimer">No spam. Unsubscribe anytime.</p>
      </div>
    `;
    return overlay;
  }

  function showPopup(overlay) {
    overlay.classList.add('email-popup-visible');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function hidePopup(overlay) {
    overlay.classList.remove('email-popup-visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function closeAndRemember(overlay) {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
    hidePopup(overlay);
  }

  function init() {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const overlay = createPopup();
    document.body.appendChild(overlay);

    const form = overlay.querySelector('.email-popup-form');
    const input = overlay.querySelector('.email-popup-input');
    const errorEl = overlay.querySelector('.email-popup-error');
    const btn = overlay.querySelector('.email-popup-btn');
    const closeBtn = overlay.querySelector('.email-popup-close');

    function close() {
      closeAndRemember(overlay);
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && overlay.classList.contains('email-popup-visible')) {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      errorEl.textContent = '';
      const email = (input.value || '').trim();

      if (!isValidEmail(email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Subscribing…';

      try {
        const res = await fetch(SUBSCRIBE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });

        if (res.ok) {
          try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
          form.innerHTML = '<p class="email-popup-success">Thanks for subscribing!</p>';
        } else {
          throw new Error('Request failed');
        }
      } catch (err) {
        errorEl.textContent = 'Something went wrong. Try again.';
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });

    setTimeout(function () {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        showPopup(overlay);
      }
    }, DELAY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
