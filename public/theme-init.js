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
  
  // Always default to dark mode
  var theme = stored || 'dark';
  
  // Apply immediately to prevent flash
  var html = document.documentElement;
  html.classList.add('theme-' + theme);
  
  if (theme === 'dark') {
    html.classList.add('dark-mode');
    html.style.backgroundColor = '#1e1e1e';
    html.style.color = '#e0e0e0';
  } else {
    html.style.backgroundColor = '#ffffff';
    html.style.color = '#111827';
  }
  
  // Store for consistency
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    // Fallback to cookie
    document.cookie = 'theme=' + theme + ';max-age=31536000;path=/;SameSite=Strict';
  }
})();