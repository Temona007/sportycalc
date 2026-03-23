/**
 * Air Force PT Calculator - SportyCalc
 * US Air Force Physical Fitness Assessment (PFA) - 2026 Standards
 *
 * SCORING MODEL (DAFMAN 36-2905, 2026):
 * - Cardiorespiratory (2-mile run): 50 points
 * - Body Composition (Waist-to-Height Ratio): 20 points
 * - Strength (push-ups): 15 points
 * - Core Endurance (sit-ups): 15 points
 * - Total: 100 points
 * - Pass: ≥75 composite AND meet minimum in each component
 *
 * CALCULATION LOGIC:
 *
 * 1. RUN (50 pts): Linear interpolation between best time (50 pts) and worst time (0 pts).
 *    Formula: points = 50 * (worstTimeSec - actualSec) / (worstTimeSec - bestTimeSec)
 *    Clamped 0-50. Faster = more points.
 *
 * 2. WAIST-TO-HEIGHT RATIO (20 pts) - PFRA 2026:
 *    WHtR = waist_inches / height_inches
 *    - ≤0.49: 20 pts (Low Risk)
 *    - 0.50–0.54: 19–15 pts (Moderate Risk, linear)
 *    - 0.55–0.59: 12.5–2.5 pts (High Risk, linear)
 *    - ≥0.60: 0 pts (component fail)
 *
 * 3. PUSH-UPS (15 pts): Linear between min reps (0 pts) and max reps (15 pts).
 *    Formula: points = 15 * (reps - minReps) / (maxReps - minReps), clamped 0-15.
 *
 * 4. SIT-UPS (15 pts): Same as push-ups.
 *
 * Standards are ESTIMATES based on 2026 AF PFA structure. Verify with official
 * DAFMAN 36-2905 / AFPC charts. Reference: afpc.af.mil, usaafptcalculator.com
 */

(function () {
  'use strict';

  const form = document.getElementById('afpt-form');
  if (!form) return;

  const genderBtns = form.querySelectorAll('.afpt-gender-btn');
  const ageSelect = document.getElementById('afpt-age');
  const runMin = document.getElementById('afpt-run-min');
  const runSec = document.getElementById('afpt-run-sec');
  const pushupsInput = document.getElementById('afpt-pushups');
  const situpsInput = document.getElementById('afpt-situps');
  const waistInput = document.getElementById('afpt-waist');
  const heightFt = document.getElementById('afpt-height-ft');
  const heightIn = document.getElementById('afpt-height-in');

  const resultScore = document.getElementById('afpt-result-score');
  const resultTotal = document.getElementById('afpt-result-total');
  const resultBadge = document.getElementById('afpt-result-badge');
  const resultRun = document.getElementById('afpt-result-run');
  const resultWhr = document.getElementById('afpt-result-whr');
  const resultPush = document.getElementById('afpt-result-push');
  const resultSit = document.getElementById('afpt-result-sit');
  const resultRunStatus = document.getElementById('afpt-result-run-status');
  const resultWhrStatus = document.getElementById('afpt-result-whr-status');
  const resultPushStatus = document.getElementById('afpt-result-push-status');
  const resultSitStatus = document.getElementById('afpt-result-sit-status');

  let currentGender = 'male';

  // Age groups: [minAge, maxAge]. Uses lower bound for lookup.
  const AGE_GROUPS = [
    [18, 24], [25, 29], [30, 34], [35, 39], [40, 44], [45, 49], [50, 54], [55, 59], [60, 65]
  ];

  // 2-mile run: [bestTimeSec (50 pts), worstTimeSec (0 pts)] by age index, [male, female]
  const RUN_STANDARDS = [
    [630, 1050], [660, 1080], [690, 1110], [720, 1140], [750, 1170], [780, 1200], [810, 1230], [840, 1260], [870, 1290], // male
    [720, 1140], [750, 1170], [780, 1200], [810, 1230], [840, 1260], [870, 1290], [900, 1320], [930, 1350], [960, 1380]  // female
  ];

  // Push-ups: [minReps (0 pts), maxReps (15 pts)] by age index, [male, female]
  const PUSH_STANDARDS = [
    [33, 67], [30, 60], [27, 54], [24, 48], [21, 42], [18, 36], [15, 30], [12, 24], [10, 20],   // male
    [18, 42], [16, 38], [14, 34], [12, 30], [10, 26], [8, 22], [6, 18], [5, 15], [4, 12]       // female
  ];

  // Sit-ups: [minReps (0 pts), maxReps (15 pts)] by age index, [male, female]
  const SIT_STANDARDS = [
    [38, 58], [35, 53], [32, 48], [29, 43], [26, 38], [23, 33], [20, 28], [17, 23], [15, 20],  // male
    [32, 52], [30, 48], [28, 44], [26, 40], [24, 36], [22, 32], [20, 28], [18, 24], [16, 22]  // female
  ];

  function getAgeIndex(age) {
    const a = Math.max(18, Math.min(65, parseInt(age, 10) || 25));
    for (let i = 0; i < AGE_GROUPS.length; i++) {
      if (a >= AGE_GROUPS[i][0] && a <= AGE_GROUPS[i][1]) return i;
    }
    return AGE_GROUPS.length - 1;
  }

  function getRunStandards(ageIdx, isMale) {
    const idx = ageIdx + (isMale ? 0 : 9);
    return RUN_STANDARDS[idx];
  }

  function getPushStandards(ageIdx, isMale) {
    const idx = ageIdx + (isMale ? 0 : 9);
    return PUSH_STANDARDS[idx];
  }

  function getSitStandards(ageIdx, isMale) {
    const idx = ageIdx + (isMale ? 0 : 9);
    return SIT_STANDARDS[idx];
  }

  /** Run points (0-50). Faster = more points. */
  function calcRunPoints(runSec, ageIdx, isMale) {
    const [best, worst] = getRunStandards(ageIdx, isMale);
    if (runSec <= best) return 50;
    if (runSec >= worst) return 0;
    return 50 * (worst - runSec) / (worst - best);
  }

  /** WHtR points (0-20). PFRA 2026 scale: ≤0.49=20, 0.50-0.54=19-15, 0.55-0.59=12.5-2.5, ≥0.60=0. */
  function calcWhrPoints(whtr) {
    if (whtr <= 0.49) return 20;
    if (whtr <= 0.54) return 19 - (whtr - 0.50) * (4 / 0.04); // 19 at 0.50, 15 at 0.54
    if (whtr <= 0.59) return 12.5 - (whtr - 0.55) * (10 / 0.04); // 12.5 at 0.55, 2.5 at 0.59
    return 0;
  }

  /** Push-up or sit-up points (0-15). More reps = more points. */
  function calcRepPoints(reps, ageIdx, isMale, type) {
    const standards = type === 'push' ? getPushStandards(ageIdx, isMale) : getSitStandards(ageIdx, isMale);
    const [minR, maxR] = standards;
    if (reps >= maxR) return 15;
    if (reps <= minR) return 0;
    return 15 * (reps - minR) / (maxR - minR);
  }

  /** Check if component meets minimum (earns at least 1 point = passing that component). */
  function meetsMin(points, maxPoints) {
    const threshold = maxPoints * 0.2; // ~20% of max = minimum passing
    return points >= Math.max(1, threshold);
  }

  function updateHints(ageIdx, isMale) {
    const runSt = getRunStandards(ageIdx, isMale);
    const pushSt = getPushStandards(ageIdx, isMale);
    const sitSt = getSitStandards(ageIdx, isMale);
    const runMinBest = Math.floor(runSt[0] / 60);
    const runSecBest = runSt[0] % 60;
    const runMinWorst = Math.floor(runSt[1] / 60);
    const runSecWorst = runSt[1] % 60;
    document.getElementById('afpt-run-hint').textContent =
      `50 pts: ${runMinBest}:${String(runSecBest).padStart(2,'0')} · 0 pts: ${runMinWorst}:${String(runSecWorst).padStart(2,'0')}`;
    document.getElementById('afpt-push-hint').textContent =
      `Min ${pushSt[0]} (0 pts) · Max ${pushSt[1]} (15 pts)`;
    document.getElementById('afpt-sit-hint').textContent =
      `Min ${sitSt[0]} (0 pts) · Max ${sitSt[1]} (15 pts)`;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function renderResult(data) {
    const total = Math.round(data.runPts + data.whrPts + data.pushPts + data.sitPts);
    const runOk = meetsMin(data.runPts, 50);
    const whrOk = meetsMin(data.whrPts, 20);
    const pushOk = meetsMin(data.pushPts, 15);
    const sitOk = meetsMin(data.sitPts, 15);
    const pass = total >= 75 && runOk && whrOk && pushOk && sitOk;

    resultScore.textContent = total.toFixed(1);
    resultTotal.textContent = `${Math.round(data.runPts)} + ${Math.round(data.whrPts)} + ${Math.round(data.pushPts)} + ${Math.round(data.sitPts)}`;
    resultBadge.textContent = pass ? 'PASS' : 'FAIL';
    resultBadge.className = 'afpt-badge ' + (pass ? 'afpt-badge-pass' : 'afpt-badge-fail');
    if (total >= 90) resultBadge.classList.add('afpt-badge-excellent');

    resultRun.textContent = data.runPts.toFixed(1) + ' / 50';
    resultWhr.textContent = data.whrPts.toFixed(1) + ' / 20';
    resultPush.textContent = data.pushPts.toFixed(1) + ' / 15';
    resultSit.textContent = data.sitPts.toFixed(1) + ' / 15';

    resultRunStatus.textContent = runOk ? '✓ Meets minimum' : '✗ Below minimum';
    resultRunStatus.className = 'afpt-status ' + (runOk ? 'afpt-status-ok' : 'afpt-status-fail');
    resultWhrStatus.textContent = whrOk ? '✓ Meets minimum' : '✗ Below minimum';
    resultWhrStatus.className = 'afpt-status ' + (whrOk ? 'afpt-status-ok' : 'afpt-status-fail');
    resultPushStatus.textContent = pushOk ? '✓ Meets minimum' : '✗ Below minimum';
    resultPushStatus.className = 'afpt-status ' + (pushOk ? 'afpt-status-ok' : 'afpt-status-fail');
    resultSitStatus.textContent = sitOk ? '✓ Meets minimum' : '✗ Below minimum';
    resultSitStatus.className = 'afpt-status ' + (sitOk ? 'afpt-status-ok' : 'afpt-status-fail');
  }

  function calculate() {
    const age = parseInt(ageSelect?.value || 25, 10);
    const ageIdx = getAgeIndex(age);
    const isMale = currentGender === 'male';

    const runMinVal = parseInt(runMin?.value || 14, 10) || 0;
    const runSecVal = parseInt(runSec?.value || 0, 10) || 0;
    const runTotalSec = runMinVal * 60 + runSecVal;

    const pushups = parseInt(pushupsInput?.value || 0, 10) || 0;
    const situps = parseInt(situpsInput?.value || 0, 10) || 0;

    const waistIn = parseFloat(waistInput?.value || 32, 10) || 0;
    const heightFtVal = parseInt(heightFt?.value || 5, 10) || 0;
    const heightInVal = parseInt(heightIn?.value || 10, 10) || 0;
    const heightTotalIn = heightFtVal * 12 + heightInVal;
    const whtr = heightTotalIn > 0 ? waistIn / heightTotalIn : 0;

    const runPts = calcRunPoints(runTotalSec, ageIdx, isMale);
    const whrPts = calcWhrPoints(whtr);
    const pushPts = calcRepPoints(pushups, ageIdx, isMale, 'push');
    const sitPts = calcRepPoints(situps, ageIdx, isMale, 'sit');

    renderResult({
      runPts,
      whrPts,
      pushPts,
      sitPts,
      whtr
    });
  }

  genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGender = btn.dataset.gender || 'male';
      const age = parseInt(ageSelect?.value || 25, 10);
      updateHints(getAgeIndex(age), currentGender === 'male');
      calculate();
    });
  });

  ageSelect?.addEventListener('change', () => {
    const age = parseInt(ageSelect.value, 10);
    updateHints(getAgeIndex(age), currentGender === 'male');
    calculate();
  });

  [runMin, runSec, pushupsInput, situpsInput, waistInput, heightFt, heightIn].forEach(el => {
    el?.addEventListener('input', calculate);
    el?.addEventListener('change', calculate);
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  // Init
  const age = parseInt(ageSelect?.value || 25, 10);
  updateHints(getAgeIndex(age), currentGender === 'male');
  calculate();
})();
