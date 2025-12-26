/**
 * OnlyFans Performance Optimization Utilities
 * 
 * Implements code splitting, lazy loading, and bundle optimization
 * for OnlyFans pages to achieve Core Web Vitals targets
 * 
 * Requirements: 9.5
 * Property 20: Core Web Vitals Performance
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import React from 'react';

/**
 * Lazy load components with loading fallback
 * Reduces initial bundle size and improves LCP
 */
export function lazyLoadComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType<any>;
    ssr?: boolean;
  }
) {
  const Loading = options?.loading;

  return dynamic(importFn, {
    loading: Loading
      ? (loadingProps) => React.createElement(Loading, loadingProps)
      : () => React.createElement('div', { className: 'animate-pulse bg-gray-200 h-32 rounded' }),
    ssr: options?.ssr ?? true,
  });
}

/**
 * Preload critical images to improve LCP
 */
export const preloadImage = (src: string, priority: 'high' | 'low' = 'high') => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  document.head.appendChild(link);
};

/**
 * Preload critical resources
 */
export const preloadResource = (
  href: string,
  type: 'script' | 'style' | 'font' | 'fetch'
) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
    case 'fetch':
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      break;
  }
  
  document.head.appendChild(link);
};

/**
 * Optimize images with lazy loading and responsive sizes
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/**
 * Debounce function to reduce unnecessary re-renders
 * Improves FID by reducing main thread work
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * Improves FID by preventing excessive function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback wrapper for non-critical work
 * Improves FID by deferring non-critical work
 */
export const runWhenIdle = (callback: () => void, options?: IdleRequestOptions) => {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
};

/**
 * Intersection Observer for lazy loading
 * Improves initial load time by loading content on demand
 */
export const createLazyLoader = (
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) => {
  if (typeof window === 'undefined') return null;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
  
  return observer;
};

/**
 * Measure component render time
 * Helps identify performance bottlenecks
 */
export const measureRenderTime = (componentName: string) => {
  if (typeof window === 'undefined' || !window.performance) return;
  
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  const measureName = `${componentName}-render`;
  
  return {
    start: () => {
      performance.mark(startMark);
    },
    end: () => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName)[0];
      if (measure) {
        console.log(`${componentName} render time: ${measure.duration.toFixed(2)}ms`);
      }
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    },
  };
};

/**
 * Optimize bundle size by code splitting routes
 */
export const optimizeRouteLoading = () => {
  // Preload critical routes on hover
  const preloadRoute = (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  };
  
  // Add hover listeners to navigation links
  if (typeof window !== 'undefined') {
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/onlyfans"]');
      
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          preloadRoute(href);
        }
      }
    }, { passive: true });
  }
};

/**
 * Reduce CLS by reserving space for dynamic content
 */
export const reserveSpace = (
  width: number | string,
  height: number | string
): React.CSSProperties => {
  return {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    minHeight: typeof height === 'number' ? `${height}px` : height,
  };
};

/**
 * Optimize font loading to reduce CLS
 */
export const optimizeFontLoading = () => {
  if (typeof document === 'undefined') return;
  
  // Add font-display: swap to reduce CLS
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Batch DOM updates to reduce layout thrashing
 * Improves FID and reduces CLS
 */
export const batchDOMUpdates = (updates: Array<() => void>) => {
  if (typeof window === 'undefined') return;
  
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

/**
 * Monitor and report performance metrics
 */
export const reportPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) return;
  
  // Report navigation timing
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    };
    
    console.log('Performance Metrics:', metrics);
    
    // Send to analytics
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance',
          metrics,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      }).catch(() => {
        // Silently fail
      });
    }
  }
};

/**
 * Initialize performance optimizations
 */
export const initializePerformanceOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // Optimize route loading
  optimizeRouteLoading();
  
  // Optimize font loading
  optimizeFontLoading();
  
  // Report metrics after page load
  window.addEventListener('load', () => {
    runWhenIdle(() => {
      reportPerformanceMetrics();
    });
  });
};
