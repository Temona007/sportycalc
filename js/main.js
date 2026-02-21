/**
 * SportyCalc - Main JavaScript
 * Navigation, mobile menu, shared utilities
 */

(function() {
  'use strict';

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const body = document.body;

  if (navToggle && mobileNav) {
    const closeMenu = () => {
      mobileNav.classList.remove('open');
      navToggle.classList.remove('active');
      body.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      navToggle.classList.toggle('active');
      body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click (navigate away or anchor)
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close when resizing to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) closeMenu();
    });
  }

  // Scroll-based nav background
  const nav = document.querySelector('.nav');
  if (nav) {
    const handleScroll = () => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
