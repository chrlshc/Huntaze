'use client';

import { useEffect } from 'react';

export default function MobileLightTheme() {
  useEffect(() => {
    // Force light theme on mobile
    const checkAndFixTheme = () => {
      const isMobile = window.innerWidth <= 767;
      
      if (isMobile) {
        // Remove all dark theme classes
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark', 'bg-gray-950', 'bg-black');
        document.body.classList.add('bg-white', 'text-gray-900');
        
        // Override localStorage to prevent dark theme
        try {
          localStorage.setItem('theme', 'light');
        } catch (e) {
          // Ignore if localStorage is not available
        }
        
        // Fix all dark backgrounds
        const darkBgs = document.querySelectorAll('[class*="bg-gray-9"], [class*="bg-black"], .bg-gray-900, .bg-gray-950, .bg-black');
        darkBgs.forEach(el => {
          // Get all classes
          const classes = Array.from(el.classList);
          
          // Remove dark background classes
          classes.forEach(cls => {
            if (cls.includes('bg-gray-9') || cls.includes('bg-black')) {
              el.classList.remove(cls);
            }
          });
          
          // Add white background
          if (!el.classList.contains('bg-white') && !el.classList.contains('bg-gray-50')) {
            el.classList.add('bg-white');
          }
        });
        
        // Fix text colors
        const lightTexts = document.querySelectorAll('.text-white, .text-gray-100, .text-gray-200, .text-gray-300');
        lightTexts.forEach(el => {
          el.classList.remove('text-white', 'text-gray-100', 'text-gray-200', 'text-gray-300');
          if (el.tagName.match(/^H[1-6]$/)) {
            el.classList.add('text-gray-900');
          } else {
            el.classList.add('text-gray-700');
          }
        });
      }
    };
    
    // Run immediately
    checkAndFixTheme();
    
    // Run on resize
    window.addEventListener('resize', checkAndFixTheme);
    
    // Run periodically to catch dynamic content
    const interval = setInterval(checkAndFixTheme, 1000);
    
    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkAndFixTheme);
      clearInterval(interval);
    };
  }, []);
  
  return null;
}