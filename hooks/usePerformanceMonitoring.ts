/**
 * Performance Monitoring Hook
 * 
 * Monitors Core Web Vitals and reports performance metrics
 * for OnlyFans pages
 * 
 * Requirements: 9.5
 * Property 20: Core Web Vitals Performance
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { measureRenderTime, reportPerformanceMetrics } from '@/lib/performance/onlyfans-optimization';

interface ComponentPerformanceMonitoringOptions {
  componentName: string;
  trackRenderTime?: boolean;
  reportOnMount?: boolean;
  reportOnUnmount?: boolean;
}

interface DashboardPerformanceMonitoringOptions {
  pageName: string;
  trackScrollPerformance?: boolean;
  trackInteractions?: boolean;
}

type PerformanceMonitoringOptions = ComponentPerformanceMonitoringOptions | DashboardPerformanceMonitoringOptions;

type ApiMetric = {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: number;
};

type PerformanceMetricsStore = {
  api: ApiMetric[];
  fpsSamples: number[];
  interactions: number;
};

const performanceMetricsStore: PerformanceMetricsStore = {
  api: [],
  fpsSamples: [],
  interactions: 0,
};

const MAX_API_METRICS = 150;
const MAX_FPS_SAMPLES = 60;

function isComponentMonitoringOptions(options: PerformanceMonitoringOptions): options is ComponentPerformanceMonitoringOptions {
  return 'componentName' in options;
}

function normalizeUrl(input: unknown): string {
  try {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    if (typeof input === 'object' && input && 'url' in input && typeof (input as any).url === 'string') {
      return (input as any).url;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function normalizeMethod(input: unknown, init?: RequestInit): string {
  const methodFromInit = init?.method;
  if (typeof methodFromInit === 'string' && methodFromInit.trim()) return methodFromInit.toUpperCase();

  try {
    if (typeof input === 'object' && input && 'method' in input && typeof (input as any).method === 'string') {
      return (input as any).method.toUpperCase();
    }
  } catch {
    // ignore
  }

  return 'GET';
}

function pushApiMetric(metric: ApiMetric) {
  performanceMetricsStore.api.push(metric);
  if (performanceMetricsStore.api.length > MAX_API_METRICS) {
    performanceMetricsStore.api.splice(0, performanceMetricsStore.api.length - MAX_API_METRICS);
  }
}

function pushFpsSample(sample: number) {
  if (!Number.isFinite(sample)) return;
  performanceMetricsStore.fpsSamples.push(sample);
  if (performanceMetricsStore.fpsSamples.length > MAX_FPS_SAMPLES) {
    performanceMetricsStore.fpsSamples.splice(0, performanceMetricsStore.fpsSamples.length - MAX_FPS_SAMPLES);
  }
}

/**
 * Dev-only performance metrics collector used by the floating dashboard monitor.
 */
export function usePerformanceMetrics() {
  const enabled = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      const endpoint = normalizeUrl(input);
      const method = normalizeMethod(input, init);

      try {
        const response = await originalFetch(input as any, init);
        const endTime = performance.now();

        pushApiMetric({
          endpoint,
          method,
          duration: endTime - startTime,
          status: response.status,
          success: response.ok,
          timestamp: Date.now(),
        });

        return response;
      } catch (error) {
        const endTime = performance.now();

        pushApiMetric({
          endpoint,
          method,
          duration: endTime - startTime,
          status: 0,
          success: false,
          timestamp: Date.now(),
        });

        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleInteraction = () => {
      performanceMetricsStore.interactions += 1;
    };

    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let rafId = 0;
    let lastTimestamp = performance.now();
    let frames = 0;

    const tick = (now: number) => {
      frames += 1;
      const elapsed = now - lastTimestamp;
      if (elapsed >= 1000) {
        pushFpsSample((frames * 1000) / elapsed);
        frames = 0;
        lastTimestamp = now;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [enabled]);

  const getMetrics = useCallback(() => {
    return {
      api: performanceMetricsStore.api,
    };
  }, []);

  const getSummary = useCallback(() => {
    const api = performanceMetricsStore.api;
    const totalAPIRequests = api.length;
    const averageAPITime =
      totalAPIRequests === 0
        ? 0
        : Math.round(api.reduce((acc, metric) => acc + metric.duration, 0) / totalAPIRequests);

    const slowAPIRequests = api.filter((metric) => metric.duration >= 1000).length;
    const failedAPIRequests = api.filter((metric) => !metric.success).length;

    const fpsSamples = performanceMetricsStore.fpsSamples;
    const averageFPS =
      fpsSamples.length === 0 ? 0 : Math.round(fpsSamples.reduce((acc, fps) => acc + fps, 0) / fpsSamples.length);

    return {
      totalAPIRequests,
      averageAPITime,
      slowAPIRequests,
      failedAPIRequests,
      averageFPS,
      totalInteractions: performanceMetricsStore.interactions,
    };
  }, []);

  return { getMetrics, getSummary };
}

/**
 * Hook to monitor component performance
 */
export function usePerformanceMonitoring({
  ...options
}: PerformanceMonitoringOptions) {
  const componentName = useMemo(() => {
    return isComponentMonitoringOptions(options) ? options.componentName : options.pageName;
  }, [options]);

  const trackRenderTime = isComponentMonitoringOptions(options) ? (options.trackRenderTime ?? true) : false;
  const reportOnMount = isComponentMonitoringOptions(options) ? (options.reportOnMount ?? true) : false;
  const reportOnUnmount = isComponentMonitoringOptions(options) ? (options.reportOnUnmount ?? false) : false;

  const trackScrollPerformance =
    !isComponentMonitoringOptions(options) ? (options.trackScrollPerformance ?? false) : false;
  const trackInteractions = !isComponentMonitoringOptions(options) ? (options.trackInteractions ?? false) : false;

  const renderTimer = useRef<ReturnType<typeof measureRenderTime> | null>(null);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    if (!isComponentMonitoringOptions(options)) return;

    mountTime.current = performance.now();

    if (reportOnMount) {
      reportPerformanceMetrics();
    }

    return () => {
      if (reportOnUnmount) {
        const unmountTime = performance.now();
        const componentLifetime = unmountTime - mountTime.current;
        
        console.log(`${componentName} lifetime: ${componentLifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName, reportOnMount, reportOnUnmount]);

  // Track render time
  useEffect(() => {
    if (trackRenderTime) {
      renderTimer.current = measureRenderTime(componentName);
      renderTimer.current?.start();

      return () => {
        renderTimer.current?.end();
      };
    }
  });

  const trackAPIRequest = useCallback(
    async <T,>(endpoint: string, method: string, request: () => Promise<T>) => {
      const startTime = performance.now();
      try {
        const result = await request();
        const duration = performance.now() - startTime;

        let status = 200;
        let success = true;

        if (typeof Response !== 'undefined' && result instanceof Response) {
          status = result.status;
          success = result.ok;
        }

        pushApiMetric({
          endpoint,
          method,
          duration,
          status,
          success,
          timestamp: Date.now(),
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        pushApiMetric({
          endpoint,
          method,
          duration,
          status: 0,
          success: false,
          timestamp: Date.now(),
        });

        throw error;
      }
    },
    []
  );

  const trackFormSubmit = useCallback(async <T,>(formName: string, submit: () => Promise<T>) => {
    const startTime = performance.now();
    try {
      const result = await submit();
      const duration = performance.now() - startTime;
      console.log(`${componentName} form submit (${formName}): ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.warn(`${componentName} form submit failed (${formName}): ${duration.toFixed(2)}ms`);
      throw error;
    }
  }, [componentName]);

  useEffect(() => {
    if (!trackInteractions) return;

    const handleInteraction = () => {
      performanceMetricsStore.interactions += 1;
    };

    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [trackInteractions]);

  useEffect(() => {
    if (!trackScrollPerformance) return;

    let rafId = 0;
    let isMeasuring = false;
    let frames = 0;
    let startedAt = 0;

    const stop = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      isMeasuring = false;
      frames = 0;
      startedAt = 0;
    };

    const tick = (now: number) => {
      if (!isMeasuring) return;
      frames += 1;
      const elapsed = now - startedAt;
      if (elapsed >= 1000) {
        pushFpsSample((frames * 1000) / elapsed);
        stop();
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      if (isMeasuring) return;
      isMeasuring = true;
      frames = 0;
      startedAt = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      stop();
    };
  }, [trackScrollPerformance]);

  return {
    markStart: (label: string) => {
      if (typeof window !== 'undefined' && window.performance) {
        performance.mark(`${componentName}-${label}-start`);
      }
    },
    markEnd: (label: string) => {
      if (typeof window !== 'undefined' && window.performance) {
        const startMark = `${componentName}-${label}-start`;
        const endMark = `${componentName}-${label}-end`;
        const measureName = `${componentName}-${label}`;
        
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        const measure = performance.getEntriesByName(measureName)[0];
        if (measure) {
          console.log(`${componentName} ${label}: ${measure.duration.toFixed(2)}ms`);
        }
        
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      }
    },
    trackAPIRequest,
    trackFormSubmit,
  };
}

/**
 * Hook to track data fetching performance
 */
export function useDataFetchPerformance(fetchName: string) {
  const startTime = useRef<number>(0);

  const startFetch = () => {
    startTime.current = performance.now();
  };

  const endFetch = (success: boolean = true) => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    
    console.log(`${fetchName} fetch ${success ? 'succeeded' : 'failed'}: ${duration.toFixed(2)}ms`);
    
    // Report to analytics
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'data-fetch',
          name: fetchName,
          duration,
          success,
          timestamp: Date.now(),
        }),
      }).catch(() => {
        // Silently fail
      });
    }
  };

  return { startFetch, endFetch };
}

/**
 * Hook to track user interactions for FID
 */
export function useInteractionTracking(componentName: string) {
  useEffect(() => {
    const handleInteraction = (event: Event) => {
      const startTime = performance.now();
      
      // Track interaction delay
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const delay = endTime - startTime;
        
        if (delay > 100) {
          console.warn(`${componentName} interaction delay: ${delay.toFixed(2)}ms (target: <100ms)`);
        }
      });
    };

    // Track clicks and key presses
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [componentName]);
}

/**
 * Hook to prevent layout shifts (CLS)
 */
export function useLayoutStabilization() {
  useEffect(() => {
    // Observe layout shifts
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as any;
            
            if (!layoutShift.hadRecentInput && layoutShift.value > 0.1) {
              console.warn('Large layout shift detected:', {
                value: layoutShift.value,
                sources: layoutShift.sources,
              });
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        return () => observer.disconnect();
      } catch (e) {
        // Layout shift observation not supported
      }
    }
  }, []);
}

/**
 * Hook to optimize bundle loading
 */
export function useBundleOptimization() {
  useEffect(() => {
    // Preload critical routes
    const preloadCriticalRoutes = () => {
      const criticalRoutes = [
        '/onlyfans',
        '/onlyfans/messages',
        '/onlyfans/fans',
      ];

      criticalRoutes.forEach((route) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    // Preload after initial load
    if (document.readyState === 'complete') {
      preloadCriticalRoutes();
    } else {
      window.addEventListener('load', preloadCriticalRoutes);
    }

    return () => {
      window.removeEventListener('load', preloadCriticalRoutes);
    };
  }, []);
}
