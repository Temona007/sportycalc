/**
 * Power-to-Weight Ratio Calculator - SportyCalc
 * PWR = power / weight. Supports W/kg (cycling) and hp/lb (vehicles).
 * Chart.js: Compare user's result to cycling/vehicle reference values.
 */

(function () {
  'use strict';

  const form = document.getElementById('pwr-form');
  if (!form) return;

  const powerInput = document.getElementById('power');
  const weightInput = document.getElementById('weight');
  const powerUnitEl = document.getElementById('power-unit');
  const weightUnitEl = document.getElementById('weight-unit');
  const powerHint = document.getElementById('power-hint');
  const resultPwr = document.getElementById('result-pwr');
  const resultPwrUnit = document.getElementById('result-pwr-unit');
  const resultPwrLabel = document.getElementById('result-pwr-label');
  const pwrAltValues = document.getElementById('pwr-alt-values');

  let chartInstance = null;
  let currentUnit = 'metric';

  // Conversion constants
  const HP_TO_W = 745.7;
  const LB_TO_KG = 0.453592;

  // Reference values for chart (W/kg) - cycling categories + vehicles for scale
  const REFERENCE_VALUES = [
    { label: 'Beginner cyclist', value: 1.5, unit: 'W/kg' },
    { label: 'Recreational', value: 2.5, unit: 'W/kg' },
    { label: 'Cat 4/5', value: 3.2, unit: 'W/kg' },
    { label: 'Cat 3', value: 4.0, unit: 'W/kg' },
    { label: 'Cat 1/2', value: 5.0, unit: 'W/kg' },
    { label: 'Pro cyclist', value: 6.0, unit: 'W/kg' },
    { label: 'World-class', value: 6.8, unit: 'W/kg' }
  ];

  function wattsToHp(w) {
    return w / HP_TO_W;
  }

  function hpToWatts(hp) {
    return hp * HP_TO_W;
  }

  function kgToLb(kg) {
    return kg / LB_TO_KG;
  }

  function lbToKg(lb) {
    return lb * LB_TO_KG;
  }

  function getPowerWatts() {
    const val = parseFloat(powerInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? hpToWatts(val) : val;
  }

  function getWeightKg() {
    const val = parseFloat(weightInput.value);
    if (!val || val <= 0) return 0;
    return currentUnit === 'imperial' ? lbToKg(val) : val;
  }

  function calculatePWR() {
    const powerW = getPowerWatts();
    const weightKg = getWeightKg();
    if (!powerW || !weightKg) return null;
    return powerW / weightKg; // W/kg
  }

  function wPerKgToHpPerLb(wPerKg) {
    // W/kg -> (W * hp/W) / (kg * lb/kg) = hp/lb
    const wattsPerLb = wPerKg / LB_TO_KG; // W per lb
    return wattsPerLb / HP_TO_W; // hp per lb
  }

  function updateChart(wPerKg) {
    const ctx = document.getElementById('pwr-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const labels = [...REFERENCE_VALUES.map(r => r.label), 'You'];
    const refValues = REFERENCE_VALUES.map(r => r.value);
    const data = [...refValues, wPerKg];
    const maxVal = Math.max(...refValues, wPerKg * 1.15, 8);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const barInactive = isDark ? 'rgba(42, 42, 42, 0.6)' : 'rgba(0, 0, 0, 0.12)';
    const barActive = 'rgba(249, 87, 0, 0.8)';
    const barActiveBorder = '#F95700';
    const gridColor = isDark ? 'rgba(42, 42, 42, 0.5)' : 'rgba(0, 0, 0, 0.1)';
    const tickColor = isDark ? '#A1A1AA' : '#525252';

    const backgroundColor = [...refValues.map(() => barInactive), barActive];
    const borderColor = [...refValues.map(() => 'transparent'), barActiveBorder];
    const borderWidth = [...refValues.map(() => 0), 2];

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'W/kg',
          data: data,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: borderWidth
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
                const val = ctx.raw;
                const isYou = ctx.dataIndex === labels.length - 1;
                let s = val.toFixed(2) + ' W/kg';
                if (isYou) s += ' (your result)';
                return s;
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: maxVal,
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

  function updateResults() {
    const wPerKg = calculatePWR();
    if (wPerKg === null) {
      resultPwr.textContent = '—';
      resultPwrUnit.textContent = '';
      resultPwrLabel.textContent = 'Power-to-weight ratio';
      if (pwrAltValues) pwrAltValues.innerHTML = '';
      return;
    }

    if (currentUnit === 'metric') {
      resultPwr.textContent = wPerKg.toFixed(2);
      resultPwrUnit.textContent = 'W/kg';
      resultPwrLabel.textContent = 'Watts per kilogram';
      if (pwrAltValues) {
        const hpPerLb = wPerKgToHpPerLb(wPerKg);
        const kWperKg = wPerKg / 1000;
        pwrAltValues.innerHTML = `
          <div class="pwr-alt-row"><span>${kWperKg.toFixed(3)} kW/kg</span></div>
          <div class="pwr-alt-row"><span>${hpPerLb.toFixed(4)} hp/lb</span></div>
        `;
      }
    } else {
      const hpPerLb = wPerKgToHpPerLb(wPerKg);
      resultPwr.textContent = hpPerLb.toFixed(4);
      resultPwrUnit.textContent = 'hp/lb';
      resultPwrLabel.textContent = 'Horsepower per pound';
      if (pwrAltValues) {
        pwrAltValues.innerHTML = `
          <div class="pwr-alt-row"><span>${wPerKg.toFixed(2)} W/kg</span></div>
          <div class="pwr-alt-row"><span>${(wPerKg / 1000).toFixed(3)} kW/kg</span></div>
        `;
      }
    }

    updateChart(wPerKg);
  }

  function setUnit(unit) {
    const wasImperial = currentUnit === 'imperial';
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      powerUnitEl.textContent = 'W';
      weightUnitEl.textContent = 'kg';
      powerInput.placeholder = '250';
      weightInput.placeholder = '70';
      if (wasImperial) {
        const powerHp = parseFloat(powerInput.value) || 0.34;
        const weightLb = parseFloat(weightInput.value) || 154;
        powerInput.value = Math.round(hpToWatts(powerHp));
        weightInput.value = (lbToKg(weightLb)).toFixed(1);
      }
      if (powerHint) powerHint.textContent = 'Cycling: use FTP or 20-min test avg';
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      powerUnitEl.textContent = 'hp';
      weightUnitEl.textContent = 'lb';
      powerInput.placeholder = '0.33';
      weightInput.placeholder = '154';
      if (!wasImperial) {
        const powerW = parseFloat(powerInput.value) || 250;
        const weightKg = parseFloat(weightInput.value) || 70;
        powerInput.value = (powerW / HP_TO_W).toFixed(2);
        weightInput.value = Math.round(kgToLb(weightKg));
      }
      if (powerHint) powerHint.textContent = 'Vehicle: peak horsepower from specs';
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    updateResults();
  }

  function handleSubmit(e) {
    e.preventDefault();
    updateResults();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', handleSubmit);

  [powerInput, weightInput].forEach(el => {
    if (el) el.addEventListener('input', updateResults);
  });

  // Theme change – redraw chart
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(() => {
        const wPerKg = calculatePWR();
        if (wPerKg !== null) updateChart(wPerKg);
      }, 100);
    });
  }

  const observer = new MutationObserver(() => {
    const wPerKg = calculatePWR();
    if (wPerKg !== null) updateChart(wPerKg);
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // Initial calculation
  updateResults();
})();
