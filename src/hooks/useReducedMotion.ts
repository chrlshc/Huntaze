'use client';

import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function useAnimationDuration(normalDuration: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0.01 : normalDuration;
}

/**
 * Get transition config based on reduced motion preference
 */
export function useAnimationConfig<T extends Record<string, any>>(
  normalConfig: T,
  reducedConfig?: Partial<T>
): T {
  const prefersReducedMotion = useReducedMotion();
  
  if (!prefersReducedMotion) {
    return normalConfig;
  }

  return {
    ...normalConfig,
    duration: 0.01,
    ...reducedConfig,
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth < 768 || 'ontouchstart' in window;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
