// Mobile Responsive JavaScript Fixes
(function() {
  'use strict';
  
  // Only run on mobile devices
  if (window.innerWidth > 767) return;
  
  // Fix viewport height issues
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  // Run on load and resize
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
  
  // Remove dark mode classes on mobile
  function removeDarkMode() {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark');
    document.body.classList.remove('bg-gray-950');
    document.body.classList.remove('bg-black');
    document.body.classList.add('bg-white');
    
    // Remove dark backgrounds from all elements
    const darkElements = document.querySelectorAll('[class*="bg-gray-9"], [class*="bg-black"], .dark');
    darkElements.forEach(el => {
      el.classList.remove('bg-gray-900', 'bg-gray-950', 'bg-black', 'dark');
      el.classList.add('bg-white');
    });
    
    // Fix text colors
    const whiteText = document.querySelectorAll('.text-white, .text-gray-100, .text-gray-200, .text-gray-300, .text-gray-400');
    whiteText.forEach(el => {
      el.classList.remove('text-white', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400');
      el.classList.add('text-gray-700');
    });
  }
  
  // Run immediately and after DOM is loaded
  removeDarkMode();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeDarkMode);
  }
  
  // Also run after a delay to catch any late-loading content
  setTimeout(removeDarkMode, 100);
  setTimeout(removeDarkMode, 500);
  setTimeout(removeDarkMode, 1000);
  
  // Fix navigation menu
  function fixMobileMenu() {
    const menuButton = document.querySelector('button[aria-label*="menu"], button:has(svg)');
    const mobileMenu = document.querySelector('.mobile-menu, [class*="mobile-menu"]');
    
    if (menuButton) {
      menuButton.style.width = '44px';
      menuButton.style.height = '44px';
      menuButton.style.display = 'flex';
      menuButton.style.alignItems = 'center';
      menuButton.style.justifyContent = 'center';
    }
    
    if (mobileMenu) {
      mobileMenu.style.backgroundColor = 'white';
      mobileMenu.style.color = '#111827';
    }
  }
  
  fixMobileMenu();
  
  // Observe for dynamic content changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        removeDarkMode();
        fixMobileMenu();
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });
  
  // Fix header height
  const header = document.querySelector('header, .header, nav, .navbar');
  if (header) {
    header.style.height = '56px';
    header.style.backgroundColor = 'white';
    header.style.borderBottom = '1px solid #e5e7eb';
    
    // Add padding to body to compensate for fixed header
    document.body.style.paddingTop = '56px';
  }
  
  // Fix text sizes
  function fixTextSizes() {
    const largeTexts = document.querySelectorAll('.text-7xl, .text-6xl, .text-5xl');
    largeTexts.forEach(el => {
      const currentSize = window.getComputedStyle(el).fontSize;
      const sizeInPx = parseFloat(currentSize);
      if (sizeInPx > 40) {
        el.style.fontSize = '2rem';
        el.style.lineHeight = '1.2';
      }
    });
  }
  
  fixTextSizes();
  
  // Ensure buttons are touch-friendly
  const buttons = document.querySelectorAll('button, a.btn, [role="button"]');
  buttons.forEach(btn => {
    btn.style.minHeight = '48px';
    btn.style.padding = '12px 24px';
  });
  
})();