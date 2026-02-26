/**
 * Lean Body Mass Calculator
 * Boer formula (1984): American Journal of Physiology
 * Male:  LBM = 0.407 × W + 0.267 × H − 19.2
 * Female: LBM = 0.252 × W + 0.473 × H − 48.3
 * W = weight (kg), H = height (cm)
 *
 * When body fat % is known: LBM = Weight − (Weight × Body Fat % / 100)
 */

(function () {
  'use strict';

  const form = document.getElementById('lbm-form');
  if (!form) return;

  const genderBtns = form.querySelectorAll('.lbm-gender-btn');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightInput = document.getElementById('weight');
  const weightLabel = document.getElementById('weight-label');
  const bodyfatInput = document.getElementById('bodyfat');
  const resultLbm = document.getElementById('result-lbm');
  const resultLbmWrap = document.getElementById('result-lbm-wrap');
  const lbmLabel = document.getElementById('lbm-label');
  const resultFatMass = document.getElementById('result-fat-mass');
  const resultLbmSecondary = document.getElementById('result-lbm-secondary');
  const fatMassUnit = document.getElementById('fat-mass-unit');
  const lbmSecondaryUnit = document.getElementById('lbm-secondary-unit');
  const resultLbmPct = document.getElementById('result-lbm-pct');

  let currentGender = 'male';
  let currentFormula = 'boer';
  let chartInstance = null;
  let currentUnit = 'metric';

  function cmToInches(cm) { return cm / 2.54; }
  function inchesToCm(inches) { return inches * 2.54; }
  function kgToLbs(kg) { return kg * 2.20462; }
  function lbsToKg(lbs) { return lbs / 2.20462; }

  /**
   * Boer formula (1984) - LBM in kg
   * Male:  0.407 × W + 0.267 × H − 19.2
   * Female: 0.252 × W + 0.473 × H − 48.3
   */
  function boerLbm(weightKg, heightCm, isMale) {
    if (weightKg <= 0 || heightCm <= 0) return null;
    if (isMale) {
      return 0.407 * weightKg + 0.267 * heightCm - 19.2;
    }
    return 0.252 * weightKg + 0.473 * heightCm - 48.3;
  }

  /**
   * James formula (1976) - LBM in kg
   * Male:  (1.1 × W) − 128 × (W/H)²
   * Female: (1.07 × W) − 148 × (W/H)²
   * W = weight (kg), H = height (cm)
   */
  function jamesLbm(weightKg, heightCm, isMale) {
    if (weightKg <= 0 || heightCm <= 0) return null;
    const ratioSq = Math.pow(weightKg / heightCm, 2);
    if (isMale) {
      return 1.1 * weightKg - 128 * ratioSq;
    }
    return 1.07 * weightKg - 148 * ratioSq;
  }

  function getHeightCm() {
    if (currentUnit === 'metric') {
      return parseFloat(heightCmInput.value) || 178;
    }
    const ft = parseFloat(heightFtInput.value) || 5;
    const inVal = parseFloat(heightInInput.value) || 10;
    return inchesToCm(ft * 12 + inVal);
  }

  function getWeightKg() {
    const v = parseFloat(weightInput.value) || 75;
    return currentUnit === 'imperial' ? lbsToKg(v) : v;
  }

  function getBodyFatPct() {
    const v = parseFloat(bodyfatInput.value);
    return (v >= 0 && v <= 100) ? v : null;
  }

  function updateCompositionChart(leanMassKg, fatMassKg) {
    const ctx = document.getElementById('lbm-composition-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const borderColor = isDark ? '#2A2A2A' : '#FFFFFF';

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Lean Mass', 'Fat Mass'],
        datasets: [{
          data: [leanMassKg, fatMassKg],
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(249, 87, 0, 0.9)'
          ],
          borderColor: borderColor,
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const total = leanMassKg + fatMassKg;
                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                const unit = currentUnit === 'metric' ? 'kg' : 'lbs';
                const val = currentUnit === 'metric' ? ctx.raw : ctx.raw * 2.20462;
                return ctx.label + ': ' + Math.round(val * 10) / 10 + ' ' + unit + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  function setUnit(unit) {
    const prev = currentUnit;
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      heightMetricDiv.style.display = 'block';
      heightImperialDiv.style.display = 'none';
      heightCmInput.required = true;
      heightFtInput.required = false;
      heightInInput.required = false;
      if (weightLabel) weightLabel.textContent = 'Weight, kg';
      if (fatMassUnit) fatMassUnit.textContent = 'kg';
      if (lbmSecondaryUnit) lbmSecondaryUnit.textContent = 'kg';
      if (lbmLabel) lbmLabel.textContent = 'Lean Body Mass (kg)';
      if (prev === 'imperial') {
        const ft = parseFloat(heightFtInput.value) || 5;
        const inVal = parseFloat(heightInInput.value) || 10;
        heightCmInput.value = Math.round(inchesToCm(ft * 12 + inVal) * 10) / 10;
        const lbs = parseFloat(weightInput.value);
        if (lbs) weightInput.value = Math.round(lbsToKg(lbs) * 10) / 10;
      }
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialDiv.style.display = 'grid';
      heightCmInput.required = false;
      heightFtInput.required = true;
      heightInInput.required = true;
      if (weightLabel) weightLabel.textContent = 'Weight, lbs';
      if (fatMassUnit) fatMassUnit.textContent = 'lbs';
      if (lbmSecondaryUnit) lbmSecondaryUnit.textContent = 'lbs';
      if (lbmLabel) lbmLabel.textContent = 'Lean Body Mass (lbs)';
      if (prev === 'metric') {
        const cm = parseFloat(heightCmInput.value) || 178;
        const totalIn = cmToInches(cm);
        heightFtInput.value = Math.floor(totalIn / 12);
        heightInInput.value = Math.round((totalIn % 12) * 2) / 2;
        const kg = parseFloat(weightInput.value);
        if (kg) weightInput.value = Math.round(kgToLbs(kg));
      }
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }
    runCalculation();
  }

  function runCalculation() {
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();
    const bodyFatPct = getBodyFatPct();
    const isMale = currentGender === 'male';

    let lbmKg;
    let fatMassKg;

    if (bodyFatPct !== null) {
      // Direct formula when body fat % is known: LBM = Weight - (Weight × Body Fat % / 100)
      fatMassKg = weightKg * (bodyFatPct / 100);
      lbmKg = weightKg - fatMassKg;
    } else {
      // Boer or James formula
      lbmKg = currentFormula === 'james'
        ? jamesLbm(weightKg, heightCm, isMale)
        : boerLbm(weightKg, heightCm, isMale);
      if (lbmKg === null || isNaN(lbmKg)) {
        lbmKg = 0;
      }
      lbmKg = Math.max(0, Math.min(weightKg, lbmKg));
      fatMassKg = weightKg - lbmKg;
    }

    // Sanity: LBM and fat non-negative, sum to weight
    lbmKg = Math.max(0, Math.min(weightKg, lbmKg));
    fatMassKg = weightKg - lbmKg;

    const lbmPct = weightKg > 0 ? (lbmKg / weightKg) * 100 : 0;

    if (resultLbm) resultLbm.textContent = currentUnit === 'metric' ? Math.round(lbmKg) : Math.round(kgToLbs(lbmKg));
    if (resultLbmSecondary) resultLbmSecondary.textContent = currentUnit === 'metric' ? Math.round(lbmKg) : Math.round(kgToLbs(lbmKg));
    if (resultFatMass) resultFatMass.textContent = currentUnit === 'metric' ? Math.round(fatMassKg) : Math.round(kgToLbs(fatMassKg));
    if (resultLbmPct) resultLbmPct.textContent = Math.round(lbmPct) + '%';

    updateCompositionChart(lbmKg, fatMassKg);
  }

  genderBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      currentGender = btn.dataset.gender;
      genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      runCalculation();
    });
  });

  form.querySelectorAll('.formula-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      currentFormula = btn.dataset.formula;
      form.querySelectorAll('.formula-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      runCalculation();
    });
  });

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [heightCmInput, heightFtInput, heightInInput, weightInput, bodyfatInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  // Theme change – redraw chart
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTimeout(runCalculation, 150);
    });
  }

  // Initial: male, 75kg, 180cm → Boer: 0.407*75 + 0.267*180 - 19.2 = 30.525 + 48.06 - 19.2 = 59.385 ≈ 59 kg
  runCalculation();
})();
