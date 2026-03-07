/**
 * Carbohydrate Calculator - SportyCalc
 * Mifflin-St Jeor BMR × activity = calories, optional manual override.
 * Carbs = chosen % of calories, plus 45–65% guideline range and g/kg.
 * Calories per gram of carbohydrate = 4.
 */

(function () {
  'use strict';

  const form = document.getElementById('carb-form');
  if (!form) return;

  const genderSelect = document.getElementById('gender');
  const ageInput = document.getElementById('age');
  const weightInput = document.getElementById('weight');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightUnitEl = document.getElementById('weight-unit');
  const heightUnitEl = document.getElementById('height-unit');
  const knownCaloriesInput = document.getElementById('known-calories');
  const carbPercentInput = document.getElementById('carb-percent');
  const carbPercentVal = document.getElementById('carb-percent-val');

  const resultCalories = document.getElementById('result-calories');
  const resultBmr = document.getElementById('result-bmr');
  const resultCarbsTarget = document.getElementById('result-carbs-target');
  const resultCarbsTargetCal = document.getElementById('result-carbs-target-cal');
  const resultCarbsRange = document.getElementById('result-carbs-range');
  const resultCarbsPerKg = document.getElementById('result-carbs-perkg');

  const CAL_PER_GRAM_CARB = 4;
  const MIN_ADULT_GRAMS = 130; // Institute of Medicine minimum for adults
  const RANGE_MIN_PCT = 45;
  const RANGE_MAX_PCT = 65;

  let currentUnit = 'metric';
  let chartInstance = null;

  function getActivityMult() {
    const checked = form.querySelector('input[name="activity"]:checked');
    return checked ? parseFloat(checked.value) || 1.55 : 1.55;
  }

  function mifflinStJeor(weightKg, heightCm, age, isMale) {
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return isMale ? base + 5 : base - 161;
  }

  function lbsToKg(lbs) { return lbs / 2.20462; }
  function kgToLbs(kg) { return kg * 2.20462; }
  function cmToInches(cm) { return cm / 2.54; }
  function inchesToCm(inches) { return inches * 2.54; }

  function inchesToFtIn(totalInches) {
    const ft = Math.floor(totalInches / 12);
    const inVal = Math.round((totalInches % 12) * 2) / 2;
    return { ft, in: inVal };
  }

  function getHeightCm() {
    if (currentUnit === 'metric') {
      return parseFloat(heightCmInput.value) || 0;
    }
    const ft = parseFloat(heightFtInput.value) || 0;
    const inVal = parseFloat(heightInInput.value) || 0;
    const totalInches = ft * 12 + inVal;
    return totalInches > 0 ? inchesToCm(totalInches) : 0;
  }

  function getWeightKg() {
    const val = parseFloat(weightInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? lbsToKg(val) : val;
  }

  function getEffectiveCalories(bmr, activityMult) {
    const estimated = bmr * activityMult;
    let calories = estimated;
    const manual = parseFloat(knownCaloriesInput.value);
    if (!isNaN(manual) && manual >= 800 && manual <= 8000) {
      calories = manual;
    }
    return { calories, estimated };
  }

  function updateChart(carbCal, otherCal) {
    const ctx = document.getElementById('carb-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const borderColor = isDark ? '#2A2A2A' : '#FFFFFF';

    const labels = ['Carbs', 'Other calories'];
    const data = [Math.max(0, carbCal), Math.max(0, otherCal)];

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(37, 99, 235, 0.8)', // carbs
            'rgba(148, 163, 184, 0.6)' // other
          ],
          borderColor,
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const value = ctx.raw || 0;
                const total = data.reduce((sum, v) => sum + v, 0) || 1;
                const pct = Math.round((value / total) * 100);
                return labels[ctx.dataIndex] + ': ' + Math.round(value) + ' cal (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  function runCalculation() {
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();
    const age = parseInt(ageInput.value, 10) || 0;
    const isMale = genderSelect.value === 'male';
    const activityMult = getActivityMult();

    if (!weightKg || !heightCm || !age || heightCm <= 0) return;

    const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);
    const { calories, estimated } = getEffectiveCalories(bmr, activityMult);

    let carbPct = parseFloat(carbPercentInput.value);
    if (isNaN(carbPct)) carbPct = 50;
    carbPct = Math.min(75, Math.max(10, carbPct));

    const carbCalTarget = calories * (carbPct / 100);
    const carbGramsTarget = carbCalTarget / CAL_PER_GRAM_CARB;

    const carbMinGrams = Math.max(
      MIN_ADULT_GRAMS,
      (calories * (RANGE_MIN_PCT / 100)) / CAL_PER_GRAM_CARB
    );
    const carbMaxGrams = (calories * (RANGE_MAX_PCT / 100)) / CAL_PER_GRAM_CARB;

    const perKg = weightKg > 0 ? carbGramsTarget / weightKg : 0;

    if (resultCalories) resultCalories.textContent = Math.round(calories).toLocaleString();
    if (resultBmr) resultBmr.textContent = Math.round(bmr).toLocaleString();
    if (resultCarbsTarget) {
      resultCarbsTarget.textContent = Math.round(carbGramsTarget) + ' g/day';
    }
    if (resultCarbsTargetCal) {
      resultCarbsTargetCal.textContent = Math.round(carbCalTarget) + ' cal (' + Math.round(carbPct) + '%)';
    }
    if (resultCarbsRange) {
      resultCarbsRange.textContent =
        Math.round(carbMinGrams) + '–' + Math.round(carbMaxGrams) + ' g/day';
    }
    if (resultCarbsPerKg) {
      resultCarbsPerKg.textContent = perKg ? perKg.toFixed(1) + ' g/kg' : '—';
    }

    updateChart(carbCalTarget, calories - carbCalTarget);
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
      if (weightUnitEl) weightUnitEl.textContent = 'kg';
      if (heightUnitEl) heightUnitEl.textContent = 'cm';

      if (prev === 'imperial') {
        const ft = parseFloat(heightFtInput.value) || 0;
        const inVal = parseFloat(heightInInput.value) || 0;
        if (ft || inVal) {
          const totalInches = ft * 12 + inVal;
          heightCmInput.value = (inchesToCm(totalInches)).toFixed(1);
        }
        const lbs = parseFloat(weightInput.value) || 0;
        if (lbs) weightInput.value = (lbsToKg(lbs)).toFixed(1);
      }

      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialDiv.style.display = 'grid';
      heightCmInput.required = false;
      heightFtInput.required = true;
      heightInInput.required = true;
      if (weightUnitEl) weightUnitEl.textContent = 'lbs';

      const cm = parseFloat(heightCmInput.value) || 178;
      const totalInches = cmToInches(cm);
      const split = inchesToFtIn(totalInches);
      heightFtInput.value = split.ft;
      heightInInput.value = split.in;

      const kg = parseFloat(weightInput.value) || 88;
      weightInput.value = Math.round(kgToLbs(kg));

      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  if (carbPercentInput && carbPercentVal) {
    carbPercentInput.addEventListener('input', function () {
      carbPercentVal.textContent = this.value;
      runCalculation();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [genderSelect, ageInput, weightInput, heightCmInput, heightFtInput, heightInInput, knownCaloriesInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  form.querySelectorAll('input[name="activity"]').forEach(radio => {
    radio.addEventListener('change', runCalculation);
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTimeout(runCalculation, 150);
    });
  }

  // Prefill defaults similar to calorie calculator
  genderSelect.value = 'male';
  ageInput.value = '35';
  heightCmInput.value = '178';
  weightInput.value = '88';
  if (carbPercentInput && carbPercentVal) {
    carbPercentInput.value = 50;
    carbPercentVal.textContent = '50';
  }

  runCalculation();
})();

