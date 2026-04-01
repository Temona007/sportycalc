/**
 * Chipotle-style meal nutrition calculator (SportyCalc).
 * Single base + protein/rice/beans + toppings (qty for cheese/guac) + salsas + extras.
 */
(function () {
  'use strict';

  const CHIPOTLE_MENU_ITEMS = [
    { id: 'base_burrito', name: 'Burrito', category: 'base', calories: 320, protein: 9, carbs: 48, fat: 8, sodium: 780 },
    { id: 'base_bowl', name: 'Burrito Bowl', category: 'base', calories: 180, protein: 7, carbs: 33, fat: 3, sodium: 680 },
    { id: 'base_salad', name: 'Salad', category: 'base', calories: 140, protein: 6, carbs: 20, fat: 2, sodium: 520 },
    { id: 'base_tacos', name: '3 Tacos', category: 'base', calories: 240, protein: 8, carbs: 36, fat: 6, sodium: 620 },
    { id: 'base_quesadilla', name: 'Quesadilla', category: 'base', calories: 520, protein: 14, carbs: 52, fat: 28, sodium: 980 },
    { id: 'chicken', name: 'Chicken', category: 'protein', calories: 180, protein: 32, carbs: 0, fat: 7, sodium: 610 },
    { id: 'steak', name: 'Steak', category: 'protein', calories: 190, protein: 30, carbs: 1, fat: 8, sodium: 680 },
    { id: 'carnitas', name: 'Carnitas', category: 'protein', calories: 210, protein: 23, carbs: 2, fat: 12, sodium: 450 },
    { id: 'barbacoa', name: 'Barbacoa', category: 'protein', calories: 170, protein: 24, carbs: 2, fat: 7, sodium: 530 },
    { id: 'sofritas', name: 'Sofritas', category: 'protein', calories: 150, protein: 8, carbs: 10, fat: 10, sodium: 720 },
    { id: 'veggie', name: 'No Protein (Veggie)', category: 'protein', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'white_rice', name: 'White Rice', category: 'rice', calories: 210, protein: 4, carbs: 40, fat: 4, sodium: 370 },
    { id: 'brown_rice', name: 'Brown Rice', category: 'rice', calories: 210, protein: 5, carbs: 36, fat: 5.5, sodium: 370 },
    { id: 'no_rice', name: 'No Rice', category: 'rice', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'black_beans', name: 'Black Beans', category: 'beans', calories: 130, protein: 8, carbs: 22, fat: 1.5, sodium: 300 },
    { id: 'pinto_beans', name: 'Pinto Beans', category: 'beans', calories: 130, protein: 8, carbs: 22, fat: 1.5, sodium: 300 },
    { id: 'no_beans', name: 'No Beans', category: 'beans', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'fajita_veggies', name: 'Fajita Vegetables', category: 'topping', calories: 20, protein: 1, carbs: 4, fat: 0, sodium: 150 },
    { id: 'cheese', name: 'Cheese', category: 'topping', calories: 110, protein: 6, carbs: 1, fat: 9, sodium: 190, maxQuantity: 2 },
    { id: 'guacamole', name: 'Guacamole', category: 'topping', calories: 230, protein: 2, carbs: 8, fat: 22, sodium: 370, maxQuantity: 3 },
    { id: 'sour_cream', name: 'Sour Cream', category: 'topping', calories: 110, protein: 2, carbs: 2, fat: 10, sodium: 30 },
    { id: 'romaine_lettuce', name: 'Romaine Lettuce', category: 'topping', calories: 5, protein: 0.5, carbs: 1, fat: 0, sodium: 0 },
    { id: 'fresh_tomato_salsa', name: 'Fresh Tomato Salsa', category: 'salsa', calories: 25, protein: 1, carbs: 4, fat: 0, sodium: 500 },
    { id: 'roasted_chili_corn_salsa', name: 'Roasted Chili-Corn Salsa', category: 'salsa', calories: 80, protein: 2, carbs: 16, fat: 1.5, sodium: 330 },
    { id: 'tomatillo_green_salsa', name: 'Tomatillo-Green Salsa', category: 'salsa', calories: 15, protein: 1, carbs: 3, fat: 0, sodium: 260 },
    { id: 'tomatillo_red_salsa', name: 'Tomatillo-Red Salsa', category: 'salsa', calories: 30, protein: 1, carbs: 4, fat: 0.5, sodium: 520 },
    { id: 'chips', name: 'Chips', category: 'extra', calories: 540, protein: 7, carbs: 70, fat: 24, sodium: 420 },
    { id: 'side_guac', name: 'Side of Guacamole', category: 'extra', calories: 230, protein: 2, carbs: 8, fat: 22, sodium: 370 },
    { id: 'drink_water', name: 'Water', category: 'extra', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'drink_soda', name: 'Fountain Drink (approx. 22 fl oz)', category: 'extra', calories: 240, protein: 0, carbs: 65, fat: 0, sodium: 80 }
  ];

  const byId = Object.fromEntries(CHIPOTLE_MENU_ITEMS.map((x) => [x.id, x]));

  const totalCal = document.getElementById('chip-total-cal');
  const totalDv = document.getElementById('chip-total-dv');
  const totalPro = document.getElementById('chip-total-pro');
  const totalCarb = document.getElementById('chip-total-carb');
  const totalFat = document.getElementById('chip-total-fat');
  const totalNa = document.getElementById('chip-total-na');
  const form = document.getElementById('chipotle-form');
  const clearBtn = document.getElementById('chip-clear-meal');

  function valRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function checked(id) {
    const el = document.getElementById(id);
    return el && el.checked;
  }

  function intVal(id, min, max, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    let n = parseInt(el.value, 10);
    if (Number.isNaN(n)) n = fallback;
    return Math.max(min, Math.min(max, n));
  }

  function addItem(totals, id, qty) {
    const it = byId[id];
    if (!it || qty <= 0) return;
    const q = qty;
    totals.calories += it.calories * q;
    totals.protein += it.protein * q;
    totals.carbs += it.carbs * q;
    totals.fat += it.fat * q;
    totals.sodium += it.sodium * q;
  }

  function recalc() {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 };

    addItem(t, valRadio('chip-base'), 1);
    addItem(t, valRadio('chip-protein'), 1);
    addItem(t, valRadio('chip-rice'), 1);
    addItem(t, valRadio('chip-beans'), 1);

    if (checked('chip-fajita')) addItem(t, 'fajita_veggies', 1);
    if (checked('chip-cheese')) {
      const q = intVal('chip-cheese-qty', 1, 2, 1);
      addItem(t, 'cheese', q);
    }
    if (checked('chip-guac')) {
      const maxG = byId.guacamole.maxQuantity || 3;
      const q = intVal('chip-guac-qty', 1, maxG, 1);
      addItem(t, 'guacamole', q);
    }
    if (checked('chip-sour')) addItem(t, 'sour_cream', 1);
    if (checked('chip-romaine')) addItem(t, 'romaine_lettuce', 1);

    if (checked('chip-salsa-tomato')) addItem(t, 'fresh_tomato_salsa', 1);
    if (checked('chip-salsa-corn')) addItem(t, 'roasted_chili_corn_salsa', 1);
    if (checked('chip-salsa-green')) addItem(t, 'tomatillo_green_salsa', 1);
    if (checked('chip-salsa-red')) addItem(t, 'tomatillo_red_salsa', 1);

    if (checked('chip-chips')) addItem(t, 'chips', 1);
    if (checked('chip-side-guac')) addItem(t, 'side_guac', 1);
    if (checked('chip-drink-water')) addItem(t, 'drink_water', 1);
    if (checked('chip-drink-soda')) addItem(t, 'drink_soda', 1);

    const cal = t.calories;
    const dv = Math.min(100, Math.round((cal / 2000) * 100));

    totalCal.textContent = Math.round(cal);
    totalDv.textContent = isFinite(dv) ? String(dv) : '0';
    totalPro.textContent = (Math.round(t.protein * 10) / 10) + ' g';
    totalCarb.textContent = (Math.round(t.carbs * 10) / 10) + ' g';
    totalFat.textContent = (Math.round(t.fat * 10) / 10) + ' g';
    totalNa.textContent = Math.round(t.sodium) + ' mg';
  }

  function toggleQtyRow(checkId, rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.hidden = !checked(checkId);
  }

  function wire() {
    form.addEventListener('change', (e) => {
      if (e.target.id === 'chip-cheese') toggleQtyRow('chip-cheese', 'chip-cheese-row');
      if (e.target.id === 'chip-guac') toggleQtyRow('chip-guac', 'chip-guac-row');
      recalc();
    });
    form.addEventListener('input', (e) => {
      if (e.target.matches('#chip-cheese-qty, #chip-guac-qty')) recalc();
    });

    clearBtn.addEventListener('click', () => {
      form.reset();
      document.querySelector('input[name="chip-base"][value="base_bowl"]').checked = true;
      document.querySelector('input[name="chip-protein"][value="veggie"]').checked = true;
      document.querySelector('input[name="chip-rice"][value="white_rice"]').checked = true;
      document.querySelector('input[name="chip-beans"][value="no_beans"]').checked = true;
      document.getElementById('chip-cheese-qty').value = '1';
      document.getElementById('chip-guac-qty').value = '1';
      document.getElementById('chip-cheese-row').hidden = true;
      document.getElementById('chip-guac-row').hidden = true;
      recalc();
    });

    toggleQtyRow('chip-cheese', 'chip-cheese-row');
    toggleQtyRow('chip-guac', 'chip-guac-row');
    recalc();
  }

  wire();
})();
