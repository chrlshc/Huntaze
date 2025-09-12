// Dark mode initialization - Prevents flash of unstyled content
(function() {
  // Check for saved theme preference or default to 'dark'
  const theme = localStorage.getItem('theme') || 'dark';
  
  // Apply theme immediately
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.style.backgroundColor = '#1e1e1e';
    document.documentElement.style.color = '#e0e0e0';
  }
  
  // Store theme for consistency
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    // Handle storage errors gracefully
  }
})();