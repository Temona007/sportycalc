/**
 * SportyCalc - Calculator Search with Autocomplete
 * Search icon in nav, overlay with autocomplete dropdown
 */

(function () {
  'use strict';

  const CALCULATORS = [
    { title: 'BMI Calculator', subtitle: 'Body Mass Index', href: 'bmi-calculator.html', keywords: 'bmi body mass index weight height' },
    { title: 'BMR Calculator', subtitle: 'Basal Metabolic Rate', href: 'bmr-calculator.html', keywords: 'bmr metabolic rate calories base' },
    { title: 'TDEE Calculator', subtitle: 'Total Daily Energy Expenditure', href: 'tdee-calculator.html', keywords: 'tdee calories daily expenditure' },
    { title: 'Calorie Calculator', subtitle: 'Daily calorie needs', href: 'calorie-calculator.html', keywords: 'calorie calories daily needs diet' },
    { title: 'Macro Calculator', subtitle: 'Protein, carbs, fat', href: 'macro-calculator.html', keywords: 'macro macros protein carbs fat nutrition' },
    { title: 'Body Fat Calculator', subtitle: 'Navy method estimate', href: 'body-fat-calculator.html', keywords: 'body fat navy percentage' },
    { title: 'Heart Rate Zones', subtitle: 'Training zones', href: 'heart-rate-zones.html', keywords: 'heart rate zones cardio training' },
    { title: '1RM Calculator', subtitle: 'One-rep max', href: '1rm-calculator.html', keywords: '1rm one rep max strength lift' },
    { title: 'Protein Intake', subtitle: 'Daily protein needs', href: 'protein-intake.html', keywords: 'protein intake daily muscle' },
    { title: 'Water Intake', subtitle: 'Daily hydration', href: 'water-intake.html', keywords: 'water intake hydration daily' },
    { title: 'Calories Burned', subtitle: 'Activity calories', href: 'calories-burned.html', keywords: 'calories burned activity exercise' },
    { title: 'Power-to-Weight', subtitle: 'W/kg, hp/lb ratio', href: 'power-to-weight-calculator.html', keywords: 'power weight ratio pwr cycling watts' },
    { title: 'Calorie Deficit', subtitle: 'Time to reach target weight', href: 'calorie-deficit-calculator.html', keywords: 'calorie deficit weight loss diet target date' },
    { title: 'Healthy Weight Calculator', subtitle: 'Ideal body weight, Robinson, Miller, Devine, Hamwi', href: 'healthy-weight-calculator.html', keywords: 'ideal weight healthy weight IBW ideal body weight Robinson Miller Devine Hamwi BMI range' },
    { title: 'Ideal Body Weight Calculator', subtitle: 'IBW, Robinson, Miller, Devine, Hamwi', href: 'ideal-body-weight-calculator.html', keywords: 'ideal body weight IBW calculator Devine Robinson Miller Hamwi formula' },
    { title: 'Running Pace Calculator', subtitle: '5K, 10K, marathon finish time', href: 'running-pace-calculator.html', keywords: 'running pace calculator race time 5K 10K marathon pace' }
  ];

  function getCalcBasePath() {
    const path = window.location.pathname || '/';
    if (path.includes('/calculators/') || path.endsWith('/calculators')) return '';
    if (path === '/' || path === '/index.html' || path === '') return 'calculators/';
    return '../calculators/';
  }

  function searchCalcs(query) {
    if (!query || query.trim().length < 1) return CALCULATORS.slice(0, 6);
    const q = query.trim().toLowerCase();
    const scored = CALCULATORS.map(c => {
      const titleLo = c.title.toLowerCase();
      const subtitleLo = c.subtitle.toLowerCase();
      const keywordsLo = c.keywords.toLowerCase();
      let score = 0;
      if (titleLo.startsWith(q)) score += 100;
      else if (titleLo.includes(q)) score += 50;
      if (subtitleLo.includes(q)) score += 30;
      if (keywordsLo.includes(q)) score += 20;
      const titleWords = titleLo.split(/\s+/);
      const qWords = q.split(/\s+/);
      qWords.forEach(w => {
        if (w.length < 2) return;
        titleWords.forEach(tw => { if (tw.startsWith(w) || tw.includes(w)) score += 15; });
      });
      return { calc: c, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map(x => x.calc);
  }

  function init() {
    const trigger = document.getElementById('search-trigger');
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const closeBtn = document.getElementById('search-close');

    if (!trigger || !overlay || !input || !results) return;

    const basePath = getCalcBasePath();

    function openSearch() {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      input.value = '';
      results.innerHTML = '';
      input.focus();
      showResults(CALCULATORS.slice(0, 6));
    }

    function closeSearch() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      trigger.focus();
      document.body.style.overflow = '';
    }

    function showResults(calcs) {
      if (!calcs.length) {
        results.innerHTML = '<div class="search-result-empty">No calculators found. Try another term.</div>';
      } else {
        results.innerHTML = calcs.map(c => `
          <a href="${basePath}${c.href}" class="search-result-item" role="option" tabindex="-1">
            <span class="search-result-title">${escapeHtml(c.title)}</span>
            <span class="search-result-subtitle">${escapeHtml(c.subtitle)}</span>
          </a>
        `).join('');
      }
      results.setAttribute('aria-hidden', calcs.length ? 'false' : 'true');
    }

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    trigger.addEventListener('click', () => {
      openSearch();
      document.body.style.overflow = 'hidden';
    });

    closeBtn.addEventListener('click', closeSearch);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSearch();
    });

    input.addEventListener('input', () => {
      const q = input.value;
      const matches = searchCalcs(q);
      showResults(matches);
    });

    input.addEventListener('keydown', (e) => {
      const items = results.querySelectorAll('.search-result-item');
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      } else if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        const cur = document.activeElement;
        const idx = Array.from(items).indexOf(cur);
        if (idx < items.length - 1) items[idx + 1].focus();
        else if (idx < 0) items[0].focus();
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        const cur = document.activeElement;
        const idx = Array.from(items).indexOf(cur);
        if (idx > 0) items[idx - 1].focus();
        else if (idx === 0) input.focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !overlay.classList.contains('open') && !/^(input|textarea)$/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        trigger.click();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
