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
 * Only active in development mode (Requirements: 3.2, 5.1, 5.2, 5.4)
 */
export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    trackScrollPerformance = false,
    trackInteractions = false,
    pageName,
  } = options;

  const mountTimeRef = useRef<number>(Date.now());
  
  // Early return if not in development - no monitoring overhead in production
  const isEnabled = process.env.NODE_ENV === 'development';

  // Track component mount time (development only)
  useEffect(() => {
    if (!isEnabled) return;
    
    const mountTime = Date.now() - mountTimeRef.current;
    console.log(`[Performance] ${pageName || 'Component'} mounted in ${mountTime}ms`);
  }, [pageName, isEnabled]);

  // Track scroll performance (development only)
  useEffect(() => {
    if (!isEnabled || !trackScrollPerformance) return;
    
    performanceMonitor.startScrollMonitoring();
    
    return () => {
      performanceMonitor.stopScrollMonitoring();
    };
  }, [trackScrollPerformance, isEnabled]);

  // Track click interactions (development only)
  useEffect(() => {
    if (!isEnabled || !trackInteractions) return;

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
  }, [trackInteractions, pageName, isEnabled]);

  // Track API request (development only)
  const trackAPIRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string,
      requestFn: () => Promise<T>
    ): Promise<T> => {
      // Skip tracking in production
      if (!isEnabled) {
        return requestFn();
      }
      
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
    [isEnabled]
  );

  // Track navigation (development only)
  const trackNavigation = useCallback(
    (destination: string, metadata?: Record<string, any>) => {
      if (!isEnabled) return;
      
      performanceMonitor.trackInteraction('navigation', destination, {
        page: pageName,
        ...metadata,
      });
    },
    [pageName, isEnabled]
  );

  // Track form submission (development only)
  const trackFormSubmit = useCallback(
    (formName: string, metadata?: Record<string, any>) => {
      if (!isEnabled) return;
      
      performanceMonitor.trackInteraction('form_submit', formName, {
        page: pageName,
        ...metadata,
      });
    },
    [pageName, isEnabled]
  );

  // Track custom event (development only)
  const trackCustomEvent = useCallback(
    (eventName: string, metadata?: Record<string, any>) => {
      if (!isEnabled) return;
      
      performanceMonitor.trackInteraction('custom', eventName, {
        page: pageName,
        ...metadata,
      });
    },
    [pageName, isEnabled]
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
 * Only active in development mode (Requirements: 3.2, 5.1, 5.2, 5.4)
 */
export function useAPIPerformance() {
  const isEnabled = process.env.NODE_ENV === 'development';
  
  const trackRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: string,
      requestFn: () => Promise<T>
    ): Promise<T> => {
      // Skip tracking in production
      if (!isEnabled) {
        return requestFn();
      }
      
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
    [isEnabled]
  );

  return { trackRequest };
}

/**
 * Hook to get performance metrics
 * Only active in development mode (Requirements: 3.2, 5.1, 5.2, 5.4)
 */
export function usePerformanceMetrics() {
  const isEnabled = process.env.NODE_ENV === 'development';
  
  const getMetrics = useCallback(() => {
    if (!isEnabled) return [];
    return performanceMonitor.getMetrics();
  }, [isEnabled]);

  const getSummary = useCallback(() => {
    if (!isEnabled) return null;
    return performanceMonitor.getSummary();
  }, [isEnabled]);

  const clearMetrics = useCallback(() => {
    if (!isEnabled) return;
    performanceMonitor.clearMetrics();
  }, [isEnabled]);

  return {
    getMetrics,
    getSummary,
    clearMetrics,
  };
}
