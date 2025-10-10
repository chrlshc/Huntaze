// Critical theme initialization - MUST run before any CSS
// This prevents Flash of Unstyled Content (FOUC)
(function() {
  'use strict';
  
  // Get stored theme or check system preference
  var stored = null;
  try {
    stored = localStorage.getItem('theme');
  } catch (e) {
    // Check cookie fallback for private browsing
    var match = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/);
    stored = match ? match[1] : null;
  }
  
  // Force light mode (no dark mode)
  var theme = 'light';
  
  // Apply immediately to prevent flash
  var html = document.documentElement;
  html.classList.add('theme-' + theme);
  html.style.backgroundColor = '#ffffff';
  html.style.color = '#111827';
  
  // Store for consistency
  try {
    localStorage.setItem('theme', 'light');
  } catch (e) {
    // Fallback to cookie
    document.cookie = 'theme=light;max-age=31536000;path=/;SameSite=Strict';
  }
})();
