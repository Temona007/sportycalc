/**
 * Water Intake Calculator
 * Based on bodycalc.io - weight, activity, climate, pregnant/nursing
 * Formula: (weight_kg × 33 ml) × activity × climate + pregnancy adjustment
 */
(function() {
  'use strict';

  const LB_PER_KG = 2.20462;
  const ML_PER_OZ = 29.5735;
  const OZ_PER_CUP = 8;
  const ML_PER_BOTTLE = 500;
  const BASE_ML_PER_KG = 33;

  const ACTIVITY = {
    sedentary: 1.0,
    light: 1.05,
    moderate: 1.1,
    active: 1.15,
    veryActive: 1.2
  };

  const CLIMATE = {
    temperate: 1.0,
    hot: 1.15,
    dry: 1.1
  };

  const PREGNANT_ADD_ML = 400;

  function runCalc() {
    const form = document.getElementById('water-form');
    const weightInput = document.getElementById('weight');

    if (!form || !weightInput) return;

    const weightVal = parseFloat(weightInput.value) || 0;
    const unit = document.querySelector('#water-form .unit-btn.active')?.dataset?.unit || 'kg';
    const weightKg = unit === 'lb' ? weightVal / LB_PER_KG : weightVal;

    const activityVal = (document.querySelector('input[name="activity"]:checked') || {}).value || 'moderate';
    const climateVal = (document.querySelector('input[name="climate"]:checked') || {}).value || 'temperate';
    const pregnant = document.getElementById('pregnant')?.checked || false;

    const activityMult = ACTIVITY[activityVal] ?? 1.1;
    const climateMult = CLIMATE[climateVal] ?? 1.0;

    let totalMl = (weightKg * BASE_ML_PER_KG) * activityMult * climateMult;
    if (pregnant) totalMl += PREGNANT_ADD_ML;

    totalMl = Math.round(Math.max(500, totalMl));
    const totalOz = totalMl / ML_PER_OZ;
    const totalL = (totalMl / 1000).toFixed(1);
    const cups = Math.round(totalOz / OZ_PER_CUP);
    const bottles = Math.round(totalMl / ML_PER_BOTTLE);

    const ozEl = document.getElementById('water-main-value');
    const unitEl = document.getElementById('water-main-unit');
    document.getElementById('result-liters').textContent = weightVal > 0 ? totalL + ' L' : '—';
    document.getElementById('result-cups').textContent = weightVal > 0 ? cups : '—';
    document.getElementById('result-bottles').textContent = weightVal > 0 ? bottles : '—';

    renderCupIcons(cups, weightVal > 0);

    if (ozEl) ozEl.textContent = weightVal > 0 ? Math.round(totalOz) : '—';
    if (unitEl) unitEl.textContent = weightVal > 0 ? 'oz' : '';
    const countEl = document.getElementById('water-drank-count');
    if (countEl) {
      if (weightVal > 0) {
        const stored = localStorage.getItem('waterGlassesToday');
        const dateKey = new Date().toDateString();
        const storedDate = localStorage.getItem('waterDate');
        let drunk = 0;
        if (storedDate === dateKey && stored) drunk = parseInt(stored, 10) || 0;
        countEl.textContent = drunk + ' / ' + cups;
      } else {
        countEl.textContent = '0 / —';
      }
    }
    const card = document.getElementById('water-result-card');
    if (card) card.setAttribute('data-goal-cups', String(weightVal > 0 ? cups : 8));

    if (weightVal > 0) {
      document.getElementById('water-result-card')?.classList.add('water-result-reveal');
      celebrate();
      updateProgressBar(cups);
    } else {
      updateProgressBar(8);
    }
  }

  function renderCupIcons(totalCups, hasData) {
    const container = document.getElementById('water-cups-visual');
    if (!container) return;
    container.innerHTML = '';
    if (!hasData || totalCups < 1) return;

    const iconCups = Math.min(7, totalCups);
    const remainder = totalCups > 7 ? totalCups - 7 : 0;

    for (let i = 0; i < iconCups; i++) {
      const cup = document.createElement('span');
      cup.className = 'water-cup-icon';
      cup.setAttribute('aria-hidden', 'true');
      cup.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="6" width="14" height="14" rx="1"/><path d="M8 6V4h8v2"/></svg>';
      container.appendChild(cup);
    }
    if (remainder > 0) {
      const extra = document.createElement('span');
      extra.className = 'water-cup-extra';
      extra.textContent = '+' + remainder;
      container.appendChild(extra);
    }
  }

  function updateProgressBar(totalCups) {
    const fill = document.getElementById('water-progress-fill');
    const stored = localStorage.getItem('waterGlassesToday');
    const dateKey = new Date().toDateString();
    const storedDate = localStorage.getItem('waterDate');
    let drunk = 0;
    if (storedDate === dateKey && stored) drunk = parseInt(stored, 10) || 0;
    else if (storedDate !== dateKey) {
      localStorage.setItem('waterGlassesToday', '0');
      localStorage.setItem('waterDate', dateKey);
    }
    const cups = totalCups || 8;
    if (fill) {
      const pct = cups > 0 ? Math.min(100, (drunk / cups) * 100) : 0;
      fill.style.width = pct + '%';
    }
    const countEl = document.getElementById('water-drank-count');
    if (countEl) countEl.textContent = drunk + ' / ' + cups;
  }

  function initLogWater() {
    const btn = document.getElementById('water-log-glass');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const dateKey = new Date().toDateString();
      const storedDate = localStorage.getItem('waterDate');
      let drunk = 0;
      if (storedDate === dateKey) drunk = parseInt(localStorage.getItem('waterGlassesToday') || '0', 10);
      else localStorage.setItem('waterDate', dateKey);
      drunk++;
      localStorage.setItem('waterGlassesToday', String(drunk));
      const totalCups = parseInt(document.getElementById('water-result-card')?.getAttribute('data-goal-cups') || '8', 10);
      updateProgressBar(totalCups);
      if (drunk >= totalCups) celebrate();
    });
  }

  function celebrate() {
    const card = document.getElementById('water-result-card');
    if (!card) return;
    card.classList.remove('water-celebration');
    void card.offsetWidth;
    card.classList.add('water-celebration');
    setTimeout(() => card.classList.remove('water-celebration'), 800);
  }

  function initUnitToggle() {
    const form = document.getElementById('water-form');
    const weightUnit = document.getElementById('weight-unit');
    const weightInput = document.getElementById('weight');
    if (!form || !weightUnit || !weightInput) return;

    form.querySelectorAll('.unit-btn[data-unit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toggle = btn.closest('.unit-toggle, [class*="unit-toggle"]');
        const prevUnit = toggle?.querySelector('.unit-btn.active')?.dataset?.unit;
        if (prevUnit === btn.dataset.unit) return;

        toggle?.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const newUnit = btn.dataset.unit;
        weightUnit.textContent = newUnit === 'lb' ? 'lb' : 'kg';

        const w = parseFloat(weightInput.value);
        if (!isNaN(w) && w > 0 && prevUnit && prevUnit !== newUnit) {
          if (prevUnit === 'kg' && newUnit === 'lb') weightInput.value = Math.round(w * LB_PER_KG * 10) / 10;
          else if (prevUnit === 'lb' && newUnit === 'kg') weightInput.value = Math.round(w / LB_PER_KG * 10) / 10;
        }
        runCalc();
      });
    });
  }

  function init() {
    const form = document.getElementById('water-form');
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
    initLogWater();
    runCalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
