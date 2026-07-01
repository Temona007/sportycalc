/**
 * Marathon Calculator - SportyCalc
 * Predicts race times for shorter distances from a marathon goal time
 * using the Pete Riegel formula: T2 = T1 × (D2/D1)^1.06
 */

(function () {
  'use strict';

  const form = document.getElementById('marathon-form');
  if (!form) return;

  const hoursInput = document.getElementById('goal-hours');
  const minutesInput = document.getElementById('goal-minutes');
  const secondsInput = document.getElementById('goal-seconds');
  const resultsBody = document.getElementById('marathon-results-body');
  const sidebarTime = document.getElementById('sidebar-goal-time');
  const sidebarPaceKm = document.getElementById('sidebar-pace-km');
  const sidebarPaceMi = document.getElementById('sidebar-pace-mi');

  const MARATHON_KM = 42.195;
  const KM_PER_MILE = 1.609344;
  const RIEGEL_EXPONENT = 1.06;

  const DISTANCES = [
    { label: '1 500 m', km: 1.5 },
    { label: '1 mi', km: KM_PER_MILE },
    { label: '3 mi', km: 3 * KM_PER_MILE },
    { label: '5 km', km: 5 },
    { label: '5 mi', km: 5 * KM_PER_MILE },
    { label: '10 km', km: 10 },
    { label: '15 km', km: 15 },
    { label: '10 mi', km: 10 * KM_PER_MILE },
    { label: '½ marathon', km: 21.0975 },
    { label: 'marathon', km: MARATHON_KM }
  ];

  function getGoalSeconds() {
    const h = parseInt(hoursInput.value, 10) || 0;
    const m = parseInt(minutesInput.value, 10) || 0;
    const s = parseInt(secondsInput.value, 10) || 0;
    return h * 3600 + m * 60 + s;
  }

  function formatRaceTime(totalSeconds) {
    const sec = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function formatPace(totalSeconds, distanceKm) {
    if (!distanceKm || totalSeconds <= 0) return '0:00';
    const minPerKm = (totalSeconds / 60) / distanceKm;
    const min = Math.floor(minPerKm);
    let sec = Math.round((minPerKm - min) * 60);
    if (sec === 60) {
      return (min + 1) + ':00';
    }
    return min + ':' + String(sec).padStart(2, '0');
  }

  function predictTime(goalSeconds, distanceKm) {
    if (goalSeconds <= 0) return 0;
    return goalSeconds * Math.pow(distanceKm / MARATHON_KM, RIEGEL_EXPONENT);
  }

  function runCalculation() {
    const goalSeconds = getGoalSeconds();

    if (sidebarTime) sidebarTime.textContent = formatRaceTime(goalSeconds);
    if (sidebarPaceKm) sidebarPaceKm.textContent = formatPace(goalSeconds, MARATHON_KM);
    if (sidebarPaceMi) sidebarPaceMi.textContent = formatPace(goalSeconds, MARATHON_KM / KM_PER_MILE);

    if (!resultsBody) return;

    if (goalSeconds <= 0) {
      resultsBody.innerHTML = '<tr><td colspan="4" class="text-muted">Enter a marathon goal time.</td></tr>';
      return;
    }

    let html = '';
    DISTANCES.forEach(function (d) {
      const predictedSeconds = predictTime(goalSeconds, d.km);
      html += '<tr>';
      html += '<th scope="row">' + d.label + '</th>';
      html += '<td>' + formatRaceTime(predictedSeconds) + '</td>';
      html += '<td>' + formatPace(predictedSeconds, d.km) + '</td>';
      html += '<td>' + formatPace(predictedSeconds, d.km / KM_PER_MILE) + '</td>';
      html += '</tr>';
    });
    resultsBody.innerHTML = html;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [hoursInput, minutesInput, secondsInput].forEach(function (el) {
    if (el) el.addEventListener('input', runCalculation);
  });

  runCalculation();
})();
