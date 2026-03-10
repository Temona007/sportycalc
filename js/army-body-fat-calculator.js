/**
 * Army Body Fat Calculator - SportyCalc
 * U.S. Army one-site circumference-based tape method (June 2023).
 *
 * FORMULA (official Army Directive 2023-11):
 * - Male:   BF% = -26.97 - (0.12 × weight_lb) + (1.99 × abdomen_in)
 * - Female: BF% = -9.15 - (0.015 × weight_lb) + (1.27 × abdomen_in)
 *
 * Rounding: weight to nearest 1 lb; abdomen rounded down to nearest 0.5 in.
 * Reference: https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN38535-ARMY_DIR_2023-11-000-WEB-1.pdf
 * Cross-check: https://traincalc.com/calculators/army-body-fat
 */

(function () {
  'use strict';

  const form = document.getElementById('army-bf-form');
  if (!form) return;

  const genderBtns = form.querySelectorAll('.army-bf-gender-btn');
  const ageInput = document.getElementById('age');
  const weightInput = document.getElementById('weight');
  const abdomenInput = document.getElementById('abdomen');
  const weightLabel = document.getElementById('weight-label');
  const abdomenLabel = document.getElementById('abdomen-label');
  const weightUnitEl = document.getElementById('weight-unit');
  const abdomenUnitEl = document.getElementById('abdomen-unit');

  const resultBf = document.getElementById('result-bf');
  const resultWrap = document.getElementById('army-bf-result-wrap');
  const resultBadge = document.getElementById('result-badge');
  const resultStatusText = document.getElementById('result-status-text');
  const resultMaxPct = document.getElementById('result-max-pct');
  const resultBuffer = document.getElementById('result-buffer');
  const resultMaxAbdomen = document.getElementById('result-max-abdomen');
  const sensitivityBody = document.getElementById('army-sensitivity-body');

  let currentGender = 'male';
  let currentUnit = 'metric';
  let chartInstance = null;

  // Max allowable body fat by age bracket: [minAge, maxAge, male%, female%]
  const AGE_STANDARDS = [
    [17, 20, 20, 30],
    [21, 27, 22, 32],
    [28, 39, 24, 34],
    [40, 999, 26, 36]
  ];

  function kgToLbs(kg) { return kg * 2.20462; }
  function lbsToKg(lbs) { return lbs / 2.20462; }
  function cmToInches(cm) { return cm / 2.54; }
  function inchesToCm(inches) { return inches * 2.54; }

  /** Round abdomen down to nearest 0.5 inch (Army guidance) */
  function roundAbdomenDown(inches) {
    return Math.floor(inches * 2) / 2;
  }

  /** Round weight to nearest 1 lb */
  function roundWeightLbs(lbs) {
    return Math.round(lbs);
  }

  /**
   * Army body fat formula.
   * @param {number} weightLb - weight in pounds (rounded to nearest 1)
   * @param {number} abdomenIn - abdominal circumference in inches (rounded down to 0.5)
   * @param {boolean} isMale
   * @returns {number|null} body fat percentage or null if invalid
   */
  function armyBodyFat(weightLb, abdomenIn, isMale) {
    if (!weightLb || !abdomenIn || weightLb <= 0 || abdomenIn <= 0) return null;
    const w = roundWeightLbs(weightLb);
    const a = roundAbdomenDown(abdomenIn);
    if (isMale) {
      return -26.97 - (0.12 * w) + (1.99 * a);
    }
    return -9.15 - (0.015 * w) + (1.27 * a);
  }

  /** Get max allowable body fat % for age and gender */
  function getMaxBodyFat(age, isMale) {
    const a = parseInt(age, 10) || 30;
    for (const [min, max, malePct, femalePct] of AGE_STANDARDS) {
      if (a >= min && a <= max) return isMale ? malePct : femalePct;
    }
    return isMale ? 26 : 36;
  }

  /**
   * Solve for max abdomen (in) at given weight and target BF%.
   * Male:  BF = -26.97 - 0.12*W + 1.99*A  =>  A = (BF + 26.97 + 0.12*W) / 1.99
   * Female: BF = -9.15 - 0.015*W + 1.27*A  =>  A = (BF + 9.15 + 0.015*W) / 1.27
   */
  function maxAbdomenToPass(weightLb, targetBf, isMale) {
    const w = roundWeightLbs(weightLb);
    if (isMale) {
      return (targetBf + 26.97 + 0.12 * w) / 1.99;
    }
    return (targetBf + 9.15 + 0.015 * w) / 1.27;
  }

  function getWeightLb() {
    const v = parseFloat(weightInput.value) || 82;
    return currentUnit === 'imperial' ? v : kgToLbs(v);
  }

  function getAbdomenIn() {
    const v = parseFloat(abdomenInput.value) || 89;
    return currentUnit === 'imperial' ? v : cmToInches(v);
  }

  function updateChart(bfPct, maxPct, isPass) {
    const ctx = document.getElementById('army-bf-chart');
    if (!ctx || !ctx.getContext || typeof Chart === 'undefined') return;

    if (chartInstance) chartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A1A1AA' : '#525252';
    const gridColor = isDark ? '#2A2A2A' : '#E5E5E5';

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your BF%', 'Max for Age'],
        datasets: [{
          label: 'Body Fat %',
          data: [bfPct, maxPct],
          backgroundColor: [
            isPass ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            'rgba(100, 116, 139, 0.5)'
          ],
          borderColor: [
            isPass ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            'rgb(100, 116, 139)'
          ],
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.raw.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: Math.ceil(Math.max(bfPct, maxPct) * 1.3),
            grid: { color: gridColor },
            ticks: { color: textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          }
        }
      }
    });
  }

  function runCalculation() {
    const weightLb = getWeightLb();
    const abdomenIn = getAbdomenIn();
    const age = parseInt(ageInput.value, 10) || 30;
    const isMale = currentGender === 'male';

    const bfRaw = armyBodyFat(weightLb, abdomenIn, isMale);
    if (bfRaw === null || isNaN(bfRaw)) {
      resultBf.textContent = '—';
      if (resultWrap) resultWrap.classList.remove('army-bf-pass', 'army-bf-fail');
      if (resultBadge) resultBadge.textContent = '—';
      if (resultStatusText) resultStatusText.textContent = 'Enter valid measurements';
      if (resultMaxPct) resultMaxPct.textContent = '—';
      if (resultBuffer) resultBuffer.textContent = '—';
      if (resultMaxAbdomen) resultMaxAbdomen.textContent = '—';
      if (sensitivityBody) sensitivityBody.innerHTML = '<tr><td colspan="3">Calculate to see</td></tr>';
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    const bfPct = Math.max(0, Math.min(100, Math.round(bfRaw)));
    const maxPct = getMaxBodyFat(age, isMale);
    const isPass = bfPct <= maxPct;
    const buffer = maxPct - bfPct;
    const maxAbdIn = maxAbdomenToPass(weightLb, maxPct, isMale);

    // Update main result
    resultBf.textContent = bfPct;
    if (resultWrap) {
      resultWrap.classList.remove('army-bf-pass', 'army-bf-fail');
      resultWrap.classList.add(isPass ? 'army-bf-pass' : 'army-bf-fail');
    }
    if (resultBadge) {
      resultBadge.textContent = isPass ? 'PASS' : 'FAIL';
      resultBadge.classList.remove('army-bf-badge-pass', 'army-bf-badge-fail');
      resultBadge.classList.add(isPass ? 'army-bf-badge-pass' : 'army-bf-badge-fail');
    }
    if (resultStatusText) {
      resultStatusText.textContent = isPass
        ? `Within standard (max ${maxPct}% for age ${age})`
        : `Exceeds standard (max ${maxPct}% for age ${age})`;
    }

    // Details table
    if (resultMaxPct) resultMaxPct.textContent = maxPct + '%';
    if (resultBuffer) {
      resultBuffer.textContent = buffer >= 0
        ? `${buffer}% under limit`
        : `${Math.abs(buffer)}% over limit`;
    }
    if (resultMaxAbdomen) {
      const maxAbdRounded = roundAbdomenDown(maxAbdIn);
      const maxAbdCm = inchesToCm(maxAbdRounded);
      resultMaxAbdomen.textContent = currentUnit === 'imperial'
        ? `${maxAbdRounded.toFixed(1)} in`
        : `${maxAbdCm.toFixed(1)} cm`;
    }

    // Sensitivity table: -1, -0.5, 0, +0.5, +1 inch
    if (sensitivityBody) {
      const steps = [-1, -0.5, 0, 0.5, 1];
      const baseAbdIn = roundAbdomenDown(abdomenIn);
      const rows = steps.map(delta => {
        const abd = baseAbdIn + delta;
        if (abd <= 0) return null;
        const bf = armyBodyFat(weightLb, abd, isMale);
        if (bf === null || isNaN(bf)) return null;
        const bfRounded = Math.max(0, Math.min(100, Math.round(bf)));
        const pass = bfRounded <= maxPct;
        const deltaStr = delta === 0 ? 'Current' : (delta > 0 ? '+' : '') + delta + ' in';
        const abdStr = currentUnit === 'imperial'
          ? abd.toFixed(1) + ' in'
          : inchesToCm(abd).toFixed(1) + ' cm';
        return { abd: abdStr, bf: bfRounded, pass, deltaStr };
      }).filter(Boolean);

      sensitivityBody.innerHTML = rows.map(r => `
        <tr>
          <td>${r.abd}</td>
          <td>${r.bf}%</td>
          <td><span class="army-sens-badge ${r.pass ? 'army-bf-badge-pass' : 'army-bf-badge-fail'}">${r.pass ? 'PASS' : 'FAIL'}</span></td>
        </tr>
      `).join('');
    }

    updateChart(bfPct, maxPct, isPass);
  }

  function setUnit(unit) {
    const prev = currentUnit;
    currentUnit = unit;

    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      if (weightUnitEl) weightUnitEl.textContent = 'kg';
      if (abdomenUnitEl) abdomenUnitEl.textContent = 'cm';
      if (prev === 'imperial') {
        const lbs = parseFloat(weightInput.value) || 181;
        weightInput.value = (lbsToKg(lbs)).toFixed(1);
        const inVal = parseFloat(abdomenInput.value) || 35;
        abdomenInput.value = inchesToCm(inVal).toFixed(1);
      }
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      if (weightUnitEl) weightUnitEl.textContent = 'lbs';
      if (abdomenUnitEl) abdomenUnitEl.textContent = 'in';
      if (prev === 'metric') {
        const kg = parseFloat(weightInput.value) || 82;
        weightInput.value = Math.round(kgToLbs(kg));
        const cm = parseFloat(abdomenInput.value) || 89;
        abdomenInput.value = (cmToInches(cm)).toFixed(1);
      }
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  genderBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      currentGender = this.dataset.gender;
      genderBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
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

  [ageInput, weightInput, abdomenInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => setTimeout(runCalculation, 150));
  }

  // Default: male, 30, 82kg, 89cm abdomen (matches traincalc example: 21% PASS)
  runCalculation();
})();
