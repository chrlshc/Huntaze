'use client';

/**
 * useReducedMotion Hook
 * 
 * Detects if the user has enabled reduced motion preference.
 * Requirements: 4.8
 */

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
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
