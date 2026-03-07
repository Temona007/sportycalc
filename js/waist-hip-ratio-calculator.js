/**
 * Waist to Hip Ratio (WHR) Calculator - SportyCalc
 * Formula: WHR = Waist / Hip (WHO-based thresholds)
 * Reference: https://www.omnicalculator.com/health/waist-hip-ratio
 * Verified: 75/95 = 0.789 ≈ 0.79
 */

(function () {
  'use strict';

  const form = document.getElementById('whr-form');
  if (!form) return;

  const waistInput = document.getElementById('waist');
  const hipInput = document.getElementById('hip');
  const waistUnitEl = document.getElementById('waist-unit');
  const hipUnitEl = document.getElementById('hip-unit');
  const resultWhr = document.getElementById('result-whr');
  const resultCategory = document.getElementById('result-category');
  const whrMarker = document.getElementById('whr-marker');
  const whrTickLow = document.getElementById('whr-tick-low');
  const whrTickHigh = document.getElementById('whr-tick-high');
  const whrRangeLow = document.getElementById('whr-range-low');
  const whrRangeModerate = document.getElementById('whr-range-moderate');
  const whrRangeHigh = document.getElementById('whr-range-high');

  let chartInstance = null;
  let currentUnit = 'metric';
  let currentGender = 'male';

  // WHO thresholds (Omni Calculator / WHO)
  const THRESHOLDS = {
    male: { low: 0.90, moderate: 0.95 },
    female: { low: 0.85, moderate: 0.90 }
  };

  function getCategory(whr, gender) {
    const t = THRESHOLDS[gender];
    if (whr < t.low) return 'low';
    if (whr < t.moderate) return 'moderate';
    return 'high';
  }

  function getCategoryLabel(category) {
    const labels = { low: 'Low Risk', moderate: 'Moderate Risk', high: 'High Risk' };
    return labels[category] || category;
  }

  function calculateWHR(waistCm, hipCm) {
    if (!hipCm || hipCm <= 0) return 0;
    return waistCm / hipCm;
  }

  function cmToInches(cm) {
    return cm / 2.54;
  }

  function inchesToCm(inches) {
    return inches * 2.54;
  }

  function getWaistCm() {
    const val = parseFloat(waistInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? inchesToCm(val) : val;
  }

  function getHipCm() {
    const val = parseFloat(hipInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? inchesToCm(val) : val;
  }

  function updateScaleMarker(whr) {
    if (!whrMarker) return;
    const minWhr = 0.6;
    const maxWhr = 1.2;
    const clamped = Math.max(minWhr, Math.min(maxWhr, whr));
    const pct = ((clamped - minWhr) / (maxWhr - minWhr)) * 100;
    whrMarker.style.left = pct + '%';
  }

  function updateCategoryRanges() {
    const t = THRESHOLDS[currentGender];
    if (whrRangeLow) whrRangeLow.textContent = '< ' + t.low.toFixed(2);
    if (whrRangeModerate) whrRangeModerate.textContent = t.low.toFixed(2) + ' – ' + t.moderate.toFixed(2);
    if (whrRangeHigh) whrRangeHigh.textContent = '≥ ' + t.moderate.toFixed(2);
    if (whrTickLow) whrTickLow.textContent = t.low.toFixed(2);
    if (whrTickHigh) whrTickHigh.textContent = t.moderate.toFixed(2);
  }

  function updateChart(whr) {
    const ctx = document.getElementById('whr-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const t = THRESHOLDS[currentGender];
    const categories = [
      { label: 'Low Risk', min: 0.5, max: t.low },
      { label: 'Moderate Risk', min: t.low, max: t.moderate },
      { label: 'High Risk', min: t.moderate, max: 1.2 }
    ];

    const barData = categories.map(c => ({
      range: c.max - c.min,
      userInRange: whr >= c.min && whr < c.max
    }));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const barInactive = isDark ? 'rgba(42, 42, 42, 0.6)' : 'rgba(0, 0, 0, 0.12)';
    const barInactiveBorder = isDark ? 'rgba(42, 42, 42, 0.8)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0, 0, 0, 0.1)';
    const tickColor = isDark ? '#A1A1AA' : '#525252';

    // Colors for risk levels
    const lowColor = 'rgba(34, 197, 94, 0.6)';
    const moderateColor = 'rgba(234, 179, 8, 0.6)';
    const highColor = 'rgba(239, 68, 68, 0.6)';
    const colors = [lowColor, moderateColor, highColor];

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories.map(c => c.label),
        datasets: [{
          label: 'WHR Range',
          data: barData.map(b => b.range),
          backgroundColor: barData.map((b, i) =>
            b.userInRange ? (b.userInRange ? 'rgba(249, 87, 0, 0.6)' : colors[i]) : barInactive
          ),
          borderColor: barData.map((b, i) =>
            b.userInRange ? '#F95700' : barInactiveBorder
          ),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 800
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const cat = categories[ctx.dataIndex];
                let s = cat.min.toFixed(2) + ' – ' + cat.max.toFixed(2);
                if (barData[ctx.dataIndex].userInRange) {
                  s += ' (You: ' + whr.toFixed(2) + ')';
                }
                return s;
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 0.8,
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

  function animateValue(el, from, to, duration) {
    if (!el) return;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const val = from + (to - from) * eased;
      el.textContent = val.toFixed(2);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function markCategoryCard(category) {
    const cards = document.querySelectorAll('.whr-category-card');
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.category === category);
    });
  }

  function updateResultClass(category) {
    if (!resultCategory) return;
    resultCategory.className = 'whr-category whr-category-' + category;
  }

  function updateResults(whr, waistCm, hipCm) {
    if (!resultWhr || !resultCategory) return;

    const category = getCategory(whr, currentGender);
    const categoryLabel = getCategoryLabel(category);

    const prevWhr = parseFloat(resultWhr.textContent) || 0;
    if (Math.abs(prevWhr - whr) > 0.001) {
      animateValue(resultWhr, prevWhr, whr, 500);
    } else {
      resultWhr.textContent = whr.toFixed(2);
    }

    resultCategory.textContent = categoryLabel;
    updateResultClass(category);
    markCategoryCard(category);
    updateScaleMarker(whr);
    updateChart(whr);
  }

  function runCalculation() {
    const waistCm = getWaistCm();
    const hipCm = getHipCm();

    if (!waistCm || !hipCm || hipCm <= 0) return;

    const whr = calculateWHR(waistCm, hipCm);
    updateResults(whr, waistCm, hipCm);
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
      waistUnitEl.textContent = 'cm';
      hipUnitEl.textContent = 'cm';
      waistInput.placeholder = '75';
      hipInput.placeholder = '95';
      // Current values are in inches (imperial)
      const waistIn = parseFloat(waistInput.value) || 29.5;
      const hipIn = parseFloat(hipInput.value) || 37.4;
      waistInput.value = Math.round(inchesToCm(waistIn) * 10) / 10;
      hipInput.value = Math.round(inchesToCm(hipIn) * 10) / 10;
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      waistUnitEl.textContent = 'in';
      hipUnitEl.textContent = 'in';
      waistInput.placeholder = '30';
      hipInput.placeholder = '37';
      const waistCm = parseFloat(waistInput.value) || 75;
      const hipCm = parseFloat(hipInput.value) || 95;
      waistInput.value = (Math.round(cmToInches(waistCm) * 10) / 10).toFixed(1);
      hipInput.value = (Math.round(cmToInches(hipCm) * 10) / 10).toFixed(1);
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    updateCategoryRanges();
    runCalculation();
  }

  function setGender(gender) {
    currentGender = gender;
    const btns = form.querySelectorAll('.bf-gender-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gender === gender);
    });
    updateCategoryRanges();
    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.querySelectorAll('.bf-gender-btn').forEach(btn => {
    btn.addEventListener('click', () => setGender(btn.dataset.gender));
  });

  form.addEventListener('submit', handleSubmit);

  [waistInput, hipInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  // Theme change – redraw chart
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(() => {
        const waistCm = getWaistCm();
        const hipCm = getHipCm();
        if (waistCm && hipCm > 0) {
          const whr = calculateWHR(waistCm, hipCm);
          updateChart(whr);
        }
      }, 100);
    });
  }

  const observer = new MutationObserver(() => {
    const waistCm = getWaistCm();
    const hipCm = getHipCm();
    if (waistCm && hipCm > 0) {
      const whr = calculateWHR(waistCm, hipCm);
      updateChart(whr);
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // Init: 75 cm waist, 95 cm hip = 0.79 (Omni example)
  updateCategoryRanges();
  waistInput.value = '75';
  hipInput.value = '95';
  const whr = calculateWHR(75, 95);
  updateResults(whr, 75, 95);
})();
