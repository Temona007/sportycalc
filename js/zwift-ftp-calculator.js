/**
 * Zwift FTP & VO2 Max Calculator
 * MAP = last completed stage + (unfinished / step duration) × step size
 * FTP = MAP × protocol factor (0.75 or 0.825)
 * VO2max (L/min) = 0.01141 × MAP + 0.435  (Hawley & Noakes 1992)
 */
(function () {
  'use strict';

  const LB_PER_KG = 2.20462;

  const PROTOCOLS = {
    male: { id: 'male', name: 'Non-elite male', stepWatts: 25, stepSeconds: 60, ftpFactor: 0.75, startWatts: 100 },
    female: { id: 'female', name: 'Female', stepWatts: 15, stepSeconds: 60, ftpFactor: 0.75, startWatts: 50 },
    elite: { id: 'elite', name: 'Elite male', stepWatts: 20, stepSeconds: 60, ftpFactor: 0.75, startWatts: 100 },
    gplama: { id: 'gplama', name: 'GP Lama', stepWatts: 25, stepSeconds: 150, ftpFactor: 0.825, startWatts: 100 }
  };

  const COGGAN_ZONES = [
    { id: 1, name: 'Active recovery', lo: 0, hi: 0.55 },
    { id: 2, name: 'Endurance', lo: 0.56, hi: 0.75 },
    { id: 3, name: 'Tempo', lo: 0.76, hi: 0.90 },
    { id: 4, name: 'Threshold', lo: 0.91, hi: 1.05 },
    { id: 5, name: 'VO2 max', lo: 1.06, hi: 1.20 },
    { id: 6, name: 'Anaerobic', lo: 1.21, hi: 1.50 },
    { id: 7, name: 'Neuromuscular', lo: 1.51, hi: null }
  ];

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function calcMap(lastCompletedWatts, unfinishedSeconds, stepWatts, stepSeconds) {
    if (!(lastCompletedWatts > 0) || !(stepWatts > 0) || !(stepSeconds > 0)) return null;
    const unfinished = clamp(Number(unfinishedSeconds) || 0, 0, stepSeconds);
    return lastCompletedWatts + (unfinished / stepSeconds) * stepWatts;
  }

  function calcFtp(mapWatts, ftpFactor) {
    if (!(mapWatts > 0) || !(ftpFactor > 0)) return null;
    return mapWatts * ftpFactor;
  }

  function calcVo2LMin(mapWatts) {
    if (!(mapWatts > 0)) return null;
    return 0.01141 * mapWatts + 0.435;
  }

  function calcVo2Rel(vo2LMin, weightKg) {
    if (!(vo2LMin > 0) || !(weightKg > 0)) return null;
    return (vo2LMin * 1000) / weightKg;
  }

  function calcTwentyMinTarget(ftpWatts) {
    if (!(ftpWatts > 0)) return null;
    return ftpWatts / 0.95;
  }

  function zoneWatts(ftpWatts) {
    if (!(ftpWatts > 0)) return [];
    return COGGAN_ZONES.map((z) => ({
      id: z.id,
      name: z.name,
      lo: Math.round(ftpWatts * z.lo),
      hi: z.hi == null ? null : Math.round(ftpWatts * z.hi)
    }));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function formatWatts(n) {
    if (!Number.isFinite(n)) return '—';
    return String(Math.round(n));
  }

  function formatDecimal(n, digits) {
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(digits);
  }

  function xmlEscape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildZwo(protocol) {
    const start = protocol.startWatts;
    const step = protocol.stepWatts;
    const dur = protocol.stepSeconds;
    const top = Math.max(start + step * 20, 500);
    const steps = [];
    for (let w = start; w <= top; w += step) {
      steps.push('    <SteadyState Duration="' + dur + '" Power="' + (w / 100).toFixed(2) + '"/>');
    }
    const name = 'SportyCalc Ramp — ' + protocol.name;
    const desc = protocol.stepWatts + 'W steps, ' + protocol.stepSeconds + 's each. Set Zwift FTP to 100W before starting so ERG targets are absolute watts.';
    return [
      '<workout_file>',
      '  <author>SportyCalc</author>',
      '  <name>' + xmlEscape(name) + '</name>',
      '  <description>' + xmlEscape(desc) + '</description>',
      '  <sportType>bike</sportType>',
      '  <tags>',
      '    <tag name="FTP"/>',
      '    <tag name="Ramp Test"/>',
      '  </tags>',
      '  <workout>',
      '    <Warmup Duration="300" PowerLow="0.50" PowerHigh="1.00"/>',
      steps.join('\n'),
      '  </workout>',
      '</workout_file>',
      ''
    ].join('\n');
  }

  const api = {
    PROTOCOLS,
    COGGAN_ZONES,
    calcMap,
    calcFtp,
    calcVo2LMin,
    calcVo2Rel,
    calcTwentyMinTarget,
    zoneWatts,
    buildZwo
  };
  if (typeof window !== 'undefined') window.__zwiftFtp = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  const form = document.getElementById('zwift-ftp-form');
  if (!form) return;

  const lastInput = document.getElementById('zwift-last-stage');
  const unfinishedInput = document.getElementById('zwift-unfinished');
  const unfinishedHint = document.getElementById('zwift-unfinished-hint');
  const weightInput = document.getElementById('zwift-weight');
  const stepWattsInput = document.getElementById('zwift-step-watts');
  const stepSecondsInput = document.getElementById('zwift-step-seconds');
  const ftpFactorInput = document.getElementById('zwift-ftp-factor');
  const startWattsInput = document.getElementById('zwift-start-watts');
  const protoBtns = form.querySelectorAll('[data-zwift-protocol]');
  const unitBtns = form.querySelectorAll('.unit-btn[data-unit]');
  const downloadBtn = document.getElementById('zwift-download-zwo');

  const els = {
    ftp: document.getElementById('zwift-result-ftp'),
    map: document.getElementById('zwift-result-map'),
    ftpKg: document.getElementById('zwift-result-ftp-kg'),
    mapKg: document.getElementById('zwift-result-map-kg'),
    vo2l: document.getElementById('zwift-result-vo2l'),
    vo2rel: document.getElementById('zwift-result-vo2rel'),
    twenty: document.getElementById('zwift-result-20min'),
    protocol: document.getElementById('zwift-result-protocol'),
    zones: document.getElementById('zwift-zones-body')
  };

  let currentProtocol = 'male';

  function getProtocol() {
    const preset = PROTOCOLS[currentProtocol] || PROTOCOLS.male;
    return {
      id: currentProtocol,
      name: currentProtocol === 'custom' ? 'Custom' : preset.name,
      stepWatts: parseFloat(stepWattsInput.value) || preset.stepWatts,
      stepSeconds: parseFloat(stepSecondsInput.value) || preset.stepSeconds,
      ftpFactor: (parseFloat(ftpFactorInput.value) || preset.ftpFactor * 100) / 100,
      startWatts: parseFloat(startWattsInput.value) || preset.startWatts
    };
  }

  function applyProtocol(id) {
    const p = PROTOCOLS[id];
    if (!p) return;
    currentProtocol = id;
    stepWattsInput.value = String(p.stepWatts);
    stepSecondsInput.value = String(p.stepSeconds);
    ftpFactorInput.value = String(round1(p.ftpFactor * 100));
    startWattsInput.value = String(p.startWatts);
    unfinishedInput.max = String(p.stepSeconds);
    if (unfinishedHint) {
      unfinishedHint.textContent = 'Seconds into the final incomplete stage (0–' + p.stepSeconds + ').';
    }
    protoBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.zwiftProtocol === id));
  }

  function getWeightKg() {
    const raw = parseFloat(weightInput.value);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const unit = form.querySelector('.unit-btn.active')?.dataset?.unit || 'kg';
    return unit === 'lb' ? raw / LB_PER_KG : raw;
  }

  function updateUI() {
    const proto = getProtocol();
    const last = parseFloat(lastInput.value);
    const unfinished = parseFloat(unfinishedInput.value) || 0;
    const map = calcMap(last, unfinished, proto.stepWatts, proto.stepSeconds);
    const ftp = calcFtp(map, proto.ftpFactor);
    const vo2l = calcVo2LMin(map);
    const weightKg = getWeightKg();
    const vo2rel = calcVo2Rel(vo2l, weightKg);
    const twenty = calcTwentyMinTarget(ftp);

    if (els.ftp) els.ftp.textContent = formatWatts(ftp);
    if (els.map) els.map.textContent = formatWatts(map);
    if (els.ftpKg) els.ftpKg.textContent = weightKg && ftp ? formatDecimal(ftp / weightKg, 2) : '—';
    if (els.mapKg) els.mapKg.textContent = weightKg && map ? formatDecimal(map / weightKg, 2) : '—';
    if (els.vo2l) els.vo2l.textContent = vo2l ? formatDecimal(vo2l, 2) : '—';
    if (els.vo2rel) els.vo2rel.textContent = vo2rel ? formatDecimal(vo2rel, 1) : '—';
    if (els.twenty) els.twenty.textContent = formatWatts(twenty);
    if (els.protocol) els.protocol.textContent = proto.name + ' · ' + round1(proto.ftpFactor * 100) + '%';

    if (els.zones) {
      const zones = zoneWatts(ftp);
      els.zones.innerHTML = zones.length
        ? zones.map((z) => {
            const range = z.hi == null ? z.lo + '+ W' : z.lo + '–' + z.hi + ' W';
            return '<tr><td>Z' + z.id + ' ' + z.name + '</td><td>' + range + '</td></tr>';
          }).join('')
        : '<tr><td colspan="2">—</td></tr>';
    }
  }

  protoBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyProtocol(btn.dataset.zwiftProtocol);
      updateUI();
    });
  });

  unitBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      unitBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const unitLabel = document.getElementById('zwift-weight-unit');
      if (unitLabel) unitLabel.textContent = btn.dataset.unit;
      updateUI();
    });
  });

  [stepWattsInput, stepSecondsInput, ftpFactorInput, startWattsInput].forEach((el) => {
    el.addEventListener('input', () => {
      currentProtocol = 'custom';
      protoBtns.forEach((btn) => btn.classList.remove('active'));
      const secs = parseFloat(stepSecondsInput.value) || 60;
      unfinishedInput.max = String(secs);
      if (unfinishedHint) unfinishedHint.textContent = 'Seconds into the final incomplete stage (0–' + secs + ').';
      updateUI();
    });
  });

  [lastInput, unfinishedInput, weightInput].forEach((el) => {
    el.addEventListener('input', updateUI);
    el.addEventListener('change', updateUI);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUI();
  });

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const proto = getProtocol();
      const blob = new Blob([buildZwo(proto)], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sportycalc-ramp-' + (proto.id || 'custom') + '.zwo';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  applyProtocol('male');
  updateUI();
})();
