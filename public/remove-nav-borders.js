// Force remove all nav borders and selection effects
document.addEventListener('DOMContentLoaded', function() {
  // Get all nav elements
  const navElements = document.querySelectorAll('nav *');
  
  // Remove borders from all nav elements except Start for free
  navElements.forEach(element => {
    if (!element.href || !element.href.includes('/get-started')) {
      element.style.border = 'none';
      element.style.borderWidth = '0';
      element.style.outline = 'none';
      element.style.boxShadow = 'none';
    }
  });
  
  // Specifically target Pricing and Sign in
  const pricing = document.querySelector('a[href="/pricing"]');
  const signIn = document.querySelector('a[href="/auth"]');
  
  if (pricing) {
    pricing.style.border = 'none';
    pricing.style.borderWidth = '0';
    pricing.style.outline = 'none';
    pricing.style.boxShadow = 'none';
  }
  
  if (signIn) {
    signIn.style.border = 'none';
    signIn.style.borderWidth = '0';
    signIn.style.outline = 'none';
    signIn.style.boxShadow = 'none';
  }
  
  // Add CSS to remove selection effect
  const style = document.createElement('style');
  style.textContent = `
    nav *::selection {
      background-color: transparent !important;
      color: inherit !important;
    }
    nav *::-moz-selection {
      background-color: transparent !important;
      color: inherit !important;
    }
    nav a:not([href="/get-started"]),
    nav button {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
});