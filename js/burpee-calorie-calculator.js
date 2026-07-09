/**
 * Burpee Calorie Calculator - SportyCalc
 * Formula (Omni Calculator): C = (W_lb / 150) × 0.5 × N
 * Range: low 0.25×, high 0.75× per-rep factor (pace / effort variation)
 */
(function () {
  'use strict';

  const LB_PER_KG = 2.20462;
  const REF_WEIGHT_LB = 150;
  const MEAN_FACTOR = 0.5;
  const LOW_FACTOR = 0.25;
  const HIGH_FACTOR = 0.75;

  const form = document.getElementById('burpee-form');
  if (!form) return;

  const weightInput = document.getElementById('burpee-weight');
  const burpeesInput = document.getElementById('burpee-count');
  const unitBtns = form.querySelectorAll('.unit-btn[data-unit]');

  const meanEl = document.getElementById('burpee-result-mean');
  const rangeEl = document.getElementById('burpee-result-range');
  const perRepEl = document.getElementById('burpee-result-per-rep');
  const resultCard = document.getElementById('burpee-result-card');

  function getWeightLb() {
    const unit = form.querySelector('.unit-btn.active')?.dataset?.unit || 'kg';
    const val = parseFloat(weightInput.value);
    if (!Number.isFinite(val) || val <= 0) return null;
    return unit === 'lb' ? val : val * LB_PER_KG;
  }

  function formatCalories(value) {
    if (value < 10) return value.toFixed(2);
    if (value < 100) return value.toFixed(1);
    return Math.round(value).toString();
  }

  /** @returns {{ mean: number, low: number, high: number, perRep: number } | null} */
  function calculateBurpeeCalories(weightLb, burpees) {
    if (!Number.isFinite(weightLb) || weightLb <= 0) return null;
    if (!Number.isFinite(burpees) || burpees <= 0) return null;

    const bwf = weightLb / REF_WEIGHT_LB;
    const mean = bwf * MEAN_FACTOR * burpees;
    const low = bwf * LOW_FACTOR * burpees;
    const high = bwf * HIGH_FACTOR * burpees;
    const perRep = bwf * MEAN_FACTOR;

    return { mean, low, high, perRep };
  }

  function updateUI() {
    const weightLb = getWeightLb();
    const burpees = parseInt(burpeesInput.value, 10);
    const result = calculateBurpeeCalories(weightLb, burpees);

    if (!result) {
      meanEl.textContent = '—';
      rangeEl.textContent = '—';
      perRepEl.textContent = '—';
      if (resultCard) resultCard.classList.remove('calories-result-reveal');
      return;
    }

    const { mean, low, high, perRep } = result;
    meanEl.textContent = formatCalories(mean);
    rangeEl.textContent = formatCalories(low) + ' – ' + formatCalories(high);
    perRepEl.textContent = formatCalories(perRep);

    if (resultCard) {
      resultCard.classList.remove('calories-result-reveal');
      void resultCard.offsetWidth;
      resultCard.classList.add('calories-result-reveal');
    }
  }

  unitBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      unitBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const unit = btn.dataset.unit;
      const unitLabel = document.getElementById('burpee-weight-unit');
      if (unitLabel) unitLabel.textContent = unit;
      updateUI();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUI();
  });

  [weightInput, burpeesInput].forEach((el) => {
    el.addEventListener('input', updateUI);
    el.addEventListener('change', updateUI);
  });

  updateUI();

  window.SportyCalcBurpeeCalorie = { calculateBurpeeCalories, REF_WEIGHT_LB, MEAN_FACTOR, LOW_FACTOR, HIGH_FACTOR };
})();
