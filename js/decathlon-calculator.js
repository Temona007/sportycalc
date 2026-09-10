/**
 * Decathlon Calculator - SportyCalc
 * World Athletics (IAAF 1984) men's decathlon scoring.
 * Track: INT(A * (B - P)^C)  Field: INT(A * (P - B)^C)
 */
(function () {
  'use strict';

  const EVENTS = [
    { id: 'run100', name: '100m', type: 'track', A: 25.4347, B: 18, C: 1.81, unit: 's', precision: 2, step: 0.01, manualAdj: 0.24, day: 1, timeFormat: false },
    { id: 'longJump', name: 'Long jump', type: 'field', A: 0.14354, B: 220, C: 1.4, unit: 'cm', precision: 0, step: 1, day: 1, timeFormat: false },
    { id: 'shotPut', name: 'Shot put', type: 'field', A: 51.39, B: 1.5, C: 1.05, unit: 'm', precision: 2, step: 0.01, day: 1, timeFormat: false },
    { id: 'highJump', name: 'High jump', type: 'field', A: 0.8465, B: 75, C: 1.42, unit: 'cm', precision: 0, step: 1, day: 1, timeFormat: false },
    { id: 'run400', name: '400m', type: 'track', A: 1.53775, B: 82, C: 1.81, unit: 's', precision: 2, step: 0.01, manualAdj: 0.14, day: 1, timeFormat: false },
    { id: 'hurdles110', name: '110m hurdles', type: 'track', A: 5.74352, B: 28.5, C: 1.92, unit: 's', precision: 2, step: 0.01, manualAdj: 0.24, day: 2, timeFormat: false },
    { id: 'discus', name: 'Discus throw', type: 'field', A: 12.91, B: 4, C: 1.1, unit: 'm', precision: 2, step: 0.01, day: 2, timeFormat: false },
    { id: 'poleVault', name: 'Pole vault', type: 'field', A: 0.2797, B: 100, C: 1.35, unit: 'cm', precision: 0, step: 1, day: 2, timeFormat: false },
    { id: 'javelin', name: 'Javelin throw', type: 'field', A: 10.14, B: 7, C: 1.08, unit: 'm', precision: 2, step: 0.01, day: 2, timeFormat: false },
    { id: 'run1500', name: '1500m', type: 'track', A: 0.03768, B: 480, C: 1.85, unit: 'm:ss', precision: 2, step: 0.01, day: 2, timeFormat: true }
  ];

  const BY_ID = Object.create(null);
  EVENTS.forEach(function (ev) { BY_ID[ev.id] = ev; });

  function roundTo(n, decimals) {
    const f = Math.pow(10, decimals);
    return Math.round(n * f) / f;
  }

  function parseNum(str) {
    if (str == null) return null;
    const t = String(str).trim().replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return isFinite(n) ? n : null;
  }

  function parse1500(str) {
    if (str == null) return null;
    const t = String(str).trim().replace(',', '.');
    if (!t) return null;
    if (t.indexOf(':') !== -1) {
      const parts = t.split(':');
      const m = Number(parts[0]);
      const s = Number(parts[1]);
      if (!isFinite(m) || !isFinite(s) || s < 0) return null;
      return m * 60 + s;
    }
    return parseNum(t);
  }

  function format1500(seconds) {
    if (seconds == null || !isFinite(seconds) || seconds < 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds - m * 60;
    const sStr = s.toFixed(2).padStart(5, '0');
    return m + ':' + sStr;
  }

  function formatResult(event, value) {
    if (value == null || !isFinite(value)) return '';
    if (event.timeFormat) return format1500(value);
    if (event.precision === 0) return String(Math.round(value));
    return value.toFixed(event.precision);
  }

  function parseResult(event, str) {
    if (event.timeFormat) return parse1500(str);
    return parseNum(str);
  }

  function pointsFromResult(event, result, manual) {
    if (result == null || !isFinite(result)) return null;
    let p = result;
    if (manual && event.manualAdj) p += event.manualAdj;
    const delta = event.type === 'track' ? (event.B - p) : (p - event.B);
    if (delta <= 0) return 0;
    const raw = event.A * Math.pow(delta, event.C);
    if (!isFinite(raw) || raw <= 0) return 0;
    return Math.floor(raw + 1e-10);
  }

  function resultFromPoints(event, points, manual) {
    const pts = Math.round(Number(points));
    if (!isFinite(pts) || pts <= 0) return null;

    const raw = Math.pow(pts / event.A, 1 / event.C);
    if (!isFinite(raw) || raw <= 0) return null;

    let p = event.type === 'track' ? event.B - raw : event.B + raw;
    if (manual && event.manualAdj) p -= event.manualAdj;
    p = roundTo(p, event.precision);

    const improve = event.type === 'track' ? -event.step : event.step;
    const worsen = -improve;
    let guard = 0;
    while (pointsFromResult(event, p, manual) < pts && guard++ < 20000) {
      p = roundTo(p + improve, event.precision);
    }
    guard = 0;
    while (guard++ < 20000) {
      const next = roundTo(p + worsen, event.precision);
      const nextPts = pointsFromResult(event, next, manual);
      if (nextPts == null || nextPts < pts) break;
      p = next;
    }
    return p;
  }

  const api = {
    EVENTS: EVENTS,
    pointsFromResult: pointsFromResult,
    resultFromPoints: resultFromPoints,
    parseResult: parseResult,
    formatResult: formatResult,
    parse1500: parse1500,
    format1500: format1500
  };

  if (typeof window !== 'undefined') window.__decathlon = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document === 'undefined') return;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function init() {
    const form = document.getElementById('decathlon-form');
    if (!form) return;

    const modeBtns = form.querySelectorAll('[data-dec-mode]');
    const day1El = document.getElementById('dec-day1');
    const day2El = document.getElementById('dec-day2');
    const totalEl = document.getElementById('dec-total');
    const sideTotal = document.getElementById('dec-side-total');
    const sideDay1 = document.getElementById('dec-side-day1');
    const sideDay2 = document.getElementById('dec-side-day2');
    const sideFilled = document.getElementById('dec-side-filled');
    const sideList = document.getElementById('dec-side-list');
    const resetBtn = document.getElementById('dec-reset');

    let mode = 'result';

    function rowEls(id) {
      const row = form.querySelector('[data-dec-event="' + id + '"]');
      if (!row) return null;
      return {
        row: row,
        result: row.querySelector('[data-dec-field="result"]'),
        points: row.querySelector('[data-dec-field="points"]'),
        manual: row.querySelector('[data-dec-manual]')
      };
    }

    function isManual(id) {
      const els = rowEls(id);
      return !!(els && els.manual && els.manual.checked);
    }

    function applyMode() {
      EVENTS.forEach(function (ev) {
        const els = rowEls(ev.id);
        if (!els) return;
        const resultLocked = mode === 'points';
        els.result.readOnly = resultLocked;
        els.points.readOnly = !resultLocked;
        els.result.classList.toggle('dec-input-locked', resultLocked);
        els.points.classList.toggle('dec-input-locked', !resultLocked);
      });
      modeBtns.forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-dec-mode') === mode);
      });
    }

    function setText(el, value) {
      if (!el) return;
      el.textContent = value;
    }

    function updateTotals() {
      let day1 = 0;
      let day2 = 0;
      let filled = 0;
      const lines = [];

      EVENTS.forEach(function (ev) {
        const els = rowEls(ev.id);
        if (!els) return;
        const pts = parseNum(els.points.value);
        const hasResult = parseResult(ev, els.result.value) != null;
        const hasPts = pts != null;
        if (hasResult || hasPts) filled += 1;
        const add = pts != null && pts > 0 ? pts : 0;
        if (ev.day === 1) day1 += add;
        else day2 += add;
        lines.push({ name: ev.name, pts: hasPts ? String(Math.round(pts)) : '—' });
      });

      const total = day1 + day2;
      setText(day1El, String(day1));
      setText(day2El, String(day2));
      setText(totalEl, String(total));
      setText(sideTotal, String(total));
      setText(sideDay1, String(day1));
      setText(sideDay2, String(day2));
      setText(sideFilled, filled + ' / 10');

      if (sideList) {
        sideList.innerHTML = lines.map(function (line) {
          return '<div class="result-item"><span class="result-label">' + line.name + '</span><span class="result-value">' + line.pts + '</span></div>';
        }).join('');
      }
    }

    function syncFromResult(id, format) {
      const ev = BY_ID[id];
      const els = rowEls(id);
      if (!ev || !els) return;
      const value = parseResult(ev, els.result.value);
      if (value == null) {
        els.points.value = '';
        return;
      }
      if (format) els.result.value = formatResult(ev, value);
      const pts = pointsFromResult(ev, value, isManual(id));
      els.points.value = pts == null ? '' : String(pts);
    }

    function syncFromPoints(id, format) {
      const ev = BY_ID[id];
      const els = rowEls(id);
      if (!ev || !els) return;
      const pts = parseNum(els.points.value);
      if (pts == null) {
        els.result.value = '';
        return;
      }
      const result = resultFromPoints(ev, pts, isManual(id));
      els.result.value = result == null ? '' : formatResult(ev, result);
      if (format) els.points.value = String(Math.round(pts));
    }

    function syncAll(format) {
      EVENTS.forEach(function (ev) {
        if (mode === 'result') syncFromResult(ev.id, format);
        else syncFromPoints(ev.id, format);
      });
      updateTotals();
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const next = btn.getAttribute('data-dec-mode');
        if (next === mode) return;
        mode = next;
        applyMode();
        syncAll(true);
      });
    });

    EVENTS.forEach(function (ev) {
      const els = rowEls(ev.id);
      if (!els) return;

      els.result.addEventListener('input', function () {
        if (mode !== 'result') return;
        syncFromResult(ev.id, false);
        updateTotals();
      });
      els.result.addEventListener('change', function () {
        if (mode !== 'result') return;
        syncFromResult(ev.id, true);
        updateTotals();
      });

      els.points.addEventListener('input', function () {
        if (mode !== 'points') return;
        syncFromPoints(ev.id, false);
        updateTotals();
      });
      els.points.addEventListener('change', function () {
        if (mode !== 'points') return;
        syncFromPoints(ev.id, true);
        updateTotals();
      });

      if (els.manual) {
        els.manual.addEventListener('change', function () {
          if (mode === 'result') syncFromResult(ev.id, false);
          else syncFromPoints(ev.id, true);
          updateTotals();
        });
      }
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        EVENTS.forEach(function (ev) {
          const els = rowEls(ev.id);
          if (!els) return;
          els.result.value = '';
          els.points.value = '';
          if (els.manual) els.manual.checked = false;
        });
        updateTotals();
        const first = form.querySelector(mode === 'points' ? '[data-dec-field="points"]' : '[data-dec-field="result"]');
        if (first) first.focus();
      });
    }

    applyMode();
    updateTotals();
  });
})();
