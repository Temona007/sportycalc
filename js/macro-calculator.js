/**
 * Macro Calculator - SportyCalc
 * Splits daily calories into protein, carbs, fat by percentages.
 * Calories per gram: P=4, C=4, F=9
 * Predefined: 2000 cal, Balanced (30% P / 40% C / 30% F)
 */

(function () {
  'use strict';

  const form = document.getElementById('macro-form');
  if (!form) return;

  const caloriesInput = document.getElementById('calories');
  const macroPInput = document.getElementById('macro-p');
  const macroCInput = document.getElementById('macro-c');
  const macroFInput = document.getElementById('macro-f');
  const macroPVal = document.getElementById('macro-p-val');
  const macroCVal = document.getElementById('macro-c-val');
  const macroFVal = document.getElementById('macro-f-val');
  const macroTotalEl = document.getElementById('macro-total');
  const resultCalories = document.getElementById('result-calories');
  const resultProtein = document.getElementById('result-protein');
  const resultCarbs = document.getElementById('result-carbs');
  const resultFat = document.getElementById('result-fat');
  const resultProteinCal = document.getElementById('result-protein-cal');
  const resultCarbsCal = document.getElementById('result-carbs-cal');
  const resultFatCal = document.getElementById('result-fat-cal');

  const CAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };
  let chartInstance = null;

  function getRatios() {
    let p = parseInt(macroPInput.value, 10);
    let c = parseInt(macroCInput.value, 10);
    let f = parseInt(macroFInput.value, 10);
    if (isNaN(p)) p = 30;
    if (isNaN(c)) c = 40;
    if (isNaN(f)) f = 30;
    const total = p + c + f;
    if (total !== 100 && total > 0) {
      p = Math.round((p / total) * 100);
      c = Math.round((c / total) * 100);
      f = 100 - p - c;
      if (f < 0) { f = 0; c = 100 - p - f; }
      setSliderValues(p, c, f);
    }
    return { p, c, f };
  }

  function setSliderValues(p, c, f) {
    macroPInput.value = p;
    macroCInput.value = c;
    macroFInput.value = f;
    if (macroPVal) macroPVal.textContent = p;
    if (macroCVal) macroCVal.textContent = c;
    if (macroFVal) macroFVal.textContent = f;
  }

  function updateValueDisplays() {
    if (macroPVal) macroPVal.textContent = macroPInput.value;
    if (macroCVal) macroCVal.textContent = macroCInput.value;
    if (macroFVal) macroFVal.textContent = macroFInput.value;
  }

  function updateTotal() {
    const p = parseInt(macroPInput.value, 10) || 0;
    const c = parseInt(macroCInput.value, 10) || 0;
    const f = parseInt(macroFInput.value, 10) || 0;
    if (macroTotalEl) macroTotalEl.textContent = p + c + f;
  }

  function setPreset(p, c, f) {
    setSliderValues(p, c, f);
    updateTotal();
  }

  function updateChart(pGrams, cGrams, fGrams, pCal, cCal, fCal) {
    const ctx = document.getElementById('macro-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const borderColor = isDark ? '#2A2A2A' : '#FFFFFF';

    // Chart shows calorie split (matches the % ratios user selected)
    const calData = [pCal, cCal, fCal];
    const grams = [pGrams, cGrams, fGrams];
    const labels = ['PROTEIN', 'CARBS', 'FAT'];

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: calData,
          backgroundColor: [
            'rgba(249, 87, 0, 0.85)',
            'rgba(37, 99, 235, 0.7)',
            'rgba(34, 197, 94, 0.7)'
          ],
          borderColor: borderColor,
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const idx = ctx.dataIndex;
                const pct = Math.round(calData[idx]);
                const g = grams[idx];
                return labels[idx] + ': ' + g + 'g (' + pct + ' cal)';
              }
            }
          }
        }
      }
    });
  }

  function runCalculation() {
    let calories = parseFloat(caloriesInput.value) || 2000;
    calories = Math.max(500, Math.min(10000, calories));
    const { p, c, f } = getRatios();

    const pCal = (calories * p) / 100;
    const cCal = (calories * c) / 100;
    const fCal = (calories * f) / 100;

    const pGrams = Math.round(pCal / CAL_PER_GRAM.protein);
    const cGrams = Math.round(cCal / CAL_PER_GRAM.carbs);
    const fGrams = Math.round(fCal / CAL_PER_GRAM.fat);

    if (resultCalories) resultCalories.textContent = Math.round(calories).toLocaleString();
    if (resultProtein) resultProtein.textContent = pGrams + 'g';
    if (resultCarbs) resultCarbs.textContent = cGrams + 'g';
    if (resultFat) resultFat.textContent = fGrams + 'g';
    if (resultProteinCal) resultProteinCal.textContent = Math.round(pCal) + ' cal';
    if (resultCarbsCal) resultCarbsCal.textContent = Math.round(cCal) + ' cal';
    if (resultFatCal) resultFatCal.textContent = Math.round(fCal) + ' cal';

    updateChart(pGrams, cGrams, fGrams, pCal, cCal, fCal);
  }

  document.querySelectorAll('.macro-preset-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.macro-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const p = parseInt(btn.dataset.p, 10);
      const c = parseInt(btn.dataset.c, 10);
      const f = parseInt(btn.dataset.f, 10);
      setPreset(p, c, f);
      runCalculation();
    });
  });

  [macroPInput, macroCInput, macroFInput].forEach(input => {
    input.addEventListener('input', function () {
      document.querySelectorAll('.macro-preset-btn').forEach(b => b.classList.remove('active'));
      updateValueDisplays();
      updateTotal();
      runCalculation();
    });
  });

  caloriesInput.addEventListener('input', runCalculation);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  // Rebuild chart on theme change
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTimeout(function () {
        const p = parseInt(macroPInput.value, 10) || 30;
        const c = parseInt(macroCInput.value, 10) || 40;
        const f = parseInt(macroFInput.value, 10) || 30;
        const cal = parseFloat(caloriesInput.value) || 2000;
        const pCal = cal * p / 100;
        const cCal = cal * c / 100;
        const fCal = cal * f / 100;
        const pG = Math.round(pCal / 4);
        const cG = Math.round(cCal / 4);
        const fG = Math.round(fCal / 9);
        updateChart(pG, cG, fG, pCal, cCal, fCal);
      }, 150);
    });
  }

  updateTotal();
  runCalculation();
})();
