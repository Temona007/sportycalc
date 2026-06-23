/**
 * Sports Wager Calculator - SportyCalc
 * Converts odds formats, calculates payout/profit, implied probability, and parlays.
 */
(function () {
  'use strict';

  /** @returns {number|null} Decimal odds (includes stake return), or null if invalid */
  function americanToDecimal(american) {
    const n = parseFloat(american);
    if (isNaN(n) || n === 0) return null;
    if (n > 0) return 1 + n / 100;
    return 1 + 100 / Math.abs(n);
  }

  /** @returns {number|null} */
  function fractionalToDecimal(num, den) {
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (isNaN(n) || isNaN(d) || n <= 0 || d <= 0) return null;
    return 1 + n / d;
  }

  /** @returns {number|null} */
  function parseDecimalOdds(value) {
    const d = parseFloat(value);
    if (isNaN(d) || d <= 1) return null;
    return d;
  }

  /**
   * @param {'american'|'decimal'|'fractional'} format
   * @param {string} primary - odds value or numerator
   * @param {string} [secondary] - denominator for fractional
   */
  function parseOdds(format, primary, secondary) {
    if (format === 'american') return americanToDecimal(primary);
    if (format === 'decimal') return parseDecimalOdds(primary);
    return fractionalToDecimal(primary, secondary);
  }

  /** Implied win probability from decimal odds (0–100). */
  function impliedProbability(decimal) {
    if (!decimal || decimal <= 0) return null;
    return (1 / decimal) * 100;
  }

  /** @returns {{ profit: number, payout: number, decimal: number, impliedPct: number }} */
  function calcSingleBet(stake, decimal) {
    if (!decimal || decimal <= 1 || stake <= 0) return null;
    const profit = stake * (decimal - 1);
    const payout = stake * decimal;
    return {
      profit,
      payout,
      decimal,
      impliedPct: impliedProbability(decimal)
    };
  }

  /** @returns {{ profit: number, payout: number, decimal: number, impliedPct: number, legs: number }} */
  function calcParlay(stake, decimals) {
    const valid = decimals.filter(d => d && d > 1);
    if (valid.length < 2 || stake <= 0) return null;
    const combined = valid.reduce((acc, d) => acc * d, 1);
    const profit = stake * (combined - 1);
    const payout = stake * combined;
    return {
      profit,
      payout,
      decimal: combined,
      impliedPct: impliedProbability(combined),
      legs: valid.length
    };
  }

  function decimalToAmerican(decimal) {
    if (!decimal || decimal <= 1) return '—';
    if (decimal >= 2) {
      const american = Math.round((decimal - 1) * 100);
      return '+' + american;
    }
    const american = Math.round(-100 / (decimal - 1));
    return String(american);
  }

  function decimalToFractional(decimal) {
    if (!decimal || decimal <= 1) return '—';
    const profitRatio = decimal - 1;
    let bestNum = 1;
    let bestDen = 1;
    let bestErr = Infinity;
    for (let den = 1; den <= 20; den++) {
      const num = Math.round(profitRatio * den);
      if (num <= 0) continue;
      const err = Math.abs(profitRatio - num / den);
      if (err < bestErr) {
        bestErr = err;
        bestNum = num;
        bestDen = den;
      }
    }
    return bestNum + '/' + bestDen;
  }

  function formatMoney(n) {
    if (n == null || isNaN(n)) return '—';
    return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPct(n) {
    if (n == null || isNaN(n)) return '—';
    return n.toFixed(2) + '%';
  }

  function formatDecimal(n) {
    if (n == null || isNaN(n)) return '—';
    return n.toFixed(3);
  }

  const form = document.getElementById('wager-form');
  if (!form) return;

  const stakeInput = document.getElementById('stake');
  const oddsFormatSelect = document.getElementById('odds-format');
  const betTypeSelect = document.getElementById('bet-type');
  const oddsPrimary = document.getElementById('odds-primary');
  const oddsSecondaryGroup = document.getElementById('odds-secondary-group');
  const oddsSecondary = document.getElementById('odds-secondary');
  const parlaySection = document.getElementById('parlay-legs');
  const parlayLegsContainer = document.getElementById('parlay-legs-container');
  const addLegBtn = document.getElementById('add-parlay-leg');

  const resultProfit = document.getElementById('result-profit');
  const resultPayout = document.getElementById('result-payout');
  const resultDecimal = document.getElementById('result-decimal');
  const resultAmerican = document.getElementById('result-american');
  const resultFractional = document.getElementById('result-fractional');
  const resultImplied = document.getElementById('result-implied');
  const resultBreakeven = document.getElementById('result-breakeven');
  const parlaySummary = document.getElementById('parlay-summary');

  let parlayLegCount = 2;

  function getFormat() {
    return oddsFormatSelect?.value || 'american';
  }

  function isParlay() {
    return betTypeSelect?.value === 'parlay';
  }

  function updateOddsInputsUI() {
    const format = getFormat();
    if (oddsSecondaryGroup) {
      oddsSecondaryGroup.style.display = format === 'fractional' ? '' : 'none';
    }
    if (oddsPrimary) {
      if (format === 'american') {
        oddsPrimary.placeholder = '-110 or +150';
        oddsPrimary.step = '1';
      } else if (format === 'decimal') {
        oddsPrimary.placeholder = '2.50';
        oddsPrimary.step = '0.01';
      } else {
        oddsPrimary.placeholder = '5';
        oddsPrimary.step = '1';
      }
    }
    if (parlaySection) {
      parlaySection.style.display = isParlay() ? '' : 'none';
    }
    const singleOddsGroup = document.getElementById('single-odds-group');
    if (singleOddsGroup) {
      singleOddsGroup.style.display = isParlay() ? 'none' : '';
    }
  }

  function createParlayLeg(index) {
    const format = getFormat();
    const wrap = document.createElement('div');
    wrap.className = 'input-row parlay-leg-row';
    wrap.dataset.leg = String(index);
    wrap.innerHTML =
      '<div class="input-group">' +
        '<label>Leg ' + index + ' odds</label>' +
        '<input type="number" class="parlay-leg-odds" data-leg="' + index + '" ' +
          'value="' + (index === 1 ? '-110' : index === 2 ? '+150' : '-110') + '" ' +
          'placeholder="' + (format === 'american' ? '-110' : format === 'decimal' ? '1.91' : '10/11') + '">' +
      '</div>' +
      (format === 'fractional'
        ? '<div class="input-group"><label>Denominator</label><input type="number" class="parlay-leg-den" min="1" value="11"></div>'
        : '') +
      (index > 2
        ? '<button type="button" class="calc-btn calc-btn-secondary remove-leg-btn" data-leg="' + index + '">Remove</button>'
        : '');
    return wrap;
  }

  function rebuildParlayLegs() {
    if (!parlayLegsContainer) return;
    parlayLegsContainer.innerHTML = '';
    for (let i = 1; i <= parlayLegCount; i++) {
      parlayLegsContainer.appendChild(createParlayLeg(i));
    }
    parlayLegsContainer.querySelectorAll('.remove-leg-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        if (parlayLegCount <= 2) return;
        parlayLegCount--;
        rebuildParlayLegs();
        calculate();
      });
    });
    parlayLegsContainer.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', calculate);
      input.addEventListener('change', calculate);
    });
  }

  function readParlayDecimals() {
    const format = getFormat();
    const rows = parlayLegsContainer?.querySelectorAll('.parlay-leg-row') || [];
    const decimals = [];
    rows.forEach(row => {
      const primary = row.querySelector('.parlay-leg-odds')?.value;
      const den = row.querySelector('.parlay-leg-den')?.value;
      const d = parseOdds(format, primary, den);
      if (d) decimals.push(d);
    });
    return decimals;
  }

  function clearResults() {
    [resultProfit, resultPayout, resultDecimal, resultAmerican, resultFractional, resultImplied, resultBreakeven].forEach(el => {
      if (el) el.textContent = '—';
    });
    if (parlaySummary) parlaySummary.textContent = '';
  }

  function calculate() {
    const stake = parseFloat(stakeInput?.value) || 0;
    const format = getFormat();

    if (stake <= 0) {
      clearResults();
      return;
    }

    let result;

    if (isParlay()) {
      const decimals = readParlayDecimals();
      result = calcParlay(stake, decimals);
      if (parlaySummary) {
        parlaySummary.textContent = result
          ? decimals.length + ' legs combined'
          : decimals.length < 2 ? 'Add at least 2 valid legs' : '';
      }
    } else {
      const decimal = parseOdds(format, oddsPrimary?.value, oddsSecondary?.value);
      result = calcSingleBet(stake, decimal);
      if (parlaySummary) parlaySummary.textContent = '';
    }

    if (!result) {
      clearResults();
      return;
    }

    if (resultProfit) resultProfit.textContent = formatMoney(result.profit);
    if (resultPayout) resultPayout.textContent = formatMoney(result.payout);
    if (resultDecimal) resultDecimal.textContent = formatDecimal(result.decimal);
    if (resultAmerican) resultAmerican.textContent = decimalToAmerican(result.decimal);
    if (resultFractional) resultFractional.textContent = decimalToFractional(result.decimal);
    if (resultImplied) resultImplied.textContent = formatPct(result.impliedPct);
    if (resultBreakeven) resultBreakeven.textContent = formatPct(result.impliedPct);
  }

  oddsFormatSelect?.addEventListener('change', function () {
    rebuildParlayLegs();
    updateOddsInputsUI();
    calculate();
  });

  betTypeSelect?.addEventListener('change', function () {
    updateOddsInputsUI();
    calculate();
  });

  addLegBtn?.addEventListener('click', function () {
    if (parlayLegCount >= 8) return;
    parlayLegCount++;
    rebuildParlayLegs();
    calculate();
  });

  [stakeInput, oddsPrimary, oddsSecondary].forEach(el => {
    el?.addEventListener('input', calculate);
    el?.addEventListener('change', calculate);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    calculate();
  });

  rebuildParlayLegs();
  updateOddsInputsUI();
  calculate();

  // Expose for verification tests in Node (optional)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      americanToDecimal,
      fractionalToDecimal,
      parseDecimalOdds,
      parseOdds,
      impliedProbability,
      calcSingleBet,
      calcParlay,
      decimalToAmerican,
      decimalToFractional
    };
  }
})();
