/**
 * Fitness Age Calculator - SportyCalc
 *
 * METHOD: NTNU / Nes et al. non-exercise VO2max prediction, then fitness age from reference curves.
 *
 * 1. VO2max (L/min) = 3.542 + (-0.014 × age) + (0.015 × weight_kg) + (-0.011 × waist_cm)
 *    + (0.009 × height_cm) + (-0.027 × RHR) + (0.019 × exercise_index)
 *    Exercise: 0=never, 1=rarely, 2=1-2x/week, 3=2-3x/week, 4=4+x/week
 *
 * 2. VO2max (ml/kg/min) = (VO2max_L × 1000) / weight_kg
 *
 * 3. Reference VO2max by age (50th percentile): Men 20→45, 25→43, 30→41, 35→39, 40→37,
 *    45→35, 50→33, 55→31, 60→29, 65→27, 70→25. Women ~8 ml/kg/min lower.
 *
 * 4. Fitness age = inverse interpolation: find age where reference VO2max = user's VO2max.
 *
 * Ref: Nes et al. (1990), NTNU Fitness Age research, Cooper Institute norms.
 */

(function () {
  'use strict';

  const form = document.getElementById('fitness-age-form');
  if (!form) return;

  const genderBtns = form.querySelectorAll('.fitness-age-gender-btn');
  const ageInput = document.getElementById('age');
  const rhrInput = document.getElementById('rhr');
  const weightInput = document.getElementById('weight');
  const heightInput = document.getElementById('height');
  const waistInput = document.getElementById('waist');
  const exerciseSelect = document.getElementById('exercise');
  const weightLabel = document.getElementById('weight-label');
  const heightLabel = document.getElementById('height-label');
  const waistLabel = document.getElementById('waist-label');
  const weightUnitEl = document.getElementById('weight-unit');
  const heightUnitEl = document.getElementById('height-unit');
  const waistUnitEl = document.getElementById('waist-unit');

  const resultFitnessAge = document.getElementById('result-fitness-age');
  const resultCompare = document.getElementById('result-compare');
  const resultActualAge = document.getElementById('result-actual-age');
  const resultVo2 = document.getElementById('result-vo2');
  const resultDiff = document.getElementById('result-diff');

  let currentGender = 'male';
  let currentUnit = 'metric';

  // Reference VO2max (ml/kg/min) by age - 50th percentile. [age, male, female]
  const VO2_REF = [
    [20, 45, 37], [25, 43, 35], [30, 41, 33], [35, 39, 31], [40, 37, 29],
    [45, 35, 27], [50, 33, 25], [55, 31, 23], [60, 29, 21], [65, 27, 19],
    [70, 25, 17], [75, 23, 15], [80, 21, 13], [90, 19, 11]
  ];

  function kgToLbs(kg) { return kg * 2.20462; }
  function lbsToKg(lbs) { return lbs / 2.20462; }
  function cmToInches(cm) { return cm / 2.54; }
  function inchesToCm(inches) { return inches * 2.54; }

  /**
   * Nes et al. non-exercise VO2max prediction (L/min).
   * Converts to ml/kg/min for comparison with reference curves.
   */
  function estimateVo2max(age, weightKg, heightCm, waistCm, rhr, exerciseIndex) {
    const vo2L = 3.542 +
      (-0.014 * age) +
      (0.015 * weightKg) +
      (-0.011 * waistCm) +
      (0.009 * heightCm) +
      (-0.027 * rhr) +
      (0.019 * exerciseIndex);
    if (vo2L <= 0 || weightKg <= 0) return 0;
    return (vo2L * 1000) / weightKg;
  }

  /**
   * Get reference VO2max for a given age and gender.
   */
  function refVo2AtAge(age, isMale) {
    const col = isMale ? 1 : 2;
    if (age <= VO2_REF[0][0]) return VO2_REF[0][col];
    if (age >= VO2_REF[VO2_REF.length - 1][0]) return VO2_REF[VO2_REF.length - 1][col];
    for (let i = 0; i < VO2_REF.length - 1; i++) {
      const [a1, v1] = [VO2_REF[i][0], VO2_REF[i][col]];
      const [a2, v2] = [VO2_REF[i + 1][0], VO2_REF[i + 1][col]];
      if (age >= a1 && age <= a2) {
        const t = (age - a1) / (a2 - a1);
        return v1 + t * (v2 - v1);
      }
    }
    return VO2_REF[0][col];
  }

  /**
   * Inverse: given VO2max, find age where reference VO2max = vo2.
   * Linear interpolation between reference points.
   */
  function vo2ToFitnessAge(vo2, isMale) {
    const col = isMale ? 1 : 2;
    if (vo2 >= VO2_REF[0][col]) return 20;
    if (vo2 <= VO2_REF[VO2_REF.length - 1][col]) return 90;
    for (let i = 0; i < VO2_REF.length - 1; i++) {
      const [a1, v1] = [VO2_REF[i][0], VO2_REF[i][col]];
      const [a2, v2] = [VO2_REF[i + 1][0], VO2_REF[i + 1][col]];
      if (vo2 <= v1 && vo2 >= v2) {
        const t = (v1 - vo2) / (v1 - v2);
        return Math.round(a1 + t * (a2 - a1));
      }
    }
    return 35;
  }

  function getWeightKg() {
    const v = parseFloat(weightInput.value) || 75;
    return currentUnit === 'imperial' ? lbsToKg(v) : v;
  }

  function getHeightCm() {
    const v = parseFloat(heightInput.value) || 175;
    return currentUnit === 'imperial' ? inchesToCm(v) : v;
  }

  function getWaistCm() {
    const v = parseFloat(waistInput.value) || 85;
    return currentUnit === 'imperial' ? inchesToCm(v) : v;
  }

  function runCalculation() {
    const age = parseInt(ageInput.value, 10) || 35;
    const rhr = parseInt(rhrInput.value, 10) || 65;
    const exerciseIndex = parseInt(exerciseSelect.value, 10) || 2;
    const weightKg = getWeightKg();
    const heightCm = getHeightCm();
    const waistCm = getWaistCm();
    const isMale = currentGender === 'male';

    const vo2 = estimateVo2max(age, weightKg, heightCm, waistCm, rhr, exerciseIndex);
    const fitnessAge = vo2ToFitnessAge(vo2, isMale);
    const diff = fitnessAge - age;

    resultFitnessAge.textContent = vo2 > 0 ? fitnessAge : '—';
    resultActualAge.textContent = age;
    resultVo2.textContent = vo2 > 0 ? vo2.toFixed(1) + ' ml/kg/min' : '—';
    resultDiff.textContent = vo2 > 0
      ? (diff > 0 ? '+' + diff + ' years' : diff + ' years')
      : '—';

    if (vo2 > 0) {
      if (diff < 0) {
        resultCompare.textContent = 'Your body performs ' + Math.abs(diff) + ' year(s) younger than your actual age.';
      } else if (diff > 0) {
        resultCompare.textContent = 'Your body performs ' + diff + ' year(s) older than your actual age.';
      } else {
        resultCompare.textContent = 'Your fitness age matches your actual age.';
      }
    } else {
      resultCompare.textContent = 'Enter data to see result';
    }
  }

  // Unit toggle
  const unitBtns = form.querySelectorAll('.unit-btn');
  unitBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const unit = btn.dataset.unit;
      if (unit === currentUnit) return;
      currentUnit = unit;
      unitBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.unit === unit); });

      if (unit === 'imperial') {
        weightInput.value = Math.round(kgToLbs(parseFloat(weightInput.value) || 75) * 10) / 10;
        heightInput.value = Math.round(cmToInches(parseFloat(heightInput.value) || 175) * 10) / 10;
        waistInput.value = Math.round(cmToInches(parseFloat(waistInput.value) || 85) * 10) / 10;
        weightUnitEl.textContent = 'lbs';
        heightUnitEl.textContent = 'in';
        waistUnitEl.textContent = 'in';
      } else {
        weightInput.value = Math.round(lbsToKg(parseFloat(weightInput.value) || 165) * 10) / 10;
        heightInput.value = Math.round(inchesToCm(parseFloat(heightInput.value) || 69) * 10) / 10;
        waistInput.value = Math.round(inchesToCm(parseFloat(waistInput.value) || 33) * 10) / 10;
        weightUnitEl.textContent = 'kg';
        heightUnitEl.textContent = 'cm';
        waistUnitEl.textContent = 'cm';
      }
      runCalculation();
    });
  });

  // Gender toggle
  genderBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentGender = btn.dataset.gender;
      genderBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.gender === currentGender); });
      runCalculation();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [ageInput, rhrInput, weightInput, heightInput, waistInput, exerciseSelect].forEach(function (el) {
    if (el) el.addEventListener('input', runCalculation);
  });
  [ageInput, rhrInput, weightInput, heightInput, waistInput, exerciseSelect].forEach(function (el) {
    if (el) el.addEventListener('change', runCalculation);
  });

  runCalculation();
})();
