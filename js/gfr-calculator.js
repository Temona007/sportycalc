/**
 * GFR Calculator — SportyCalc
 * Equations aligned with calculator.net / typical IDMS MDRD, CKD-EPI 2009 (race-inclusive),
 * Mayo Quadratic, Schwartz pediatric. Output in mL/min/1.73 m² (estimated).
 */
(function () {
  'use strict';

  var UMOL_L_TO_MG_DL = 1 / 88.4;

  function scrToMgDl(value, unit) {
    if (unit === 'umol') return value * UMOL_L_TO_MG_DL;
    return value;
  }

  function gfrMdrd(scrMgDl, ageYears, female, black) {
    return (
      175 *
      Math.pow(scrMgDl, -1.154) *
      Math.pow(ageYears, -0.203) *
      (female ? 0.742 : 1) *
      (black ? 1.212 : 1)
    );
  }

  function gfrCkdEpi(scrMgDl, ageYears, female, black) {
    var kappa = female ? 0.7 : 0.9;
    var lowScr = female ? scrMgDl <= 0.7 : scrMgDl <= 0.9;
    var alpha = lowScr ? (female ? -0.329 : -0.411) : -1.209;
    var coef = black ? (female ? 166 : 163) : female ? 144 : 141;
    return coef * Math.pow(scrMgDl / kappa, alpha) * Math.pow(0.993, ageYears);
  }

  function gfrMayo(scrMgDl, ageYears, female) {
    var s = scrMgDl < 0.8 ? 0.8 : scrMgDl;
    var x =
      1.911 +
      5.249 / s -
      2.114 / (s * s) -
      0.00686 * ageYears -
      (female ? 0.205 : 0);
    return Math.exp(x);
  }

  function gfrSchwartz(heightCm, scrMgDl) {
    return (0.413 * heightCm) / scrMgDl;
  }

  function fmt(g) {
    if (!isFinite(g) || g <= 0) return '—';
    return (Math.round(g * 10) / 10).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  /** Rough GFR-only context (not diagnostic; full CKD staging uses more than GFR). */
  function stageHintLine(g) {
    if (!isFinite(g) || g <= 0) return 'Enter your details and tap Calculate.';
    if (g >= 90) return 'GFR alone often falls in G1–G2 discussion range — urine and trends matter.';
    if (g >= 60) return 'GFR alone may align with G2 range if persistent — confirm with your clinician.';
    if (g >= 45) return 'GFR alone may align with G3a range — medical follow-up is important.';
    if (g >= 30) return 'GFR alone may align with G3b range — seek clinical guidance.';
    if (g >= 15) return 'GFR alone may align with G4 range — urgent nephrology input is typical.';
    return 'GFR alone may align with G5 range — this is a medical emergency context.';
  }

  function getScrUnit(form) {
    var active = form.querySelector('.gfr-scr-unit-btn.active');
    return (active && active.getAttribute('data-scr-unit')) || 'mgdl';
  }

  function getChildHeightCm() {
    var mode = document.querySelector('#gfr-form-child .gfr-height-unit-btn.active');
    var u = (mode && mode.getAttribute('data-height-unit')) || 'cm';
    if (u === 'cm') {
      var cm = parseFloat(document.getElementById('gfr-child-height-cm').value);
      return cm > 0 ? cm : 0;
    }
    var ft = parseFloat(document.getElementById('gfr-child-height-ft').value) || 0;
    var inch = parseFloat(document.getElementById('gfr-child-height-in').value) || 0;
    var totalIn = ft * 12 + inch;
    return totalIn > 0 ? totalIn * 2.54 : 0;
  }

  function setVisible(el, on) {
    if (!el) return;
    el.hidden = !on;
    el.style.display = on ? '' : 'none';
  }

  function resetOutputs(isAdultMode) {
    document.getElementById('gfr-out-mdrd').textContent = '—';
    document.getElementById('gfr-out-ckd').textContent = '—';
    document.getElementById('gfr-out-mayo').textContent = '—';
    document.getElementById('gfr-out-schwartz').textContent = '—';
    document.getElementById('gfr-primary-value').textContent = '—';
    document.getElementById('gfr-stage-hint').textContent = 'Enter your details and tap Calculate.';
    var cap = document.getElementById('gfr-results-caption');
    if (cap) cap.textContent = isAdultMode ? 'CKD-EPI (primary)' : 'Schwartz';
  }

  function init() {
    var adultForm = document.getElementById('gfr-form-adult');
    var childForm = document.getElementById('gfr-form-child');
    if (!adultForm || !childForm) return;

    var errEl = document.getElementById('gfr-error');
    var wrapAdult = document.getElementById('gfr-adult-rows-wrap');
    var wrapChild = document.getElementById('gfr-child-rows-wrap');
    var modeBtns = document.querySelectorAll('.gfr-mode-btn');

    function setMode(mode) {
      modeBtns.forEach(function (b) {
        var m = b.getAttribute('data-mode');
        b.classList.toggle('active', m === mode);
      });
      var adult = mode === 'adult';
      setVisible(adultForm, adult);
      setVisible(childForm, !adult);
      if (wrapAdult) wrapAdult.hidden = !adult;
      if (wrapChild) wrapChild.hidden = adult;
      resetOutputs(adult);
      errEl.textContent = '';
    }

    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-mode');
        if (mode) setMode(mode);
      });
    });

    document.querySelectorAll('.gfr-scr-unit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var form = btn.closest('form');
        if (!form) return;
        form.querySelectorAll('.gfr-scr-unit-btn').forEach(function (x) {
          x.classList.toggle('active', x === btn);
        });
      });
    });

    document.querySelectorAll('.gfr-height-unit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var u = btn.getAttribute('data-height-unit');
        childForm.querySelectorAll('.gfr-height-unit-btn').forEach(function (x) {
          x.classList.toggle('active', x === btn);
        });
        var cmRow = document.getElementById('gfr-child-height-cm-wrap');
        var imRow = document.getElementById('gfr-child-height-im-wrap');
        if (u === 'cm') {
          cmRow.hidden = false;
          imRow.hidden = true;
        } else {
          cmRow.hidden = true;
          imRow.hidden = false;
        }
      });
    });

    adultForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.textContent = '';
      var age = parseFloat(document.getElementById('gfr-adult-age').value);
      var scrRaw = parseFloat(document.getElementById('gfr-adult-scr').value);
      var female = document.getElementById('gfr-adult-sex').value === 'female';
      var black = document.getElementById('gfr-adult-race').value === 'black';
      var unit = getScrUnit(adultForm);

      if (!age || age < 18 || age > 120) {
        errEl.textContent = 'Age should be between 18 and 120 for the adult equations.';
        return;
      }
      if (!scrRaw || scrRaw <= 0) {
        errEl.textContent = 'Enter a valid serum creatinine.';
        return;
      }

      var scrMg = scrToMgDl(scrRaw, unit === 'umol' ? 'umol' : 'mgdl');
      if (!isFinite(scrMg) || scrMg <= 0) {
        errEl.textContent = 'Invalid creatinine after unit conversion.';
        return;
      }

      var m = gfrMdrd(scrMg, age, female, black);
      var c = gfrCkdEpi(scrMg, age, female, black);
      var y = gfrMayo(scrMg, age, female);

      document.getElementById('gfr-out-mdrd').textContent = fmt(m);
      document.getElementById('gfr-out-ckd').textContent = fmt(c);
      document.getElementById('gfr-out-mayo').textContent = fmt(y);
      document.getElementById('gfr-primary-value').textContent = fmt(c);
      document.getElementById('gfr-results-caption').textContent = 'CKD-EPI (2009)';
      document.getElementById('gfr-stage-hint').textContent = stageHintLine(c);
    });

    childForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.textContent = '';
      var scrRaw = parseFloat(document.getElementById('gfr-child-scr').value);
      var unit = getScrUnit(childForm);
      var hCm = getChildHeightCm();

      if (!scrRaw || scrRaw <= 0) {
        errEl.textContent = 'Enter a valid serum creatinine.';
        return;
      }
      if (!hCm || hCm < 40 || hCm > 250) {
        errEl.textContent = 'Enter height (about 40–250 cm).';
        return;
      }

      var scrMg = scrToMgDl(scrRaw, unit === 'umol' ? 'umol' : 'mgdl');
      var s = gfrSchwartz(hCm, scrMg);

      document.getElementById('gfr-out-schwartz').textContent = fmt(s);
      document.getElementById('gfr-primary-value').textContent = fmt(s);
      document.getElementById('gfr-results-caption').textContent = 'Schwartz';
      document.getElementById('gfr-stage-hint').textContent = stageHintLine(s);
    });

    setMode('adult');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
