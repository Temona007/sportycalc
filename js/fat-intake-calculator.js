/**
 * Fat Intake Calculator - SportyCalc
 * Mifflin-St Jeor BMR × activity = calories, optional manual override.
 * Fat = chosen % of calories; guideline 20–35% for adults 19+.
 * Saturated fat: <10% of calories; <7% for heart health.
 * Calories per gram of fat = 9.
 */

(function () {
  'use strict';

  const form = document.getElementById('fat-form');
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
  const fatPercentInput = document.getElementById('fat-percent');
  const fatPercentVal = document.getElementById('fat-percent-val');

  const resultCalories = document.getElementById('result-calories');
  const resultBmr = document.getElementById('result-bmr');
  const resultFatTarget = document.getElementById('result-fat-target');
  const resultFatTargetCal = document.getElementById('result-fat-target-cal');
  const resultFatRange = document.getElementById('result-fat-range');
  const resultFatPerKg = document.getElementById('result-fat-perkg');
  const resultSatLimit = document.getElementById('result-sat-limit');
  const resultSatHeart = document.getElementById('result-sat-heart');

  const CAL_PER_GRAM_FAT = 9;
  const RANGE_MIN_PCT = 20;  // adults 19+
  const RANGE_MAX_PCT = 35;
  const SAT_LIMIT_PCT = 10;  // AHA: <10% of calories
  const SAT_HEART_PCT = 7;   // AHA: <7% for heart disease risk reduction

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

  function updateChart(fatCal, otherCal) {
    const ctx = document.getElementById('fat-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const borderColor = isDark ? '#2A2A2A' : '#FFFFFF';

    const labels = ['Fat', 'Other calories'];
    const data = [Math.max(0, fatCal), Math.max(0, otherCal)];

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',  // fat - green
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
    const { calories } = getEffectiveCalories(bmr, activityMult);

    let fatPct = parseFloat(fatPercentInput.value);
    if (isNaN(fatPct)) fatPct = 25;
    fatPct = Math.min(45, Math.max(15, fatPct));

    const fatCalTarget = calories * (fatPct / 100);
    const fatGramsTarget = fatCalTarget / CAL_PER_GRAM_FAT;

    const fatMinGrams = (calories * (RANGE_MIN_PCT / 100)) / CAL_PER_GRAM_FAT;
    const fatMaxGrams = (calories * (RANGE_MAX_PCT / 100)) / CAL_PER_GRAM_FAT;

    const satLimitGrams = (calories * (SAT_LIMIT_PCT / 100)) / CAL_PER_GRAM_FAT;
    const satHeartGrams = (calories * (SAT_HEART_PCT / 100)) / CAL_PER_GRAM_FAT;

    const perKg = weightKg > 0 ? fatGramsTarget / weightKg : 0;

    if (resultCalories) resultCalories.textContent = Math.round(calories).toLocaleString();
    if (resultBmr) resultBmr.textContent = Math.round(bmr).toLocaleString();
    if (resultFatTarget) {
      resultFatTarget.textContent = Math.round(fatGramsTarget) + ' g/day';
    }
    if (resultFatTargetCal) {
      resultFatTargetCal.textContent = Math.round(fatCalTarget) + ' cal (' + Math.round(fatPct) + '%)';
    }
    if (resultFatRange) {
      resultFatRange.textContent =
        Math.round(fatMinGrams) + '–' + Math.round(fatMaxGrams) + ' g/day';
    }
    if (resultFatPerKg) {
      resultFatPerKg.textContent = perKg ? perKg.toFixed(1) + ' g/kg' : '—';
    }
    if (resultSatLimit) {
      resultSatLimit.textContent = Math.round(satLimitGrams) + ' g';
    }
    if (resultSatHeart) {
      resultSatHeart.textContent = Math.round(satHeartGrams) + ' g';
    }

    updateChart(fatCalTarget, calories - fatCalTarget);
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

  if (fatPercentInput && fatPercentVal) {
    fatPercentInput.addEventListener('input', function () {
      fatPercentVal.textContent = this.value;
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

  // Prefill defaults
  genderSelect.value = 'male';
  ageInput.value = '35';
  heightCmInput.value = '178';
  weightInput.value = '88';
  if (fatPercentInput && fatPercentVal) {
    fatPercentInput.value = 25;
    fatPercentVal.textContent = '25';
  }

  runCalculation();
})();
