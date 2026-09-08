/**
 * Bowling Score Calculator - SportyCalc
 * Ten-pin scoring: 10 frames, strike (X) + next 2 rolls, spare (/) + next 1 roll.
 */
(function () {
  'use strict';

  function markPin(n) {
    return n === 0 ? '-' : String(n);
  }

  function tenthMarks(tenth) {
    const marks = ['', '', ''];
    if (!tenth.length) return marks;

    if (tenth[0] === 10) {
      marks[0] = 'X';
      if (tenth[1] === 10) {
        marks[1] = 'X';
        if (tenth[2] === 10) marks[2] = 'X';
        else if (tenth[2] !== undefined) marks[2] = markPin(tenth[2]);
      } else if (tenth[1] !== undefined) {
        marks[1] = markPin(tenth[1]);
        if (tenth[2] !== undefined) {
          marks[2] = tenth[1] + tenth[2] === 10 ? '/' : markPin(tenth[2]);
        }
      }
    } else {
      marks[0] = markPin(tenth[0]);
      if (tenth[1] !== undefined) {
        if (tenth[0] + tenth[1] === 10) {
          marks[1] = '/';
          if (tenth[2] === 10) marks[2] = 'X';
          else if (tenth[2] !== undefined) marks[2] = markPin(tenth[2]);
        } else {
          marks[1] = markPin(tenth[1]);
        }
      }
    }
    return marks;
  }

  function nextRollContext(rolls) {
    let i = 0;
    for (let f = 0; f < 9; f++) {
      if (i >= rolls.length) {
        return { frame: f, rollInFrame: 0, pinsStanding: 10, firstBall: true, gameOver: false };
      }
      if (rolls[i] === 10) {
        i += 1;
      } else if (i + 1 >= rolls.length) {
        return { frame: f, rollInFrame: 1, pinsStanding: 10 - rolls[i], firstBall: false, gameOver: false };
      } else {
        i += 2;
      }
    }

    const tenth = rolls.slice(i);
    if (tenth.length === 0) {
      return { frame: 9, rollInFrame: 0, pinsStanding: 10, firstBall: true, gameOver: false };
    }
    if (tenth.length === 1) {
      if (tenth[0] === 10) {
        return { frame: 9, rollInFrame: 1, pinsStanding: 10, firstBall: true, gameOver: false };
      }
      return { frame: 9, rollInFrame: 1, pinsStanding: 10 - tenth[0], firstBall: false, gameOver: false };
    }
    if (tenth.length === 2) {
      const r1 = tenth[0];
      const r2 = tenth[1];
      const strike = r1 === 10;
      const spare = !strike && r1 + r2 === 10;
      if (!strike && !spare) {
        return { frame: 9, rollInFrame: 2, pinsStanding: 0, firstBall: false, gameOver: true };
      }
      if (strike && r2 === 10) {
        return { frame: 9, rollInFrame: 2, pinsStanding: 10, firstBall: true, gameOver: false };
      }
      if (strike) {
        return { frame: 9, rollInFrame: 2, pinsStanding: 10 - r2, firstBall: false, gameOver: false };
      }
      return { frame: 9, rollInFrame: 2, pinsStanding: 10, firstBall: true, gameOver: false };
    }
    return { frame: 9, rollInFrame: 3, pinsStanding: 0, firstBall: false, gameOver: true };
  }

  function analyze(rolls) {
    const frames = [];
    let i = 0;

    for (let f = 0; f < 9; f++) {
      if (i >= rolls.length) {
        frames.push({ rolls: [], marks: ['', ''], framePins: null, type: 'empty' });
        continue;
      }
      if (rolls[i] === 10) {
        const b1 = rolls[i + 1];
        const b2 = rolls[i + 2];
        const complete = b1 !== undefined && b2 !== undefined;
        frames.push({
          rolls: [10],
          marks: ['', 'X'],
          framePins: complete ? 10 + b1 + b2 : null,
          type: complete ? 'strike' : 'incomplete'
        });
        i += 1;
      } else {
        const r1 = rolls[i];
        const r2 = rolls[i + 1];
        if (r2 === undefined) {
          frames.push({
            rolls: [r1],
            marks: [markPin(r1), ''],
            framePins: null,
            type: 'incomplete'
          });
          i += 1;
        } else if (r1 + r2 === 10) {
          const b1 = rolls[i + 2];
          const complete = b1 !== undefined;
          frames.push({
            rolls: [r1, r2],
            marks: [markPin(r1), '/'],
            framePins: complete ? 10 + b1 : null,
            type: complete ? 'spare' : 'incomplete'
          });
          i += 2;
        } else {
          frames.push({
            rolls: [r1, r2],
            marks: [markPin(r1), markPin(r2)],
            framePins: r1 + r2,
            type: 'open'
          });
          i += 2;
        }
      }
    }

    const tenth = rolls.slice(i);
    const tenthNeeded = (function () {
      if (tenth.length === 0) return 2;
      if (tenth.length === 1) return tenth[0] === 10 ? 3 : 2;
      if (tenth[0] === 10 || tenth[0] + tenth[1] === 10) return 3;
      return 2;
    })();
    const tenthComplete = tenth.length >= tenthNeeded && tenth.length > 0;
    const tenthSum = tenthComplete ? tenth.slice(0, tenthNeeded).reduce(function (a, b) { return a + b; }, 0) : null;
    let tenthType = 'empty';
    if (tenth.length) {
      if (!tenthComplete) tenthType = 'incomplete';
      else if (tenth[0] === 10) tenthType = 'strike';
      else if (tenth[0] + tenth[1] === 10) tenthType = 'spare';
      else tenthType = 'open';
    }

    frames.push({
      rolls: tenth.slice(),
      marks: tenthMarks(tenth),
      framePins: tenthSum,
      type: tenthType
    });

    let running = 0;
    let scored = true;
    frames.forEach(function (fr) {
      if (scored && fr.framePins != null) {
        running += fr.framePins;
        fr.score = running;
      } else {
        scored = false;
        fr.score = null;
      }
    });

    const ctx = nextRollContext(rolls);
    const strikes = frames.filter(function (fr) { return fr.type === 'strike'; }).length;
    const spares = frames.filter(function (fr) { return fr.type === 'spare'; }).length;
    const opens = frames.filter(function (fr) { return fr.type === 'open'; }).length;
    const pinsDown = rolls.reduce(function (a, b) { return a + b; }, 0);

    return {
      frames: frames,
      total: running,
      context: ctx,
      strikes: strikes,
      spares: spares,
      opens: opens,
      pinsDown: pinsDown
    };
  }

  function canPress(ctx, value) {
    if (ctx.gameOver) return false;
    if (value === 'X') return ctx.firstBall && ctx.pinsStanding === 10;
    if (value === '/') return !ctx.firstBall && ctx.pinsStanding > 0;
    const n = Number(value);
    if (n > ctx.pinsStanding) return false;
    if (!ctx.firstBall && n === ctx.pinsStanding) return false;
    return true;
  }

  function valueToPins(value, ctx) {
    if (value === 'X') return 10;
    if (value === '/') return ctx.pinsStanding;
    return Number(value);
  }

  const api = { analyze: analyze, nextRollContext: nextRollContext, canPress: canPress, valueToPins: valueToPins };
  if (typeof window !== 'undefined') window.__bowlingScore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document === 'undefined') return;

  const boardEl = document.getElementById('bowl-board');
  const padEl = document.getElementById('bowl-pad');
  const scoreEl = document.getElementById('bowl-score');
  const statusEl = document.getElementById('bowl-status');
  const undoBtn = document.getElementById('bowl-undo');
  const newBtn = document.getElementById('bowl-new');
  if (!boardEl || !padEl || !scoreEl) return;

  const statScore = document.getElementById('bowl-stat-score');
  const statFrame = document.getElementById('bowl-stat-frame');
  const statThrow = document.getElementById('bowl-stat-throw');
  const statStrikes = document.getElementById('bowl-stat-strikes');
  const statSpares = document.getElementById('bowl-stat-spares');
  const statOpen = document.getElementById('bowl-stat-open');
  const statPins = document.getElementById('bowl-stat-pins');

  let rolls = [];

  function renderBoard(state) {
    boardEl.innerHTML = '';
    state.frames.forEach(function (fr, idx) {
      const frame = document.createElement('div');
      const isCurrent = !state.context.gameOver && state.context.frame === idx;
      frame.className = 'bowl-frame' + (idx === 9 ? ' bowl-frame-tenth' : '') + (isCurrent ? ' bowl-frame-current' : '');

      const num = document.createElement('div');
      num.className = 'bowl-frame-num';
      num.textContent = String(idx + 1);
      frame.appendChild(num);

      const rollsRow = document.createElement('div');
      rollsRow.className = 'bowl-frame-rolls';
      const cells = idx === 9 ? 3 : 2;
      for (let c = 0; c < cells; c++) {
        const cell = document.createElement('span');
        cell.className = 'bowl-roll' + (fr.marks[c] === 'X' || fr.marks[c] === '/' ? ' bowl-roll-mark' : '');
        cell.textContent = fr.marks[c] || '';
        rollsRow.appendChild(cell);
      }
      frame.appendChild(rollsRow);

      const total = document.createElement('div');
      total.className = 'bowl-frame-score';
      total.textContent = fr.score != null ? String(fr.score) : '';
      frame.appendChild(total);

      boardEl.appendChild(frame);
    });
  }

  function renderPad(ctx) {
    padEl.querySelectorAll('[data-bowl]').forEach(function (btn) {
      const ok = canPress(ctx, btn.getAttribute('data-bowl'));
      btn.disabled = !ok;
    });
    undoBtn.disabled = rolls.length === 0;
  }

  function renderStats(state) {
    const ctx = state.context;
    scoreEl.textContent = String(state.total);
    if (statScore) statScore.textContent = String(state.total);
    if (statFrame) statFrame.textContent = ctx.gameOver ? '10 / 10' : (ctx.frame + 1) + ' / 10';
    if (statThrow) {
      statThrow.textContent = ctx.gameOver ? '—' : String(ctx.rollInFrame + 1);
    }
    if (statStrikes) statStrikes.textContent = String(state.strikes);
    if (statSpares) statSpares.textContent = String(state.spares);
    if (statOpen) statOpen.textContent = String(state.opens);
    if (statPins) statPins.textContent = String(state.pinsDown);

    if (ctx.gameOver) {
      statusEl.textContent = state.total === 300 ? 'Perfect game' : 'Game complete';
    } else if (rolls.length === 0) {
      statusEl.textContent = 'Frame 1 · throw 1';
    } else {
      statusEl.textContent = 'Frame ' + (ctx.frame + 1) + ' · throw ' + (ctx.rollInFrame + 1);
    }
  }

  function render() {
    const state = analyze(rolls);
    renderBoard(state);
    renderPad(state.context);
    renderStats(state);
  }

  function pushValue(value) {
    const ctx = nextRollContext(rolls);
    if (!canPress(ctx, value)) return;
    rolls.push(valueToPins(value, ctx));
    render();
  }

  padEl.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-bowl]');
    if (!btn || btn.disabled) return;
    pushValue(btn.getAttribute('data-bowl'));
  });

  undoBtn.addEventListener('click', function () {
    if (!rolls.length) return;
    rolls.pop();
    render();
  });

  newBtn.addEventListener('click', function () {
    rolls = [];
    render();
  });

  document.addEventListener('keydown', function (e) {
    if (/^(input|textarea|select)$/i.test(document.activeElement && document.activeElement.tagName)) return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      pushValue(e.key);
    } else if (e.key === '/' || e.key === '-') {
      e.preventDefault();
      pushValue('/');
    } else if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      pushValue('X');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      undoBtn.click();
    } else if (e.key === 'n' || e.key === 'N') {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      newBtn.click();
    }
  });

  render();
})();
