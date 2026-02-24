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

  // Distances: { label, miles } - matches Strava exact values
  const DISTANCES = [
    { label: '1 mi', miles: 1, tier: 'short' },
    { label: '2 mi', miles: 2, tier: 'short' },
    { label: '5K', miles: 3.10686, tier: 'short' },
    { label: '5 mi', miles: 5, tier: 'mid' },
    { label: '10K', miles: 6.21372, tier: 'mid' },
    { label: '10 mi', miles: 10, tier: 'mid' },
    { label: 'Half Marathon', miles: 13.1094, tier: 'half' },
    { label: 'Marathon', miles: 26.2188, tier: 'long' },
    { label: '50K', miles: 31.0686, tier: 'long' }
  ];

  const MILES_PER_KM = 0.621371;

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

  function getPaceMinPerMile() {
    const min = parseFloat(paceMinInput.value) || 0;
    const sec = parseFloat(paceSecInput.value) || 0;
    return min + sec / 60;
  }

  function runCalculation() {
    const paceMinPerMile = getPaceMinPerMile();
    if (!paceMinPerMile || paceMinPerMile <= 0) return;

    let paceMinPerUnit;
    let unitLabel;
    if (currentUnit === 'mimi') {
      paceMinPerUnit = paceMinPerMile;
      unitLabel = 'mi';
    } else {
      paceMinPerUnit = paceMinPerMile / MILES_PER_KM; // min per km
      unitLabel = 'km';
    }

    const paceStr = Math.floor(paceMinPerMile) + ':' + String(Math.round((paceMinPerMile % 1) * 60)).padStart(2, '0');
    paceDisplay.textContent = 'At ' + paceStr + ' /' + (currentUnit === 'mimi' ? 'mi' : 'km');

    let html = '';
    DISTANCES.forEach(function (d) {
      const totalMinutes = paceMinPerMile * d.miles;
      const timeStr = formatTime(totalMinutes);
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

  function setUnit(unit) {
    currentUnit = unit;
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
