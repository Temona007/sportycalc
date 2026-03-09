/**
 * Body Surface Area (BSA) Calculator - SportyCalc
 * Implements Du Bois, Mosteller, Haycock, Gehan & George, Boyd, Fujimoto, Takahira, Schlich.
 * W = weight (kg), H = height (cm). Results in m² and ft².
 * Reference: https://www.calculator.net/body-surface-area-calculator.html
 */

(function () {
  'use strict';

  const form = document.getElementById('bsa-form');
  if (!form) return;

  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightInput = document.getElementById('weight');
  const heightUnitEl = document.getElementById('height-unit');
  const weightUnitEl = document.getElementById('weight-unit');

  const resultBsa = document.getElementById('result-bsa');
  const resultBsaFt = document.getElementById('result-bsa-ft');
  const resultCells = {
    dubois: document.getElementById('res-dubois'),
    mosteller: document.getElementById('res-mosteller'),
    haycock: document.getElementById('res-haycock'),
    gehan: document.getElementById('res-gehan'),
    boyd: document.getElementById('res-boyd'),
    fujimoto: document.getElementById('res-fujimoto'),
    takahira: document.getElementById('res-takahira'),
    schlich: document.getElementById('res-schlich')
  };

  const M2_TO_FT2 = 10.7639;
  let currentUnit = 'metric';
  let currentGender = 'male';
  let chartInstance = null;

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
      return parseFloat(heightCmInput.value) || 178;
    }
    const ft = parseFloat(heightFtInput.value) || 5;
    const inVal = parseFloat(heightInInput.value) || 10;
    const totalInches = ft * 12 + inVal;
    return totalInches > 0 ? inchesToCm(totalInches) : 178;
  }

  function getWeightKg() {
    const val = parseFloat(weightInput.value) || 80;
    if (!val || val <= 0) return 80;
    return currentUnit === 'imperial' ? lbsToKg(val) : val;
  }

  // BSA formulas - W in kg, H in cm, result in m²
  function bsaDuBois(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    return 0.007184 * Math.pow(W, 0.425) * Math.pow(H, 0.725);
  }

  function bsaMosteller(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    return Math.sqrt(W * H) / 60;
  }

  function bsaHaycock(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    return 0.024265 * Math.pow(W, 0.5378) * Math.pow(H, 0.3964);
  }

  function bsaGehanGeorge(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    return 0.0235 * Math.pow(W, 0.51456) * Math.pow(H, 0.42246);
  }

  function bsaBoyd(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    const exp = 0.6157 - 0.0188 * Math.log10(W);
    return 0.03330 * Math.pow(W, exp) * Math.pow(H, 0.3);
  }

  function bsaFujimoto(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    return 0.008883 * Math.pow(W, 0.444) * Math.pow(H, 0.663);
  }

  function bsaTakahira(W, H) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    return 0.007241 * Math.pow(W, 0.425) * Math.pow(H, 0.725);
  }

  function bsaSchlich(W, H, isMale) {
    if (!W || !H || W <= 0 || H <= 0) return null;
    if (isMale) {
      return 0.000579479 * Math.pow(W, 0.38) * Math.pow(H, 1.24);
    }
    return 0.000975482 * Math.pow(W, 0.46) * Math.pow(H, 1.08);
  }

  function round2(val) {
    return val != null ? val.toFixed(2) : '—';
  }

  function animateValue(el, from, to, duration, decimals) {
    decimals = decimals ?? 2;
    if (!el || typeof from !== 'number' || typeof to !== 'number') return;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2); // ease-out
      const current = from + (to - from) * eased;
      el.textContent = current.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = to.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }

  function updateChart(results) {
    const ctx = document.getElementById('bsa-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const labels = ['Du Bois', 'Mosteller', 'Haycock', 'Gehan', 'Boyd', 'Fujimoto', 'Takahira', 'Schlich'];
    const data = labels.map((_, i) => {
      const key = ['dubois', 'mosteller', 'haycock', 'gehan', 'boyd', 'fujimoto', 'takahira', 'schlich'][i];
      return results[key] != null ? results[key] : 0;
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const gridColor = isDark ? '#2A2A2A' : '#E5E5E5';
    const barColors = [
      'rgba(37, 99, 235, 0.8)',   // Du Bois - primary
      'rgba(34, 197, 94, 0.7)',
      'rgba(249, 115, 22, 0.7)',
      'rgba(168, 85, 247, 0.7)',
      'rgba(236, 72, 153, 0.7)',
      'rgba(14, 165, 233, 0.7)',
      'rgba(234, 179, 8, 0.7)',
      'rgba(239, 68, 68, 0.7)'
    ];

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: barColors,
          borderColor: barColors.map(c => c.replace('0.7', '1').replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const v = ctx.raw;
                return v ? v.toFixed(2) + ' m² (' + (v * M2_TO_FT2).toFixed(1) + ' ft²)' : '—';
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: Math.ceil(Math.max(...data) * 1.2 * 10) / 10 || 2.5,
            grid: { color: gridColor },
            ticks: { color: textColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor }
          }
        }
      }
    });
  }

  function runCalculation() {
    const W = getWeightKg();
    const H = getHeightCm();
    const isMale = currentGender === 'male';

    const results = {
      dubois: bsaDuBois(W, H),
      mosteller: bsaMosteller(W, H),
      haycock: bsaHaycock(W, H),
      gehan: bsaGehanGeorge(W, H),
      boyd: bsaBoyd(W, H),
      fujimoto: bsaFujimoto(W, H),
      takahira: bsaTakahira(W, H),
      schlich: bsaSchlich(W, H, isMale)
    };

    const primary = results.dubois;
    const primaryFt = primary != null ? primary * M2_TO_FT2 : 0;

    // Animate main result
    const prevVal = parseFloat(resultBsa.textContent) || 0;
    animateValue(resultBsa, prevVal, primary || 0, 400, 2);
    if (resultBsaFt) {
      const prevFt = parseFloat(resultBsaFt.textContent) || 0;
      animateValue(resultBsaFt, prevFt, primaryFt, 400, 1);
    }

    // Update table
    Object.keys(resultCells).forEach(key => {
      const cell = resultCells[key];
      if (cell) cell.textContent = round2(results[key]);
    });

    updateChart(results);
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
        const ft = parseFloat(heightFtInput.value) || 5;
        const inVal = parseFloat(heightInInput.value) || 10;
        if (ft || inVal) {
          const totalInches = ft * 12 + inVal;
          heightCmInput.value = inchesToCm(totalInches).toFixed(1);
        }
        const lbs = parseFloat(weightInput.value) || 176;
        if (lbs) weightInput.value = lbsToKg(lbs).toFixed(1);
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

      const kg = parseFloat(weightInput.value) || 80;
      weightInput.value = Math.round(kgToLbs(kg));

      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.querySelectorAll('.bsa-gender-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      currentGender = this.dataset.gender;
      form.querySelectorAll('.bsa-gender-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      runCalculation();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [heightCmInput, heightFtInput, heightInInput, weightInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => setTimeout(runCalculation, 150));
  }

  runCalculation();
})();
