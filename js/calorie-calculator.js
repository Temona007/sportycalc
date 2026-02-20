/**
 * Calorie Calculator - SportyCalc
 * Mifflin-St Jeor BMR × activity = TDEE. Goals with sub-options.
 * Predefined: male, 35 years, 178 cm, 88 kg, moderate (1.55)
 */

(function () {
  'use strict';

  const form = document.getElementById('calorie-form');
  if (!form) return;

  const genderSelect = document.getElementById('gender');
  const ageInput = document.getElementById('age');
  const weightInput = document.getElementById('weight');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialCells = document.querySelectorAll('.height-imperial-cell');
  const weightLabel = document.getElementById('weight-label');
  const resultTdee = document.getElementById('result-tdee');
  const resultBmr = document.getElementById('result-bmr');
  const resultTarget = document.getElementById('result-target');
  const goalLoseDetail = document.getElementById('goal-lose-detail');
  const goalMaintainDetail = document.getElementById('goal-maintain-detail');
  const goalGainDetail = document.getElementById('goal-gain-detail');
  const calMildLoss = document.getElementById('cal-mild-loss');
  const calLoss = document.getElementById('cal-loss');
  const calLeanBulk = document.getElementById('cal-lean-bulk');
  const calModerateBulk = document.getElementById('cal-moderate-bulk');
  const calAggressiveBulk = document.getElementById('cal-aggressive-bulk');
  const goalNoteText = document.getElementById('goal-note-text');

  let currentUnit = 'metric';
  let currentGoal = 'maintain';
  let lastTdee = 0;

  function getActivityMult() {
    const checked = form.querySelector('input[name="activity"]:checked');
    return checked ? parseFloat(checked.value) : 1.55;
  }

  function mifflinStJeor(weightKg, heightCm, age, isMale) {
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return isMale ? base + 5 : base - 161;
  }

  function lbsToKg(lbs) { return lbs / 2.20462; }
  function kgToLbs(kg) { return kg * 2.20462; }
  function cmToInches(cm) { return cm / 2.54; }
  function inchesToCm(inches) { return inches * 2.54; }

  function inchesToFtIn(totalIn) {
    const ft = Math.floor(totalIn / 12);
    const inVal = Math.round((totalIn % 12) * 2) / 2;
    return { ft, in: inVal };
  }

  function getHeightCm() {
    if (currentUnit === 'metric') {
      return parseFloat(heightCmInput.value) || 0;
    }
    const ft = parseFloat(heightFtInput.value) || 0;
    const inVal = parseFloat(heightInInput.value) || 0;
    return (ft * 12 + inVal) > 0 ? inchesToCm(ft * 12 + inVal) : 0;
  }

  function getWeightKg() {
    const v = parseFloat(weightInput.value);
    if (!v || v <= 0) return 0;
    return currentUnit === 'imperial' ? lbsToKg(v) : v;
  }

  function updateGoalDetails(tdee) {
    lastTdee = tdee;

    if (calMildLoss) calMildLoss.textContent = Math.round(tdee - 250).toLocaleString();
    if (calLoss) calLoss.textContent = Math.round(tdee - 500).toLocaleString();
    if (resultTarget) resultTarget.textContent = tdee.toLocaleString();
    if (calLeanBulk) calLeanBulk.textContent = Math.round(tdee + 250).toLocaleString();
    if (calModerateBulk) calModerateBulk.textContent = Math.round(tdee + 500).toLocaleString();
    if (calAggressiveBulk) calAggressiveBulk.textContent = Math.round(tdee + 750).toLocaleString();
  }

  function runCalculation() {
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();
    const age = parseInt(ageInput.value, 10) || 0;
    const isMale = genderSelect.value === 'male';
    const mult = getActivityMult();

    if (!weightKg || !heightCm || !age || heightCm <= 0) return;

    const bmr = mifflinStJeor(weightKg, heightCm, age, isMale);
    const tdee = Math.round(bmr * mult);

    if (resultTdee) resultTdee.textContent = tdee.toLocaleString();
    if (resultBmr) resultBmr.textContent = Math.round(bmr).toLocaleString();

    updateGoalDetails(tdee);
  }

  function updateGoalLabels() {
    const unit = currentUnit;
    document.querySelectorAll('.goal-desc').forEach(el => {
      const text = el.getAttribute(`data-${unit}`);
      if (text) el.textContent = text;
    });
    if (goalNoteText) {
      const text = goalNoteText.getAttribute(`data-${unit}`);
      if (text) goalNoteText.textContent = text;
    }
  }

  function setGoal(goal) {
    currentGoal = goal;
    document.querySelectorAll('.calorie-goal-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.goal === goal);
    });
    if (goalLoseDetail) goalLoseDetail.style.display = goal === 'lose' ? 'block' : 'none';
    if (goalMaintainDetail) goalMaintainDetail.style.display = goal === 'maintain' ? 'block' : 'none';
    if (goalGainDetail) goalGainDetail.style.display = goal === 'gain' ? 'block' : 'none';
  }

  function setUnit(unit) {
    const prev = currentUnit;
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      heightMetricDiv.style.display = 'block';
      heightImperialCells.forEach(el => { el.style.display = 'none'; });
      heightCmInput.required = true;
      heightFtInput.required = false;
      heightInInput.required = false;
      if (weightLabel) weightLabel.textContent = 'Weight, kg';
      if (prev === 'imperial') {
        const ft = parseFloat(heightFtInput.value) || 0;
        const inVal = parseFloat(heightInInput.value) || 0;
        if (ft || inVal) heightCmInput.value = inchesToCm(ft * 12 + inVal).toFixed(1);
        const lbs = parseFloat(weightInput.value);
        if (lbs) weightInput.value = (lbs / 2.20462).toFixed(1);
      }
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
      updateGoalLabels();
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialCells.forEach(el => { el.style.display = 'block'; });
      heightCmInput.required = false;
      heightFtInput.required = true;
      heightInInput.required = true;
      if (weightLabel) weightLabel.textContent = 'Weight, lbs';
      if (prev === 'metric') {
        const cm = parseFloat(heightCmInput.value) || 178;
        const { ft, in: inVal } = inchesToFtIn(cmToInches(cm));
        heightFtInput.value = ft;
        heightInInput.value = inVal;
        const kg = parseFloat(weightInput.value);
        if (kg) weightInput.value = Math.round(kgToLbs(kg));
      }
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
      updateGoalLabels();
    }
    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  document.querySelectorAll('.calorie-goal-btn').forEach(btn => {
    btn.addEventListener('click', () => setGoal(btn.dataset.goal));
  });

  form.querySelectorAll('input[name="activity"]').forEach(radio => {
    radio.addEventListener('change', runCalculation);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [weightInput, ageInput, heightCmInput, heightFtInput, heightInInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (genderSelect) genderSelect.addEventListener('change', runCalculation);

  // Predefined: male, 35, 178 cm, 88 kg, moderate (1.55)
  genderSelect.value = 'male';
  ageInput.value = '35';
  heightCmInput.value = '178';
  weightInput.value = '88';
  const moderateRadio = form.querySelector('input[name="activity"][value="1.55"]');
  if (moderateRadio) moderateRadio.checked = true;
  updateGoalLabels();
  runCalculation();
})();
