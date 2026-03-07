/**
 * Pregnancy Weight Gain Calculator - SportyCalc
 * Based on Institute of Medicine guidelines (IOM)
 * Reference: https://www.calculator.net/pregnancy-weight-gain-calculator.html
 *
 * IOM recommendations by prepregnancy BMI:
 * - Underweight (<18.5): 28-40 lbs (single)
 * - Normal (18.5-24.9): 25-35 lbs (single), 37-54 lbs (twins)
 * - Overweight (25-29.9): 15-25 lbs (single), 31-50 lbs (twins)
 * - Obese (>30): 11-20 lbs (single), 25-42 lbs (twins)
 */

(function () {
  'use strict';

  const form = document.getElementById('pregnancy-form');
  if (!form) return;

  const weekSelect = document.getElementById('week');
  const twinsSelect = document.getElementById('twins');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightBeforeInput = document.getElementById('weight-before');
  const weightNowInput = document.getElementById('weight-now');
  const heightUnitEl = document.getElementById('height-unit');
  const weightUnitEl = document.getElementById('weight-unit');
  const weightNowUnitEl = document.getElementById('weight-now-unit');

  const resultGain = document.getElementById('result-gain');
  const resultRange = document.getElementById('result-range');
  const resultBmi = document.getElementById('result-bmi');
  const resultCategory = document.getElementById('result-category');
  const resultStatus = document.getElementById('result-status');
  const statusNote = document.getElementById('status-note');
  const scaleWrap = document.getElementById('pregnancy-scale-wrap');
  const scaleZone = document.getElementById('pregnancy-scale-zone');
  const scaleMarker = document.getElementById('pregnancy-scale-marker');
  const scaleTickMin = document.getElementById('scale-tick-min');
  const scaleTickMax = document.getElementById('scale-tick-max');
  const scaleTickEnd = document.getElementById('scale-tick-end');
  const scaleLabel = document.getElementById('pregnancy-scale-label');

  let currentUnit = 'metric';

  // IOM ranges in lbs: [min, max] for single, [min, max] or null for twins
  const IOM_RANGES = {
    underweight: { single: [28, 40], twins: null },
    normal: { single: [25, 35], twins: [37, 54] },
    overweight: { single: [15, 25], twins: [31, 50] },
    obese: { single: [11, 20], twins: [25, 42] }
  };

  function kgToLbs(kg) {
    return kg * 2.20462;
  }

  function lbsToKg(lbs) {
    return lbs / 2.20462;
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

  function getWeightKg(input) {
    const val = parseFloat(input.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? lbsToKg(val) : val;
  }

  function getBmiCategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  function getCategoryLabel(cat) {
    const labels = { underweight: 'Underweight', normal: 'Normal', overweight: 'Overweight', obese: 'Obese' };
    return labels[cat] || cat;
  }

  function getRecommendedRange(bmiCategory, isTwins) {
    const ranges = IOM_RANGES[bmiCategory];
    if (!ranges) return null;
    if (isTwins && ranges.twins) return ranges.twins;
    if (isTwins && !ranges.twins) return null; // underweight twins - no IOM range
    return ranges.single;
  }

  function setUnit(unit) {
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      heightMetricDiv.style.display = 'block';
      heightImperialDiv.style.display = 'none';
      heightCmInput.required = true;
      if (heightFtInput) heightFtInput.required = false;
      if (heightInInput) heightInInput.required = false;
      heightUnitEl.textContent = 'cm';
      weightUnitEl.textContent = 'kg';
      weightNowUnitEl.textContent = 'kg';
      heightCmInput.placeholder = '165';
      weightBeforeInput.placeholder = '65';
      weightNowInput.placeholder = '72';
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
      const ft = parseFloat(heightFtInput?.value) || 0;
      const inVal = parseFloat(heightInInput?.value) || 0;
      if (ft || inVal) {
        const totalInches = ft * 12 + inVal;
        heightCmInput.value = Math.round(inchesToCm(totalInches) * 10) / 10;
      }
      // Values on screen are in lbs when switching from imperial; convert to kg
      const wBeforeLbs = parseFloat(weightBeforeInput.value) || 143;
      const wNowLbs = parseFloat(weightNowInput.value) || 159;
      weightBeforeInput.value = Math.round(lbsToKg(wBeforeLbs) * 10) / 10;
      weightNowInput.value = Math.round(lbsToKg(wNowLbs) * 10) / 10;
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialDiv.style.display = 'grid';
      heightCmInput.required = false;
      if (heightFtInput) heightFtInput.required = true;
      if (heightInInput) heightInInput.required = true;
      heightUnitEl.textContent = 'ft / in';
      weightUnitEl.textContent = 'lbs';
      weightNowUnitEl.textContent = 'lbs';
      weightBeforeInput.placeholder = '143';
      weightNowInput.placeholder = '159';
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
      const cm = parseFloat(heightCmInput.value) || 165;
      const totalInches = cmToInches(cm);
      const { ft, in: inVal } = inchesToFtIn(totalInches);
      if (heightFtInput) heightFtInput.value = ft;
      if (heightInInput) heightInInput.value = inVal;
      const wBefore = parseFloat(weightBeforeInput.value) || 65;
      const wNow = parseFloat(weightNowInput.value) || 72;
      const wBeforeKg = currentUnit === 'metric' ? wBefore : lbsToKg(wBefore);
      const wNowKg = currentUnit === 'metric' ? wNow : lbsToKg(wNow);
      weightBeforeInput.value = Math.round(kgToLbs(wBeforeKg) * 10) / 10;
      weightNowInput.value = Math.round(kgToLbs(wNowKg) * 10) / 10;
    }

    runCalculation();
  }

  function updateScale(gainLbs, range, status) {
    if (!scaleWrap || !scaleZone || !scaleMarker) return;
    if (!range) {
      scaleWrap.style.display = 'none';
      return;
    }
    scaleWrap.style.display = 'block';

    const scaleMaxLbs = Math.max(60, range[1] + 10);
    const rangeMinLbs = range[0];
    const rangeMaxLbs = range[1];

    const zoneLeft = (rangeMinLbs / scaleMaxLbs) * 100;
    const zoneWidth = ((rangeMaxLbs - rangeMinLbs) / scaleMaxLbs) * 100;
    const markerLeft = Math.min(100, Math.max(0, (gainLbs / scaleMaxLbs) * 100));

    scaleZone.style.left = zoneLeft + '%';
    scaleZone.style.width = zoneWidth + '%';
    scaleMarker.style.left = markerLeft + '%';

    scaleMarker.classList.remove('below', 'within', 'above');
    scaleMarker.classList.add(status);

    if (scaleLabel) scaleLabel.textContent = 'Weight gain (' + (currentUnit === 'metric' ? 'kg' : 'lbs') + ')';
    if (currentUnit === 'metric') {
      if (scaleTickMin) scaleTickMin.textContent = Math.round(lbsToKg(rangeMinLbs));
      if (scaleTickMax) scaleTickMax.textContent = Math.round(lbsToKg(rangeMaxLbs));
      if (scaleTickEnd) scaleTickEnd.textContent = Math.round(lbsToKg(scaleMaxLbs));
    } else {
      if (scaleTickMin) scaleTickMin.textContent = rangeMinLbs;
      if (scaleTickMax) scaleTickMax.textContent = rangeMaxLbs;
      if (scaleTickEnd) scaleTickEnd.textContent = Math.round(scaleMaxLbs);
    }
  }

  function runCalculation() {
    const heightM = getHeightM();
    const weightBeforeKg = getWeightKg(weightBeforeInput);
    const weightNowKg = getWeightKg(weightNowInput);

    if (!weightBeforeKg || !weightNowKg || !heightM || heightM <= 0) {
      resultGain.textContent = '—';
      resultRange.textContent = '—';
      resultBmi.textContent = '—';
      resultCategory.textContent = '—';
      resultStatus.textContent = '—';
      if (statusNote) statusNote.textContent = '';
      if (scaleWrap) scaleWrap.style.display = 'none';
      return;
    }

    const bmi = weightBeforeKg / (heightM * heightM);
    const bmiCategory = getBmiCategory(bmi);
    const isTwins = twinsSelect.value === 'yes';
    const range = getRecommendedRange(bmiCategory, isTwins);

    const gainKg = weightNowKg - weightBeforeKg;
    const gainLbs = kgToLbs(gainKg);

    // Display current gain
    resultGain.textContent = currentUnit === 'metric'
      ? (Math.round(gainKg * 10) / 10 + ' kg')
      : (Math.round(gainLbs * 10) / 10 + ' lbs');

    // Display BMI
    resultBmi.textContent = bmi.toFixed(1);
    resultCategory.textContent = getCategoryLabel(bmiCategory);

    // Recommended range - IOM uses lbs
    let statusClass = 'within';
    if (range) {
      if (currentUnit === 'metric') {
        const minKg = lbsToKg(range[0]);
        const maxKg = lbsToKg(range[1]);
        resultRange.textContent = Math.round(minKg) + ' – ' + Math.round(maxKg) + ' kg';
      } else {
        resultRange.textContent = range[0] + ' – ' + range[1] + ' lbs';
      }

      // Status: below, within, above
      let status, note;
      if (gainLbs < range[0]) {
        status = 'Below range';
        statusClass = 'below';
        note = 'You have gained less than recommended. Consider discussing nutrition with your healthcare provider.';
      } else if (gainLbs > range[1]) {
        status = 'Above range';
        statusClass = 'above';
        note = 'You have gained more than recommended. This is common; discuss with your healthcare provider.';
      } else {
        status = 'Within range';
        statusClass = 'within';
        note = 'Your weight gain is within the recommended range for your prepregnancy BMI.';
      }
      resultStatus.textContent = status;
      if (statusNote) statusNote.textContent = note;
      updateScale(gainLbs, range, statusClass);
    } else {
      resultRange.textContent = 'Consult provider';
      resultStatus.textContent = '—';
      if (statusNote) statusNote.textContent = 'For underweight twin pregnancies, the IOM does not specify a range. Please consult your healthcare provider.';
      if (scaleWrap) scaleWrap.style.display = 'none';
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', handleSubmit);

  [weightBeforeInput, weightNowInput, heightCmInput, heightFtInput, heightInInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (weekSelect) weekSelect.addEventListener('change', runCalculation);
  if (twinsSelect) twinsSelect.addEventListener('change', runCalculation);

  // Init: convert imperial if needed, then run
  const cm = parseFloat(heightCmInput.value) || 165;
  const totalInches = cmToInches(cm);
  const { ft, in: inVal } = inchesToFtIn(totalInches);
  if (heightFtInput) heightFtInput.value = ft;
  if (heightInInput) heightInInput.value = inVal;

  runCalculation();
})();
