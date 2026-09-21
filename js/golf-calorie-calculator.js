/**
 * Golf Calorie Calculator
 * Calories = MET × body weight (kg) × duration (hours)
 * MET values follow Compendium of Physical Activities golf modes
 * (carrying clubs 4.3, pulling cart 4.5, riding cart 3.5, general 4.5).
 */
(function () {
  'use strict';

  const LB_PER_KG = 2.20462;

  const MODES = {
    carry: { met: 4.3, name: 'Carrying clubs' },
    pull: { met: 4.5, name: 'Pulling a cart' },
    cart: { met: 3.5, name: 'Riding a cart' },
    general: { met: 4.5, name: 'General / mixed' }
  };

  const PRESETS = {
    nine: { hours: 2, minutes: 30, label: '9 holes' },
    eighteen: { hours: 4, minutes: 30, label: '18 holes' },
    practice: { hours: 1, minutes: 30, label: 'Practice' }
  };

  function durationMinutes(hours, minutes) {
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    return h * 60 + m;
  }

  function calcGolfCalories(weightKg, minutes, met) {
    if (!(weightKg > 0) || !(minutes > 0) || !(met > 0)) return null;
    return (minutes * met * weightKg) / 60;
  }

  function formatCalories(value) {
    if (!Number.isFinite(value)) return '—';
    if (value < 10) return value.toFixed(1);
    return String(Math.round(value));
  }

  const api = { MODES, PRESETS, LB_PER_KG, durationMinutes, calcGolfCalories, formatCalories };
  if (typeof window !== 'undefined') window.__golfCalories = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  const form = document.getElementById('golf-calorie-form');
  if (!form) return;

  const weightInput = document.getElementById('golf-weight');
  const hoursInput = document.getElementById('golf-hours');
  const minutesInput = document.getElementById('golf-minutes');
  const unitBtns = form.querySelectorAll('.unit-btn[data-unit]');
  const modeBtns = form.querySelectorAll('[data-golf-mode]');
  const presetBtns = form.querySelectorAll('[data-golf-preset]');
  const kcalEl = document.getElementById('golf-result-kcal');
  const modeEl = document.getElementById('golf-result-mode');
  const metEl = document.getElementById('golf-result-met');
  const rateEl = document.getElementById('golf-result-rate');
  const durationEl = document.getElementById('golf-result-duration');
  const compareEl = document.getElementById('golf-result-compare');
  const resultCard = document.getElementById('golf-result-card');

  let currentMode = 'carry';

  function getWeightKg() {
    const unit = form.querySelector('.unit-btn.active')?.dataset?.unit || 'kg';
    const val = parseFloat(weightInput.value);
    if (!Number.isFinite(val) || val <= 0) return null;
    return unit === 'lb' ? val / LB_PER_KG : val;
  }

  function getMinutes() {
    return durationMinutes(hoursInput.value, minutesInput.value);
  }

  function syncPresetButtons() {
    const h = parseInt(hoursInput.value, 10) || 0;
    const m = parseInt(minutesInput.value, 10) || 0;
    presetBtns.forEach((btn) => {
      const preset = PRESETS[btn.dataset.golfPreset];
      const on = preset && preset.hours === h && preset.minutes === m;
      btn.classList.toggle('active', on);
    });
  }

  function updateUI() {
    const weightKg = getWeightKg();
    const minutes = getMinutes();
    const mode = MODES[currentMode] || MODES.carry;
    const kcal = calcGolfCalories(weightKg, minutes, mode.met);
    const cartKcal = calcGolfCalories(weightKg, minutes, MODES.cart.met);

    if (kcal == null) {
      if (kcalEl) kcalEl.textContent = '—';
      if (modeEl) modeEl.textContent = '—';
      if (metEl) metEl.textContent = '—';
      if (rateEl) rateEl.textContent = '—';
      if (durationEl) durationEl.textContent = '—';
      if (compareEl) compareEl.textContent = '—';
      if (resultCard) resultCard.classList.remove('calories-result-reveal');
      return;
    }

    const hours = minutes / 60;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const durationLabel = h && m ? h + 'h ' + m + 'm' : h ? h + 'h' : m + ' min';

    if (kcalEl) kcalEl.textContent = formatCalories(kcal);
    if (modeEl) modeEl.textContent = mode.name;
    if (metEl) metEl.textContent = mode.met.toFixed(1);
    if (rateEl) rateEl.textContent = formatCalories(mode.met * weightKg) + ' kcal/h';
    if (durationEl) durationEl.textContent = durationLabel;

    if (compareEl) {
      if (currentMode === 'cart') {
        const walk = calcGolfCalories(weightKg, minutes, MODES.carry.met);
        compareEl.textContent = '+' + formatCalories(walk - kcal) + ' kcal if carrying clubs';
      } else if (cartKcal != null) {
        compareEl.textContent = '+' + formatCalories(kcal - cartKcal) + ' kcal vs riding a cart';
      } else {
        compareEl.textContent = '—';
      }
    }

    if (resultCard) {
      resultCard.classList.remove('calories-result-reveal');
      void resultCard.offsetWidth;
      resultCard.classList.add('calories-result-reveal');
    }

    syncPresetButtons();
  }

  unitBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      unitBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const unitLabel = document.getElementById('golf-weight-unit');
      if (unitLabel) unitLabel.textContent = btn.dataset.unit;
      updateUI();
    });
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.golfMode || 'carry';
      updateUI();
    });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.golfPreset];
      if (!preset) return;
      hoursInput.value = String(preset.hours);
      minutesInput.value = String(preset.minutes);
      updateUI();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUI();
  });

  [weightInput, hoursInput, minutesInput].forEach((el) => {
    el.addEventListener('input', updateUI);
    el.addEventListener('change', updateUI);
  });

  updateUI();
})();
