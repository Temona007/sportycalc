/**
 * BMI calculator page — share helpers (copy link, Instagram via Web Share or clipboard).
 * Facebook / X / Email use standard URLs in the HTML.
 */
(function () {
  var SHARE_URL = 'https://sportycalc.com/calculators/bmi-calculator.html';
  var SHARE_TITLE = 'BMI Calculator – SportyCalc';
  var SHARE_BLURB = 'Free BMI calculator — metric & imperial on SportyCalc.';
  var statusEl = document.getElementById('bmi-share-status');
  var hideTimer;

  function setStatus(message) {
    if (!statusEl) return;
    if (hideTimer) clearTimeout(hideTimer);
    statusEl.textContent = message;
    hideTimer = setTimeout(function () {
      statusEl.textContent = '';
    }, 7000);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(function () {
        setStatus(successMsg);
      }).catch(function () {
        fallbackCopy(text, successMsg);
      });
      return;
    }
    fallbackCopy(text, successMsg);
  }

  /**
   * execCommand copy — works more reliably on iOS Safari when the field is visible and selected.
   */
  function fallbackCopy(text, successMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    /* iOS Safari: keep field in the viewport so selection/copy can succeed */
    ta.style.position = 'fixed';
    ta.style.top = '50%';
    ta.style.left = '50%';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    ta.style.margin = '0';
    ta.style.border = 'none';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);

    try {
      var ok = document.execCommand('copy');
      if (ok) {
        setStatus(successMsg);
      } else {
        setStatus('Copy this link: ' + SHARE_URL);
      }
    } catch (e) {
      setStatus('Copy this link: ' + SHARE_URL);
    }
    document.body.removeChild(ta);
  }

  function bindCopy() {
    var el = document.getElementById('bmi-share-copy');
    if (!el) return;
    el.addEventListener('click', function () {
      copyText(SHARE_URL, 'Link copied to clipboard.');
    });
  }

  function bindInstagram() {
    var el = document.getElementById('bmi-share-instagram');
    if (!el) return;

    el.addEventListener('click', function () {
      var combined = SHARE_BLURB + '\n' + SHARE_URL;

      if (navigator.share && typeof navigator.share === 'function') {
        navigator.share({
          title: SHARE_TITLE,
          text: SHARE_BLURB,
          url: SHARE_URL
        }).then(function () {
          setStatus('Shared — if Instagram did not appear, use Copy link and paste in the app.');
        }).catch(function (err) {
          if (err && err.name === 'AbortError') {
            return;
          }
          copyText(combined, 'Copied — open Instagram and paste in Stories, DMs, or your bio.');
        });
        return;
      }

      copyText(combined, 'Copied — open Instagram and paste in Stories, DMs, or your bio.');
    });
  }

  bindCopy();
  bindInstagram();
})();
