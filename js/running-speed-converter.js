/**
 * Running Speed Converter - SportyCalc
 * Convert between pace and speed units via m/s (SportCalculators-style).
 */

(function () {
  'use strict';

  const form = document.getElementById('speed-form');
  if (!form) return;

  const valueInput = document.getElementById('speed-value');
  const paceMinInput = document.getElementById('pace-min');
  const paceSecInput = document.getElementById('pace-sec');
  const speedFields = document.getElementById('speed-fields');
  const paceFields = document.getElementById('pace-fields');
  const unitHint = document.getElementById('unit-hint');
  const compareEl = document.getElementById('human-compare');

  const out = {
    minkm: document.getElementById('out-minkm'),
    minmi: document.getElementById('out-minmi'),
    kmh: document.getElementById('out-kmh'),
    mph: document.getElementById('out-mph'),
    ms: document.getElementById('out-ms'),
    fts: document.getElementById('out-fts')
  };

  let currentUnit = 'minkm';

  const PACE_UNITS = { minkm: true, minmi: true };

  // Exact conversion factors (via m/s)
  const MPS_PER_KMH = 1 / 3.6;
  const MPS_PER_MPH = 0.44704;
  const FT_PER_M = 3.28084;

  function isPaceUnit(unit) {
    return !!PACE_UNITS[unit];
  }

  function formatPace(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '—';
    const totalSec = Math.round(totalMinutes * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function formatNum(n, digits) {
    if (!Number.isFinite(n) || n < 0) return '—';
    return n.toFixed(digits);
  }

  function getInputMinutes() {
    const min = parseFloat(paceMinInput.value) || 0;
    const sec = parseFloat(paceSecInput.value) || 0;
    return min + sec / 60;
  }

  function getInputSpeed() {
    const n = parseFloat(valueInput.value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /** Convert current input to meters per second. */
  function toMetersPerSecond() {
    if (isPaceUnit(currentUnit)) {
      const paceMin = getInputMinutes();
      if (!paceMin || paceMin <= 0) return null;
      if (currentUnit === 'minkm') {
        // m/s = (1000 m) / (paceMin * 60 s) = 1000 / (60 * paceMin)
        return 1000 / (60 * paceMin);
      }
      // min/mi → m/s: 1609.344 / (60 * paceMin)
      return 1609.344 / (60 * paceMin);
    }

    const v = getInputSpeed();
    if (v == null) return null;
    if (currentUnit === 'kmh') return v * MPS_PER_KMH;
    if (currentUnit === 'mph') return v * MPS_PER_MPH;
    if (currentUnit === 'ms') return v;
    if (currentUnit === 'fts') return v / FT_PER_M;
    return null;
  }

  function humanCompare(kmh) {
    if (!Number.isFinite(kmh) || kmh <= 0) {
      return 'Enter a pace or speed to see how it compares to human running speeds.';
    }
    if (kmh >= 44) {
      return 'Near or above Usain Bolt’s peak sprint (~44.7 km/h / 27.8 mph) — among the fastest recorded human speeds.';
    }
    if (kmh >= 37) {
      return 'Elite 100m race pace territory (Bolt’s 9.58s WR averages ~37.6 km/h). Very few humans sustain this.';
    }
    if (kmh >= 24) {
      return 'World-class middle-distance / elite 5K pace range. Extremely strong for most runners.';
    }
    if (kmh >= 16) {
      return 'Strong recreational to competitive racing pace — solid club-runner territory.';
    }
    if (kmh >= 12) {
      return 'Comfortable jogging / easy run pace for many recreational runners.';
    }
    if (kmh >= 8) {
      return 'Easy jog or brisk walk transition — great for recovery and beginners.';
    }
    if (kmh >= 5) {
      return 'Typical walking speed range (~5 km/h / 3 mph).';
    }
    return 'Slower than a normal walk — useful for hiking or rehab pacing.';
  }

  function updateUnitUI() {
    form.querySelectorAll('.unit-btn[data-unit]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.unit === currentUnit);
    });

    const pace = isPaceUnit(currentUnit);
    paceFields.hidden = !pace;
    speedFields.hidden = pace;

    const hints = {
      minkm: 'minutes and seconds per kilometer',
      minmi: 'minutes and seconds per mile',
      kmh: 'kilometers per hour',
      mph: 'miles per hour',
      ms: 'meters per second',
      fts: 'feet per second'
    };
    unitHint.textContent = hints[currentUnit] || '';
  }

  function runConversion() {
    const mps = toMetersPerSecond();
    if (mps == null || mps <= 0) {
      Object.keys(out).forEach(function (k) { out[k].textContent = '—'; });
      compareEl.textContent = 'Enter a pace or speed to see how it compares to human running speeds.';
      return;
    }

    const kmh = mps / MPS_PER_KMH;
    const mph = mps / MPS_PER_MPH;
    const minkm = 1000 / (mps * 60); // minutes per km
    const minmi = 1609.344 / (mps * 60);
    const fts = mps * FT_PER_M;

    out.minkm.textContent = formatPace(minkm);
    out.minmi.textContent = formatPace(minmi);
    out.kmh.textContent = formatNum(kmh, 2);
    out.mph.textContent = formatNum(mph, 2);
    out.ms.textContent = formatNum(mps, 2);
    out.fts.textContent = formatNum(fts, 2);
    compareEl.textContent = humanCompare(kmh);
  }

  function setUnit(unit) {
    if (!unit || unit === currentUnit) {
      updateUnitUI();
      runConversion();
      return;
    }

    // Preserve equivalent speed/pace when switching units
    const mps = toMetersPerSecond();
    currentUnit = unit;
    updateUnitUI();

    if (mps != null && mps > 0) {
      if (isPaceUnit(unit)) {
        const paceMin = unit === 'minkm'
          ? 1000 / (mps * 60)
          : 1609.344 / (mps * 60);
        const totalSec = Math.round(paceMin * 60);
        paceMinInput.value = String(Math.floor(totalSec / 60));
        paceSecInput.value = String(totalSec % 60);
      } else {
        let v = mps;
        if (unit === 'kmh') v = mps / MPS_PER_KMH;
        else if (unit === 'mph') v = mps / MPS_PER_MPH;
        else if (unit === 'fts') v = mps * FT_PER_M;
        valueInput.value = String(Math.round(v * 100) / 100);
      }
    }

    runConversion();
  }

  form.querySelectorAll('.unit-btn[data-unit]').forEach(function (btn) {
    btn.addEventListener('click', function () { setUnit(btn.dataset.unit); });
  });

  [valueInput, paceMinInput, paceSecInput].forEach(function (el) {
    if (el) el.addEventListener('input', runConversion);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runConversion();
  });

  // Default: 6:00 min/km (common training pace)
  currentUnit = 'minkm';
  paceMinInput.value = '6';
  paceSecInput.value = '0';
  valueInput.value = '10';
  updateUnitUI();
  runConversion();
})();
