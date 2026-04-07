/**
 * Burger King–style meal nutrition calculator (SportyCalc).
 * Per-line nutrition is multiplied by quantity; cart totals are sums.
 * Values are approximate — verify against https://www.bk.com/nutrition-explorer or current BK nutrition PDFs.
 */
(function () {
  'use strict';

  const BK_CATEGORIES = [
    { id: 'burgers', label: 'Burgers' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'chicken-fish', label: 'Chicken & Fish' },
    { id: 'coffee', label: 'Coffee' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'sauces-toppings', label: 'Sauces & Toppings' },
    { id: 'sides', label: 'Sides' }
  ];

  /** Representative BK menu rows (approximate per-serving nutrition). */
  const BK_MENU_ITEMS = [
    { id: 'whopper', category: 'burgers', name: 'Whopper', calories: 657, protein: 28, carbs: 48, fat: 40, sodium: 980 },
    { id: 'whopper-jr', category: 'burgers', name: 'Whopper Jr', calories: 314, protein: 13, carbs: 27, fat: 18, sodium: 495 },
    { id: 'double-whopper', category: 'burgers', name: 'Double Whopper', calories: 900, protein: 48, carbs: 49, fat: 58, sodium: 980 },
    { id: 'triple-whopper', category: 'burgers', name: 'Triple Whopper', calories: 1130, protein: 67, carbs: 50, fat: 75, sodium: 1200 },
    { id: 'bacon-king', category: 'burgers', name: 'Bacon King', calories: 1150, protein: 53, carbs: 53, fat: 79, sodium: 2150 },
    { id: 'bacon-cheese-whopper', category: 'burgers', name: 'Bacon & Cheese Whopper', calories: 760, protein: 35, carbs: 48, fat: 48, sodium: 1350 },
    { id: 'bacon-cheeseburger', category: 'burgers', name: 'Bacon Cheeseburger', calories: 380, protein: 19, carbs: 42, fat: 22, sodium: 940 },
    { id: 'bacon-double-cheeseburger', category: 'burgers', name: 'Bacon Double Cheeseburger', calories: 450, protein: 27, carbs: 24, fat: 34, sodium: 870 },
    { id: 'cheeseburger', category: 'burgers', name: 'Cheeseburger', calories: 300, protein: 16, carbs: 27, fat: 13, sodium: 560 },
    { id: 'double-cheeseburger', category: 'burgers', name: 'Double Cheeseburger', calories: 450, protein: 27, carbs: 24, fat: 34, sodium: 870 },
    { id: 'hamburger', category: 'burgers', name: 'Hamburger', calories: 250, protein: 13, carbs: 27, fat: 10, sodium: 470 },
    { id: 'impossible-whopper', category: 'burgers', name: 'Impossible Whopper', calories: 630, protein: 25, carbs: 60, fat: 34, sodium: 1080 },
    { id: 'rodeo-burger', category: 'burgers', name: 'Rodeo Burger', calories: 390, protein: 17, carbs: 42, fat: 21, sodium: 880 },
    { id: 'rodeo-cheeseburger', category: 'burgers', name: 'Rodeo Cheeseburger', calories: 420, protein: 19, carbs: 42, fat: 24, sodium: 940 },
    { id: 'bbq-brisket-whopper', category: 'burgers', name: 'BBQ Brisket Whopper', calories: 770, protein: 40, carbs: 45, fat: 45, sodium: 1400 },
    { id: 'bbq-brisket-whopper-jr', category: 'burgers', name: 'BBQ Brisket Whopper Jr', calories: 420, protein: 22, carbs: 40, fat: 21, sodium: 800 },
    { id: 'bbq-bacon-whopper-jr', category: 'burgers', name: 'BBQ Bacon Whopper Jr', calories: 380, protein: 17, carbs: 38, fat: 20, sodium: 720 },
    { id: 'crispy-onion-whopper', category: 'burgers', name: 'Crispy Onion Whopper', calories: 720, protein: 32, carbs: 50, fat: 45, sodium: 1100 },
    { id: 'crispy-onion-whopper-jr', category: 'burgers', name: 'Crispy Onion Whopper Jr', calories: 400, protein: 16, carbs: 35, fat: 22, sodium: 620 },
    { id: 'peppercorn-blt-whopper', category: 'burgers', name: 'Peppercorn BLT Whopper', calories: 780, protein: 36, carbs: 48, fat: 48, sodium: 1280 },
    { id: 'peppercorn-blt-whopper-jr', category: 'burgers', name: 'Peppercorn BLT Whopper Jr', calories: 430, protein: 19, carbs: 36, fat: 25, sodium: 720 },
    { id: 'texas-double-whopper', category: 'burgers', name: 'Texas Double Whopper', calories: 1020, protein: 52, carbs: 52, fat: 65, sodium: 1450 },
    { id: 'ultimate-steakhouse-whopper', category: 'burgers', name: 'Ultimate Steakhouse Whopper', calories: 920, protein: 44, carbs: 46, fat: 58, sodium: 1380 },
    { id: 'ultimate-steakhouse-whopper-jr', category: 'burgers', name: 'Ultimate Steakhouse Whopper Jr', calories: 510, protein: 24, carbs: 36, fat: 32, sodium: 820 },

    { id: 'coca-cola', category: 'beverages', name: 'Coca-Cola (large)', calories: 380, protein: 0, carbs: 104, fat: 0, sodium: 0 },
    { id: 'diet-coke', category: 'beverages', name: 'Diet Coke (large)', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'sprite', category: 'beverages', name: 'Sprite (large)', calories: 380, protein: 0, carbs: 100, fat: 0, sodium: 0 },
    { id: 'dr-pepper', category: 'beverages', name: 'Dr Pepper (large)', calories: 380, protein: 0, carbs: 102, fat: 0, sodium: 0 },
    { id: 'chocolate-milk', category: 'beverages', name: 'Chocolate Milk', calories: 200, protein: 8, carbs: 28, fat: 6, sodium: 180 },
    { id: 'minute-maid-oj', category: 'beverages', name: 'Minute Maid Orange Juice', calories: 200, protein: 2, carbs: 48, fat: 0, sodium: 0 },
    { id: 'frozen-coke', category: 'beverages', name: 'Frozen Coke', calories: 170, protein: 0, carbs: 46, fat: 0, sodium: 0 },
    { id: 'sweet-tea', category: 'beverages', name: 'Sweetened Iced Tea', calories: 200, protein: 0, carbs: 52, fat: 0, sodium: 0 },
    { id: 'unsweet-tea', category: 'beverages', name: 'Unsweetened Iced Tea', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },

    { id: 'sausage-egg-cheese-croissanwich', category: 'breakfast', name: 'Sausage, Egg & Cheese Croissan\'Wich', calories: 520, protein: 22, carbs: 30, fat: 35, sodium: 1120 },
    { id: 'bacon-egg-cheese-biscuit', category: 'breakfast', name: 'Bacon, Egg & Cheese Biscuit', calories: 450, protein: 19, carbs: 38, fat: 26, sodium: 1180 },
    { id: 'fully-loaded-biscuit', category: 'breakfast', name: 'Fully Loaded Biscuit', calories: 650, protein: 28, carbs: 42, fat: 42, sodium: 1580 },
    { id: 'cini-minis', category: 'breakfast', name: 'Cini-minis', calories: 350, protein: 6, carbs: 52, fat: 14, sodium: 420 },
    { id: 'hash-browns', category: 'breakfast', name: 'Hash Browns', calories: 250, protein: 3, carbs: 28, fat: 14, sodium: 620 },
    { id: 'french-toast-sticks', category: 'breakfast', name: 'French Toast Sticks', calories: 380, protein: 6, carbs: 52, fat: 16, sodium: 480 },
    { id: 'pancake-platter', category: 'breakfast', name: 'Pancake Platter', calories: 550, protein: 10, carbs: 88, fat: 16, sodium: 920 },
    { id: 'egg-normous-burrito', category: 'breakfast', name: 'Egg-normous Burrito', calories: 700, protein: 32, carbs: 52, fat: 42, sodium: 1580 },

    { id: 'original-chicken-sandwich', category: 'chicken-fish', name: 'Original Chicken Sandwich', calories: 670, protein: 28, carbs: 52, fat: 38, sodium: 1120 },
    { id: 'big-fish', category: 'chicken-fish', name: 'Big Fish Sandwich', calories: 510, protein: 16, carbs: 52, fat: 26, sodium: 1020 },
    { id: 'fiery-big-fish', category: 'chicken-fish', name: 'Fiery Big Fish Sandwich', calories: 540, protein: 17, carbs: 54, fat: 28, sodium: 1080 },
    { id: 'chicken-fries', category: 'chicken-fish', name: 'Chicken Fries (9 pc)', calories: 290, protein: 14, carbs: 22, fat: 18, sodium: 780 },
    { id: 'chicken-nuggets-10', category: 'chicken-fish', name: 'Chicken Nuggets (10 pc)', calories: 480, protein: 26, carbs: 32, fat: 28, sodium: 920 },
    { id: 'royal-crispy-chicken', category: 'chicken-fish', name: 'Royal Crispy Chicken Sandwich', calories: 650, protein: 32, carbs: 54, fat: 32, sodium: 1180 },
    { id: 'crispy-chicken-jr', category: 'chicken-fish', name: 'Crispy Chicken Jr.', calories: 450, protein: 18, carbs: 42, fat: 24, sodium: 820 },
    { id: 'royal-crispy-wrap', category: 'chicken-fish', name: 'Royal Crispy Chicken Wrap', calories: 380, protein: 22, carbs: 36, fat: 18, sodium: 880 },

    { id: 'bk-cafe-hot', category: 'coffee', name: 'BK Café Hot Coffee', calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 },
    { id: 'iced-coffee', category: 'coffee', name: 'Iced Coffee', calories: 190, protein: 2, carbs: 36, fat: 4, sodium: 60 },
    { id: 'mocha-iced-coffee', category: 'coffee', name: 'Mocha Iced Coffee', calories: 250, protein: 3, carbs: 42, fat: 8, sodium: 80 },
    { id: 'vanilla-iced-coffee', category: 'coffee', name: 'Vanilla Iced Coffee', calories: 200, protein: 2, carbs: 38, fat: 5, sodium: 60 },
    { id: 'caramel-frappe', category: 'coffee', name: 'BK Caramel Frappe', calories: 410, protein: 6, carbs: 62, fat: 16, sodium: 180 },

    { id: 'chocolate-shake', category: 'desserts', name: 'Chocolate Milk Shake', calories: 760, protein: 16, carbs: 112, fat: 28, sodium: 420 },
    { id: 'vanilla-shake', category: 'desserts', name: 'Vanilla Milk Shake', calories: 560, protein: 12, carbs: 88, fat: 18, sodium: 320 },
    { id: 'oreo-shake', category: 'desserts', name: 'Oreo Shake', calories: 720, protein: 14, carbs: 102, fat: 26, sodium: 380 },
    { id: 'oreo-sundae', category: 'desserts', name: 'OREO Ice Cream Sundae', calories: 320, protein: 6, carbs: 48, fat: 12, sodium: 180 },
    { id: 'hershey-sundae-pie', category: 'desserts', name: 'Hershey\'s Sundae Pie', calories: 300, protein: 4, carbs: 36, fat: 16, sodium: 220 },
    { id: 'soft-serve-cone', category: 'desserts', name: 'Soft Serve Ice Cream Cone', calories: 200, protein: 5, carbs: 32, fat: 6, sodium: 80 },

    { id: 'ketchup', category: 'sauces-toppings', name: 'Ketchup', calories: 10, protein: 0, carbs: 2, fat: 0, sodium: 90 },
    { id: 'mayo', category: 'sauces-toppings', name: 'Mayonnaise', calories: 90, protein: 0, carbs: 0, fat: 10, sodium: 70 },
    { id: 'bbq-sauce', category: 'sauces-toppings', name: 'Barbecue Dipping Sauce (1 oz)', calories: 45, protein: 0, carbs: 11, fat: 0, sodium: 210 },
    { id: 'ranch-dip', category: 'sauces-toppings', name: 'Ranch Dipping Sauce (1 oz)', calories: 110, protein: 1, carbs: 2, fat: 11, sodium: 260 },
    { id: 'honey-mustard-dip', category: 'sauces-toppings', name: 'Honey Mustard Dipping Sauce (1 oz)', calories: 90, protein: 0, carbs: 8, fat: 6, sodium: 180 },
    { id: 'thick-cut-bacon', category: 'sauces-toppings', name: 'Thick cut bacon', calories: 80, protein: 6, carbs: 0, fat: 6, sodium: 280 },

    { id: 'french-fries', category: 'sides', name: 'French Fries (medium)', calories: 380, protein: 5, carbs: 52, fat: 18, sodium: 280 },
    { id: 'onion-rings', category: 'sides', name: 'Onion Rings', calories: 410, protein: 6, carbs: 48, fat: 22, sodium: 820 },
    { id: 'mozzarella-fries', category: 'sides', name: 'Mozzarella Fries', calories: 350, protein: 14, carbs: 32, fat: 18, sodium: 680 },
    { id: 'cheesy-tots', category: 'sides', name: 'Cheesy Tots', calories: 300, protein: 8, carbs: 28, fat: 18, sodium: 620 },
    { id: 'jalapeno-cheddar-bites', category: 'sides', name: 'Jalapeño Cheddar Bites', calories: 290, protein: 10, carbs: 26, fat: 16, sodium: 580 },
    { id: 'applesauce', category: 'sides', name: 'Mott\'s Applesauce', calories: 50, protein: 0, carbs: 14, fat: 0, sodium: 0 }
  ];

  const itemById = Object.fromEntries(BK_MENU_ITEMS.map((x) => [x.id, x]));

  let activeCategory = BK_CATEGORIES[0].id;
  /** @type {{ id: string, qty: number }[]} */
  let cart = [];

  const tabsEl = document.getElementById('bk-category-tabs');
  const listEl = document.getElementById('bk-item-list');
  const cartEl = document.getElementById('bk-cart-lines');
  const emptyEl = document.getElementById('bk-cart-empty');
  const clearBtn = document.getElementById('bk-clear-cart');

  const totalEl = {
    cal: document.getElementById('bk-total-cal'),
    pro: document.getElementById('bk-total-pro'),
    carb: document.getElementById('bk-total-carb'),
    fat: document.getElementById('bk-total-fat'),
    na: document.getElementById('bk-total-na'),
    dvCal: document.getElementById('bk-dv-cal')
  };

  function renderTabs() {
    tabsEl.innerHTML = BK_CATEGORIES.map(
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
    const items = BK_MENU_ITEMS.filter((i) => i.category === activeCategory);
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
