/**
 * Protein Intake Calculator
 * Based on bodycalc.io - weight, goal, daily protein, per meal, food sources
 */
(function() {
  'use strict';

  const LB_PER_KG = 2.20462;

  const GOALS = {
    sedentary: { gPerKg: 1.0, label: 'Sedentary', emoji: '🪑' },
    active: { gPerKg: 1.4, label: 'Active', emoji: '🏃' },
    build: { gPerKg: 1.8, label: 'Build Muscle', emoji: '💪' },
    athlete: { gPerKg: 2.0, label: 'Athlete', emoji: '🏆' }
  };

  const FOOD_SOURCES = [
    { name: 'Chicken Breast', protein: 31, unit: 'per 100g', emoji: '🍗' },
    { name: 'Eggs (2 large)', protein: 12, unit: 'per serving', emoji: '🥚' },
    { name: 'Salmon', protein: 25, unit: 'per 100g', emoji: '🐟' },
    { name: 'Greek Yogurt', protein: 10, unit: 'per 100g', emoji: '🥛' },
    { name: 'Lentils (cooked)', protein: 9, unit: 'per 100g', emoji: '🫘' },
    { name: 'Cottage Cheese', protein: 11, unit: 'per 100g', emoji: '🧀' }
  ];

  function runCalc() {
    const form = document.getElementById('protein-form');
    const weightInput = document.getElementById('weight');
    const goalInputs = document.querySelectorAll('input[name="goal"]');
    const mealsSelect = document.getElementById('meals');

    if (!form || !weightInput) return;

    const weightVal = parseFloat(weightInput.value) || 0;
    const unit = document.querySelector('.unit-btn.active')?.dataset?.unit || 'kg';
    const weight = unit === 'lb' ? weightVal / LB_PER_KG : weightVal;
    let selectedGoal = 'active';
    goalInputs.forEach(r => { if (r.checked) selectedGoal = r.value; });
    const meals = parseInt(mealsSelect?.value, 10) || 4;

    const goal = GOALS[selectedGoal] || GOALS.active;
    const dailyProtein = Math.round(weight * goal.gPerKg);
    const perMeal = meals > 0 ? Math.round(dailyProtein / meals) : dailyProtein;

    const resultProtein = document.getElementById('result-protein');
    const resultPerMeal = document.getElementById('result-per-meal');
    const resultMealsNote = document.getElementById('result-meals-note');

    if (resultProtein) resultProtein.textContent = weightVal > 0 ? dailyProtein + 'g' : '—';
    if (resultPerMeal) resultPerMeal.textContent = weightVal > 0 ? perMeal + 'g' : '—';
    if (resultMealsNote) resultMealsNote.textContent = weightVal > 0 ? `(${meals} meals)` : '';
  }

  function initGoalButtons() {
    const container = document.querySelector('.protein-goal-btns');
    if (!container) return;

    container.querySelectorAll('label').forEach(label => {
      label.addEventListener('click', () => runCalc());
    });
  }

  function initUnitToggle() {
    const form = document.getElementById('protein-form');
    const weightUnit = document.getElementById('weight-unit');
    const weightInput = document.getElementById('weight');
    if (!form || !weightUnit || !weightInput) return;

    form.querySelectorAll('.unit-btn[data-unit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toggle = btn.closest('.unit-toggle, [class*="unit-toggle"]');
        const prevUnit = toggle?.querySelector('.unit-btn.active')?.dataset?.unit;
        if (prevUnit === btn.dataset.unit) return;

        toggle?.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const newUnit = btn.dataset.unit;
        weightUnit.textContent = newUnit === 'lb' ? 'lb' : 'kg';

        const w = parseFloat(weightInput.value);
        if (!isNaN(w) && w > 0 && prevUnit !== newUnit) {
          if (prevUnit === 'kg' && newUnit === 'lb') weightInput.value = Math.round(w * LB_PER_KG * 10) / 10;
          else if (prevUnit === 'lb' && newUnit === 'kg') weightInput.value = Math.round(w / LB_PER_KG * 10) / 10;
        }
        runCalc();
      });
    });
  }

  function init() {
    const form = document.getElementById('protein-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runCalc();
    });

    form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', runCalc);
      el.addEventListener('change', runCalc);
    });

    initGoalButtons();
    initUnitToggle();
    runCalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
