/**
 * Bra Size Calculator - SportyCalc
 * Based on standard US/UK, EU EN 13402, FR/BE/ES, and AU/NZ sizing tables.
 * Reference: https://www.calculator.net/bra-size-calculator.html
 */

(function () {
  'use strict';

  const form = document.getElementById('bra-form');
  if (!form) return;

  const bustInput = document.getElementById('bust');
  const bandInput = document.getElementById('band');
  const bustUnitEl = document.getElementById('bust-unit');
  const bandUnitEl = document.getElementById('band-unit');
  const converterForm = document.getElementById('bra-converter-form');
  const convSystem = document.getElementById('conv-system');
  const convBand = document.getElementById('conv-band');
  const convCup = document.getElementById('conv-cup');

  const US_CUPS = ['AA', 'A', 'B', 'C', 'D', 'DD', 'DDD', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  const UK_CUPS = ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G', 'GG', 'H', 'HH', 'J', 'JJ'];
  const EU_CUPS = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

  let currentUnit = 'imperial';

  function inchesToCm(inches) {
    return inches * 2.54;
  }

  function cmToInches(cm) {
    return cm / 2.54;
  }

  function roundToEvenInches(value) {
    const rounded = Math.round(value);
    return rounded % 2 === 0 ? rounded : rounded + 1;
  }

  function euBandFromUs(usBand) {
    return 60 + ((usBand - 28) / 2) * 5;
  }

  function usBandFromEu(euBand) {
    return 28 + ((euBand - 60) / 5) * 2;
  }

  function frBandFromEu(euBand) {
    return euBand + 15;
  }

  function auBandFromUs(usBand) {
    return usBand - 22;
  }

  function usBandFromPlus4(plus4Band) {
    return roundToEvenInches(plus4Band - 4);
  }

  function plus4BandFromUs(usBand) {
    return roundToEvenInches(usBand + 4);
  }

  function cupFromInchDiff(diff, system) {
    if (diff < 1) return 'AA';
    const list = system === 'uk' ? UK_CUPS : US_CUPS;
    const index = Math.min(diff, list.length - 1);
    return list[index];
  }

  function inchDiffFromCup(cup, system) {
    const list = system === 'uk' || system === 'uk-dress' ? UK_CUPS : US_CUPS;
    const normalized = String(cup || '').trim().toUpperCase().replace(/\s+/g, '');
    const idx = list.indexOf(normalized);
    if (idx >= 0) return idx;
    const euIdx = EU_CUPS.indexOf(normalized);
    if (euIdx >= 0) return euIdx;
    return -1;
  }

  function parseMeasurements() {
    const bustVal = parseFloat(bustInput.value);
    const bandVal = parseFloat(bandInput.value);
    if (!bustVal || !bandVal || bustVal <= 0 || bandVal <= 0) return null;

    const bustIn = currentUnit === 'imperial' ? bustVal : cmToInches(bustVal);
    const underbustIn = currentUnit === 'imperial' ? bandVal : cmToInches(bandVal);
    const bustCm = currentUnit === 'metric' ? bustVal : inchesToCm(bustVal);
    const underbustCm = currentUnit === 'metric' ? bandVal : inchesToCm(bandVal);

    if (bustIn < underbustIn) return null;

    const usBand = roundToEvenInches(underbustIn);
    const usPlus4Band = roundToEvenInches(underbustIn + 4);
    const inchDiff = Math.max(0, Math.round(bustIn) - usBand);
    const cmDiff = bustCm - underbustCm;
    const euBand = euBandFromUs(usBand);
    const euCupIndex = Math.min(Math.max(inchDiff, 0), EU_CUPS.length - 1);

    return {
      bustIn,
      underbustIn,
      bustCm,
      underbustCm,
      usBand,
      usPlus4Band,
      inchDiff,
      cmDiff,
      euBand,
      frBand: frBandFromEu(euBand),
      auBand: auBandFromUs(usBand),
      usCup: cupFromInchDiff(inchDiff, 'us'),
      ukCup: cupFromInchDiff(inchDiff, 'uk'),
      euCup: EU_CUPS[euCupIndex] || EU_CUPS[EU_CUPS.length - 1]
    };
  }

  function formatSize(band, cup) {
    if (!band || !cup) return '—';
    return band + cup;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function updateMeasureResults(data) {
    if (!data) {
      setText('result-us', '—');
      setText('result-uk', '—');
      setText('result-eu', '—');
      setText('result-fr', '—');
      setText('result-au', '—');
      setText('result-us-plus4', '—');
      setText('result-uk-plus4', '—');
      setText('result-uk-dress', '—');
      setText('result-diff-in', '—');
      setText('result-diff-cm', '—');
      setText('result-primary', '—');
      return;
    }

    const us = formatSize(data.usBand, data.usCup);
    const uk = formatSize(data.usBand, data.ukCup);
    const eu = formatSize(data.euBand, data.euCup);
    const fr = formatSize(data.frBand, data.euCup);
    const au = formatSize(data.auBand, data.ukCup);
    const usPlus4 = formatSize(data.usPlus4Band, data.usCup);
    const ukPlus4 = formatSize(data.usPlus4Band, data.ukCup);
    const ukDress = formatSize(data.auBand, data.ukCup);

    setText('result-primary', us);
    setText('result-us', us);
    setText('result-uk', uk);
    setText('result-eu', eu);
    setText('result-fr', fr);
    setText('result-au', au);
    setText('result-us-plus4', usPlus4);
    setText('result-uk-plus4', ukPlus4);
    setText('result-uk-dress', ukDress);
    setText('result-diff-in', data.inchDiff + ' in');
    setText('result-diff-cm', data.cmDiff.toFixed(1) + ' cm');
  }

  function parseConverterInput() {
    const system = convSystem.value;
    const band = parseFloat(convBand.value);
    const cup = convCup.value;
    if (!band || band <= 0 || !cup) return null;

    const inchDiff = inchDiffFromCup(cup, system);
    if (inchDiff < 0) return null;

    let usBand;
    switch (system) {
      case 'us':
      case 'uk':
        usBand = band;
        break;
      case 'eu':
        usBand = usBandFromEu(band);
        break;
      case 'fr':
        usBand = usBandFromEu(band - 15);
        break;
      case 'au':
      case 'uk-dress':
        usBand = band + 22;
        break;
      case 'us-plus4':
      case 'uk-plus4':
        usBand = usBandFromPlus4(band);
        break;
      default:
        usBand = band;
    }

    if (usBand < 24 || usBand > 60) return null;

    const euBand = euBandFromUs(usBand);

    return {
      usBand: Math.round(usBand),
      usPlus4Band: plus4BandFromUs(usBand),
      inchDiff,
      euBand,
      frBand: frBandFromEu(euBand),
      auBand: auBandFromUs(usBand),
      usCup: cupFromInchDiff(inchDiff, 'us'),
      ukCup: cupFromInchDiff(inchDiff, 'uk'),
      euCup: EU_CUPS[Math.min(inchDiff, EU_CUPS.length - 1)] || EU_CUPS[EU_CUPS.length - 1]
    };
  }

  function updateConverterResults(data) {
    const ids = [
      'conv-out-us', 'conv-out-uk', 'conv-out-eu', 'conv-out-fr', 'conv-out-au',
      'conv-out-us-plus4', 'conv-out-uk-plus4', 'conv-out-uk-dress'
    ];
    if (!data) {
      ids.forEach(id => setText(id, '—'));
      return;
    }

    setText('conv-out-us', formatSize(data.usBand, data.usCup));
    setText('conv-out-uk', formatSize(data.usBand, data.ukCup));
    setText('conv-out-eu', formatSize(data.euBand, data.euCup));
    setText('conv-out-fr', formatSize(data.frBand, data.euCup));
    setText('conv-out-au', formatSize(data.auBand, data.ukCup));
    setText('conv-out-us-plus4', formatSize(data.usPlus4Band, data.usCup));
    setText('conv-out-uk-plus4', formatSize(data.usPlus4Band, data.ukCup));
    setText('conv-out-uk-dress', formatSize(data.auBand, data.ukCup));
  }

  function populateCupOptions() {
    if (!convCup) return;
    const system = convSystem.value;
    let cups;
    if (system === 'eu' || system === 'fr') {
      cups = EU_CUPS;
    } else if (system === 'uk' || system === 'uk-dress' || system === 'uk-plus4' || system === 'au') {
      cups = UK_CUPS;
    } else {
      cups = US_CUPS;
    }
    const prev = convCup.value;
    convCup.innerHTML = cups.map(c => '<option value="' + c + '">' + c + '</option>').join('');
    if (cups.includes(prev)) convCup.value = prev;
  }

  function runCalculation() {
    updateMeasureResults(parseMeasurements());
    updateConverterResults(parseConverterInput());
  }

  function handleSubmit(e) {
    e.preventDefault();
    runCalculation();
  }

  function setUnit(unit) {
    currentUnit = unit;
    const metricBtn = form.querySelector('.unit-btn[data-unit="metric"]');
    const imperialBtn = form.querySelector('.unit-btn[data-unit="imperial"]');

    if (unit === 'metric') {
      bustUnitEl.textContent = 'cm';
      bandUnitEl.textContent = 'cm';
      bustInput.placeholder = '91';
      bandInput.placeholder = '81';
      const bustIn = parseFloat(bustInput.value) || 36;
      const bandIn = parseFloat(bandInput.value) || 32;
      bustInput.value = Math.round(inchesToCm(bustIn) * 10) / 10;
      bandInput.value = Math.round(inchesToCm(bandIn) * 10) / 10;
      if (metricBtn) metricBtn.classList.add('active');
      if (imperialBtn) imperialBtn.classList.remove('active');
    } else {
      bustUnitEl.textContent = 'in';
      bandUnitEl.textContent = 'in';
      bustInput.placeholder = '36';
      bandInput.placeholder = '32';
      const bustCm = parseFloat(bustInput.value) || 91;
      const bandCm = parseFloat(bandInput.value) || 81;
      bustInput.value = (Math.round(cmToInches(bustCm) * 10) / 10).toFixed(1);
      bandInput.value = (Math.round(cmToInches(bandCm) * 10) / 10).toFixed(1);
      if (imperialBtn) imperialBtn.classList.add('active');
      if (metricBtn) metricBtn.classList.remove('active');
    }

    runCalculation();
  }

  form.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  form.addEventListener('submit', handleSubmit);
  [bustInput, bandInput].forEach(el => {
    if (el) el.addEventListener('input', runCalculation);
  });

  if (converterForm) {
    converterForm.addEventListener('submit', handleSubmit);
    [convSystem, convBand, convCup].forEach(el => {
      if (el) el.addEventListener('change', runCalculation);
      if (el && el !== convSystem) el.addEventListener('input', runCalculation);
    });
    convSystem.addEventListener('change', () => {
      populateCupOptions();
      runCalculation();
    });
  }

  populateCupOptions();
  if (convBand) convBand.value = '34';
  if (convCup) convCup.value = 'C';
  runCalculation();
})();
