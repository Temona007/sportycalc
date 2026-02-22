/**
 * Calorie Deficit Calculator - SportyCalc
 * Based on Omni Calculator logic. Mifflin-St Jeor BMR, TDEE × activity.
 * 1 kg fat ≈ 7,700 cal. Deficit mode or target-date mode.
 * Chart.js: Weight projection over weeks.
 */

(function () {
  'use strict';

  const CAL_PER_KG_FAT = 7700;
  const MIN_SAFE_INTAKE = 1200;

  const form = document.getElementById('deficit-form');
  if (!form) return;

  const genderSelect = document.getElementById('gender');
  const ageInput = document.getElementById('age');
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const targetWeightInput = document.getElementById('target-weight');
  const activitySelect = document.getElementById('activity');
  const deficitSelect = document.getElementById('deficit');
  const targetDateInput = document.getElementById('target-date');
  const deficitModePanel = document.getElementById('deficit-mode');
  const dateModePanel = document.getElementById('date-mode');

  const resultIntake = document.getElementById('result-intake');
  const resultDeficit = document.getElementById('result-deficit');
  const resultWeeks = document.getElementById('result-weeks');
  const resultTdee = document.getElementById('result-tdee');

  let chartInstance = null;
  let currentUnit = 'metric';
  let currentMode = 'deficit';

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

  function getHeightCm() {
    const val = parseFloat(heightInput.value) || 0;
    if (val <= 0) return 0;
    return currentUnit === 'imperial' ? inchesToCm(val) : val;
  }

  function getWeightKg() {
    const val = parseFloat(weightInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? lbsToKg(val) : val;
  }

  function getTargetWeightKg() {
    const val = parseFloat(targetWeightInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? lbsToKg(val) : val;
  }

  function daysFromToday(dateStr) {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = target - today;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function setMinTargetDate() {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const minStr = today.toISOString().slice(0, 10);
    if (targetDateInput) targetDateInput.min = minStr;
  }

  function updateChart(currentKg, targetKg, deficit, weeks) {
    const ctx = document.getElementById('deficit-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const maxWeeks = Math.max(weeks, 12);
    const labels = [];
    const weightData = [];
    const lossPerWeek = (deficit * 7) / CAL_PER_KG_FAT;

    for (let w = 0; w <= maxWeeks; w += 2) {
      labels.push('Week ' + w);
      const wAtWeek = Math.max(targetKg, currentKg - lossPerWeek * w);
      weightData.push(Math.round(wAtWeek * 10) / 10);
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0, 0, 0, 0.1)';
    const tickColor = isDark ? '#A1A1AA' : '#525252';

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Weight (kg)',
          data: weightData,
          borderColor: 'rgba(249, 87, 0, 0.9)',
          backgroundColor: 'rgba(249, 87, 0, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw + ' kg'
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor }
          },
          y: {
            min: Math.floor(targetKg) - 2,
            max: Math.ceil(currentKg) + 2,
            grid: { color: gridColor },
            ticks: { color: tickColor }
          }
        }
      }
    });
  }

  function runCalculation() {
    const weightKg = getWeightKg();
    const targetKg = getTargetWeightKg();
    const heightCm = getHeightCm();
    const age = parseInt(ageInput.value, 10) || 0;
    const isMale = genderSelect.value === 'male';
    const activityMult = parseFloat(activitySelect.value) || 1.375;

    if (!weightKg || !heightCm || !age || heightCm <= 0) return;

    const weightToLose = weightKg - targetKg;
    if (weightToLose <= 0) {
      resultIntake.textContent = '—';
      resultDeficit.textContent = 'Target must be below current weight';
      resultWeeks.textContent = '—';
      if (resultTdee) resultTdee.textContent = Math.round(mifflinStJeor(weightKg, heightCm, age, isMale) * activityMult).toLocaleString();
      return;
    }

    const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);
    const tdee = Math.round(bmr * activityMult);
    let deficit;
    let daysNeeded;

    if (currentMode === 'deficit') {
      deficit = parseInt(deficitSelect.value, 10) || 500;
      const totalCalToBurn = weightToLose * CAL_PER_KG_FAT;
      daysNeeded = Math.ceil(totalCalToBurn / deficit);
    } else {
      const days = daysFromToday(targetDateInput.value);
      if (days <= 0) {
        resultIntake.textContent = '—';
        resultDeficit.textContent = 'Pick a future date';
        resultWeeks.textContent = '—';
        if (resultTdee) resultTdee.textContent = tdee.toLocaleString();
        return;
      }
      const totalCalToBurn = weightToLose * CAL_PER_KG_FAT;
      deficit = Math.round(totalCalToBurn / days);
      daysNeeded = days;
      deficit = Math.min(deficit, tdee - MIN_SAFE_INTAKE);
      deficit = Math.max(deficit, 100);
    }

    const recommendedIntake = Math.round(tdee - deficit);
    const safeIntake = Math.max(recommendedIntake, MIN_SAFE_INTAKE);
    const actualDeficit = tdee - safeIntake;
    const weeks = Math.ceil(daysNeeded / 7);

    if (actualDeficit < deficit && safeIntake === MIN_SAFE_INTAKE) {
      const realDays = Math.ceil((weightToLose * CAL_PER_KG_FAT) / actualDeficit);
      daysNeeded = realDays;
    }

    resultIntake.textContent = safeIntake.toLocaleString();
    resultDeficit.textContent = Math.round(actualDeficit).toLocaleString() + ' cal/day';
    resultWeeks.textContent = weeks + ' weeks (~' + Math.ceil(daysNeeded) + ' days)';
    if (resultTdee) resultTdee.textContent = tdee.toLocaleString();

    updateChart(weightKg, targetKg, actualDeficit, weeks);
  }

  function setMode(mode) {
    currentMode = mode;
    const deficitBtn = form.querySelector('.cd-mode-btn[data-mode="deficit"]');
    const dateBtn = form.querySelector('.cd-mode-btn[data-mode="date"]');
    if (mode === 'deficit') {
      deficitModePanel.style.display = 'block';
      dateModePanel.style.display = 'none';
      if (deficitBtn) deficitBtn.classList.add('active');
      if (dateBtn) dateBtn.classList.remove('active');
    } else {
      deficitModePanel.style.display = 'none';
      dateModePanel.style.display = 'block';
      if (dateBtn) dateBtn.classList.add('active');
      if (deficitBtn) deficitBtn.classList.remove('active');
      setMinTargetDate();
    }
    runCalculation();
  }

  function setUnit(unit) {
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');
    const weightUnit = document.getElementById('weight-unit');
    const targetWeightUnit = document.getElementById('target-weight-unit');
    const heightUnit = document.getElementById('height-unit');

    if (unit === 'metric') {
      if (weightUnit) weightUnit.textContent = 'kg';
      if (targetWeightUnit) targetWeightUnit.textContent = 'kg';
      if (heightUnit) heightUnit.textContent = 'cm';
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
      const lbs = parseFloat(weightInput.value);
      const tLbs = parseFloat(targetWeightInput.value);
      const inVal = parseFloat(heightInput.value);
      if (lbs) weightInput.value = (lbs / 2.20462).toFixed(1);
      if (tLbs) targetWeightInput.value = (tLbs / 2.20462).toFixed(1);
      if (inVal) heightInput.value = (inVal * 2.54).toFixed(1);
    } else {
      if (weightUnit) weightUnit.textContent = 'lb';
      if (targetWeightUnit) targetWeightUnit.textContent = 'lb';
      if (heightUnit) heightUnit.textContent = 'in';
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
      const kg = parseFloat(weightInput.value);
      const tKg = parseFloat(targetWeightInput.value);
      const cm = parseFloat(heightInput.value);
      if (kg) weightInput.value = Math.round(kg * 2.20462);
      if (tKg) targetWeightInput.value = Math.round(tKg * 2.20462);
      if (cm) heightInput.value = Math.round(cm / 2.54);
    }
    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });
  form.querySelectorAll('.cd-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runCalculation();
  });

  [weightInput, targetWeightInput, heightInput, ageInput, activitySelect, deficitSelect, targetDateInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (genderSelect) genderSelect.addEventListener('change', runCalculation);
  if (targetDateInput) targetDateInput.addEventListener('change', runCalculation);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(runCalculation, 100);
    });
  }

  const observer = new MutationObserver(() => setTimeout(runCalculation, 50));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  setMinTargetDate();
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 70);
  if (targetDateInput && !targetDateInput.value) {
    targetDateInput.value = defaultDate.toISOString().slice(0, 10);
  }
  runCalculation();
})();
