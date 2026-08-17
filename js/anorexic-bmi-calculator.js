/**
 * Anorexic BMI / low-BMI risk assessment calculator – SportyCalc
 * Educational screening only — not a diagnosis.
 */
(function () {
  'use strict';

  const form = document.getElementById('anorexic-bmi-form');
  if (!form) return;

  const weightInput = document.getElementById('weight');
  const heightCmInput = document.getElementById('height-cm');
  const heightFtInput = document.getElementById('height-ft');
  const heightInInput = document.getElementById('height-in');
  const heightMetricDiv = document.getElementById('height-metric');
  const heightImperialDiv = document.getElementById('height-imperial');
  const weightUnitEl = document.getElementById('weight-unit');
  const ageInput = document.getElementById('age');
  const sexSelect = document.getElementById('sex');
  const activitySelect = document.getElementById('activity');
  const amenorrheaWrap = document.getElementById('amenorrhea-wrap');

  const resultBmi = document.getElementById('result-bmi');
  const resultBmiClass = document.getElementById('result-bmi-class');
  const resultRisk = document.getElementById('result-risk');
  const resultRiskDesc = document.getElementById('result-risk-desc');
  const resultHealthyMin = document.getElementById('result-healthy-min');
  const resultHealthyMax = document.getElementById('result-healthy-max');
  const resultSymptomCount = document.getElementById('result-symptom-count');
  const resultHistoryCount = document.getElementById('result-history-count');
  const resultAdvice = document.getElementById('result-advice');
  const resultCrisis = document.getElementById('result-crisis');
  const resultsCard = document.getElementById('anorexic-results');
  const bmiMarker = document.getElementById('bmi-marker');
  const resetBtn = document.getElementById('anorexic-reset');

  let currentUnit = 'metric';

  const CORE_SYMPTOMS = new Set([
    'extreme-weight-loss',
    'fear-gaining',
    'distorted-image',
    'amenorrhea',
    'obsessive-calories',
    'exercise-addiction'
  ]);

  function lbsToKg(lbs) {
    return lbs / 2.20462;
  }

  function kgToLbs(kg) {
    return kg * 2.20462;
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

  function getBmiClass(bmi) {
    if (bmi < 15) {
      return {
        key: 'life-threatening',
        label: 'Life-threatening underweight',
        detail: 'BMI below 15 — immediate professional intervention is typically required.',
        tier: 4
      };
    }
    if (bmi < 16) {
      return {
        key: 'severe',
        label: 'Severe underweight',
        detail: 'BMI 15.0–15.9 — hospitalization is often needed; seek urgent medical care.',
        tier: 3
      };
    }
    if (bmi < 17.5) {
      return {
        key: 'moderate',
        label: 'Moderate underweight',
        detail: 'BMI 16.0–17.4 — intensive eating-disorder treatment and close monitoring are usually indicated.',
        tier: 2
      };
    }
    if (bmi < 18.5) {
      return {
        key: 'mild',
        label: 'Mild underweight',
        detail: 'BMI 17.5–18.4 — professional evaluation is recommended to prevent progression.',
        tier: 1
      };
    }
    return {
      key: 'not-underweight',
      label: 'Not in underweight BMI range',
      detail: 'BMI is 18.5 or higher. Eating-disorder risk can still exist (including atypical presentations) based on symptoms.',
      tier: 0
    };
  }

  function getChecked(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (el) {
      return el.value;
    });
  }

  function scoreRisk(bmiClass, symptoms, history, activity) {
    var score = bmiClass.tier * 25;
    var coreCount = 0;
    symptoms.forEach(function (s) {
      if (CORE_SYMPTOMS.has(s)) {
        score += 8;
        coreCount += 1;
      } else {
        score += 4;
      }
    });
    history.forEach(function () {
      score += 5;
    });
    if (activity === 'very' || activity === 'extra') {
      score += 4;
    }
    // Atypical elevation: normal/high BMI but several core symptoms
    if (bmiClass.tier === 0 && coreCount >= 3) {
      score = Math.max(score, 45);
    }

    if (score >= 85 || bmiClass.tier >= 4) {
      return {
        key: 'critical',
        label: 'Critical',
        points: Math.min(100, score),
        desc: 'BMI and/or symptom pattern suggest urgent medical and mental-health evaluation.'
      };
    }
    if (score >= 55 || bmiClass.tier >= 3) {
      return {
        key: 'high',
        label: 'High',
        points: Math.min(100, score),
        desc: 'Elevated risk markers. Contact a physician or eating-disorder specialist promptly.'
      };
    }
    if (score >= 30 || bmiClass.tier >= 1) {
      return {
        key: 'elevated',
        label: 'Elevated',
        points: Math.min(100, score),
        desc: 'Some risk factors are present. A professional screening is recommended.'
      };
    }
    return {
      key: 'low',
      label: 'Low (screening)',
      points: Math.min(100, score),
      desc: 'Few screening markers based on the inputs provided. This is not a medical clearance.'
    };
  }

  function adviceHtml(bmiClass, risk, symptoms) {
    var parts = [];
    parts.push('<p>' + bmiClass.detail + '</p>');
    parts.push('<p><strong>Overall screening risk:</strong> ' + risk.label + ' — ' + risk.desc + '</p>');
    if (symptoms.indexOf('amenorrhea') !== -1) {
      parts.push('<p>Missed periods with low weight can signal hormonal disruption — discuss with a clinician.</p>');
    }
    if (risk.key === 'critical' || risk.key === 'high') {
      parts.push('<p>If you or someone you know may have an eating disorder, seek specialized care. This tool cannot diagnose or replace professional evaluation.</p>');
    } else {
      parts.push('<p>Use related SportyCalc tools for general fitness context only — not as eating-disorder treatment guidance.</p>');
    }
    return parts.join('');
  }

  function updateScaleMarker(bmi) {
    if (!bmiMarker) return;
    var minBmi = 12;
    var maxBmi = 30;
    var clamped = Math.max(minBmi, Math.min(maxBmi, bmi));
    var pct = ((clamped - minBmi) / (maxBmi - minBmi)) * 100;
    bmiMarker.style.left = pct + '%';
  }

  function updateAmenorrheaVisibility() {
    if (!amenorrheaWrap) return;
    var female = sexSelect.value === 'female';
    amenorrheaWrap.hidden = !female;
    if (!female) {
      var box = amenorrheaWrap.querySelector('input[type="checkbox"]');
      if (box) box.checked = false;
    }
  }

  function setUnit(unit) {
    currentUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-unit') === unit);
    });
    if (unit === 'metric') {
      heightMetricDiv.style.display = '';
      heightImperialDiv.style.display = 'none';
      weightUnitEl.textContent = 'kg';
      if (weightInput.value) {
        var lbs = parseFloat(weightInput.value);
        if (lbs > 0 && weightInput.dataset.lastUnit === 'imperial') {
          weightInput.value = (lbsToKg(lbs)).toFixed(1);
        }
      }
      weightInput.dataset.lastUnit = 'metric';
    } else {
      heightMetricDiv.style.display = 'none';
      heightImperialDiv.style.display = '';
      weightUnitEl.textContent = 'lbs';
      if (weightInput.value) {
        var kg = parseFloat(weightInput.value);
        if (kg > 0 && weightInput.dataset.lastUnit !== 'imperial') {
          weightInput.value = (kgToLbs(kg)).toFixed(1);
        }
      }
      weightInput.dataset.lastUnit = 'imperial';
      if (!heightFtInput.value && heightCmInput.value) {
        var totalIn = parseFloat(heightCmInput.value) / 2.54;
        heightFtInput.value = Math.floor(totalIn / 12);
        heightInInput.value = Math.round((totalIn % 12) * 2) / 2;
      }
    }
  }

  function calculate() {
    var heightM = getHeightM();
    var weightKg = getWeightKg();
    if (!heightM || !weightKg) return;

    var bmi = weightKg / (heightM * heightM);
    var bmiClass = getBmiClass(bmi);
    var symptoms = getChecked('symptom');
    var history = getChecked('history');
    var activity = activitySelect.value;
    var risk = scoreRisk(bmiClass, symptoms, history, activity);

    var minKg = 18.5 * heightM * heightM;
    var maxKg = 24.9 * heightM * heightM;
    var showImperial = currentUnit === 'imperial';

    resultBmi.textContent = bmi.toFixed(1);
    resultBmiClass.textContent = bmiClass.label;
    resultBmiClass.dataset.tier = bmiClass.key;
    resultRisk.textContent = risk.label;
    resultRisk.dataset.tier = risk.key;
    resultRiskDesc.textContent = risk.desc;
    resultHealthyMin.textContent = showImperial
      ? kgToLbs(minKg).toFixed(1) + ' lbs'
      : minKg.toFixed(1) + ' kg';
    resultHealthyMax.textContent = showImperial
      ? kgToLbs(maxKg).toFixed(1) + ' lbs'
      : maxKg.toFixed(1) + ' kg';
    resultSymptomCount.textContent = String(symptoms.length);
    resultHistoryCount.textContent = String(history.length);
    resultAdvice.innerHTML = adviceHtml(bmiClass, risk, symptoms);
    resultCrisis.hidden = !(risk.key === 'critical' || risk.key === 'high' || bmiClass.tier >= 3);
    updateScaleMarker(bmi);

    if (resultsCard) {
      resultsCard.classList.add('anorexic-results-ready');
    }
  }

  function resetForm() {
    form.reset();
    sexSelect.value = 'female';
    activitySelect.value = 'light';
    setUnit('metric');
    weightInput.value = '50';
    heightCmInput.value = '165';
    ageInput.value = '25';
    weightInput.dataset.lastUnit = 'metric';
    updateAmenorrheaVisibility();
    resultBmi.textContent = '—';
    resultBmiClass.textContent = 'Enter details to assess';
    resultBmiClass.dataset.tier = '';
    resultRisk.textContent = '—';
    resultRisk.dataset.tier = '';
    resultRiskDesc.textContent = '';
    resultHealthyMin.textContent = '—';
    resultHealthyMax.textContent = '—';
    resultSymptomCount.textContent = '0';
    resultHistoryCount.textContent = '0';
    resultAdvice.innerHTML = '<p>Results will appear here after you calculate.</p>';
    resultCrisis.hidden = true;
    if (bmiMarker) bmiMarker.style.left = '20%';
    if (resultsCard) resultsCard.classList.remove('anorexic-results-ready');
  }

  document.querySelectorAll('.unit-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setUnit(btn.getAttribute('data-unit'));
      calculate();
    });
  });

  sexSelect.addEventListener('change', function () {
    updateAmenorrheaVisibility();
    calculate();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });

  form.addEventListener('change', function () {
    if (getHeightM() && getWeightKg()) calculate();
  });

  form.addEventListener('input', function () {
    if (getHeightM() && getWeightKg()) calculate();
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetForm();
    });
  }

  weightInput.dataset.lastUnit = 'metric';
  updateAmenorrheaVisibility();
  calculate();
})();
