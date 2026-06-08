/**
 * Push Up Test Calculator - SportyCalc
 * Norms & scoring: Nieman (1999) adult + Canadian CSTF adolescent (ExRx.net methodology)
 * Score = estimated population percentile (0–100)
 */

(function () {
  'use strict';

  const form = document.getElementById('pushup-form');
  if (!form) return;

  const ageInput = document.getElementById('pushup-age');
  const repsInput = document.getElementById('pushup-reps');
  const genderBtns = form.querySelectorAll('.pushup-gender-btn');
  const avgEl = document.getElementById('pushup-avg');
  const scoreEl = document.getElementById('pushup-score');
  const ratingEl = document.getElementById('pushup-rating');
  const repsDisplay = document.getElementById('pushup-reps-display');
  const percentileFill = document.getElementById('pushup-percentile-fill');
  const percentileMarker = document.getElementById('pushup-percentile-marker');
  const avgMarker = document.getElementById('pushup-avg-marker');
  const ratingHint = document.getElementById('pushup-rating-hint');

  let gender = 'male';

  function populationAverage(isMale, age) {
    if (isMale) {
      return Math.round(
        -69.12079872 +
        10.96689892 * age -
        0.40037146 * Math.pow(age, 2) +
        0.00576340 * Math.pow(age, 3) -
        0.00002911 * Math.pow(age, 4)
      );
    }
    return Math.round(
      -0.00003969 * Math.pow(age, 4) +
      0.00710960 * Math.pow(age, 3) -
      0.45191034 * Math.pow(age, 2) +
      11.56628022 * age -
      75.77740372
    );
  }

  function standardDeviation(isMale, age, reps, avg) {
    if (isMale) {
      if (reps <= avg) {
        return (-33980791 + 3096739.1 * age) / (1 + 40384.763 * age + 3713.2581 * Math.pow(age, 2));
      }
      return (
        -56.09510371 +
        8.70427042 * age -
        0.34822960 * Math.pow(age, 2) +
        0.00562839 * Math.pow(age, 3) -
        0.00003203 * Math.pow(age, 4)
      );
    }
    if (reps <= avg) {
      return 1.0794478 * Math.pow(0.96572202, age) * Math.pow(age, 1.015305);
    }
    return (5.5414783 + 0.47843206 * age) / (1 - 0.010122299 * age + 0.0009372169 * Math.pow(age, 2));
  }

  function percentileFromZ(z) {
    const pe = Math.exp(-1.8355027 * (Math.abs(z) - 0.23073201));
    const percRegress = -0.41682992 * ((pe - 1) / (pe + 1)) + 0.58953708;
    return Math.round((z > 0 ? percRegress : 1 - percRegress) * 100);
  }

  function ratingFromZ(z) {
    if (z >= 1) return 'Excellent';
    if (z >= 0.5) return 'Good';
    if (z >= -0.5) return 'Average';
    if (z >= -1) return 'Fair';
    return 'Poor';
  }

  function ratingHintText(rating, score, avg, reps) {
    const diff = reps - avg;
    if (diff === 0) return 'Right at the population median for your age and sex.';
    if (diff > 0) return `${diff} rep${diff === 1 ? '' : 's'} above the population average (${avg}).`;
    return `${Math.abs(diff)} rep${Math.abs(diff) === 1 ? '' : 's'} below the population average (${avg}).`;
  }

  /** @returns {{ avg: number, score: number, rating: string, z: number } | null} */
  function calculatePushUpTest(isMale, age, reps) {
    if (!Number.isFinite(age) || age < 15 || age > 69) return null;
    if (!Number.isFinite(reps) || reps < 0) return null;

    const avg = populationAverage(isMale, age);
    const sd = standardDeviation(isMale, age, reps, avg);
    if (!sd || sd <= 0) return null;

    const z = (reps - avg) / sd;
    const score = Math.min(100, Math.max(0, percentileFromZ(z)));
    const rating = ratingFromZ(z);

    return { avg, score, rating, z };
  }

  function updateUI() {
    const age = parseInt(ageInput.value, 10);
    const reps = parseInt(repsInput.value, 10);
    const isMale = gender === 'male';
    const result = calculatePushUpTest(isMale, age, reps);

    if (!result) {
      avgEl.textContent = '—';
      scoreEl.textContent = '—';
      ratingEl.textContent = '—';
      ratingEl.className = 'pushup-rating-badge';
      repsDisplay.textContent = '—';
      ratingHint.textContent = 'Enter age (15–69) and repetitions.';
      percentileFill.style.width = '0%';
      percentileMarker.style.left = '0%';
      avgMarker.style.left = '50%';
      return;
    }

    const { avg, score, rating } = result;

    avgEl.textContent = avg;
    scoreEl.textContent = score;
    repsDisplay.textContent = reps;
    ratingEl.textContent = rating;
    ratingEl.className = 'pushup-rating-badge pushup-cat-' + rating.toLowerCase();
    ratingHint.textContent = ratingHintText(rating, score, avg, reps);

    percentileFill.style.width = score + '%';
    percentileMarker.style.left = score + '%';
    avgMarker.style.left = '50%';
    avgMarker.setAttribute('aria-label', 'Population average: 50th percentile');
  }

  genderBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      genderBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      gender = btn.dataset.gender;
      updateUI();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUI();
  });

  [ageInput, repsInput].forEach((el) => {
    el.addEventListener('input', updateUI);
    el.addEventListener('change', updateUI);
  });

  updateUI();

  window.SportyCalcPushUpTest = { calculatePushUpTest, populationAverage, ratingFromZ };
})();
