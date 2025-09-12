'use client';

import { useEffect } from 'react';

export default function AnimationLoader() {
  useEffect(() => {
    // Force reflow to ensure animations start
    const forceReflow = () => {
      document.body.offsetHeight;
      window.scrollTo(0, 0);
    };

    // Run after a short delay to ensure DOM is ready
    const timer = setTimeout(forceReflow, 100);

    // Also trigger on window load
    window.addEventListener('load', forceReflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', forceReflow);
    };
  }, []);

  return null;
}