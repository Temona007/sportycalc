/**
 * Calories Burned Calculator
 * Formula: Calories = (Time × MET × Body Weight) / 200
 * (Time in minutes, Body Weight in kg)
 * Reference: calculator.net calories burned calculator
 */
(function() {
  'use strict';

  const LB_PER_KG = 2.20462;

  // MET values from Compendium of Physical Activities / calculator.net
  const ACTIVITIES = {
    'walk-slow': { met: 2.0, name: 'Walking: slow' },
    'walk-moderate': { met: 3.5, name: 'Walking: moderate' },
    'walk-fast': { met: 5.0, name: 'Walking: fast' },
    'walk-very-fast': { met: 6.3, name: 'Walking: very fast' },
    'hike': { met: 6.0, name: 'Hiking: cross-country' },
    'run-slow': { met: 6.0, name: 'Running: slow' },
    'run-moderate': { met: 8.3, name: 'Running: moderate' },
    'run-fast': { met: 9.8, name: 'Running: fast' },
    'run-very-fast': { met: 11.8, name: 'Running: very fast' },
    'run-cross': { met: 9.0, name: 'Running: cross-country' },
    'walk-jog': { met: 6.0, name: 'Walk/Jog: jog <10 min' },
    'cycle-slow': { met: 4.0, name: 'Cycling: slow' },
    'cycle-moderate': { met: 8.0, name: 'Cycling: moderate' },
    'cycle-fast': { met: 12.0, name: 'Cycling: fast' },
    'cycle-bmx': { met: 8.5, name: 'Cycling: BMX or mountain' },
    'cycle-stationary-mod': { met: 5.0, name: 'Cycling, Stationary: moderate' },
    'cycle-stationary-vig': { met: 11.0, name: 'Cycling, Stationary: vigorous' },
    'swim-mod': { met: 5.8, name: 'Swimming: moderate' },
    'swim-vig': { met: 9.8, name: 'Swimming: laps, vigorous' },
    'aerobics-low': { met: 5.0, name: 'Aerobics: low impact' },
    'aerobics-high': { met: 7.0, name: 'Aerobics: high impact' },
    'aerobics-step-low': { met: 5.0, name: 'Aerobics, Step: low impact' },
    'aerobics-step-high': { met: 8.5, name: 'Aerobics, Step: high impact' },
    'aerobics-water': { met: 5.0, name: 'Aerobics: water' },
    'calisthenics-mod': { met: 3.8, name: 'Calisthenics: moderate' },
    'calisthenics-vig': { met: 8.0, name: 'Calisthenics: vigorous' },
    'circuit': { met: 7.0, name: 'Circuit Training: general' },
    'elliptical': { met: 5.0, name: 'Elliptical Trainer: general' },
    'rowing-mod': { met: 5.0, name: 'Rowing, Stationary: moderate' },
    'rowing-vig': { met: 12.0, name: 'Rowing, Stationary: vigorous' },
    'stair-step': { met: 9.0, name: 'Stair Step Machine: general' },
    'ski-machine': { met: 7.0, name: 'Ski Machine: general' },
    'weight-general': { met: 3.0, name: 'Weight Lifting: general' },
    'weight-vig': { met: 6.0, name: 'Weight Lifting: vigorous' },
    'yoga': { met: 2.5, name: 'Stretching, Hatha Yoga' },
    'badminton': { met: 5.5, name: 'Badminton: general' },
    'basketball-game': { met: 8.0, name: 'Basketball: playing a game' },
    'basketball-wheelchair': { met: 7.0, name: 'Basketball: wheelchair' },
    'bowling': { met: 3.0, name: 'Bowling' },
    'boxing': { met: 12.8, name: 'Boxing: sparring' },
    'dance-slow': { met: 2.9, name: 'Dancing: slow, waltz, foxtrot' },
    'dance-disco': { met: 5.5, name: 'Dancing: disco, ballroom, square' },
    'dance-fast': { met: 4.8, name: 'Dancing: Fast, ballet, twist' },
    'fencing': { met: 6.0, name: 'Fencing: general' },
    'football-comp': { met: 9.0, name: 'Football: competitive' },
    'football-touch': { met: 8.0, name: 'Football: touch, flag, general' },
    'frisbee': { met: 3.0, name: 'Frisbee' },
    'golf-cart': { met: 2.5, name: 'Golf: using cart' },
    'golf-carry': { met: 4.8, name: 'Golf: carrying clubs' },
    'gymnastics': { met: 3.8, name: 'Gymnastics: general' },
    'handball': { met: 8.0, name: 'Handball: general' },
    'hockey': { met: 8.0, name: 'Hockey: field & ice' },
    'horseback': { met: 4.0, name: 'Horseback Riding: general' },
    'ice-skate': { met: 5.5, name: 'Ice Skating: general' },
    'kayaking': { met: 5.0, name: 'Kayaking' },
    'martial-arts': { met: 10.3, name: 'Martial Arts: judo, karate, kickbox' },
    'racquetball-casual': { met: 7.0, name: 'Racquetball: casual, general' },
    'racquetball-comp': { met: 10.0, name: 'Racquetball: competitive' },
    'rock-climb-asc': { met: 11.0, name: 'Rock Climbing: ascending' },
    'rock-climb-rapp': { met: 5.0, name: 'Rock Climbing: rappelling' },
    'rollerblade-casual': { met: 5.5, name: 'Rollerblading/skating (Casual)' },
    'rollerblade-fast': { met: 9.8, name: 'Rollerblading/skating (Fast)' },
    'rope-fast': { met: 11.0, name: 'Rope Jumping (Fast)' },
    'rope-slow': { met: 8.8, name: 'Rope Jumping (Slow)' },
    'rugby': { met: 10.0, name: 'Rugby: competitive' },
    'scuba': { met: 7.0, name: 'Scuba or skin diving' },
    'skateboard': { met: 5.0, name: 'Skateboarding' },
    'ski-downhill': { met: 5.3, name: 'Skiing: downhill' },
    'ski-cross': { met: 9.0, name: 'Skiing: cross-country' },
    'sledding': { met: 7.0, name: 'Sledding, luge, toboggan' },
    'snow-shoe': { met: 8.0, name: 'Snow Shoeing' },
    'soccer': { met: 7.0, name: 'Soccer: general' },
    'softball': { met: 5.0, name: 'Softball: general play' },
    'tai-chi': { met: 3.0, name: 'Tai Chi' },
    'tennis': { met: 7.0, name: 'Tennis: general' },
    'volleyball-comp': { met: 8.0, name: 'Volleyball: competitive, gymnasium' },
    'volleyball-beach': { met: 8.0, name: 'Volleyball: beach' },
    'volleyball-casual': { met: 3.0, name: 'Volleyball: non-competitive' },
    'water-polo': { met: 10.0, name: 'Water Polo' },
    'water-ski': { met: 6.0, name: 'Water Skiing' },
    'water-volley': { met: 3.0, name: 'Water Volleyball' },
    'whitewater': { met: 5.0, name: 'Whitewater: rafting, kayaking' },
    'wrestling': { met: 6.0, name: 'Wrestling' },
    'wood-stack': { met: 5.0, name: 'Carrying & stacking wood' },
    'fishing': { met: 3.5, name: 'Fishing' },
    'mow-hand': { met: 6.0, name: 'Mowing Lawn: push, hand' },
    'mow-power': { met: 4.5, name: 'Mowing lawn: push, power' },
    'raking': { met: 4.0, name: 'Raking lawn' },
    'shovel-snow': { met: 6.0, name: 'Shoveling Snow: by hand' },
    'snow-blower': { met: 4.0, name: 'Operate Snow Blower: walking' },
    'chop-wood': { met: 6.0, name: 'Chopping & splitting wood' },
    'gardening': { met: 4.0, name: 'Gardening: general' },
    'cooking': { met: 2.5, name: 'Cooking' },
    'heavy-cleaning': { met: 3.5, name: 'Heavy Cleaning: wash car, windows' },
    'moving-furniture': { met: 6.0, name: 'Moving: household furniture' },
    'moving-boxes': { met: 7.5, name: 'Moving: carrying boxes' },
    'playing-kids': { met: 4.0, name: 'Playing w/kids: moderate effort' },
    'sex': { met: 1.3, name: 'Sex' },
    'standing': { met: 1.3, name: 'Standing in line' },
    'food-shopping': { met: 2.3, name: 'Food Shopping: with cart' },
    'paint-remodel': { met: 4.5, name: 'Paint, paper, remodel: inside' },
    'reading': { met: 1.0, name: 'Reading: sitting' },
    'billiards': { met: 2.5, name: 'Billiards' },
    'sleeping': { met: 0.95, name: 'Sleeping' },
    'tv': { met: 1.0, name: 'Watching TV' }
  };

  function getMet(key) {
    const a = ACTIVITIES[key];
    return a ? a.met : 3.0;
  }

  // Activity icons (emoji) by key – fallback by prefix
  const ACTIVITY_ICONS = {
    'walk-slow': '🚶', 'walk-moderate': '🚶', 'walk-fast': '🚶', 'walk-very-fast': '🚶', 'walk-jog': '🏃',
    'hike': '🥾', 'run-slow': '🏃', 'run-moderate': '🏃', 'run-fast': '🏃', 'run-very-fast': '🏃', 'run-cross': '🏃',
    'cycle-slow': '🚴', 'cycle-moderate': '🚴', 'cycle-fast': '🚴', 'cycle-bmx': '🚴', 'cycle-stationary-mod': '🚴', 'cycle-stationary-vig': '🚴',
    'swim-mod': '🏊', 'swim-vig': '🏊', 'aerobics-low': '💃', 'aerobics-high': '💃', 'aerobics-step-low': '💃', 'aerobics-step-high': '💃', 'aerobics-water': '🏊',
    'calisthenics-mod': '💪', 'calisthenics-vig': '💪', 'circuit': '⚡', 'elliptical': '🏃', 'rowing-mod': '🚣', 'rowing-vig': '🚣',
    'stair-step': '🪜', 'ski-machine': '⛷️', 'weight-general': '💪', 'weight-vig': '💪', 'yoga': '🧘',
    'badminton': '🏸', 'basketball-game': '🏀', 'basketball-wheelchair': '🏀', 'bowling': '🎳', 'boxing': '🥊',
    'dance-slow': '💃', 'dance-disco': '💃', 'dance-fast': '💃', 'fencing': '🤺', 'football-comp': '🏈', 'football-touch': '🏈',
    'frisbee': '🥏', 'golf-cart': '⛳', 'golf-carry': '⛳', 'gymnastics': '🤸', 'handball': '🤾', 'hockey': '🏒',
    'horseback': '🐴', 'ice-skate': '⛸️', 'kayaking': '🛶', 'martial-arts': '🥋', 'racquetball-casual': '🎾', 'racquetball-comp': '🎾',
    'rock-climb-asc': '🧗', 'rock-climb-rapp': '🧗', 'rollerblade-casual': '🛼', 'rollerblade-fast': '🛼',
    'rope-fast': '⛹️', 'rope-slow': '⛹️', 'rugby': '🏉', 'scuba': '🤿', 'skateboard': '🛹', 'ski-downhill': '⛷️', 'ski-cross': '⛷️',
    'sledding': '🛷', 'snow-shoe': '🥾', 'soccer': '⚽', 'softball': '🥎', 'tai-chi': '🧘', 'tennis': '🎾',
    'volleyball-comp': '🏐', 'volleyball-beach': '🏐', 'volleyball-casual': '🏐', 'water-polo': '🤽', 'water-ski': '⛷️',
    'water-volley': '🏐', 'whitewater': '🛶', 'wrestling': '🤼', 'wood-stack': '🪵', 'fishing': '🎣',
    'mow-hand': '🌿', 'mow-power': '🌿', 'raking': '🍂', 'shovel-snow': '❄️', 'snow-blower': '❄️', 'chop-wood': '🪓',
    'gardening': '🌱', 'cooking': '👨‍🍳', 'heavy-cleaning': '🧹', 'moving-furniture': '📦', 'moving-boxes': '📦',
    'playing-kids': '👶', 'sex': '💕', 'standing': '🧍', 'food-shopping': '🛒', 'paint-remodel': '🪣',
    'reading': '📖', 'billiards': '🎱', 'sleeping': '😴', 'tv': '📺'
  };

  function getActivityIcon(key) {
    return ACTIVITY_ICONS[key] || '🔥';
  }

  /**
   * Standard MET formula: 1 MET = 1 kcal/kg/hour
   * Calories = MET × weight(kg) × time(hours) = (Time_min × MET × Weight_kg) / 60
   * Matches scientific consensus (Compendium, NASM, etc.)
   */
  function calcCalories(timeMinutes, met, weightKg) {
    if (!timeMinutes || !met || !weightKg || weightKg <= 0) return null;
    return (timeMinutes * met * weightKg) / 60;
  }

  function runCalc() {
    const form = document.getElementById('calories-burned-form');
    const weightInput = document.getElementById('weight');
    const activitySelect = document.getElementById('activity');
    const hoursInput = document.getElementById('duration-hours');
    const minutesInput = document.getElementById('duration-minutes');

    if (!form || !weightInput || !activitySelect) return;

    const unit = document.querySelector('#calories-burned-form .unit-btn.active')?.dataset?.unit || 'kg';
    let weightVal = parseFloat(weightInput.value) || 0;
    const weightKg = unit === 'lb' ? weightVal / LB_PER_KG : weightVal;
    const activityKey = activitySelect.value || 'run-moderate';
    const met = getMet(activityKey);
    let timeMinutes = 0;
    if (hoursInput && minutesInput) {
      const h = parseInt(hoursInput.value, 10) || 0;
      const m = parseInt(minutesInput.value, 10) || 0;
      timeMinutes = h * 60 + m;
    } else {
      const dur = document.getElementById('duration');
      timeMinutes = parseInt(dur?.value, 10) || 0;
    }

    const resultEl = document.getElementById('result-calories');
    const resultUnitEl = document.getElementById('result-calories-unit');
    const resultCard = document.getElementById('calories-result-card');
    const activityNameEl = document.getElementById('result-activity-name');
    const activityIconEl = document.getElementById('result-activity-icon');

    if (weightVal <= 0 || timeMinutes <= 0) {
      if (resultEl) resultEl.textContent = '—';
      if (resultUnitEl) resultUnitEl.textContent = '';
      if (activityIconEl) { activityIconEl.textContent = ''; activityIconEl.classList.remove('calories-icon-pop'); }
      if (resultCard) resultCard.classList.remove('calories-result-reveal');
      if (activityNameEl) activityNameEl.textContent = '';
      return;
    }

    const calories = Math.round(calcCalories(timeMinutes, met, weightKg));
    const icon = getActivityIcon(activityKey);

    if (resultEl) resultEl.textContent = calories;
    if (resultUnitEl) resultUnitEl.textContent = ' kcal';
    if (activityNameEl) activityNameEl.textContent = ACTIVITIES[activityKey]?.name || activityKey;
    if (activityIconEl) {
      activityIconEl.textContent = icon;
      activityIconEl.classList.remove('calories-icon-pop');
      void activityIconEl.offsetWidth;
      activityIconEl.classList.add('calories-icon-pop');
    }

    if (resultCard) {
      resultCard.classList.remove('calories-result-reveal');
      void resultCard.offsetWidth;
      resultCard.classList.add('calories-result-reveal');
    }
  }

  function buildActivitySelect() {
    const select = document.getElementById('activity');
    if (!select) return;

    const groups = {
      'Walk & Run': ['walk-slow', 'walk-moderate', 'walk-fast', 'walk-very-fast', 'hike', 'walk-jog', 'run-slow', 'run-moderate', 'run-fast', 'run-very-fast', 'run-cross'],
      'Cycling': ['cycle-slow', 'cycle-moderate', 'cycle-fast', 'cycle-bmx', 'cycle-stationary-mod', 'cycle-stationary-vig'],
      'Swimming': ['swim-mod', 'swim-vig'],
      'Gym': ['aerobics-low', 'aerobics-high', 'aerobics-step-low', 'aerobics-step-high', 'aerobics-water', 'calisthenics-mod', 'calisthenics-vig', 'circuit', 'elliptical', 'rowing-mod', 'rowing-vig', 'stair-step', 'ski-machine', 'weight-general', 'weight-vig', 'yoga'],
      'Sports & Training': ['badminton', 'basketball-game', 'basketball-wheelchair', 'bowling', 'boxing', 'dance-slow', 'dance-disco', 'dance-fast', 'fencing', 'football-comp', 'football-touch', 'frisbee', 'golf-cart', 'golf-carry', 'gymnastics', 'handball', 'hockey', 'horseback', 'ice-skate', 'kayaking', 'martial-arts', 'racquetball-casual', 'racquetball-comp', 'rock-climb-asc', 'rock-climb-rapp', 'rollerblade-casual', 'rollerblade-fast', 'rope-fast', 'rope-slow', 'rugby', 'scuba', 'skateboard', 'ski-downhill', 'ski-cross', 'sledding', 'snow-shoe', 'soccer', 'softball', 'tai-chi', 'tennis', 'volleyball-comp', 'volleyball-beach', 'volleyball-casual', 'water-polo', 'water-ski', 'water-volley', 'whitewater', 'wrestling', 'billiards'],
      'Outdoor & Home': ['wood-stack', 'fishing', 'mow-hand', 'mow-power', 'raking', 'shovel-snow', 'snow-blower', 'chop-wood', 'gardening', 'cooking', 'heavy-cleaning', 'moving-furniture', 'moving-boxes', 'playing-kids', 'sex', 'standing', 'food-shopping', 'paint-remodel', 'reading', 'sleeping', 'tv']
    };

    select.innerHTML = '';
    let firstKey = null;
    for (const [label, keys] of Object.entries(groups)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = label;
      keys.forEach(k => {
        if (!firstKey) firstKey = k;
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = ACTIVITIES[k]?.name || k;
        if (k === 'run-moderate') opt.selected = true;
        optgroup.appendChild(opt);
      });
      select.appendChild(optgroup);
    }
    if (!select.value && firstKey) select.value = firstKey;
  }

  function initUnitToggle() {
    const form = document.getElementById('calories-burned-form');
    const weightUnit = document.getElementById('weight-unit');
    const weightInput = document.getElementById('weight');

    if (!form || !weightUnit || !weightInput) return;

    form.querySelectorAll('.unit-toggle-btns .unit-btn, .unit-toggle .unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const toggle = btn.closest('.unit-toggle');
        const prevUnit = toggle?.querySelector('.unit-btn.active')?.dataset?.unit;
        if (prevUnit && prevUnit === btn.dataset.unit) return;

        toggle?.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const newUnit = btn.dataset.unit;
        weightUnit.textContent = newUnit === 'lb' ? 'lb' : 'kg';

        const w = parseFloat(weightInput.value);
        if (!isNaN(w) && w > 0 && prevUnit && prevUnit !== newUnit) {
          if (prevUnit === 'kg' && newUnit === 'lb') weightInput.value = Math.round(w * LB_PER_KG * 10) / 10;
          else if (prevUnit === 'lb' && newUnit === 'kg') weightInput.value = Math.round(w / LB_PER_KG * 10) / 10;
        }
        runCalc();
      });
    });
  }

  function init() {
    const form = document.getElementById('calories-burned-form');
    if (!form) return;

    buildActivitySelect();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runCalc();
    });

    form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', runCalc);
      el.addEventListener('change', runCalc);
    });

    initUnitToggle();
    runCalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
