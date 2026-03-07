/**
 * 1RM Calculator - One Rep Max
 * Formulas: Brzycki, Epley, Lander, Average of All
 * Based on bodycalc.io functionality
 */
(function() {
  'use strict';

  const LB_PER_KG = 2.20462;

  const TRAINING_PERCENTAGES = [
    { pct: 50, reps: '12–15', zone: 'Warm-up', zoneClass: 'orm-zone-warmup' },
    { pct: 60, reps: '10–12', zone: 'Endurance', zoneClass: 'orm-zone-endurance' },
    { pct: 65, reps: '8–10', zone: 'Endurance', zoneClass: 'orm-zone-endurance' },
    { pct: 70, reps: '6–8', zone: 'Hypertrophy', zoneClass: 'orm-zone-hypertrophy' },
    { pct: 75, reps: '5–6', zone: 'Hypertrophy', zoneClass: 'orm-zone-hypertrophy' },
    { pct: 80, reps: '4–5', zone: 'Strength', zoneClass: 'orm-zone-strength' },
    { pct: 85, reps: '3–4', zone: 'Strength', zoneClass: 'orm-zone-strength' },
    { pct: 90, reps: '2–3', zone: 'Power', zoneClass: 'orm-zone-power' },
    { pct: 95, reps: '1–2', zone: 'Max effort', zoneClass: 'orm-zone-max' },
    { pct: 100, reps: '1', zone: '1RM', zoneClass: 'orm-zone-1rm' }
  ];

  function calcBrzycki(weight, reps) {
    if (reps >= 37) return 0;
    return weight * (36 / (37 - reps));
  }

  function calcEpley(weight, reps) {
    return weight * (1 + reps / 30);
  }

  function calcLander(weight, reps) {
    const denom = 101.3 - 2.67123 * reps;
    if (denom <= 0) return 0;
    return (100 * weight) / denom;
  }

  function calc1RM(weight, reps, method) {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 1;
    if (w <= 0 || r < 1) return null;
    let result;
    if (method === 'brzycki') result = calcBrzycki(w, r);
    else if (method === 'epley') result = calcEpley(w, r);
    else if (method === 'lander') result = calcLander(w, r);
    else if (method === 'average') {
      const b = calcBrzycki(w, r);
      const e = calcEpley(w, r);
      const l = calcLander(w, r);
      result = (b + e + l) / 3;
    } else result = calcEpley(w, r);
    return Math.round(result * 10) / 10;
  }

  function runCalc() {
    const form = document.getElementById('one-rm-form');
    const weightInput = document.getElementById('weight');
    const repsInput = document.getElementById('reps');
    const methodSelect = document.getElementById('method');

    if (!form || !weightInput) return;

    const method = methodSelect ? methodSelect.value : 'epley';
    const weight = parseFloat(weightInput.value) || 0;
    const reps = parseInt(repsInput.value, 10) || 1;

    const result1rm = document.getElementById('result-1rm');
    const resultUnit = document.getElementById('result-1rm-unit');
    const tbody = document.getElementById('1rm-training-tbody');

    if (weight <= 0 || reps < 1 || reps > 12) {
      if (result1rm) result1rm.textContent = '—';
      if (resultUnit) resultUnit.textContent = '';
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Enter weight and reps</td></tr>';
      return;
    }

    const oneRM = calc1RM(weight, reps, method);
    const unit = document.querySelector('.unit-btn.active')?.dataset?.unit || 'kg';

    if (result1rm) result1rm.textContent = oneRM;
    if (resultUnit) resultUnit.textContent = unit === 'lb' ? ' lb' : ' kg';

    if (tbody) {
      tbody.innerHTML = TRAINING_PERCENTAGES.map(row => {
        const w = Math.round((oneRM * row.pct / 100) * 10) / 10;
        return `<tr class="orm-zone-row ${row.zoneClass}">
          <td>${row.pct}%</td>
          <td><strong>${w}</strong> ${unit}</td>
          <td>${row.reps}</td>
          <td>${row.zone}</td>
        </tr>`;
      }).join('');
    }
  }

  function initUnitToggle() {
    const form = document.getElementById('one-rm-form');
    const weightUnit = document.getElementById('weight-unit');
    const weightInput = document.getElementById('weight');
    if (!form || !weightUnit || !weightInput) return;

    form.querySelectorAll('.unit-toggle-btns .unit-btn, .unit-toggle .unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const toggle = btn.closest('.unit-toggle');
        const prevUnit = toggle?.querySelector('.unit-btn.active')?.dataset?.unit;
        if (prevUnit && prevUnit === btn.dataset.unit) return;

        toggle?.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const newUnit = btn.dataset.unit;
        weightUnit.textContent = newUnit === 'lb' ? 'lb' : 'kg';

        const w = parseFloat(weightInput.value);
        if (!isNaN(w) && w > 0 && prevUnit !== newUnit) {
          if (prevUnit === 'kg' && newUnit === 'lb') weightInput.value = Math.round(w * LB_PER_KG * 10) / 10;
          else if (prevUnit === 'lb' && newUnit === 'kg') weightInput.value = Math.round(w / LB_PER_KG * 10) / 10;
        }
        runCalc();
      });
    });
  }

  function init() {
    const form = document.getElementById('one-rm-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runCalc();
    });

    form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', runCalc);
      el.addEventListener('change', runCalc);
    });

    initUnitToggle();
    runCalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
