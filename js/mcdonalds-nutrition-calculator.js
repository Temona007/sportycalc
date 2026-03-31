/**
 * McDonald's-style meal nutrition calculator (SportyCalc).
 * Modeled after the official flow: pick category → add menu items → see combined macros.
 * Replace/expand MCD_MENU_ITEMS with your full dataset (per-serving calories, protein, carbs, fat, sodium).
 */
(function () {
  'use strict';

  const MCD_CATEGORIES = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'burgers', label: 'Burgers' },
    { id: 'chicken-fish', label: 'Chicken & Fish' },
    { id: 'sides-snacks', label: 'Sides & Snacks' },
    { id: 'desserts-shakes', label: 'Desserts & Shakes' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'sauces-condiments', label: 'Sauces & Condiments' }
  ];

  /** Sample rows only — swap for complete, sourced nutrition data later. */
  const MCD_MENU_ITEMS = [
    { id: 'egg-mcmuffin', category: 'breakfast', name: 'Egg McMuffin', calories: 310, protein: 17, carbs: 30, fat: 13, sodium: 770 },
    { id: 'hotcakes', category: 'breakfast', name: 'Hotcakes (3) with syrup & butter', calories: 580, protein: 9, carbs: 101, fat: 16, sodium: 690 },
    { id: 'big-mac', category: 'burgers', name: 'Big Mac', calories: 550, protein: 25, carbs: 45, fat: 30, sodium: 1010 },
    { id: 'qpc', category: 'burgers', name: 'Quarter Pounder with Cheese', calories: 520, protein: 30, carbs: 42, fat: 26, sodium: 1120 },
    { id: 'mcnuggets-10', category: 'chicken-fish', name: 'Chicken McNuggets (10 piece)', calories: 410, protein: 26, carbs: 26, fat: 24, sodium: 840 },
    { id: 'mc-crispy', category: 'chicken-fish', name: 'McCrispy Classic', calories: 620, protein: 27, carbs: 52, fat: 34, sodium: 1200 },
    { id: 'fries-l', category: 'sides-snacks', name: 'French Fries (large)', calories: 490, protein: 6, carbs: 66, fat: 23, sodium: 400 },
    { id: 'apple-slices', category: 'sides-snacks', name: 'Apple Slices', calories: 15, protein: 0, carbs: 4, fat: 0, sodium: 0 },
    { id: 'oreo-mcflurry', category: 'desserts-shakes', name: 'McFlurry with OREO (regular)', calories: 510, protein: 12, carbs: 80, fat: 16, sodium: 260 },
    { id: 'vanilla-cone', category: 'desserts-shakes', name: 'Vanilla Cone', calories: 200, protein: 5, carbs: 33, fat: 5, sodium: 80 },
    { id: 'coke-l', category: 'beverages', name: 'Coca-Cola (large)', calories: 290, protein: 0, carbs: 77, fat: 0, sodium: 0 },
    { id: 'coke-zero-l', category: 'beverages', name: 'Coca-Cola Zero Sugar (large)', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'ketchup-packet', category: 'sauces-condiments', name: 'Ketchup (1 packet)', calories: 10, protein: 0, carbs: 2, fat: 0, sodium: 90 },
    { id: 'ranch-cup', category: 'sauces-condiments', name: 'Ranch dipping cup', calories: 110, protein: 1, carbs: 2, fat: 11, sodium: 260 }
  ];

  const itemById = Object.fromEntries(MCD_MENU_ITEMS.map((x) => [x.id, x]));

  let activeCategory = MCD_CATEGORIES[0].id;
  /** @type {{ id: string, qty: number }[]} */
  let cart = [];

  const tabsEl = document.getElementById('mcd-category-tabs');
  const listEl = document.getElementById('mcd-item-list');
  const cartEl = document.getElementById('mcd-cart-lines');
  const emptyEl = document.getElementById('mcd-cart-empty');
  const clearBtn = document.getElementById('mcd-clear-cart');

  const totalEl = {
    cal: document.getElementById('mcd-total-cal'),
    pro: document.getElementById('mcd-total-pro'),
    carb: document.getElementById('mcd-total-carb'),
    fat: document.getElementById('mcd-total-fat'),
    na: document.getElementById('mcd-total-na'),
    dvCal: document.getElementById('mcd-dv-cal')
  };

  function renderTabs() {
    tabsEl.innerHTML = MCD_CATEGORIES.map(
      (c) =>
        `<button type="button" class="mcd-tab ${c.id === activeCategory ? 'mcd-tab-active' : ''}" data-cat="${c.id}">${escapeHtml(c.label)}</button>`
    ).join('');
    tabsEl.querySelectorAll('.mcd-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderTabs();
        renderItemList();
      });
    });
  }

  function renderItemList() {
    const items = MCD_MENU_ITEMS.filter((i) => i.category === activeCategory);
    listEl.innerHTML = items
      .map(
        (i) => `
      <div class="mcd-item-row">
        <div class="mcd-item-meta">
          <span class="mcd-item-name">${escapeHtml(i.name)}</span>
          <span class="mcd-item-kcal">${i.calories} kcal</span>
        </div>
        <button type="button" class="mcd-add-btn" data-id="${escapeHtml(i.id)}">Add</button>
      </div>`
      )
      .join('');
    listEl.querySelectorAll('.mcd-add-btn').forEach((btn) => {
      btn.addEventListener('click', () => addLine(btn.getAttribute('data-id')));
    });
  }

  function addLine(id) {
    const existing = cart.find((l) => l.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ id, qty: 1 });
    renderCart();
  }

  function setQty(id, qty) {
    const n = Math.max(0, Math.min(99, parseInt(qty, 10) || 0));
    const line = cart.find((l) => l.id === id);
    if (!line) return;
    if (n <= 0) cart = cart.filter((l) => l.id !== id);
    else line.qty = n;
    renderCart();
  }

  function renderCart() {
    if (!cart.length) {
      emptyEl.hidden = false;
      cartEl.innerHTML = '';
    } else {
      emptyEl.hidden = true;
      cartEl.innerHTML = cart
        .map((line) => {
          const item = itemById[line.id];
          if (!item) return '';
          return `
        <div class="mcd-cart-line">
          <div class="mcd-cart-line-top">
            <span class="mcd-cart-name">${escapeHtml(item.name)}</span>
            <button type="button" class="mcd-remove" data-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
          </div>
          <div class="mcd-cart-line-controls">
            <label class="mcd-qty-label">Qty
              <input type="number" class="mcd-qty-input" min="0" max="99" value="${line.qty}" data-id="${escapeHtml(item.id)}" aria-label="Quantity for ${escapeHtml(item.name)}" />
            </label>
            <span class="mcd-line-kcal">${item.calories * line.qty} kcal</span>
          </div>
        </div>`;
        })
        .join('');

      cartEl.querySelectorAll('.mcd-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          cart = cart.filter((l) => l.id !== id);
          renderCart();
        });
      });
      cartEl.querySelectorAll('.mcd-qty-input').forEach((inp) => {
        inp.addEventListener('change', () => setQty(inp.getAttribute('data-id'), inp.value));
      });
    }

    const t = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 };
    cart.forEach((line) => {
      const item = itemById[line.id];
      if (!item) return;
      const q = line.qty;
      t.calories += item.calories * q;
      t.protein += item.protein * q;
      t.carbs += item.carbs * q;
      t.fat += item.fat * q;
      t.sodium += item.sodium * q;
    });

    totalEl.cal.textContent = Math.round(t.calories);
    totalEl.pro.textContent = Math.round(t.protein * 10) / 10 + ' g';
    totalEl.carb.textContent = Math.round(t.carbs * 10) / 10 + ' g';
    totalEl.fat.textContent = Math.round(t.fat * 10) / 10 + ' g';
    totalEl.na.textContent = Math.round(t.sodium) + ' mg';
    if (totalEl.dvCal) {
      const pct = Math.min(100, Math.round((t.calories / 2000) * 100));
      totalEl.dvCal.textContent = isFinite(pct) ? pct.toString() : '0';
    }
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  clearBtn.addEventListener('click', () => {
    cart = [];
    renderCart();
  });

  renderTabs();
  renderItemList();
  renderCart();
})();
