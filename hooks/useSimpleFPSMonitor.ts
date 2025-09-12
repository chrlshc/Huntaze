'use client';

import { useEffect, useState } from 'react';

export function useSimpleFPSMonitor() {
  const [isLowPerf, setIsLowPerf] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setIsLowPerf(true);
      document.body.classList.add('reduce-motion');
    }
    
    // Simple performance check based on device memory and CPU cores
    if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
      setIsLowPerf(true);
      document.body.classList.add('reduce-motion');
    }
    
    // Check for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && window.innerWidth < 768) {
      // More conservative on mobile
      setIsLowPerf(true);
      document.body.classList.add('reduce-motion');
    }
  }, []);

  return { isLowPerf };
}