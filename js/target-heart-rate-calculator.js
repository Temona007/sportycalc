/**
 * Target Heart Rate Calculator — SportyCalc
 * Max HR: Haskell–Fox (220−age), Tanaka et al. (208−0.7×age), Nes et al. (211−0.64×age).
 * Zones (5): 50–60%, 60–70%, …, 90–100% of MHR OR of heart-rate reserve with Karvonen.
 * Borg 6–20: THR = RHR + (MHR − RHR) × (B − 6) / 14. CR10: THR = RHR + HRR × (B / 10).
 * Reference parity: calculator.net-style behavior (fixed scrape typos by using standard formulae).
 */
(function () {
  'use strict';

  var ZONE_PCTS = [
    { id: 'z1', lo: 50, hi: 60 },
    { id: 'z2', lo: 60, hi: 70 },
    { id: 'z3', lo: 70, hi: 80 },
    { id: 'z4', lo: 80, hi: 90 },
    { id: 'z5', lo: 90, hi: 100 }
  ];

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function estimateMaxHr(age, formula) {
    if (formula === 'tanaka') return 208 - 0.7 * age;
    if (formula === 'nes') return 211 - 0.64 * age;
    return 220 - age; // haskell
  }

  function parseOptionalMeasuredMax(raw) {
    if (raw === '' || raw == null) return null;
    var n = Number(raw);
    if (!isFinite(n)) return null;
    n = Math.round(n);
    if (n < 100 || n > 230) return null;
    return n;
  }

  function parseRhr(raw) {
    if (raw === '' || raw == null) return null;
    var n = parseFloat(raw);
    if (!isFinite(n)) return null;
    n = Math.round(n);
    if (n < 30 || n > 120) return null;
    return n;
  }

  function calcZonePctMax(mhr, loPct, hiPct) {
    var lo = Math.round((mhr * loPct) / 100);
    var hi = Math.round((mhr * hiPct) / 100);
    return [lo, hi];
  }

  function calcZoneKarvonen(mhr, rhr, loPct, hiPct) {
    var hrr = mhr - rhr;
    var lo = Math.round(rhr + (hrr * loPct) / 100);
    var hi = Math.round(rhr + (hrr * hiPct) / 100);
    return [lo, hi];
  }

  /** Borg scale 6–20 mapped linearly onto HRR (common Karvonen–Borg linkage). */
  function thrFromBorg620(rhr, mhr, b) {
    var hrr = mhr - rhr;
    b = clamp(b, 6, 20);
    var frac = (b - 6) / 14;
    return Math.round(rhr + hrr * frac);
  }

  function thrFromBorgCr10(rhr, mhr, b) {
    var hrr = mhr - rhr;
    b = clamp(b, 0, 10);
    return Math.round(rhr + (hrr * b) / 10);
  }

  function formulaLabel(formulaKey) {
    if (formulaKey === 'tanaka') return '208 − 0.7 × age';
    if (formulaKey === 'nes') return '211 − 0.64 × age';
    return '220 − age';
  }

  function init() {
    var form = document.getElementById('thr-form');
    var errEl = document.getElementById('thr-error');
    var ageInput = document.getElementById('thr-age');
    var measuredInput = document.getElementById('thr-measured-mhr');
    var rhrInput = document.getElementById('thr-rhr');
    var formulaSel = document.getElementById('thr-mhr-formula');
    var intensitySel = document.getElementById('thr-intensity');
    var rpeGroup = document.getElementById('thr-rpe-group');
    var rpeInput = document.getElementById('thr-rpe-value');
    var rpeHint = document.getElementById('thr-rpe-hint');
    var zonesWrap = document.getElementById('thr-zones-results');
    var rpeWrap = document.getElementById('thr-rpe-result-row');
    var resultMax = document.getElementById('thr-result-max');
    var resultHrrRow = document.getElementById('thr-result-hrr-row');
    var resultHrr = document.getElementById('thr-result-hrr');
    var resultThr = document.getElementById('thr-result-single-thr');
    var caption = document.getElementById('thr-result-caption');
    var subtitle = document.getElementById('thr-result-subtitle');

    if (
      !form ||
      !errEl ||
      !ageInput ||
      !resultThr ||
      !resultMax ||
      !caption ||
      !subtitle
    )
      return;

    function intensityMode() {
      return intensitySel ? intensitySel.value : 'pct-max';
    }

    function toggleUi() {
      var mode = intensityMode();
      if (rpeGroup) rpeGroup.hidden = mode !== 'borg620' && mode !== 'borg10';
      if (rpeHint) {
        if (mode === 'borg620')
          rpeHint.textContent = 'Borg 6–20; typical “somewhat hard” ≈ 13.';
        else if (mode === 'borg10')
          rpeHint.textContent = 'Borg CR10 (0–10); decimals allowed (e.g. 4 or 7).';
        else rpeHint.textContent = '';
      }
      var needRhr = mode === 'karvonen' || mode === 'borg620' || mode === 'borg10';
      form.classList.toggle('thr-needs-rhr', needRhr);
    }

    function run(ev) {
      if (ev) ev.preventDefault();
      errEl.textContent = '';

      ZONE_PCTS.forEach(function (z) {
        var el = document.getElementById('thr-' + z.id);
        if (el) el.textContent = '—';
      });
      resultThr.textContent = '—';
      caption.textContent = 'Training zones';
      resultMax.textContent = '—';
      subtitle.textContent = '';
      if (resultHrrRow) resultHrrRow.hidden = true;
      if (resultHrr) resultHrr.textContent = '—';

      var age = parseInt(ageInput.value, 10);
      var measured = measuredInput ? parseOptionalMeasuredMax(measuredInput.value) : null;
      var rhr = rhrInput ? parseRhr(rhrInput.value) : null;

      var mode = intensityMode();
      var needRhr = mode === 'karvonen' || mode === 'borg620' || mode === 'borg10';

      if (!age || age < 10 || age > 100) {
        errEl.textContent = 'Age should be between 10 and 100.';
        return;
      }
      var formulaKey = formulaSel ? formulaSel.value : 'haskell';
      var mhr = measured != null ? measured : Math.round(estimateMaxHr(age, formulaKey));

      if (!mhr || mhr < 100 || mhr > 230) {
        errEl.textContent = 'Check max heart rate or measured override (100–230 bpm).';
        return;
      }

      var hrrTxt = '';

      resultMax.textContent = String(mhr);
      subtitle.textContent = measured != null ? 'Measured max HR' : 'Est. max: ' + formulaLabel(formulaKey);

      if (needRhr) {
        if (rhr == null) {
          errEl.textContent = 'Resting HR required for this intensity method (reasonable range ~30–120 bpm).';
          if (resultHrrRow) resultHrrRow.hidden = true;
          return;
        }
        if (rhr >= mhr - 8) {
          errEl.textContent = 'Resting HR should be comfortably below estimated max.';
          if (resultHrrRow) resultHrrRow.hidden = true;
          return;
        }
        if (resultHrrRow) resultHrrRow.hidden = false;
        var hrr = mhr - rhr;
        if (resultHrr) resultHrr.textContent = String(Math.round(hrr));
        hrrTxt = 'HRR = ' + mhr + ' − ' + rhr + ' = ' + Math.round(hrr) + ' bpm';
      } else {
        if (resultHrrRow) resultHrrRow.hidden = true;
      }

      if (mode === 'borg620' || mode === 'borg10') {
        if (zonesWrap) zonesWrap.hidden = true;
        if (rpeWrap) rpeWrap.hidden = false;

        var bRaw = parseFloat(rpeInput.value);
        if (!isFinite(bRaw)) {
          errEl.textContent = 'Enter an RPE value.';
          resultThr.textContent = '—';
          caption.textContent = 'Single target HR';
          return;
        }

        var thr =
          mode === 'borg620' ? thrFromBorg620(rhr, mhr, bRaw) : thrFromBorgCr10(rhr, mhr, bRaw);
        resultThr.textContent = thr + ' bpm';
        caption.textContent = mode === 'borg620' ? 'Borg 6–20 target' : 'Borg CR10 target';
        subtitle.textContent =
          (measured != null ? 'Measured max HR' : 'Est. max: ' + formulaLabel(formulaKey)) +
          (hrrTxt ? ' · ' + hrrTxt : '');
      } else {
        if (zonesWrap) zonesWrap.hidden = false;
        if (rpeWrap) rpeWrap.hidden = true;

        var useKv = mode === 'karvonen';
        ZONE_PCTS.forEach(function (z) {
          var el = document.getElementById('thr-' + z.id);
          if (!el) return;
          var loHi;
          if (useKv) loHi = calcZoneKarvonen(mhr, rhr, z.lo, z.hi);
          else loHi = calcZonePctMax(mhr, z.lo, z.hi);
          el.textContent = loHi[0] + '–' + loHi[1] + ' bpm';
        });

        caption.textContent = useKv ? 'Karvonen zones' : '% of max HR zones';

        subtitle.textContent =
          (measured != null ? 'Measured max HR' : 'Est. max: ' + formulaLabel(formulaKey)) +
          (useKv ? ' · ' + hrrTxt : '');
      }
    }

    form.addEventListener('submit', run);
    if (formulaSel) formulaSel.addEventListener('change', function () {
      toggleUi();
      run();
    });
    if (intensitySel) intensitySel.addEventListener('change', function () {
      toggleUi();
      run();
    });
    form.querySelectorAll('input').forEach(function (el) {
      el.addEventListener('input', function () {
        toggleUi();
        run();
      });
    });

    toggleUi();
    run();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
