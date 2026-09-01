/**
 * Triathlon Calculator - SportyCalc
 * Bidirectional pace/speed ↔ time for swim, bike, run plus transitions.
 * Changing distance keeps pace/speed and recalculates split times.
 */

(function () {
  'use strict';

  const form = document.getElementById('triathlon-form');
  if (!form) return;

  const KM_PER_MILE = 1.609344;
  const YD_PER_M = 1 / 0.9144;

  const PRESETS = {
    sprint: {
      metric: { swim: 0.75, bike: 20, run: 5 },
      imperial: { swim: 0.47, bike: 12, run: 3.1 }
    },
    olympic: {
      metric: { swim: 1.5, bike: 40, run: 10 },
      imperial: { swim: 0.93, bike: 25, run: 6.2 }
    },
    half: {
      metric: { swim: 1.9, bike: 90, run: 21.1 },
      imperial: { swim: 1.2, bike: 56, run: 13.1 }
    },
    ironman: {
      metric: { swim: 3.8, bike: 180.2, run: 42.2 },
      imperial: { swim: 2.4, bike: 112, run: 26.2 }
    }
  };

  const els = {
    distSwim: document.getElementById('dist-swim'),
    distBike: document.getElementById('dist-bike'),
    distRun: document.getElementById('dist-run'),
    distSwimUnit: document.getElementById('dist-swim-unit'),
    distBikeUnit: document.getElementById('dist-bike-unit'),
    distRunUnit: document.getElementById('dist-run-unit'),
    swimPaceMin: document.getElementById('swim-pace-min'),
    swimPaceSec: document.getElementById('swim-pace-sec'),
    swimPaceUnit: document.getElementById('swim-pace-unit'),
    swimH: document.getElementById('swim-h'),
    swimM: document.getElementById('swim-m'),
    swimS: document.getElementById('swim-s'),
    t1M: document.getElementById('t1-m'),
    t1S: document.getElementById('t1-s'),
    bikeSpeed: document.getElementById('bike-speed'),
    bikeSpeedUnit: document.getElementById('bike-speed-unit'),
    bikeH: document.getElementById('bike-h'),
    bikeM: document.getElementById('bike-m'),
    bikeS: document.getElementById('bike-s'),
    t2M: document.getElementById('t2-m'),
    t2S: document.getElementById('t2-s'),
    runPaceMin: document.getElementById('run-pace-min'),
    runPaceSec: document.getElementById('run-pace-sec'),
    runPaceUnit: document.getElementById('run-pace-unit'),
    runH: document.getElementById('run-h'),
    runM: document.getElementById('run-m'),
    runS: document.getElementById('run-s'),
    totalTime: document.getElementById('total-time'),
    sidebarTotal: document.getElementById('sidebar-total'),
    sidebarSwim: document.getElementById('sidebar-swim'),
    sidebarSwimPace: document.getElementById('sidebar-swim-pace'),
    sidebarT1: document.getElementById('sidebar-t1'),
    sidebarBike: document.getElementById('sidebar-bike'),
    sidebarBikeSpeed: document.getElementById('sidebar-bike-speed'),
    sidebarT2: document.getElementById('sidebar-t2'),
    sidebarRun: document.getElementById('sidebar-run'),
    sidebarRunPace: document.getElementById('sidebar-run-pace')
  };

  let unit = 'metric';
  let preset = 'sprint';
  let updating = false;
  const lastEdited = { swim: 'pace', bike: 'speed', run: 'pace' };

  function parseNum(el) {
    if (!el) return 0;
    const n = parseFloat(el.value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function hasValue(el) {
    return !!(el && String(el.value).trim() !== '');
  }

  function fieldSeconds(minEl, secEl) {
    return (parseNum(minEl) * 60) + parseNum(secEl);
  }

  function hmsSeconds(hEl, mEl, sEl) {
    return (parseNum(hEl) * 3600) + (parseNum(mEl) * 60) + parseNum(sEl);
  }

  function formatHms(totalSeconds) {
    const sec = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function formatPace(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
    const sec = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function formatSpeed(kmh) {
    if (!Number.isFinite(kmh) || kmh <= 0) return '—';
    const value = unit === 'metric' ? kmh : kmh / KM_PER_MILE;
    const label = unit === 'metric' ? ' km/h' : ' mph';
    return (Math.round(value * 10) / 10).toFixed(1) + label;
  }

  function writeHms(hEl, mEl, sEl, totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      hEl.value = '0';
      mEl.value = '00';
      sEl.value = '00';
      return;
    }
    const sec = Math.max(0, Math.round(totalSeconds));
    hEl.value = String(Math.floor(sec / 3600));
    mEl.value = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    sEl.value = String(sec % 60).padStart(2, '0');
  }

  function writePace(minEl, secEl, totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      minEl.value = '';
      secEl.value = '';
      return;
    }
    const sec = Math.max(0, Math.round(totalSeconds));
    minEl.value = String(Math.floor(sec / 60));
    secEl.value = String(sec % 60).padStart(2, '0');
  }

  function toKm(value) {
    return unit === 'metric' ? value : value * KM_PER_MILE;
  }

  function fromKm(km) {
    return unit === 'metric' ? km : km / KM_PER_MILE;
  }

  function roundDist(value) {
    if (!Number.isFinite(value)) return '';
    const rounded = Math.round(value * 100) / 100;
    return String(parseFloat(rounded.toFixed(2)));
  }

  function getDistancesKm() {
    return {
      swim: toKm(parseNum(els.distSwim)),
      bike: toKm(parseNum(els.distBike)),
      run: toKm(parseNum(els.distRun))
    };
  }

  function swimPacePer100m() {
    const paceSec = fieldSeconds(els.swimPaceMin, els.swimPaceSec);
    if (paceSec <= 0) return 0;
    return unit === 'metric' ? paceSec : paceSec * YD_PER_M;
  }

  function displaySwimPaceFromPer100m(per100m) {
    if (per100m <= 0) return 0;
    return unit === 'metric' ? per100m : per100m / YD_PER_M;
  }

  function bikeSpeedKmh() {
    const speed = parseNum(els.bikeSpeed);
    if (speed <= 0) return 0;
    return unit === 'metric' ? speed : speed * KM_PER_MILE;
  }

  function displayBikeSpeedFromKmh(kmh) {
    if (kmh <= 0) return 0;
    return unit === 'metric' ? kmh : kmh / KM_PER_MILE;
  }

  function runPacePerKm() {
    const paceSec = fieldSeconds(els.runPaceMin, els.runPaceSec);
    if (paceSec <= 0) return 0;
    return unit === 'metric' ? paceSec : paceSec / KM_PER_MILE;
  }

  function displayRunPaceFromPerKm(perKm) {
    if (perKm <= 0) return 0;
    return unit === 'metric' ? perKm : perKm * KM_PER_MILE;
  }

  function swimTimeFromPace(distKm, pacePer100m) {
    if (distKm <= 0 || pacePer100m <= 0) return 0;
    return distKm * 10 * pacePer100m;
  }

  function swimPaceFromTime(distKm, timeSec) {
    if (distKm <= 0 || timeSec <= 0) return 0;
    return timeSec / (distKm * 10);
  }

  function bikeTimeFromSpeed(distKm, kmh) {
    if (distKm <= 0 || kmh <= 0) return 0;
    return (distKm / kmh) * 3600;
  }

  function bikeSpeedFromTime(distKm, timeSec) {
    if (distKm <= 0 || timeSec <= 0) return 0;
    return distKm / (timeSec / 3600);
  }

  function runTimeFromPace(distKm, pacePerKm) {
    if (distKm <= 0 || pacePerKm <= 0) return 0;
    return distKm * pacePerKm;
  }

  function runPaceFromTime(distKm, timeSec) {
    if (distKm <= 0 || timeSec <= 0) return 0;
    return timeSec / distKm;
  }

  function setActiveButtons(selector, value, attr) {
    form.querySelectorAll(selector).forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute(attr) === value);
    });
  }

  function applyPreset(name) {
    const data = PRESETS[name];
    if (!data) return;
    const d = data[unit];
    els.distSwim.value = String(d.swim);
    els.distBike.value = String(d.bike);
    els.distRun.value = String(d.run);
    preset = name;
    setActiveButtons('.unit-btn[data-preset]', name, 'data-preset');
  }

  function markCustomIfNeeded() {
    const current = PRESETS[preset];
    if (!current) {
      preset = 'custom';
      setActiveButtons('.unit-btn[data-preset]', 'custom', 'data-preset');
      return;
    }
    const d = current[unit];
    const swim = parseNum(els.distSwim);
    const bike = parseNum(els.distBike);
    const run = parseNum(els.distRun);
    const close = function (a, b) { return Math.abs(a - b) < 0.011; };
    if (!close(swim, d.swim) || !close(bike, d.bike) || !close(run, d.run)) {
      preset = 'custom';
      setActiveButtons('.unit-btn[data-preset]', 'custom', 'data-preset');
    }
  }

  function updateUnitLabels() {
    const dist = unit === 'metric' ? 'km' : 'mi';
    els.distSwimUnit.textContent = dist;
    els.distBikeUnit.textContent = dist;
    els.distRunUnit.textContent = dist;
    els.swimPaceUnit.textContent = unit === 'metric' ? '/100m' : '/100 yd';
    els.bikeSpeedUnit.textContent = unit === 'metric' ? 'km/h' : 'mph';
    els.runPaceUnit.textContent = unit === 'metric' ? '/km' : '/mi';
  }

  function syncSplitsFromPace() {
    const dist = getDistancesKm();

    if (lastEdited.swim === 'pace') {
      const pace = swimPacePer100m();
      if (pace > 0) writeHms(els.swimH, els.swimM, els.swimS, swimTimeFromPace(dist.swim, pace));
    } else {
      const time = hmsSeconds(els.swimH, els.swimM, els.swimS);
      if (time > 0) writePace(els.swimPaceMin, els.swimPaceSec, displaySwimPaceFromPer100m(swimPaceFromTime(dist.swim, time)));
    }

    if (lastEdited.bike === 'speed') {
      const speed = bikeSpeedKmh();
      if (speed > 0) writeHms(els.bikeH, els.bikeM, els.bikeS, bikeTimeFromSpeed(dist.bike, speed));
    } else {
      const time = hmsSeconds(els.bikeH, els.bikeM, els.bikeS);
      if (time > 0) {
        const kmh = bikeSpeedFromTime(dist.bike, time);
        els.bikeSpeed.value = kmh > 0 ? String(Math.round(displayBikeSpeedFromKmh(kmh) * 10) / 10) : '';
      }
    }

    if (lastEdited.run === 'pace') {
      const pace = runPacePerKm();
      if (pace > 0) writeHms(els.runH, els.runM, els.runS, runTimeFromPace(dist.run, pace));
    } else {
      const time = hmsSeconds(els.runH, els.runM, els.runS);
      if (time > 0) writePace(els.runPaceMin, els.runPaceSec, displayRunPaceFromPerKm(runPaceFromTime(dist.run, time)));
    }
  }

  function renderResults() {
    const dist = getDistancesKm();
    const swimSec = hmsSeconds(els.swimH, els.swimM, els.swimS);
    const bikeSec = hmsSeconds(els.bikeH, els.bikeM, els.bikeS);
    const runSec = hmsSeconds(els.runH, els.runM, els.runS);
    const t1Sec = fieldSeconds(els.t1M, els.t1S);
    const t2Sec = fieldSeconds(els.t2M, els.t2S);
    const total = swimSec + t1Sec + bikeSec + t2Sec + runSec;

    const totalText = formatHms(total);
    if (els.totalTime) els.totalTime.textContent = totalText;
    if (els.sidebarTotal) els.sidebarTotal.textContent = totalText;
    if (els.sidebarSwim) els.sidebarSwim.textContent = formatHms(swimSec);
    if (els.sidebarT1) els.sidebarT1.textContent = formatHms(t1Sec);
    if (els.sidebarBike) els.sidebarBike.textContent = formatHms(bikeSec);
    if (els.sidebarT2) els.sidebarT2.textContent = formatHms(t2Sec);
    if (els.sidebarRun) els.sidebarRun.textContent = formatHms(runSec);

    const swimPace = swimPacePer100m() || swimPaceFromTime(dist.swim, swimSec);
    const bikeKmh = bikeSpeedKmh() || bikeSpeedFromTime(dist.bike, bikeSec);
    const runPace = runPacePerKm() || runPaceFromTime(dist.run, runSec);

    if (els.sidebarSwimPace) {
      els.sidebarSwimPace.textContent = swimPace > 0
        ? formatPace(displaySwimPaceFromPer100m(swimPace)) + (unit === 'metric' ? ' /100m' : ' /100 yd')
        : '—';
    }
    if (els.sidebarBikeSpeed) els.sidebarBikeSpeed.textContent = formatSpeed(bikeKmh);
    if (els.sidebarRunPace) {
      els.sidebarRunPace.textContent = runPace > 0
        ? formatPace(displayRunPaceFromPerKm(runPace)) + (unit === 'metric' ? ' /km' : ' /mi')
        : '—';
    }
  }

  function recalc(options) {
    if (updating) return;
    updating = true;
    const opts = options || {};
    if (opts.fromDistance !== false) syncSplitsFromPace();
    renderResults();
    updating = false;
  }

  function switchUnit(next) {
    if (next === unit) return;

    const distKm = getDistancesKm();
    const swimPace = swimPacePer100m();
    const bikeKmh = bikeSpeedKmh();
    const runPace = runPacePerKm();

    unit = next;
    setActiveButtons('.unit-btn[data-unit]', unit, 'data-unit');
    updateUnitLabels();

    if (preset !== 'custom' && PRESETS[preset]) {
      applyPreset(preset);
    } else {
      els.distSwim.value = roundDist(fromKm(distKm.swim));
      els.distBike.value = roundDist(fromKm(distKm.bike));
      els.distRun.value = roundDist(fromKm(distKm.run));
    }

    if (hasValue(els.swimPaceMin) || hasValue(els.swimPaceSec) || swimPace > 0) {
      writePace(els.swimPaceMin, els.swimPaceSec, displaySwimPaceFromPer100m(swimPace));
    }
    if (hasValue(els.bikeSpeed) || bikeKmh > 0) {
      const shown = displayBikeSpeedFromKmh(bikeKmh);
      els.bikeSpeed.value = shown > 0 ? String(Math.round(shown * 10) / 10) : '';
    }
    if (hasValue(els.runPaceMin) || hasValue(els.runPaceSec) || runPace > 0) {
      writePace(els.runPaceMin, els.runPaceSec, displayRunPaceFromPerKm(runPace));
    }

    lastEdited.swim = 'pace';
    lastEdited.bike = 'speed';
    lastEdited.run = 'pace';
    recalc();
  }

  form.querySelectorAll('.unit-btn[data-unit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchUnit(btn.getAttribute('data-unit'));
    });
  });

  form.querySelectorAll('.unit-btn[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const name = btn.getAttribute('data-preset');
      if (name === 'custom') {
        preset = 'custom';
        setActiveButtons('.unit-btn[data-preset]', 'custom', 'data-preset');
        return;
      }
      lastEdited.swim = 'pace';
      lastEdited.bike = 'speed';
      lastEdited.run = 'pace';
      applyPreset(name);
      recalc();
    });
  });

  [els.distSwim, els.distBike, els.distRun].forEach(function (el) {
    el.addEventListener('input', function () {
      markCustomIfNeeded();
      if (swimPacePer100m() > 0) lastEdited.swim = 'pace';
      if (bikeSpeedKmh() > 0) lastEdited.bike = 'speed';
      if (runPacePerKm() > 0) lastEdited.run = 'pace';
      recalc();
    });
  });

  [els.swimPaceMin, els.swimPaceSec].forEach(function (el) {
    el.addEventListener('input', function () {
      lastEdited.swim = 'pace';
      recalc();
    });
  });
  [els.swimH, els.swimM, els.swimS].forEach(function (el) {
    el.addEventListener('input', function () {
      lastEdited.swim = 'time';
      recalc();
    });
  });

  els.bikeSpeed.addEventListener('input', function () {
    lastEdited.bike = 'speed';
    recalc();
  });
  [els.bikeH, els.bikeM, els.bikeS].forEach(function (el) {
    el.addEventListener('input', function () {
      lastEdited.bike = 'time';
      recalc();
    });
  });

  [els.runPaceMin, els.runPaceSec].forEach(function (el) {
    el.addEventListener('input', function () {
      lastEdited.run = 'pace';
      recalc();
    });
  });
  [els.runH, els.runM, els.runS].forEach(function (el) {
    el.addEventListener('input', function () {
      lastEdited.run = 'time';
      recalc();
    });
  });

  [els.t1M, els.t1S, els.t2M, els.t2S].forEach(function (el) {
    el.addEventListener('input', recalc);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    recalc();
  });

  updateUnitLabels();
  applyPreset('sprint');
  recalc();
})();
