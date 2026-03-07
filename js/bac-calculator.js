/**
 * BAC Calculator – SportyCalc
 * Widmark-style estimate based on weight, sex, alcohol grams and time.
 * Reference behavior cross-checked against calculator.net BAC calculator.
 */
(function () {
  'use strict';

  var LB_PER_KG = 2.20462;
  var GRAMS_PER_STANDARD_DRINK = 14; // US standard drink
  var ELIMINATION_PER_HOUR = 0.015; // %BAC/hour

  // Widmark distribution ratios (approximate)
  var R_MALE = 0.68;
  var R_FEMALE = 0.55;

  function getElements() {
    var form = document.getElementById('bac-form');
    if (!form) return null;

    return {
      form: form,
      weightInput: document.getElementById('weight'),
      weightUnitLabel: document.getElementById('weight-unit'),
      sexSelect: document.getElementById('sex'),
      standardDrinksInput: document.getElementById('standard-drinks'),
      alcoholGramsInput: document.getElementById('alcohol-grams'),
      hoursSinceInput: document.getElementById('hours-since'),
      resultCard: document.getElementById('bac-result-card'),
      resultBac: document.getElementById('result-bac'),
      resultImpairmentLong: document.getElementById('result-impairment'),
      resultImpairmentShort: document.getElementById('result-impairment-short'),
      resultLegal: document.getElementById('result-legal-limit'),
      resultTimeSober: document.getElementById('result-time-sober')
    };
  }

  function getActiveWeightUnit(form) {
    var active = form.querySelector('.unit-btn.active');
    return (active && active.getAttribute('data-unit')) || 'kg';
  }

  function getWeightKg(weightInput, form) {
    var raw = parseFloat(weightInput.value);
    if (!raw || raw <= 0) return 0;
    var unit = getActiveWeightUnit(form);
    return unit === 'lb' ? raw / LB_PER_KG : raw;
  }

  function getAlcoholGrams(standardDrinksInput, alcoholGramsInput) {
    var gramsInput = parseFloat(alcoholGramsInput.value);
    if (gramsInput && gramsInput > 0) return gramsInput;
    var drinks = parseFloat(standardDrinksInput.value);
    if (!drinks || drinks <= 0) return 0;
    return drinks * GRAMS_PER_STANDARD_DRINK;
  }

  function getHoursSince(hoursSinceInput) {
    var h = parseFloat(hoursSinceInput.value);
    if (isNaN(h) || h < 0) return 0;
    return h;
  }

  function getDistributionRatio(sex) {
    return sex === 'female' ? R_FEMALE : R_MALE;
  }

  /**
   * Widmark-style BAC estimate (percent)
   * BAC% = A / (r * W * 10) - beta * t
   *  A: grams of alcohol
   *  r: distribution ratio
   *  W: body weight in kg
   *  beta: elimination per hour (0.015)
   *  t: hours since first drink
   */
  function calculateBac(weightKg, sex, gramsAlcohol, hoursSince) {
    if (!weightKg || !gramsAlcohol) return 0;
    var r = getDistributionRatio(sex);
    var peakBac = gramsAlcohol / (r * weightKg * 10); // percent
    var reduced = peakBac - ELIMINATION_PER_HOUR * hoursSince;
    return Math.max(0, reduced);
  }

  function getImpairmentCategory(bac) {
    if (bac <= 0) {
      return {
        short: 'None',
        long: 'No measurable alcohol — BAC at or near 0.00%.'
      };
    }
    if (bac < 0.03) {
      return {
        short: 'Very mild',
        long: 'Subtle or no noticeable effects for most people.'
      };
    }
    if (bac < 0.06) {
      return {
        short: 'Mild euphoria',
        long: 'Relaxation and lowered inhibitions; attention and judgment begin to decline.'
      };
    }
    if (bac < 0.10) {
      return {
        short: 'Clear impairment',
        long: 'Coordination, reaction time and judgment are notably impaired. Driving is unsafe.'
      };
    }
    if (bac < 0.20) {
      return {
        short: 'Heavy impairment',
        long: 'Marked loss of coordination, slurred speech and much higher accident risk.'
      };
    }
    if (bac < 0.30) {
      return {
        short: 'Severe impairment',
        long: 'Very high risk of injury, vomiting, blackouts and severe motor impairment.'
      };
    }
    if (bac < 0.40) {
      return {
        short: 'Dangerous',
        long: 'Stupor and possible loss of consciousness; medical emergency risk is high.'
      };
    }
    return {
      short: 'Life-threatening',
      long: 'Extremely dangerous BAC — high risk of coma, respiratory depression and death.'
    };
  }

  function formatHours(hours) {
    if (hours <= 0) return '0 h';
    if (hours < 1) {
      var mins = Math.round(hours * 60);
      return mins + ' min';
    }
    if (hours < 10) {
      return hours.toFixed(1) + ' h';
    }
    return Math.round(hours) + ' h';
  }

  function updateResults(els, bac, sex, weightKg, gramsAlcohol, hoursSince) {
    if (!els.resultBac || !els.resultCard) return;

    if (!weightKg || !gramsAlcohol) {
      els.resultBac.textContent = '0.000';
      els.resultImpairmentLong.textContent = 'Enter weight and alcohol to estimate BAC.';
      els.resultImpairmentShort.textContent = '—';
      els.resultLegal.textContent = '—';
      els.resultTimeSober.textContent = '—';
      els.resultCard.classList.remove('bac-result-reveal');
      return;
    }

    var displayBac = Math.max(0, bac);
    els.resultBac.textContent = displayBac.toFixed(3);

    var cat = getImpairmentCategory(displayBac);
    if (els.resultImpairmentLong) els.resultImpairmentLong.textContent = cat.long;
    if (els.resultImpairmentShort) els.resultImpairmentShort.textContent = cat.short;

    if (els.resultLegal) {
      if (displayBac >= 0.08) {
        els.resultLegal.textContent = 'Yes';
        els.resultLegal.classList.add('highlight');
      } else {
        els.resultLegal.textContent = 'No';
        els.resultLegal.classList.remove('highlight');
      }
    }

    if (els.resultTimeSober) {
      var hoursToZero = displayBac / ELIMINATION_PER_HOUR;
      els.resultTimeSober.textContent = formatHours(hoursToZero);
    }

    els.resultCard.classList.remove('bac-result-reveal');
    void els.resultCard.offsetWidth;
    els.resultCard.classList.add('bac-result-reveal');
  }

  function runCalculation(els) {
    var weightKg = getWeightKg(els.weightInput, els.form);
    var gramsAlcohol = getAlcoholGrams(els.standardDrinksInput, els.alcoholGramsInput);
    var hoursSince = getHoursSince(els.hoursSinceInput);
    var sex = (els.sexSelect && els.sexSelect.value) || 'male';

    var bac = calculateBac(weightKg, sex, gramsAlcohol, hoursSince);
    updateResults(els, bac, sex, weightKg, gramsAlcohol, hoursSince);
  }

  function initUnitToggle(els) {
    var form = els.form;
    if (!form || !els.weightUnitLabel || !els.weightInput) return;

    var buttons = form.querySelectorAll('.unit-btn[data-unit]');
    if (!buttons.length) return;

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var newUnit = btn.getAttribute('data-unit');
        var currentActive = form.querySelector('.unit-btn.active');
        var prevUnit = currentActive && currentActive.getAttribute('data-unit');
        if (prevUnit === newUnit) return;

        Array.prototype.forEach.call(buttons, function (b) {
          b.classList.toggle('active', b === btn);
        });

        els.weightUnitLabel.textContent = newUnit === 'lb' ? 'lb' : 'kg';

        var w = parseFloat(els.weightInput.value);
        if (!isNaN(w) && w > 0 && prevUnit && prevUnit !== newUnit) {
          if (prevUnit === 'kg' && newUnit === 'lb') {
            els.weightInput.value = Math.round(w * LB_PER_KG * 10) / 10;
          } else if (prevUnit === 'lb' && newUnit === 'kg') {
            els.weightInput.value = Math.round((w / LB_PER_KG) * 10) / 10;
          }
        }

        runCalculation(els);
      });
    });
  }

  function init() {
    var els = getElements();
    if (!els) return;

    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      runCalculation(els);
    });

    var inputs = [
      els.weightInput,
      els.sexSelect,
      els.standardDrinksInput,
      els.alcoholGramsInput,
      els.hoursSinceInput
    ];

    inputs.forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', function () { runCalculation(els); });
      el.addEventListener('change', function () { runCalculation(els); });
    });

    initUnitToggle(els);

    // Initialise with default example (80 kg, male, 3 drinks, 2 hours)
    runCalculation(els);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

