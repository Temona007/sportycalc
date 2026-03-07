/**
 * Sleep Cycle Calculator - SportyCalc
 * Based on 90-minute sleep cycles (N1 → N2 → N3 → REM).
 * Research: 4–6 complete cycles recommended per night.
 * 4 cycles = 6h, 5 cycles = 7.5h, 6 cycles = 9h
 *
 * Mode "wake": User enters wake time → calculate bedtimes (when to fall asleep)
 * Mode "bed": User enters bedtime → calculate wake times
 */

(function () {
  'use strict';

  const CYCLE_MINUTES = 90;
  const CYCLE_HOURS = 1.5;
  const CYCLES = [4, 5, 6]; // 6h, 7.5h, 9h

  const form = document.getElementById('sleep-cycle-form');
  const wakeModeBtn = document.querySelector('.sleep-mode-btn[data-mode="wake"]');
  const bedModeBtn = document.querySelector('.sleep-mode-btn[data-mode="bed"]');
  const wakePanel = document.getElementById('wake-mode-panel');
  const bedPanel = document.getElementById('bed-mode-panel');
  const bedtimeInput = document.getElementById('bedtime-input');
  const waketimeInput = document.getElementById('waketime-input');
  const ageInput = document.getElementById('age-input');
  const placeholder = document.getElementById('sleep-result-placeholder');
  const resultsDiv = document.getElementById('sleep-results');
  const resultHeading = document.getElementById('sleep-result-heading');
  const optionsDiv = document.getElementById('sleep-options');
  const resetBtn = document.getElementById('sleep-reset-btn');
  const chartCanvas = document.getElementById('sleep-cycle-chart');

  let currentMode = 'bed';
  let chartInstance = null;
  let lastResults = [];

  /**
   * Parse "HH:mm" to minutes since midnight (0-1439)
   */
  function timeToMinutes(timeStr) {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h % 24) * 60 + (m % 60);
  }

  /**
   * Minutes since midnight to "HH:mm" (12h format for display)
   */
  function minutesToTime12(minutes) {
    const total = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Minutes since midnight to "HH:mm" (24h format)
   */
  function minutesToTime24(minutes) {
    const total = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Add hours to a time (in minutes). Handles overnight.
   */
  function addHours(minutes, hours) {
    return minutes + Math.round(hours * 60);
  }

  /**
   * Subtract hours from a time. Handles overnight.
   */
  function subtractHours(minutes, hours) {
    return minutes - Math.round(hours * 60);
  }

  /**
   * Get recommended cycle count based on age (CDC guidelines)
   * Adults 18+: 7+ hours → 5–6 cycles ideal
   * 65+: 7–8 hours → 5–6 cycles
   */
  function getRecommendedCycles(age) {
    const a = parseInt(age, 10) || 30;
    if (a >= 65) return 5;
    if (a >= 18) return 6;
    if (a >= 13) return 6;
    return 6;
  }

  function runCalculation() {
    let baseMinutes;
    let baseTimeStr;

    if (currentMode === 'wake') {
      baseMinutes = timeToMinutes(waketimeInput.value);
      baseTimeStr = minutesToTime12(baseMinutes);
    } else {
      baseMinutes = timeToMinutes(bedtimeInput.value);
      baseTimeStr = minutesToTime12(baseMinutes);
    }

    const age = parseInt(ageInput.value, 10) || 30;
    const recommended = getRecommendedCycles(age);

    const results = CYCLES.map((cycles) => {
      const hours = cycles * CYCLE_HOURS;
      let resultMinutes;

      if (currentMode === 'wake') {
        resultMinutes = subtractHours(baseMinutes, hours);
      } else {
        resultMinutes = addHours(baseMinutes, hours);
      }

      return {
        cycles,
        hours,
        time: minutesToTime12(resultMinutes),
        time24: minutesToTime24(resultMinutes),
        isRecommended: cycles === recommended,
      };
    });

    lastResults = results;
    renderResults(results, baseTimeStr);
    renderChart(results);
  }

  function renderResults(results, baseTimeStr) {
    placeholder.style.display = 'none';
    resultsDiv.style.display = 'block';

    if (currentMode === 'wake') {
      resultHeading.textContent = `To wake at ${baseTimeStr}, try to fall asleep at one of these times:`;
    } else {
      resultHeading.textContent = `If you fall asleep at ${baseTimeStr}, wake at one of these times for complete cycles:`;
    }

    optionsDiv.innerHTML = results
      .map(
        (r) => `
      <div class="sleep-option ${r.isRecommended ? 'sleep-option-recommended' : ''}" data-cycles="${r.cycles}">
        <div class="sleep-option-header">
          <span class="sleep-option-time">${r.time}</span>
          ${r.isRecommended ? '<span class="sleep-option-badge">Recommended</span>' : ''}
        </div>
        <p class="sleep-option-desc">${r.hours} hours of sleep · ${r.cycles} complete cycles</p>
      </div>
    `
      )
      .join('');

    optionsDiv.querySelectorAll('.sleep-option').forEach((el, i) => {
      el.style.animationDelay = `${i * 0.1}s`;
    });
  }

  function renderChart(results) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridColor = isDark ? 'rgba(226, 232, 240, 0.1)' : 'rgba(71, 85, 105, 0.15)';

    if (chartInstance) chartInstance.destroy();

    const labels = results.map((r) => `${r.cycles} cycles`);
    const data = results.map((r) => r.hours);
    const colors = results.map((r) =>
      r.isRecommended ? 'rgba(249, 87, 0, 0.85)' : 'rgba(99, 102, 241, 0.6)'
    );

    chartInstance = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw + ' hours sleep',
            },
          },
        },
        scales: {
          x: {
            min: 0,
            max: 10,
            ticks: {
              color: textColor,
              callback: (v) => v + 'h',
            },
            grid: { color: gridColor },
          },
          y: {
            ticks: { color: textColor },
            grid: { display: false },
          },
        },
      },
    });
  }

  function resetResults() {
    resultsDiv.style.display = 'none';
    placeholder.style.display = 'flex';
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  function setMode(mode) {
    currentMode = mode;
    wakeModeBtn.classList.toggle('active', mode === 'wake');
    bedModeBtn.classList.toggle('active', mode === 'bed');
    wakePanel.style.display = mode === 'wake' ? 'block' : 'none';
    bedPanel.style.display = mode === 'bed' ? 'block' : 'none';
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runCalculation();
    });
  }

  if (wakeModeBtn) wakeModeBtn.addEventListener('click', () => setMode('wake'));
  if (bedModeBtn) bedModeBtn.addEventListener('click', () => setMode('bed'));
  if (resetBtn) resetBtn.addEventListener('click', resetResults);

  // Re-render chart when theme changes (for correct colors)
  const observer = new MutationObserver(() => {
    if (chartInstance && lastResults.length > 0) {
      renderChart(lastResults);
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
