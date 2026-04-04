/**
 * SportyCalc — share strip (Copy, Facebook, X, Instagram, Email).
 * Reads canonical URL, og:title, and meta description from the page head.
 */
(function () {
  function getCanonicalUrl() {
    var link = document.querySelector('link[rel="canonical"]');
    if (link && link.href) return link.href;
    return window.location.href;
  }

  function getShareTitle() {
    var m = document.querySelector('meta[property="og:title"]');
    if (m && m.content) return m.content.trim();
    var t = document.title || 'SportyCalc';
    return t.replace(/\s*\|\s*SportyCalc\s*$/i, '').trim() || 'SportyCalc';
  }

  function getShareBlurb() {
    var m = document.querySelector('meta[name="description"]');
    if (m && m.content) return m.content.trim().slice(0, 280);
    return 'Free fitness tools on SportyCalc.';
  }

  var statusEl = document.getElementById('page-share-status');
  var hideTimer;

  function setStatus(message) {
    if (!statusEl) return;
    if (hideTimer) clearTimeout(hideTimer);
    statusEl.textContent = message;
    hideTimer = setTimeout(function () {
      statusEl.textContent = '';
    }, 7000);
  }

  function fallbackCopy(text, successMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
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
        setStatus('Copy this link: ' + getCanonicalUrl());
      }
    } catch (e) {
      setStatus('Copy this link: ' + getCanonicalUrl());
    }
    document.body.removeChild(ta);
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

  function wireShareLinks() {
    var url = getCanonicalUrl();
    var title = getShareTitle();
    var blurb = getShareBlurb();

    var fb = document.getElementById('page-share-fb');
    if (fb) {
      fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    }

    var x = document.getElementById('page-share-x');
    if (x) {
      var tweet = blurb.length > 200 ? blurb.slice(0, 197) + '…' : blurb;
      x.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweet) + '&url=' + encodeURIComponent(url);
    }

    var em = document.getElementById('page-share-email');
    if (em) {
      em.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(blurb + '\n\n' + url);
    }
  }

  function bindCopy() {
    var el = document.getElementById('page-share-copy');
    if (!el) return;
    el.addEventListener('click', function () {
      copyText(getCanonicalUrl(), 'Link copied to clipboard.');
    });
  }

  function bindInstagram() {
    var el = document.getElementById('page-share-instagram');
    if (!el) return;

    el.addEventListener('click', function () {
      var url = getCanonicalUrl();
      var blurb = getShareBlurb();
      var title = getShareTitle();
      var combined = blurb + '\n' + url;

      if (navigator.share && typeof navigator.share === 'function') {
        navigator.share({
          title: title,
          text: blurb,
          url: url
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

  function init() {
    wireShareLinks();
    bindCopy();
    bindInstagram();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
