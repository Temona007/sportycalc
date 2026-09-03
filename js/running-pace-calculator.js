/**
 * Running Pace Calculator - SportyCalc
 * Logic matches Strava running pace calculator
 * https://www.strava.com/running-pace-calculator
 * Time = pace (min per unit) × distance (in same unit)
 */

(function () {
  'use strict';

  const form = document.getElementById('pace-form');
  if (!form) return;

  const paceMinInput = document.getElementById('pace-min');
  const paceSecInput = document.getElementById('pace-sec');
  const paceUnitHint = document.getElementById('pace-unit-hint');
  const paceDisplay = document.getElementById('pace-display');
  const paceResults = document.getElementById('pace-results');

  let currentUnit = 'mimi'; // min/mi or min/km

  const MILES_PER_KM = 0.621371;
  const KM_PER_MILE = 1 / MILES_PER_KM;

  // Official race distances in km; mile equivalents use the same constant so
  // switching units keeps identical finish times for the same effort.
  const RACE_KM = {
    fiveK: 5,
    tenK: 10,
    half: 21.0975,
    marathon: 42.195,
    fiftyK: 50
  };

  // Distance lists switch with unit (Strava-style)
  const DISTANCES_MI = [
    { label: '1 mi', distance: 1, tier: 'short' },
    { label: '2 mi', distance: 2, tier: 'short' },
    { label: '5K', distance: RACE_KM.fiveK * MILES_PER_KM, tier: 'short' },
    { label: '5 mi', distance: 5, tier: 'mid' },
    { label: '10K', distance: RACE_KM.tenK * MILES_PER_KM, tier: 'mid' },
    { label: '10 mi', distance: 10, tier: 'mid' },
    { label: 'Half Marathon', distance: RACE_KM.half * MILES_PER_KM, tier: 'half' },
    { label: 'Marathon', distance: RACE_KM.marathon * MILES_PER_KM, tier: 'long' },
    { label: '50K', distance: RACE_KM.fiftyK * MILES_PER_KM, tier: 'long' }
  ];

  const DISTANCES_KM = [
    { label: '1 km', distance: 1, tier: 'short' },
    { label: '2 km', distance: 2, tier: 'short' },
    { label: '5K', distance: RACE_KM.fiveK, tier: 'short' },
    { label: '10K', distance: RACE_KM.tenK, tier: 'mid' },
    { label: '15 km', distance: 15, tier: 'mid' },
    { label: '20 km', distance: 20, tier: 'mid' },
    { label: 'Half Marathon', distance: RACE_KM.half, tier: 'half' },
    { label: 'Marathon', distance: RACE_KM.marathon, tier: 'long' },
    { label: '50K', distance: RACE_KM.fiftyK, tier: 'long' }
  ];

  function formatTime(totalMinutes) {
    const totalSec = Math.round(totalMinutes * 60);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    return m + ':' + String(s).padStart(2, '0');
  }

  function formatPaceParts(paceMinutes) {
    const totalSec = Math.round(paceMinutes * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return { min: m, sec: s, text: m + ':' + String(s).padStart(2, '0') };
  }

  function getPaceInputMinutes() {
    const min = parseFloat(paceMinInput.value) || 0;
    const sec = parseFloat(paceSecInput.value) || 0;
    return min + sec / 60;
  }

  function setPaceInputs(paceMinutes) {
    const parts = formatPaceParts(paceMinutes);
    paceMinInput.value = String(parts.min);
    paceSecInput.value = String(parts.sec);
  }

  function getDistances() {
    return currentUnit === 'mimi' ? DISTANCES_MI : DISTANCES_KM;
  }

  function runCalculation() {
    const paceInput = getPaceInputMinutes();
    if (!paceInput || paceInput <= 0) return;

    const unitSuffix = currentUnit === 'mimi' ? 'mi' : 'km';
    paceDisplay.textContent = 'At ' + formatPaceParts(paceInput).text + ' /' + unitSuffix;

    let html = '';
    getDistances().forEach(function (d) {
      // Same-unit math: min/mi × miles, or min/km × km
      const timeStr = formatTime(paceInput * d.distance);
      html += '<div class="pace-result-item pace-tier-' + d.tier + '">';
      html += '<span class="pace-result-label">' + d.label + '</span>';
      html += '<span class="pace-result-value">' + timeStr + '</span>';
      html += '</div>';
    });
    paceResults.innerHTML = html;
  }

  function handleSubmit(e) {
    e.preventDefault();
    runCalculation();
  }

  function convertPace(fromUnit, toUnit, paceMinutes) {
    if (fromUnit === toUnit) return paceMinutes;
    // 12:00/mi → ~7:27/km ; 7:27/km → ~12:00/mi
    if (fromUnit === 'mimi' && toUnit === 'mikm') {
      return paceMinutes * MILES_PER_KM;
    }
    return paceMinutes * KM_PER_MILE;
  }

  function setUnit(unit) {
    if (!unit || unit === currentUnit) return;

    const previousUnit = currentUnit;
    const converted = convertPace(previousUnit, unit, getPaceInputMinutes());
    currentUnit = unit;
    setPaceInputs(converted);

    const mimiBtn = form.querySelector('.unit-btn[data-unit="mimi"]');
    const mikmBtn = form.querySelector('.unit-btn[data-unit="mikm"]');
    if (unit === 'mimi') {
      paceUnitHint.textContent = 'per mile';
      if (mimiBtn) mimiBtn.classList.add('active');
      if (mikmBtn) mikmBtn.classList.remove('active');
    } else {
      paceUnitHint.textContent = 'per km';
      if (mikmBtn) mikmBtn.classList.add('active');
      if (mimiBtn) mimiBtn.classList.remove('active');
    }
    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setUnit(btn.dataset.unit); });
  });
  form.addEventListener('submit', handleSubmit);

  [paceMinInput, paceSecInput].forEach(function (el) {
    if (el) el.addEventListener('input', runCalculation);
  });

  // Init: 12:00/mi (matches Strava default)
  paceMinInput.value = '12';
  paceSecInput.value = '0';
  runCalculation();
})();
