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
  const resultBmi = document.getElementById('result-bmi');
  const resultBmiCat = document.getElementById('result-bmi-cat');
  const calMildLoss = document.getElementById('cal-mild-loss');
  const calLoss = document.getElementById('cal-loss');
  const calMildGain = document.getElementById('cal-mild-gain');
  const calGain = document.getElementById('cal-gain');
  const calFastGain = document.getElementById('cal-fast-gain');

  let currentUnit = 'metric';

  function getBmiCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

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
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    if (resultBmr) resultBmr.textContent = Math.round(bmr).toLocaleString();
    if (resultTdee) resultTdee.textContent = tdee.toLocaleString();

    if (resultBmi) resultBmi.textContent = bmi.toFixed(1);
    if (resultBmiCat) resultBmiCat.textContent = getBmiCategory(bmi);

    if (calMildLoss) calMildLoss.textContent = Math.round(tdee * 0.9).toLocaleString();
    if (calLoss) calLoss.textContent = Math.round(tdee * 0.79).toLocaleString();
    if (calMildGain) calMildGain.textContent = Math.round(tdee * 1.1).toLocaleString();
    if (calGain) calGain.textContent = Math.round(tdee * 1.21).toLocaleString();
    if (calFastGain) calFastGain.textContent = Math.round(tdee * 1.41).toLocaleString();
  }

  function setUnit(unit) {
    const prevUnit = currentUnit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      weightUnitEl.textContent = 'kg';
      heightUnitEl.textContent = 'cm';
      weightInput.placeholder = '65';
      heightInput.placeholder = '180';
      if (prevUnit === 'imperial') {
        const lbs = parseFloat(weightInput.value) || 0;
        const inVal = parseFloat(heightInput.value) || 0;
        if (lbs) weightInput.value = (lbs / 2.20462).toFixed(1);
        if (inVal) heightInput.value = (inVal * 2.54).toFixed(1);
      }
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      weightUnitEl.textContent = 'lbs';
      heightUnitEl.textContent = 'in';
      weightInput.placeholder = '143';
      heightInput.placeholder = '71';
      if (prevUnit === 'metric') {
        const kg = parseFloat(weightInput.value) || 0;
        const cm = parseFloat(heightInput.value) || 0;
        if (kg) weightInput.value = Math.round(kg * 2.20462);
        if (cm) heightInput.value = Math.round(cm / 2.54);
      }
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }
    currentUnit = unit;
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
