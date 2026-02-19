/**
 * TDEE Calculator - SportyCalc
 * Mifflin-St Jeor BMR × activity multiplier
 * Predefined: male, 25 years, 180 cm, 65 kg, Light (1.375)
 * Compare: calculator.net gives 2,425 with 1.465; we use Light 1.375 → ~2,276
 */

(function () {
  'use strict';

  const form = document.getElementById('tdee-form');
  if (!form) return;

  const genderSelect = document.getElementById('gender');
  const ageInput = document.getElementById('age');
  const weightInput = document.getElementById('weight');
  const heightInput = document.getElementById('height');
  const activitySelect = document.getElementById('activity');
  const weightUnitEl = document.getElementById('weight-unit');
  const heightUnitEl = document.getElementById('height-unit');
  const resultBmr = document.getElementById('result-bmr');
  const resultTdee = document.getElementById('result-tdee');

  let currentUnit = 'metric';

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

  function runCalculation() {
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();
    const age = parseInt(ageInput.value, 10) || 0;
    const isMale = genderSelect.value === 'male';
    const activityMult = parseFloat(activitySelect.value) || 1.375;

    if (!weightKg || !heightCm || !age || heightCm <= 0) return;

    const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);
    const tdee = Math.round(bmr * activityMult);

    if (resultBmr) resultBmr.textContent = Math.round(bmr).toLocaleString();
    if (resultTdee) resultTdee.textContent = tdee.toLocaleString();
  }

  function setUnit(unit) {
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      weightUnitEl.textContent = 'kg';
      heightUnitEl.textContent = 'cm';
      weightInput.placeholder = '65';
      heightInput.placeholder = '180';
      if (currentUnit === 'imperial') {
        const lbs = parseFloat(weightInput.value) || 0;
        const inVal = parseFloat(heightInput.value) || 0;
        if (lbs) weightInput.value = (lbs / 2.20462).toFixed(1);
        if (inVal) heightInput.value = (inVal * 2.54).toFixed(1);
      }
      currentUnit = 'metric';
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      weightUnitEl.textContent = 'lbs';
      heightUnitEl.textContent = 'in';
      weightInput.placeholder = '143';
      heightInput.placeholder = '71';
      if (currentUnit === 'metric') {
        const kg = parseFloat(weightInput.value) || 0;
        const cm = parseFloat(heightInput.value) || 0;
        if (kg) weightInput.value = Math.round(kg * 2.20462);
        if (cm) heightInput.value = Math.round(cm / 2.54);
      }
      currentUnit = 'imperial';
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

  [weightInput, ageInput, heightInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (genderSelect) genderSelect.addEventListener('change', runCalculation);
  if (activitySelect) activitySelect.addEventListener('change', runCalculation);

  // Predefined: male, 25, 180 cm, 65 kg, Light (1.375)
  genderSelect.value = 'male';
  ageInput.value = '25';
  heightInput.value = '180';
  weightInput.value = '65';
  activitySelect.value = '1.375';
  runCalculation();
})();
