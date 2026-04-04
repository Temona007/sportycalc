/**
 * BMI calculator page — share helpers (copy link, Instagram clipboard, status messages).
 * Facebook / X / Email use standard URLs in the HTML.
 */
(function () {
  var SHARE_URL = 'https://sportycalc.com/calculators/bmi-calculator.html';
  var SHARE_BLURB = 'Free BMI calculator — metric & imperial on SportyCalc.';
  var statusEl = document.getElementById('bmi-share-status');
  var hideTimer;

  function setStatus(message) {
    if (!statusEl) return;
    if (hideTimer) clearTimeout(hideTimer);
    statusEl.textContent = message;
    hideTimer = setTimeout(function () {
      statusEl.textContent = '';
    }, 5000);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        setStatus(successMsg);
      }).catch(function () {
        fallbackCopy(text, successMsg);
      });
    }
    fallbackCopy(text, successMsg);
  }

  function fallbackCopy(text, successMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      setStatus(successMsg);
    } catch (e) {
      setStatus('Could not copy automatically — copy the address from your browser bar.');
    }
    document.body.removeChild(ta);
  }

  document.getElementById('bmi-share-copy')?.addEventListener('click', function () {
    copyText(SHARE_URL, 'Link copied to clipboard.');
  });

  document.getElementById('bmi-share-instagram')?.addEventListener('click', function () {
    var forIg = SHARE_BLURB + ' ' + SHARE_URL;
    copyText(forIg, 'Copied — paste into Instagram Stories, Reels, or your bio.');
  });
})();
