/**
 * BMI Calculator - SportyCalc
 * Structure aligned with bodycalc.io; Chart.js as separate result
 * Prefilled: Male, 80 kg, 35 age, 178 cm
 */

(function () {
  'use strict';

  const form = document.getElementById('bmi-form');
  if (!form) return;

  const weightInput = document.getElementById('weight');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightUnitEl = document.getElementById('weight-unit');
  const heightUnitEl = document.getElementById('height-unit');
  const resultBmi = document.getElementById('result-bmi');
  const resultCategory = document.getElementById('result-category');
  const resultMinWeight = document.getElementById('result-min-weight');
  const resultMaxWeight = document.getElementById('result-max-weight');
  const minWeightLabel = document.getElementById('min-weight-label');
  const maxWeightLabel = document.getElementById('max-weight-label');
  const bmiMarker = document.getElementById('bmi-marker');

  let chartInstance = null;
  let currentUnit = 'metric';

  const CATEGORY_LABELS = {
    Underweight: 'Underweight',
    Normal: 'Normal Weight',
    Overweight: 'Overweight',
    Obese: 'Obese'
  };

  function getCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  function calculateBMI(weightKg, heightM) {
    return weightKg / (heightM * heightM);
  }

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

  function getWeightKg() {
    const val = parseFloat(weightInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? lbsToKg(val) : val;
  }

  function getHealthyWeightRange(heightM) {
    const minKg = 18.5 * heightM * heightM;
    const maxKg = 24.9 * heightM * heightM;
    return { minKg, maxKg };
  }

  function updateScaleMarker(bmi) {
    if (!bmiMarker) return;
    const minBmi = 15;
    const maxBmi = 40;
    const clamped = Math.max(minBmi, Math.min(maxBmi, bmi));
    const pct = ((clamped - minBmi) / (maxBmi - minBmi)) * 100;
    bmiMarker.style.left = pct + '%';
  }

  function updateChart(bmi) {
    const ctx = document.getElementById('bmi-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const categories = [
      { label: 'Underweight', min: 0, max: 18.5 },
      { label: 'Normal', min: 18.5, max: 25 },
      { label: 'Overweight', min: 25, max: 30 },
      { label: 'Obese', min: 30, max: 50 }
    ];

    const barData = categories.map(c => ({
      range: c.max - c.min,
      userInRange: bmi >= c.min && bmi < c.max
    }));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const barInactive = isDark ? 'rgba(42, 42, 42, 0.6)' : 'rgba(0, 0, 0, 0.12)';
    const barInactiveBorder = isDark ? 'rgba(42, 42, 42, 0.8)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0, 0, 0, 0.1)';
    const tickColor = isDark ? '#A1A1AA' : '#525252';

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories.map(c => c.label),
        datasets: [{
          label: 'BMI Range',
          data: barData.map(b => b.range),
          backgroundColor: barData.map(b =>
            b.userInRange ? 'rgba(249, 87, 0, 0.5)' : barInactive
          ),
          borderColor: barData.map(b =>
            b.userInRange ? '#F95700' : barInactiveBorder
          ),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const cat = categories[ctx.dataIndex];
                let s = cat.min + ' – ' + cat.max;
                if (barData[ctx.dataIndex].userInRange) {
                  s += ' (You: ' + bmi.toFixed(1) + ')';
                }
                return s;
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 50,
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

  function markCategoryCard(category) {
    const cards = document.querySelectorAll('.bmi-category-card');
    const categoryMap = {
      Underweight: 'underweight',
      Normal: 'normal',
      Overweight: 'overweight',
      Obese: 'obese'
    };
    const dataVal = categoryMap[category] || '';
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.category === dataVal);
    });
  }

  function updateResults(bmi, weightKg, heightM) {
    if (!resultBmi || !resultCategory) return;

    const category = getCategory(bmi);
    const categoryLabel = CATEGORY_LABELS[category] || category;

    resultBmi.textContent = bmi.toFixed(1);
    resultCategory.textContent = categoryLabel;

    markCategoryCard(category);

    const { minKg, maxKg } = getHealthyWeightRange(heightM);

    if (resultMinWeight && resultMaxWeight && minWeightLabel && maxWeightLabel) {
      if (currentUnit === 'metric') {
        resultMinWeight.textContent = Math.round(minKg);
        resultMaxWeight.textContent = Math.round(maxKg);
        minWeightLabel.textContent = 'Min Healthy Weight (kg)';
        maxWeightLabel.textContent = 'Max Healthy Weight (kg)';
      } else {
        resultMinWeight.textContent = Math.round(kgToLbs(minKg));
        resultMaxWeight.textContent = Math.round(kgToLbs(maxKg));
        minWeightLabel.textContent = 'Min Healthy Weight (lbs)';
        maxWeightLabel.textContent = 'Max Healthy Weight (lbs)';
      }
    }

    updateScaleMarker(bmi);
    updateChart(bmi);
  }

  function runCalculation() {
    const heightM = getHeightM();
    const weightKg = getWeightKg();

    if (!weightKg || !heightM || heightM <= 0) return;

    const bmi = calculateBMI(weightKg, heightM);
    updateResults(bmi, weightKg, heightM);
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
      weightUnitEl.textContent = 'kg';
      heightUnitEl.textContent = 'cm';
      weightInput.placeholder = '80';
      heightCmInput.placeholder = '178';
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
      weightUnitEl.textContent = 'lbs';
      const cm = parseFloat(heightCmInput.value) || 178;
      const totalInches = cmToInches(cm);
      const { ft, in: inVal } = inchesToFtIn(totalInches);
      heightFtInput.value = ft;
      heightInInput.value = inVal;
      heightFtInput.placeholder = '5';
      heightInInput.placeholder = '10';
      const kg = parseFloat(weightInput.value) || 80;
      weightInput.value = Math.round(kgToLbs(kg));
      weightInput.placeholder = '176';
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', handleSubmit);

  // Recalculate on input change (like bodycalc – instant feedback)
  [weightInput, heightCmInput, heightFtInput, heightInInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });
  if (heightFtInput) heightFtInput.addEventListener('change', runCalculation);
  if (heightInInput) heightInInput.addEventListener('change', runCalculation);

  // Theme change – redraw chart
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(() => {
        const heightM = getHeightM();
        const weightKg = getWeightKg();
        if (weightKg && heightM > 0) {
          const bmi = calculateBMI(weightKg, heightM);
          updateChart(bmi);
        }
      }, 100);
    });
  }

  // Listen for theme changes (from theme.js)
  const observer = new MutationObserver(() => {
    const heightM = getHeightM();
    const weightKg = getWeightKg();
    if (weightKg && heightM > 0) {
      const bmi = calculateBMI(weightKg, heightM);
      updateChart(bmi);
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // Init with prefilled: Male, 80 kg, 35 age, 178 cm
  document.getElementById('sex').value = 'male';
  document.getElementById('age').value = '35';
  heightCmInput.value = '178';
  weightInput.value = '80';
  const heightM = 178 / 100;
  const weightKg = 80;
  const bmi = calculateBMI(weightKg, heightM);
  updateResults(bmi, weightKg, heightM);
})();
