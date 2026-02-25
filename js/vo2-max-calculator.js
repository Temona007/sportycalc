/**
 * VO2 Max Calculator - SportyCalc
 * Methods: Resting HR (Uth-Sørensen formula), 1.5 mile run (ACSM-style)
 * Chart: Fitness level comparison (Cooper norms adapted)
 */

(function () {
  'use strict';

  const form = document.getElementById('vo2-form');
  if (!form) return;

  const methodSelect = document.getElementById('method');
  const restingInputs = document.getElementById('resting-inputs');
  const run15Inputs = document.getElementById('run15-inputs');
  const ageInput = document.getElementById('age');
  const sexSelect = document.getElementById('sex');
  const restingHrInput = document.getElementById('resting-hr');
  const timeMinInput = document.getElementById('time-min');
  const timeSecInput = document.getElementById('time-sec');
  const vo2ValueEl = document.getElementById('vo2-value');
  const vo2Subtitle = document.getElementById('vo2-subtitle');
  const vo2CategoryEl = document.getElementById('vo2-category');

  let chartInstance = null;

  // Cooper-style fitness categories (ml/kg/min): Poor, Fair, Average, Good, Excellent, Superior
  // Simplified: use age/sex-adjusted ranges. For chart we use generic ranges.
  const FITNESS_CATEGORIES = [
    { label: 'Poor', min: 0, max: 30 },
    { label: 'Fair', min: 30, max: 38 },
    { label: 'Average', min: 38, max: 46 },
    { label: 'Good', min: 46, max: 54 },
    { label: 'Excellent', min: 54, max: 62 },
    { label: 'Superior', min: 62, max: 85 }
  ];

  function getCategory(vo2) {
    // Match chart FITNESS_CATEGORIES
    if (vo2 >= 62) return 'Superior';
    if (vo2 >= 54) return 'Excellent';
    if (vo2 >= 46) return 'Good';
    if (vo2 >= 38) return 'Average';
    if (vo2 >= 30) return 'Fair';
    return 'Poor';
  }

  function vo2FromRestingHR(age, restingHR) {
    // Uth-Sørensen formula: maxHR = 208 - 0.7*age, VO2max = 15.3 * (maxHR/restingHR)
    const maxHR = 208 - 0.7 * age;
    if (restingHR <= 0) return 0;
    return 15.3 * (maxHR / restingHR);
  }

  function vo2From15MileRun(timeMinutes) {
    // ACSM-style: VO2max = 3.5 + 483 / time_in_minutes
    if (timeMinutes <= 0) return 0;
    return 3.5 + 483 / timeMinutes;
  }

  function runCalculation() {
    const method = methodSelect.value;
    const age = parseInt(ageInput.value, 10) || 30;

    let vo2 = 0;
    if (method === 'resting') {
      const restingHR = parseInt(restingHrInput.value, 10) || 60;
      vo2 = vo2FromRestingHR(age, restingHR);
      vo2Subtitle.textContent = 'Resting HR method';
    } else {
      const min = parseInt(timeMinInput.value, 10) || 12;
      const sec = parseInt(timeSecInput.value, 10) || 0;
      const timeMinutes = min + sec / 60;
      vo2 = vo2From15MileRun(timeMinutes);
      vo2Subtitle.textContent = '1.5 mile run test';
    }

    vo2 = Math.round(vo2 * 10) / 10;
    vo2ValueEl.textContent = vo2 > 0 ? vo2 : '—';
    const category = getCategory(vo2);
    vo2CategoryEl.textContent = vo2 > 0 ? category : '';
    vo2CategoryEl.className = 'vo2-category vo2-cat-' + category.toLowerCase();

    if (vo2 > 0) updateChart(vo2);
  }

  function updateChart(vo2) {
    const ctx = document.getElementById('vo2-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const barData = FITNESS_CATEGORIES.map(c => ({
      range: c.max - c.min,
      userInRange: vo2 >= c.min && vo2 < c.max
    }));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const barInactive = isDark ? 'rgba(42, 42, 42, 0.6)' : 'rgba(0, 0, 0, 0.12)';
    const barInactiveBorder = isDark ? 'rgba(42, 42, 42, 0.8)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0, 0, 0, 0.1)';
    const tickColor = isDark ? '#A1A1AA' : '#525252';

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: FITNESS_CATEGORIES.map(c => c.label),
        datasets: [{
          label: 'VO2 Range (ml/kg/min)',
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
                const cat = FITNESS_CATEGORIES[ctx.dataIndex];
                let s = cat.min + ' – ' + cat.max + ' ml/kg/min';
                if (barData[ctx.dataIndex].userInRange) {
                  s += ' (You: ' + vo2 + ')';
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

  function switchMethod() {
    const method = methodSelect.value;
    restingInputs.style.display = method === 'resting' ? '' : 'none';
    run15Inputs.style.display = method === 'run15' ? '' : 'none';
    runCalculation();
  }

  methodSelect.addEventListener('change', switchMethod);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [ageInput, sexSelect, restingHrInput, timeMinInput, timeSecInput].forEach(function (el) {
    if (el) el.addEventListener('input', runCalculation);
  });
  [ageInput, sexSelect, restingHrInput, timeMinInput, timeSecInput].forEach(function (el) {
    if (el) el.addEventListener('change', runCalculation);
  });

  // Theme change – redraw chart
  const observer = new MutationObserver(function () {
    if (chartInstance && vo2ValueEl.textContent !== '—') {
      const vo2 = parseFloat(vo2ValueEl.textContent);
      if (!isNaN(vo2)) updateChart(vo2);
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  switchMethod();
  runCalculation();
})();
