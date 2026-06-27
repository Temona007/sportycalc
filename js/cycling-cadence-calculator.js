/**
 * Cycling Cadence Calculator - SportyCalc
 * Speed ↔ cadence from wheel size, chainring, and cog.
 */

(function () {
  'use strict';

  const form = document.getElementById('cadence-form');
  if (!form) return;

  const rimInput = document.getElementById('rim-size');
  const tireInput = document.getElementById('tire-size');
  const chainringInput = document.getElementById('chainring');
  const cogInput = document.getElementById('cog');
  const cadenceInput = document.getElementById('cadence');
  const speedInput = document.getElementById('speed');
  const wheelPreset = document.getElementById('wheel-preset');
  const tableBody = document.getElementById('cadence-table-body');

  const resultSpeedKmh = document.getElementById('result-speed-kmh');
  const resultSpeedMph = document.getElementById('result-speed-mph');
  const resultCadence = document.getElementById('result-cadence');
  const resultGearRatio = document.getElementById('result-gear-ratio');
  const resultDevelopment = document.getElementById('result-development');
  const resultCircumference = document.getElementById('result-circumference');

  let dimUnit = 'mm';
  let speedUnit = 'kmh';
  let activeField = 'cadence';

  const MM_PER_IN = 25.4;
  const KMH_TO_MPH = 0.621371;
  const TABLE_RPMS = [];
  for (let rpm = 50; rpm <= 130; rpm += 5) TABLE_RPMS.push(rpm);

  const WHEEL_PRESETS = {
    custom: null,
    road700x25: { rim: 622, tire: 25 },
    road700x28: { rim: 622, tire: 28 },
    road700x32: { rim: 622, tire: 32 },
    gravel700x40: { rim: 622, tire: 40 },
    gravel650x47: { rim: 584, tire: 47 },
    mtb29x22: { rim: 622, tire: 56 },
    mtb275x24: { rim: 584, tire: 61 }
  };

  function parsePositive(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function toMm(value) {
    return dimUnit === 'mm' ? value : value * MM_PER_IN;
  }

  function fromMm(mm) {
    const v = dimUnit === 'mm' ? mm : mm / MM_PER_IN;
    return Math.round(v * 10) / 10;
  }

  function getWheelCircumferenceMm() {
    const rim = parsePositive(rimInput.value);
    const tire = parsePositive(tireInput.value);
    if (rim == null || tire == null) return null;
    const diameterMm = toMm(rim) + 2 * toMm(tire);
    return Math.PI * diameterMm;
  }

  function getGearRatio() {
    const chainring = parsePositive(chainringInput.value);
    const cog = parsePositive(cogInput.value);
    if (chainring == null || cog == null) return null;
    return chainring / cog;
  }

  function speedKmhFromCadence(cadence, circumferenceMm, gearRatio) {
    return cadence * gearRatio * circumferenceMm * 0.00006;
  }

  function cadenceFromSpeedKmh(speedKmh, circumferenceMm, gearRatio) {
    const factor = gearRatio * circumferenceMm * 0.00006;
    if (!factor) return null;
    return speedKmh / factor;
  }

  function formatSpeed(value, unit) {
    if (value == null || !Number.isFinite(value)) return '—';
    return (Math.round(value * 10) / 10).toFixed(1);
  }

  function formatRpm(value) {
    if (value == null || !Number.isFinite(value)) return '—';
    return String(Math.round(value));
  }

  function setDimUnit(unit) {
    if (unit === dimUnit) return;

    const rimVal = parsePositive(rimInput.value);
    const tireVal = parsePositive(tireInput.value);
    if (rimVal != null && tireVal != null) {
      if (unit === 'in') {
        rimInput.value = String(Math.round((rimVal / MM_PER_IN) * 10) / 10);
        tireInput.value = String(Math.round((tireVal / MM_PER_IN) * 10) / 10);
      } else {
        rimInput.value = String(Math.round(rimVal * MM_PER_IN));
        tireInput.value = String(Math.round(tireVal * MM_PER_IN));
      }
    }

    dimUnit = unit;
    const mmBtn = form.querySelector('.unit-btn[data-dim="mm"]');
    const inBtn = form.querySelector('.unit-btn[data-dim="in"]');
    const rimLabel = document.getElementById('rim-unit-label');
    const tireLabel = document.getElementById('tire-unit-label');

    if (unit === 'mm') {
      if (mmBtn) mmBtn.classList.add('active');
      if (inBtn) inBtn.classList.remove('active');
      if (rimLabel) rimLabel.textContent = 'mm';
      if (tireLabel) tireLabel.textContent = 'mm';
      rimInput.step = '1';
      tireInput.step = '1';
    } else {
      if (inBtn) inBtn.classList.add('active');
      if (mmBtn) mmBtn.classList.remove('active');
      if (rimLabel) rimLabel.textContent = 'in';
      if (tireLabel) tireLabel.textContent = 'in';
      rimInput.step = '0.1';
      tireInput.step = '0.1';
    }
    runCalculation();
  }

  function setSpeedUnit(unit) {
    if (unit === speedUnit) return;

    const speedVal = parsePositive(speedInput.value);
    if (speedVal != null) {
      if (unit === 'mph' && speedUnit === 'kmh') {
        speedInput.value = formatSpeed(speedVal * KMH_TO_MPH, 'mph');
      } else if (unit === 'kmh' && speedUnit === 'mph') {
        speedInput.value = formatSpeed(speedVal / KMH_TO_MPH, 'kmh');
      }
    }

    speedUnit = unit;
    const kmhBtn = form.querySelector('.unit-btn[data-speed="kmh"]');
    const mphBtn = form.querySelector('.unit-btn[data-speed="mph"]');
    const speedLabel = document.getElementById('speed-unit-label');

    if (unit === 'kmh') {
      if (kmhBtn) kmhBtn.classList.add('active');
      if (mphBtn) mphBtn.classList.remove('active');
      if (speedLabel) speedLabel.textContent = 'km/h';
    } else {
      if (mphBtn) mphBtn.classList.add('active');
      if (kmhBtn) kmhBtn.classList.remove('active');
      if (speedLabel) speedLabel.textContent = 'mph';
    }
    runCalculation();
  }

  function applyPreset(key) {
    const preset = WHEEL_PRESETS[key];
    if (!preset) return;
    rimInput.value = String(fromMm(preset.rim));
    tireInput.value = String(fromMm(preset.tire));
    runCalculation();
  }

  function syncPresetSelect() {
    if (!wheelPreset) return;
    const rimMm = toMm(parsePositive(rimInput.value) || 0);
    const tireMm = toMm(parsePositive(tireInput.value) || 0);
    let matched = 'custom';
    Object.keys(WHEEL_PRESETS).forEach(function (key) {
      const p = WHEEL_PRESETS[key];
      if (!p) return;
      if (Math.abs(p.rim - rimMm) < 0.5 && Math.abs(p.tire - tireMm) < 0.5) matched = key;
    });
    wheelPreset.value = matched;
  }

  function updateTable(circumferenceMm, gearRatio) {
    if (!tableBody) return;
    if (circumferenceMm == null || gearRatio == null) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-muted">Enter valid bike parameters</td></tr>';
      return;
    }

    const currentCadence = parsePositive(cadenceInput.value);
    let html = '';
    TABLE_RPMS.forEach(function (rpm) {
      const kmh = speedKmhFromCadence(rpm, circumferenceMm, gearRatio);
      const mph = kmh * KMH_TO_MPH;
      let rowClass = '';
      if (rpm >= 85 && rpm <= 95) rowClass = ' cadence-row-optimal';
      if (currentCadence != null && Math.abs(rpm - currentCadence) < 2.5) rowClass += ' cadence-row-current';
      html += '<tr class="' + rowClass.trim() + '">';
      html += '<td>' + rpm + '</td>';
      html += '<td>' + formatSpeed(kmh, 'kmh') + '</td>';
      html += '<td>' + formatSpeed(mph, 'mph') + '</td>';
      html += '</tr>';
    });
    tableBody.innerHTML = html;
  }

  function runCalculation() {
    const circumferenceMm = getWheelCircumferenceMm();
    const gearRatio = getGearRatio();

    if (circumferenceMm == null || gearRatio == null) {
      resultSpeedKmh.textContent = '—';
      resultSpeedMph.textContent = '—';
      resultCadence.textContent = '—';
      resultGearRatio.textContent = '—';
      resultDevelopment.textContent = '—';
      resultCircumference.textContent = '—';
      updateTable(null, null);
      return;
    }

    const developmentM = (circumferenceMm / 1000) * gearRatio;
    resultGearRatio.textContent = (Math.round(gearRatio * 100) / 100).toFixed(2) + ':1';
    resultDevelopment.textContent = (Math.round(developmentM * 100) / 100).toFixed(2) + ' m/rev';
    resultCircumference.textContent = Math.round(circumferenceMm) + ' mm';

    let cadence = parsePositive(cadenceInput.value);
    let speedKmh;

    if (activeField === 'speed') {
      const speedVal = parsePositive(speedInput.value);
      if (speedVal != null) {
        speedKmh = speedUnit === 'kmh' ? speedVal : speedVal / KMH_TO_MPH;
        cadence = cadenceFromSpeedKmh(speedKmh, circumferenceMm, gearRatio);
        if (cadence != null) cadenceInput.value = String(Math.round(cadence));
      }
    } else {
      if (cadence != null) {
        speedKmh = speedKmhFromCadence(cadence, circumferenceMm, gearRatio);
        const displaySpeed = speedUnit === 'kmh' ? speedKmh : speedKmh * KMH_TO_MPH;
        speedInput.value = formatSpeed(displaySpeed, speedUnit);
      }
    }

    if (cadence == null) cadence = parsePositive(cadenceInput.value);
    if (speedKmh == null) {
      const speedVal = parsePositive(speedInput.value);
      if (speedVal != null) {
        speedKmh = speedUnit === 'kmh' ? speedVal : speedVal / KMH_TO_MPH;
      } else if (cadence != null) {
        speedKmh = speedKmhFromCadence(cadence, circumferenceMm, gearRatio);
      }
    }

    resultSpeedKmh.textContent = speedKmh != null ? formatSpeed(speedKmh, 'kmh') + ' km/h' : '—';
    resultSpeedMph.textContent = speedKmh != null ? formatSpeed(speedKmh * KMH_TO_MPH, 'mph') + ' mph' : '—';
    resultCadence.textContent = cadence != null ? formatRpm(cadence) + ' RPM' : '—';

    syncPresetSelect();
    updateTable(circumferenceMm, gearRatio);
  }

  form.querySelectorAll('.unit-btn[data-dim]').forEach(function (btn) {
    btn.addEventListener('click', function () { setDimUnit(btn.dataset.dim); });
  });

  form.querySelectorAll('.unit-btn[data-speed]').forEach(function (btn) {
    btn.addEventListener('click', function () { setSpeedUnit(btn.dataset.speed); });
  });

  if (wheelPreset) {
    wheelPreset.addEventListener('change', function () {
      if (wheelPreset.value !== 'custom') applyPreset(wheelPreset.value);
    });
  }

  cadenceInput.addEventListener('input', function () {
    activeField = 'cadence';
    runCalculation();
  });

  speedInput.addEventListener('input', function () {
    activeField = 'speed';
    runCalculation();
  });

  [rimInput, tireInput, chainringInput, cogInput].forEach(function (el) {
    el.addEventListener('input', runCalculation);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCalculation();
  });

  runCalculation();
})();
