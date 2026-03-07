/**
 * Body Fat Calculator - U.S. Navy Method
 * Hodgdon & Beckett formulas. All measurements converted to inches for calculation.
 * Male: 86.010*log10(waist-neck) - 70.041*log10(height) + 36.76
 * Female: 163.205*log10(waist+hip-neck) - 97.684*log10(height) - 78.387
 * Predefined: male, 178cm, 82kg, neck 38, waist 86 (hip not used for male)
 */

(function () {
  'use strict';

  const form = document.getElementById('bodyfat-form');
  if (!form) return;

  const genderBtns = form.querySelectorAll('.bf-gender-btn');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightInput = document.getElementById('weight');
  const weightLabel = document.getElementById('weight-label');
  const neckInput = document.getElementById('neck');
  const neckLabel = document.getElementById('neck-label');
  const waistInput = document.getElementById('waist');
  const waistLabel = document.getElementById('waist-label');
  const hipInput = document.getElementById('hip');
  const hipLabel = document.getElementById('hip-label');
  const hipGroup = document.getElementById('hip-group');
  const resultBf = document.getElementById('result-bf');
  const resultBfWrap = document.getElementById('result-bf-wrap');
  const resultCategory = document.getElementById('result-category');
  const resultFatMass = document.getElementById('result-fat-mass');
  const resultLeanMass = document.getElementById('result-lean-mass');
  const fatMassUnit = document.getElementById('fat-mass-unit');
  const leanMassUnit = document.getElementById('lean-mass-unit');

  let currentGender = 'male';
  let chartInstance = null;
  let currentUnit = 'metric';

  const CATEGORIES_MALE = [
    { name: 'Essential', min: 2, max: 5 },
    { name: 'Athletic', min: 6, max: 13 },
    { name: 'Fitness', min: 14, max: 17 },
    { name: 'Average', min: 18, max: 24 },
    { name: 'Obese', min: 25, max: 100 }
  ];
  const CATEGORIES_FEMALE = [
    { name: 'Essential', min: 10, max: 13 },
    { name: 'Athletic', min: 14, max: 20 },
    { name: 'Fitness', min: 21, max: 24 },
    { name: 'Average', min: 25, max: 31 },
    { name: 'Obese', min: 32, max: 100 }
  ];

  function cmToInches(cm) { return cm / 2.54; }
  function inchesToCm(inches) { return inches * 2.54; }
  function kgToLbs(kg) { return kg * 2.20462; }
  function lbsToKg(lbs) { return lbs / 2.20462; }

  function getHeightInches() {
    if (currentUnit === 'metric') {
      const cm = parseFloat(heightCmInput.value) || 178;
      return cmToInches(cm);
    }
    const ft = parseFloat(heightFtInput.value) || 5;
    const inVal = parseFloat(heightInInput.value) || 10;
    return ft * 12 + inVal;
  }

  function getWeightKg() {
    const v = parseFloat(weightInput.value) || 82;
    return currentUnit === 'imperial' ? lbsToKg(v) : v;
  }

  function getNeckInches() {
    const v = parseFloat(neckInput.value) || 38;
    return currentUnit === 'imperial' ? v : cmToInches(v);
  }

  function getWaistInches() {
    const v = parseFloat(waistInput.value) || 86;
    return currentUnit === 'imperial' ? v : cmToInches(v);
  }

  function getHipInches() {
    const v = parseFloat(hipInput.value) || 98;
    return currentUnit === 'imperial' ? v : cmToInches(v);
  }

  function navyBodyFatMale(waistIn, neckIn, heightIn) {
    const diff = waistIn - neckIn;
    if (diff <= 0 || heightIn <= 0) return null;
    return 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightIn) + 36.76;
  }

  function navyBodyFatFemale(waistIn, hipIn, neckIn, heightIn) {
    const sum = waistIn + hipIn - neckIn;
    if (sum <= 0 || heightIn <= 0) return null;
    return 163.205 * Math.log10(sum) - 97.684 * Math.log10(heightIn) - 78.387;
  }

  function getCategory(bf, isMale) {
    const cats = isMale ? CATEGORIES_MALE : CATEGORIES_FEMALE;
    for (const c of cats) {
      if (bf >= c.min && bf <= c.max) return c.name;
    }
    if (bf < cats[0].min) return cats[0].name;
    return cats[cats.length - 1].name;
  }

  function highlightCategory(bf, isMale) {
    form.querySelectorAll('.bf-cat').forEach(el => {
      const cat = el.dataset.cat;
      const cats = isMale ? CATEGORIES_MALE : CATEGORIES_FEMALE;
      const def = cats.find(c => c.name.toLowerCase() === cat);
      if (!def) return;
      const active = bf >= def.min && bf <= def.max;
      el.classList.toggle('active', active);
    });
  }

  function setBfWrapColor(category) {
    if (!resultBfWrap) return;
    resultBfWrap.classList.remove('bf-cat-essential', 'bf-cat-athletic', 'bf-cat-fitness', 'bf-cat-average', 'bf-cat-obese');
    resultBfWrap.classList.add('bf-cat-' + category.toLowerCase());
  }

  function updateCompositionChart(fatMassKg, leanMassKg) {
    const ctx = document.getElementById('bf-composition-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const borderColor = isDark ? '#2A2A2A' : '#FFFFFF';

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Fat Mass', 'Lean Mass'],
        datasets: [{
          data: [fatMassKg, leanMassKg],
          backgroundColor: [
            'rgba(249, 87, 0, 0.9)',
            'rgba(37, 99, 235, 0.7)'
          ],
          borderColor: borderColor,
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const total = fatMassKg + leanMassKg;
                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                const unit = currentUnit === 'metric' ? 'kg' : 'lbs';
                const val = currentUnit === 'metric' ? ctx.raw : ctx.raw * 2.20462;
                return ctx.label + ': ' + Math.round(val) + ' ' + unit + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
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
      if (weightLabel) weightLabel.textContent = 'Weight, kg';
      if (neckLabel) neckLabel.textContent = 'Neck circumference, cm';
      if (waistLabel) waistLabel.textContent = 'Waist circumference, cm';
      if (hipLabel) hipLabel.textContent = 'Hip circumference, cm';
      if (fatMassUnit) fatMassUnit.textContent = 'kg';
      if (leanMassUnit) leanMassUnit.textContent = 'kg';
      if (prev === 'imperial') {
        const ft = parseFloat(heightFtInput.value) || 5;
        const inVal = parseFloat(heightInInput.value) || 10;
        heightCmInput.value = Math.round(inchesToCm(ft * 12 + inVal) * 10) / 10;
        const lbs = parseFloat(weightInput.value);
        if (lbs) weightInput.value = Math.round(lbsToKg(lbs) * 10) / 10;
        neckInput.value = Math.round(inchesToCm(parseFloat(neckInput.value) || 15) * 10) / 10;
        waistInput.value = Math.round(inchesToCm(parseFloat(waistInput.value) || 34) * 10) / 10;
        hipInput.value = Math.round(inchesToCm(parseFloat(hipInput.value) || 38) * 10) / 10;
      }
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialDiv.style.display = 'grid';
      heightCmInput.required = false;
      heightFtInput.required = true;
      heightInInput.required = true;
      if (weightLabel) weightLabel.textContent = 'Weight, lbs';
      if (neckLabel) neckLabel.textContent = 'Neck circumference, in';
      if (waistLabel) waistLabel.textContent = 'Waist circumference, in';
      if (hipLabel) hipLabel.textContent = 'Hip circumference, in';
      if (fatMassUnit) fatMassUnit.textContent = 'lbs';
      if (leanMassUnit) leanMassUnit.textContent = 'lbs';
      if (prev === 'metric') {
        const cm = parseFloat(heightCmInput.value) || 178;
        const totalIn = cmToInches(cm);
        heightFtInput.value = Math.floor(totalIn / 12);
        heightInInput.value = Math.round((totalIn % 12) * 2) / 2;
        const kg = parseFloat(weightInput.value);
        if (kg) weightInput.value = Math.round(kgToLbs(kg));
        neckInput.value = Math.round(cmToInches(parseFloat(neckInput.value) || 38) * 10) / 10;
        waistInput.value = Math.round(cmToInches(parseFloat(waistInput.value) || 86) * 10) / 10;
        hipInput.value = Math.round(cmToInches(parseFloat(hipInput.value) || 98) * 10) / 10;
      }
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }
    runCalculation();
  }

  function runCalculation() {
    const heightIn = getHeightInches();
    const weightKg = getWeightKg();
    const neckIn = getNeckInches();
    const waistIn = getWaistInches();
    const hipIn = getHipInches();
    const isMale = currentGender === 'male';

    let bf = null;
    if (isMale) {
      bf = navyBodyFatMale(waistIn, neckIn, heightIn);
    } else {
      bf = navyBodyFatFemale(waistIn, hipIn, neckIn, heightIn);
    }

    if (bf === null || isNaN(bf) || bf < 0 || bf > 100) {
      if (resultBf) resultBf.textContent = '—';
      if (resultBfWrap) resultBfWrap.classList.remove('bf-cat-essential', 'bf-cat-athletic', 'bf-cat-fitness', 'bf-cat-average', 'bf-cat-obese');
      if (resultCategory) { resultCategory.textContent = '—'; resultCategory.removeAttribute('data-category'); }
      if (resultFatMass) resultFatMass.textContent = '—';
      if (resultLeanMass) resultLeanMass.textContent = '—';
      form.querySelectorAll('.bf-cat').forEach(el => el.classList.remove('active'));
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    bf = Math.max(0, Math.min(100, bf));
    const category = getCategory(bf, isMale);
    const fatMassKg = weightKg * (bf / 100);
    const leanMassKg = weightKg - fatMassKg;

    if (resultBf) resultBf.textContent = Math.round(bf);
    if (resultCategory) {
      resultCategory.textContent = category;
      resultCategory.dataset.category = category.toLowerCase();
    }
    setBfWrapColor(category);
    highlightCategory(bf, isMale);
    updateCompositionChart(fatMassKg, leanMassKg);

    if (currentUnit === 'metric') {
      if (resultFatMass) resultFatMass.textContent = Math.round(fatMassKg);
      if (resultLeanMass) resultLeanMass.textContent = Math.round(leanMassKg);
    } else {
      const fatLbs = kgToLbs(fatMassKg);
      const leanLbs = kgToLbs(leanMassKg);
      if (resultFatMass) resultFatMass.textContent = Math.round(fatLbs);
      if (resultLeanMass) resultLeanMass.textContent = Math.round(leanLbs);
    }
  }

  genderBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      currentGender = btn.dataset.gender;
      genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hipInput.required = currentGender === 'female';
      runCalculation();
    });
  });

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [heightCmInput, heightFtInput, heightInInput, weightInput, neckInput, waistInput, hipInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  // Theme change – redraw chart
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTimeout(function () {
        const w = getWeightKg();
        const bf = parseFloat(resultBf.textContent);
        if (!isNaN(bf) && bf > 0) {
          const fatKg = w * (bf / 100);
          const leanKg = w - fatKg;
          updateCompositionChart(fatKg, leanKg);
        }
      }, 150);
    });
  }

  // Predefined: male, 178cm, 82kg, neck 38, waist 86
  currentGender = 'male';
  heightCmInput.value = '178';
  weightInput.value = '82';
  neckInput.value = '38';
  waistInput.value = '86';
  hipInput.value = '98';
  runCalculation();
})();
