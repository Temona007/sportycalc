/**
 * BMR Calculator - SportyCalc
 * Mifflin-St Jeor equation. Prefilled: male, 33 years, 178 cm, 88 kg
 * Chart.js: BMR vs TDEE by activity level
 */

(function () {
  'use strict';

  const form = document.getElementById('bmr-form');
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
  const resultBmr = document.getElementById('result-bmr');

  let chartInstance = null;
  let currentUnit = 'metric';

  const ACTIVITY_LEVELS = [
    { label: 'BMR (at rest)', mult: 1 },
    { label: 'Sedentary', mult: 1.2 },
    { label: 'Light', mult: 1.375 },
    { label: 'Moderate', mult: 1.55 },
    { label: 'Active', mult: 1.725 },
    { label: 'Very Active', mult: 1.9 }
  ];

  const CALORIE_TABLE_LEVELS = [
    { id: 'cal-sedentary', mult: 1.2 },
    { id: 'cal-light', mult: 1.375 },
    { id: 'cal-moderate', mult: 1.55 },
    { id: 'cal-active', mult: 1.725 },
    { id: 'cal-very', mult: 1.9 },
    { id: 'cal-extra', mult: 2.0 }
  ];

  function mifflinStJeor(weightKg, heightCm, age, isMale) {
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return isMale ? base + 5 : base - 161;
  }

  function lbsToKg(lbs) {
    return lbs / 2.20462;
  }

  function kgToLbs(kg) {
    return kg * 2.20462;
  }

  function cmToInches(cm) {
    return cm / 2.54;
  }

  function inchesToCm(inches) {
    return inches * 2.54;
  }

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

  function formatBmr(bmr) {
    return Math.round(bmr).toLocaleString();
  }

  function updateCalorieTable(bmr) {
    CALORIE_TABLE_LEVELS.forEach(function (row) {
      const el = document.getElementById(row.id);
      if (el) {
        el.textContent = Math.round(bmr * row.mult).toLocaleString();
      }
    });
  }

  function updateChart(bmr) {
    const ctx = document.getElementById('bmr-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const labels = ACTIVITY_LEVELS.map(a => a.label);
    const data = ACTIVITY_LEVELS.map(a => Math.round(bmr * a.mult));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0, 0, 0, 0.1)';
    const tickColor = isDark ? '#A1A1AA' : '#525252';

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Calories/day',
          data,
          backgroundColor: labels.map((_, i) =>
            i === 0 ? 'rgba(249, 87, 0, 0.6)' : 'rgba(249, 87, 0, 0.25)'
          ),
          borderColor: 'rgba(249, 87, 0, 0.8)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.raw + ' cal/day';
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: Math.ceil(Math.max(...data) * 1.15 / 500) * 500,
            grid: { color: gridColor },
            ticks: { color: tickColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: tickColor }
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

    if (!weightKg || !heightCm || !age || heightCm <= 0) return;

    const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);

    if (resultBmr) {
      resultBmr.textContent = formatBmr(bmr);
    }

    updateCalorieTable(bmr);
    updateChart(bmr);
  }

  function setUnit(unit) {
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      heightMetricDiv.style.display = 'block';
      heightImperialDiv.style.display = 'none';
      heightCmInput.required = true;
      heightFtInput.required = false;
      heightInInput.required = false;
      weightUnitEl.textContent = 'kg';
      heightUnitEl.textContent = 'cm';
      weightInput.placeholder = '88';
      heightCmInput.placeholder = '178';
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
      const ft = parseFloat(heightFtInput.value) || 0;
      const inVal = parseFloat(heightInInput.value) || 0;
      if (ft || inVal) {
        const totalInches = ft * 12 + inVal;
        heightCmInput.value = Math.round(inchesToCm(totalInches) * 10) / 10;
      }
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialDiv.style.display = 'grid';
      heightCmInput.required = false;
      heightFtInput.required = true;
      heightInInput.required = true;
      weightUnitEl.textContent = 'lbs';
      const cm = parseFloat(heightCmInput.value) || 178;
      const totalInches = cmToInches(cm);
      const { ft, in: inVal } = inchesToFtIn(totalInches);
      heightFtInput.value = ft;
      heightInInput.value = inVal;
      heightFtInput.placeholder = '5';
      heightInInput.placeholder = '10';
      const kg = parseFloat(weightInput.value) || 88;
      weightInput.value = Math.round(kgToLbs(kg));
      weightInput.placeholder = '194';
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [weightInput, ageInput, heightCmInput, heightFtInput, heightInInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (genderSelect) genderSelect.addEventListener('change', runCalculation);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(() => {
        const weightKg = getWeightKg();
        const heightCm = getHeightCm();
        const age = parseInt(ageInput.value, 10) || 0;
        const isMale = genderSelect.value === 'male';
        if (weightKg && heightCm && age) {
          const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);
          updateChart(bmr);
        }
      }, 100);
    });
  }

  const observer = new MutationObserver(() => {
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();
    const age = parseInt(ageInput.value, 10) || 0;
    const isMale = genderSelect.value === 'male';
    if (weightKg && heightCm && age) {
      const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);
      updateChart(bmr);
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // Prefilled: male, 33 years, 178 cm, 88 kg
  genderSelect.value = 'male';
  ageInput.value = '33';
  heightCmInput.value = '178';
  weightInput.value = '88';
  runCalculation();
})();
