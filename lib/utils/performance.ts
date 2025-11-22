/**
 * Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing application performance
 * including dynamic imports, resource hints, and font optimization.
 * 
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */

/**
 * Dynamic import wrapper with error handling
 * Use for heavy components that are not critical for initial render
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    console.error('Dynamic import failed:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Preconnect to external domains for faster resource loading
 * Call this in the root layout or early in the app lifecycle
 */
export function addResourceHints(domains: string[]) {
  if (typeof window === 'undefined') return;

  domains.forEach((domain) => {
    // Add preconnect link
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = domain;
    document.head.appendChild(preconnect);

    // Add dns-prefetch as fallback
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = domain;
    document.head.appendChild(dnsPrefetch);
  });
}

/**
 * External domains that should be preconnected
 */
export const EXTERNAL_DOMAINS = [
  'https://api.dicebear.com',
  'https://ui-avatars.com',
  'https://cdn.huntaze.com',
  'https://static.onlyfansassets.com',
];

/**
 * Check if code splitting is beneficial for a component
 * Based on estimated bundle size and usage frequency
 */
export function shouldCodeSplit(
  estimatedSizeKB: number,
  usageFrequency: 'high' | 'medium' | 'low'
): boolean {
  // Don't split small components or high-frequency components
  if (estimatedSizeKB < 50 || usageFrequency === 'high') {
    return false;
  }

  // Always split large, low-frequency components
  if (estimatedSizeKB > 200 && usageFrequency === 'low') {
    return true;
  }

  // Split medium-sized, medium-frequency components
  return estimatedSizeKB > 100 && usageFrequency === 'medium';
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Mark the start of a performance measurement
   */
  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  },

  /**
   * Measure the time between two marks
   */
  measure(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        return measure.duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Get Core Web Vitals metrics
   */
  getCoreWebVitals() {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      // First Contentful Paint
      fcp: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || null,
      // Largest Contentful Paint (requires web-vitals library for accurate measurement)
      lcp: null, // Placeholder - use web-vitals library for accurate LCP
      // First Input Delay (requires web-vitals library)
      fid: null, // Placeholder - use web-vitals library for accurate FID
      // Cumulative Layout Shift (requires web-vitals library)
      cls: null, // Placeholder - use web-vitals library for accurate CLS
      // Time to First Byte
      ttfb: navigation?.responseStart - navigation?.requestStart || null,
      // DOM Content Loaded
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || null,
    };
  },
};
