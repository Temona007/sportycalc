/**
 * Healthy Weight / Ideal Body Weight Calculator - SportyCalc
 * Logic and formulas match calculator.net ideal weight calculator
 * Robinson, Miller, Devine, Hamwi, Healthy BMI Range (18.5-25)
 */

(function () {
  'use strict';

  const form = document.getElementById('healthy-weight-form');
  if (!form) return;

  const ageInput = document.getElementById('age');
  const sexSelect = document.getElementById('sex');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const heightUnitEl = document.getElementById('height-unit');

  const resultRobinson = document.getElementById('result-robinson');
  const resultMiller = document.getElementById('result-miller');
  const resultDevine = document.getElementById('result-devine');
  const resultHamwi = document.getElementById('result-hamwi');
  const resultBmiRange = document.getElementById('result-bmi-range');

  let currentUnit = 'metric';

  function cmToInches(cm) {
    return cm / 2.54;
  }

  function inchesToCm(inches) {
    return inches * 2.54;
  }

  function kgToLbs(kg) {
    return kg * 2.20462;
  }

  function formatWeight(kg, unit) {
    if (unit === 'imperial') {
      const lbs = kgToLbs(kg);
      return lbs.toFixed(1) + ' lbs';
    }
    return kg.toFixed(1) + ' kg';
  }

  function getHeightM() {
    if (currentUnit === 'metric') {
      const v = parseFloat(heightCmInput.value);
      return v && v > 0 ? v / 100 : 0;
    }
    const ft = parseFloat(heightFtInput.value) || 0;
    const inVal = parseFloat(heightInInput.value) || 0;
    const totalInches = ft * 12 + inVal;
    return totalInches > 0 ? totalInches * 0.0254 : 0;
  }

  function getInchesOver5Feet() {
    let totalInches;
    if (currentUnit === 'metric') {
      const cm = parseFloat(heightCmInput.value) || 0;
      totalInches = cmToInches(cm);
    } else {
      const ft = parseFloat(heightFtInput.value) || 0;
      const inVal = parseFloat(heightInInput.value) || 0;
      totalInches = ft * 12 + inVal;
    }
    return Math.max(0, totalInches - 60);
  }

  /**
   * Robinson (1983): Male 52 + 1.9 per inch | Female 49 + 1.7 per inch
   */
  function robinson(inchesOver5ft, isMale) {
    const base = isMale ? 52 : 49;
    const perInch = isMale ? 1.9 : 1.7;
    return base + perInch * inchesOver5ft;
  }

  /**
   * Miller (1983): Male 56.2 + 1.41 per inch | Female 53.1 + 1.36 per inch
   */
  function miller(inchesOver5ft, isMale) {
    const base = isMale ? 56.2 : 53.1;
    const perInch = isMale ? 1.41 : 1.36;
    return base + perInch * inchesOver5ft;
  }

  /**
   * Devine (1974): Male 50 + 2.3 per inch | Female 45.5 + 2.3 per inch
   */
  function devine(inchesOver5ft, isMale) {
    const base = isMale ? 50 : 45.5;
    const perInch = 2.3;
    return base + perInch * inchesOver5ft;
  }

  /**
   * Hamwi (1964): Male 48 + 2.7 per inch | Female 45.5 + 2.2 per inch
   */
  function hamwi(inchesOver5ft, isMale) {
    const base = isMale ? 48 : 45.5;
    const perInch = isMale ? 2.7 : 2.2;
    return base + perInch * inchesOver5ft;
  }

  /**
   * Healthy BMI Range: WHO 18.5 - 25
   * weight = height(m)² × BMI
   */
  function healthyBmiRange(heightM) {
    const h2 = heightM * heightM;
    return {
      min: 18.5 * h2,
      max: 25 * h2
    };
  }

  function runCalculation() {
    const heightM = getHeightM();
    const inchesOver5ft = getInchesOver5Feet();
    const isMale = sexSelect.value === 'male';

    if (!heightM || heightM <= 0) return;

    const robinsonKg = robinson(inchesOver5ft, isMale);
    const millerKg = miller(inchesOver5ft, isMale);
    const devineKg = devine(inchesOver5ft, isMale);
    const hamwiKg = hamwi(inchesOver5ft, isMale);
    const { min: bmiMinKg, max: bmiMaxKg } = healthyBmiRange(heightM);

    if (resultRobinson) resultRobinson.textContent = formatWeight(robinsonKg, currentUnit);
    if (resultMiller) resultMiller.textContent = formatWeight(millerKg, currentUnit);
    if (resultDevine) resultDevine.textContent = formatWeight(devineKg, currentUnit);
    if (resultHamwi) resultHamwi.textContent = formatWeight(hamwiKg, currentUnit);
    if (resultBmiRange) {
      resultBmiRange.textContent = formatWeight(bmiMinKg, currentUnit) + ' – ' + formatWeight(bmiMaxKg, currentUnit);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runCalculation();
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
      heightUnitEl.textContent = 'cm';
      heightCmInput.placeholder = '180';
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
      heightUnitEl.textContent = '';
      const cm = parseFloat(heightCmInput.value) || 180;
      const totalInches = cmToInches(cm);
      const ft = Math.floor(totalInches / 12);
      const inVal = Math.round((totalInches % 12) * 2) / 2;
      heightFtInput.value = ft;
      heightInInput.value = inVal;
      heightFtInput.placeholder = '5';
      heightInInput.placeholder = '10';
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', handleSubmit);

  [ageInput, sexSelect, heightCmInput, heightFtInput, heightInInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (heightFtInput) heightFtInput.addEventListener('change', runCalculation);
  if (heightInInput) heightInInput.addEventListener('change', runCalculation);

  // Init: 180cm, male, 25 (matches calculator.net example)
  sexSelect.value = 'male';
  ageInput.value = '25';
  heightCmInput.value = '180';
  runCalculation();
})();
