/**
 * SportyCalc - Theme toggle (light/dark)
 * Light mode default, persists in localStorage
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'sportycalc-theme';
  const LIGHT = 'light';
  const DARK = 'dark';

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || LIGHT;
    } catch (_) {
      return LIGHT;
    }
  }

  function setTheme(theme) {
    const html = document.documentElement;
    if (theme === DARK) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
    updateToggleButton(theme);
  }

  function updateToggleButton(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sun = btn.querySelector('.theme-sun');
    const moon = btn.querySelector('.theme-moon');
    if (sun) sun.style.display = theme === DARK ? 'block' : 'none';
    if (moon) moon.style.display = theme === DARK ? 'none' : 'block';
    btn.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function init() {
    const theme = getStoredTheme();
    setTheme(theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = getStoredTheme();
        setTheme(current === DARK ? LIGHT : DARK);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
