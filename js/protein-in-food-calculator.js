/**
 * Protein in Food Calculator - SportyCalc
 * Estimates protein content based on food type and amount.
 * Protein values per 100g (approximate, USDA-style).
 */

(function () {
  'use strict';

  const form = document.getElementById('protein-food-form');
  if (!form) return;

  const foodSelect = document.getElementById('food');
  const amountInput = document.getElementById('amount');
  const unitSelect = document.getElementById('unit');
  const foodLabelEl = document.getElementById('food-label');
  const proteinValueEl = document.getElementById('protein-value');
  const proteinUnitEl = document.getElementById('protein-unit');
  // Protein per 100g (approximate)
  const FOODS = {
    'chicken-breast': { name: 'Chicken breast', protein: 31 },
    'chicken-thigh': { name: 'Chicken thigh', protein: 26 },
    'beef-lean': { name: 'Beef (lean)', protein: 26 },
    'ground-beef': { name: 'Ground beef (85% lean)', protein: 24 },
    'turkey-breast': { name: 'Turkey breast', protein: 29 },
    'pork-tenderloin': { name: 'Pork tenderloin', protein: 26 },
    'salmon': { name: 'Salmon', protein: 25 },
    'tuna': { name: 'Tuna', protein: 30 },
    'cod': { name: 'Cod', protein: 18 },
    'shrimp': { name: 'Shrimp', protein: 24 },
    'egg': { name: 'Egg (whole)', protein: 13 },
    'egg-white': { name: 'Egg white', protein: 11 },
    'greek-yogurt': { name: 'Greek yogurt (plain)', protein: 10 },
    'cottage-cheese': { name: 'Cottage cheese', protein: 11 },
    'milk': { name: 'Milk (whole)', protein: 3.4 },
    'cheddar': { name: 'Cheddar cheese', protein: 25 },
    'tofu': { name: 'Tofu (firm)', protein: 8 },
    'tempeh': { name: 'Tempeh', protein: 19 },
    'lentils': { name: 'Lentils (cooked)', protein: 9 },
    'chickpeas': { name: 'Chickpeas (cooked)', protein: 9 },
    'black-beans': { name: 'Black beans (cooked)', protein: 8.9 },
    'quinoa': { name: 'Quinoa (cooked)', protein: 4.4 },
    'edamame': { name: 'Edamame', protein: 11 }
  };

  const OZ_TO_G = 28.3495;

  function runCalculation() {
    const foodId = foodSelect.value;
    const food = FOODS[foodId];
    if (!food) return;

    let amountG = parseFloat(amountInput.value) || 0;
    if (unitSelect.value === 'oz') {
      amountG = amountG * OZ_TO_G;
    }

    if (amountG <= 0) {
      proteinValueEl.textContent = '—';
      proteinUnitEl.textContent = '';
      foodLabelEl.textContent = '';
      return;
    }

    const proteinPer100 = food.protein;
    const proteinG = (amountG / 100) * proteinPer100;
    const isOz = unitSelect.value === 'oz';

    if (isOz) {
      const proteinOz = proteinG / OZ_TO_G;
      proteinValueEl.textContent = proteinOz.toFixed(2);
      proteinUnitEl.textContent = ' oz';
    } else {
      proteinValueEl.textContent = proteinG.toFixed(1);
      proteinUnitEl.textContent = ' g';
    }
    foodLabelEl.textContent = food.name;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  [foodSelect, amountInput, unitSelect].forEach(function (el) {
    if (el) el.addEventListener('input', runCalculation);
  });
  [foodSelect, unitSelect].forEach(function (el) {
    if (el) el.addEventListener('change', runCalculation);
  });

  runCalculation();
})();
