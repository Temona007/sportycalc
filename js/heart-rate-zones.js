/**
 * Heart Rate Zones Calculator
 * Methods: Standard (220 - age), Tanaka (208 - 0.7 × age), Karvonen (uses resting HR)
 */
(function() {
  'use strict';

  const ZONES = [
    { id: 'z1', label: 'Zone 1', pct: [50, 60], desc: 'Recovery' },
    { id: 'z2', label: 'Zone 2', pct: [60, 70], desc: 'Endurance' },
    { id: 'z3', label: 'Zone 3', pct: [70, 80], desc: 'Aerobic' },
    { id: 'z4', label: 'Zone 4', pct: [80, 90], desc: 'Anaerobic' },
    { id: 'z5', label: 'Zone 5', pct: [90, 100], desc: 'Max' }
  ];

  function getMaxHR(age, method) {
    if (method === 'standard') return Math.round(220 - age);
    if (method === 'tanaka') return Math.round(208 - 0.7 * age);
    return Math.round(208 - 0.7 * age); // Karvonen uses Tanaka for MHR
  }

  function calcZoneSimple(mhr, lo, hi) {
    return [Math.round(mhr * lo / 100), Math.round(mhr * hi / 100)];
  }

  function calcZoneKarvonen(mhr, rhr, lo, hi) {
    const reserve = mhr - rhr;
    const low = Math.round(rhr + reserve * lo / 100);
    const high = Math.round(rhr + reserve * hi / 100);
    return [low, high];
  }

  function runCalc() {
    const form = document.getElementById('hr-form');
    const ageInput = document.getElementById('age');
    const rhrInput = document.getElementById('rhr');
    const methodSelect = document.getElementById('method');

    if (!form || !ageInput) return;

    const method = methodSelect ? methodSelect.value : 'standard';
    const age = parseInt(ageInput.value, 10) || 30;
    const rhr = rhrInput ? parseInt(rhrInput.value, 10) : null;
    const mhr = getMaxHR(age, method);

    const useKarvonen = method === 'karvonen' && rhr != null && !isNaN(rhr) && rhr >= 40 && rhr <= 100;

    document.getElementById('result-maxhr').textContent = mhr + ' bpm';

    ZONES.forEach(z => {
      let low, high;
      if (useKarvonen) {
        [low, high] = calcZoneKarvonen(mhr, rhr, z.pct[0], z.pct[1]);
      } else {
        [low, high] = calcZoneSimple(mhr, z.pct[0], z.pct[1]);
      }
      const el = document.getElementById('result-' + z.id);
      if (el) el.textContent = low + '–' + high + ' bpm';
    });
  }

  function toggleMethod() {
    const methodSelect = document.getElementById('method');
    const rhrHint = document.getElementById('rhr-hint');
    if (methodSelect && rhrHint) {
      rhrHint.style.display = methodSelect.value === 'karvonen' ? 'block' : 'none';
    }
    runCalc();
  }

  function init() {
    const form = document.getElementById('hr-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runCalc();
    });

    const methodSelect = document.getElementById('method');
    if (methodSelect) methodSelect.addEventListener('change', toggleMethod);

    form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', runCalc);
      el.addEventListener('change', runCalc);
    });

    toggleMethod();
    runCalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
