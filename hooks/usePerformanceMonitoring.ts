/**
 * React Hook for Performance Monitoring
 * 
 * Provides easy access to performance monitoring in React components
 * Requirements: 15.1, 15.2, 15.5
 */

import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/lib/monitoring/performance';

interface UsePerformanceMonitoringOptions {
  trackScrollPerformance?: boolean;
  trackInteractions?: boolean;
  pageName?: string;
}

/**
 * Hook to monitor performance in React components
 */
export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    trackScrollPerformance = false,
    trackInteractions = false,
    pageName,
  } = options;

  const mountTimeRef = useRef<number>(Date.now());

  // Track component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${pageName || 'Component'} mounted in ${mountTime}ms`);
    }
  }, [pageName]);

  // Track scroll performance
  useEffect(() => {
    if (trackScrollPerformance) {
      performanceMonitor.startScrollMonitoring();
      
      return () => {
        performanceMonitor.stopScrollMonitoring();
      };
    }
  }, [trackScrollPerformance]);

  // Track click interactions
  useEffect(() => {
    if (!trackInteractions) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const targetInfo = target.tagName + (target.id ? `#${target.id}` : '') + 
                        (target.className ? `.${target.className.split(' ')[0]}` : '');
      
      performanceMonitor.trackInteraction('click', targetInfo, {
        page: pageName,
        x: e.clientX,
        y: e.clientY,
      });
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [trackInteractions, pageName]);

  // Track API request
  const trackAPIRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string,
      requestFn: () => Promise<T>
    ): Promise<T> => {
      const startTime = Date.now();
      let status = 200;
      let success = true;

      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        success = false;
        status = (error as any)?.status || 500;
        throw error;
      } finally {
        performanceMonitor.trackAPIRequest(endpoint, method, startTime, status, success);
      }
    },
    []
  );

  // Track navigation
  const trackNavigation = useCallback(
    (destination: string, metadata?: Record<string, any>) => {
      performanceMonitor.trackInteraction('navigation', destination, {
        page: pageName,
        ...metadata,
      });
    },
    [pageName]
  );

  // Track form submission
  const trackFormSubmit = useCallback(
    (formName: string, metadata?: Record<string, any>) => {
      performanceMonitor.trackInteraction('form_submit', formName, {
        page: pageName,
        ...metadata,
      });
    },
    [pageName]
  );

  // Track custom event
  const trackCustomEvent = useCallback(
    (eventName: string, metadata?: Record<string, any>) => {
      performanceMonitor.trackInteraction('custom', eventName, {
        page: pageName,
        ...metadata,
      });
    },
    [pageName]
  );

  return {
    trackAPIRequest,
    trackNavigation,
    trackFormSubmit,
    trackCustomEvent,
  };
}

/**
 * Hook to track API requests with automatic performance monitoring
 */
export function useAPIPerformance() {
  const trackRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string,
      requestFn: () => Promise<T>
    ): Promise<T> => {
      const startTime = Date.now();
      let status = 200;
      let success = true;

      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        success = false;
        status = (error as any)?.status || 500;
        throw error;
      } finally {
        performanceMonitor.trackAPIRequest(endpoint, method, startTime, status, success);
      }
    },
    []
  );

  return { trackRequest };
}

/**
 * Hook to get performance metrics
 */
export function usePerformanceMetrics() {
  const getMetrics = useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  const getSummary = useCallback(() => {
    return performanceMonitor.getSummary();
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
  }, []);

  return {
    getMetrics,
    getSummary,
    clearMetrics,
  };
}
