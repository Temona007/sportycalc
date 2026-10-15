/**
 * Waist to Height Ratio (WHtR) Calculator
 * WHtR = waist / height (same units)
 * Ashwell shape-chart cut-offs: 0.4, 0.5, 0.6
 * Browning et al. 2010: 0.50 global cardiometabolic boundary
 */
(function () {
  'use strict';

  const CM_PER_INCH = 2.54;
  const SCALE_MIN = 0.3;
  const SCALE_MAX = 0.7;

  const CATEGORIES = [
    { id: 'care', label: 'Take Care', detail: 'Possibly underweight', lo: 0, hi: 0.4 },
    { id: 'ok', label: 'OK', detail: 'Healthy range', lo: 0.4, hi: 0.5 },
    { id: 'consider', label: 'Consider Action', detail: 'Increased health risk', lo: 0.5, hi: 0.6 },
    { id: 'action', label: 'Take Action', detail: 'High health risk', lo: 0.6, hi: null }
  ];

  function calcWhtr(waist, height) {
    if (!(waist > 0) || !(height > 0)) return null;
    return waist / height;
  }

  function getCategory(whtr) {
    if (!(whtr > 0)) return null;
    if (whtr < 0.4) return CATEGORIES[0];
    if (whtr < 0.5) return CATEGORIES[1];
    if (whtr < 0.6) return CATEGORIES[2];
    return CATEGORIES[3];
  }

  function healthyWaistRange(height) {
    if (!(height > 0)) return null;
    return { lo: height * 0.4, hi: height * 0.49 };
  }

  function halfHeight(height) {
    if (!(height > 0)) return null;
    return height * 0.5;
  }

  function cmToInches(cm) {
    return cm / CM_PER_INCH;
  }

  function inchesToCm(inches) {
    return inches * CM_PER_INCH;
  }

  function cmToFtIn(cm) {
    const totalIn = cmToInches(cm);
    let ft = Math.floor(totalIn / 12);
    let inches = Math.round((totalIn - ft * 12) * 10) / 10;
    if (inches >= 12) {
      ft += 1;
      inches = 0;
    }
    return { ft: ft, inches: inches };
  }

  function ftInToCm(ft, inches) {
    const f = Number(ft) || 0;
    const i = Number(inches) || 0;
    return inchesToCm(f * 12 + i);
  }

  function formatRatio(n) {
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
  }

  function formatMeasure(n, digits) {
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(digits);
  }

  const api = {
    CATEGORIES,
    calcWhtr,
    getCategory,
    healthyWaistRange,
    halfHeight,
    cmToInches,
    inchesToCm,
    cmToFtIn,
    ftInToCm
  };
  if (typeof window !== 'undefined') window.__whtr = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  const form = document.getElementById('whtr-form');
  if (!form) return;

  const waistInput = document.getElementById('whtr-waist');
  const waistUnitEl = document.getElementById('whtr-waist-unit');
  const heightCmWrap = document.getElementById('whtr-height-metric');
  const heightImpWrap = document.getElementById('whtr-height-imperial');
  const heightCmInput = document.getElementById('whtr-height-cm');
  const heightFtInput = document.getElementById('whtr-height-ft');
  const heightInInput = document.getElementById('whtr-height-in');

  const els = {
    value: document.getElementById('whtr-result-value'),
    category: document.getElementById('whtr-result-category'),
    detail: document.getElementById('whtr-result-detail'),
    half: document.getElementById('whtr-result-half'),
    healthy: document.getElementById('whtr-result-healthy'),
    marker: document.getElementById('whtr-marker')
  };

  let currentUnit = 'metric';

  function getHeightCm() {
    if (currentUnit === 'imperial') {
      return ftInToCm(heightFtInput.value, heightInInput.value);
    }
    return parseFloat(heightCmInput.value) || 0;
  }

  function getWaistCm() {
    const val = parseFloat(waistInput.value);
    if (!(val > 0)) return 0;
    return currentUnit === 'imperial' ? inchesToCm(val) : val;
  }

  function formatLen(cm) {
    if (!(cm > 0)) return '—';
    if (currentUnit === 'imperial') return formatMeasure(cmToInches(cm), 1) + ' in';
    return formatMeasure(cm, 1) + ' cm';
  }

  function updateScale(whtr) {
    if (!els.marker || !(whtr > 0)) return;
    const clamped = Math.max(SCALE_MIN, Math.min(SCALE_MAX, whtr));
    const pct = ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
    els.marker.style.left = pct + '%';
  }

  function setCategoryClass(id) {
    if (!els.category) return;
    els.category.className = 'whr-category whtr-category-' + (id || 'ok');
  }

  function updateUI() {
    const waistCm = getWaistCm();
    const heightCm = getHeightCm();
    const whtr = calcWhtr(waistCm, heightCm);
    const cat = getCategory(whtr);
    const healthy = healthyWaistRange(heightCm);
    const half = halfHeight(heightCm);

    if (els.value) els.value.textContent = formatRatio(whtr);
    if (els.category) els.category.textContent = cat ? cat.label : '—';
    if (els.detail) els.detail.textContent = cat ? cat.detail : '';
    setCategoryClass(cat ? cat.id : null);
    if (els.half) els.half.textContent = formatLen(half);
    if (els.healthy) {
      els.healthy.textContent = healthy
        ? formatLen(healthy.lo) + ' – ' + formatLen(healthy.hi)
        : '—';
    }
    updateScale(whtr);
  }

  function setUnit(unit) {
    if (unit === currentUnit) return;
    const heightCm = getHeightCm();
    const waistCm = getWaistCm();
    currentUnit = unit;

    form.querySelectorAll('.unit-btn[data-unit]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.unit === unit);
    });

    if (unit === 'imperial') {
      if (waistUnitEl) waistUnitEl.textContent = 'in';
      if (waistCm > 0) waistInput.value = String(Math.round(cmToInches(waistCm) * 10) / 10);
      const fi = cmToFtIn(heightCm || 170);
      if (heightFtInput) heightFtInput.value = String(fi.ft);
      if (heightInInput) heightInInput.value = String(fi.inches);
      if (heightCmWrap) heightCmWrap.style.display = 'none';
      if (heightImpWrap) heightImpWrap.style.display = '';
    } else {
      if (waistUnitEl) waistUnitEl.textContent = 'cm';
      if (waistCm > 0) waistInput.value = String(Math.round(waistCm * 10) / 10);
      if (heightCm > 0) heightCmInput.value = String(Math.round(heightCm * 10) / 10);
      if (heightCmWrap) heightCmWrap.style.display = '';
      if (heightImpWrap) heightImpWrap.style.display = 'none';
    }
    updateUI();
  }

  form.querySelectorAll('.unit-btn[data-unit]').forEach((btn) => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  [waistInput, heightCmInput, heightFtInput, heightInInput].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', updateUI);
    el.addEventListener('change', updateUI);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUI();
  });

  updateUI();
})();
