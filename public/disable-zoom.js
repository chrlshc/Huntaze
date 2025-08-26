// Prevent zoom on double tap and pinch
document.addEventListener('touchstart', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Prevent zoom with keyboard shortcuts
document.addEventListener('keydown', function(event) {
  if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '-' || event.key === '0')) {
    event.preventDefault();
  }
});

// Prevent zoom on input focus (iOS)
const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
  input.addEventListener('focus', function() {
    document.querySelector('meta[name="viewport"]').setAttribute('content', 
      'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no');
  });
});