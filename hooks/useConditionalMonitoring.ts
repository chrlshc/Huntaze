'use client';

/**
 * Conditional Monitoring Hook
 * Provides monitoring utilities that respect environment settings
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  productionSafeMonitoring,
  trackPerformance,
  measureAsync,
  measure,
} from '@/lib/monitoring/production-safe-monitoring';

export interface UseConditionalMonitoringReturn {
  shouldMonitor: boolean;
  trackMetric: (name: string, value: number, tags?: Record<string, string>) => void;
  measureAsync: <T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ) => Promise<T>;
  measure: <T>(name: string, fn: () => T, tags?: Record<string, string>) => T;
  startTimer: (name: string) => () => void;
}

export function useConditionalMonitoring(): UseConditionalMonitoringReturn {
  const shouldMonitor = productionSafeMonitoring.shouldMonitor();
  const timersRef = useRef<Map<string, number>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      productionSafeMonitoring.forceFlush();
    };
  }, []);

  const trackMetric = useCallback(
    (name: string, value: number, tags?: Record<string, string>) => {
      if (!shouldMonitor) return;
      trackPerformance(name, value, tags);
    },
    [shouldMonitor]
  );

  const startTimer = useCallback(
    (name: string) => {
      if (!shouldMonitor) {
        return () => {}; // No-op
      }

      const start = performance.now();
      const timerId = `${name}-${Date.now()}`;
      timersRef.current.set(timerId, start);

      return () => {
        const startTime = timersRef.current.get(timerId);
        if (startTime !== undefined) {
          const duration = performance.now() - startTime;
          trackPerformance(name, duration);
          timersRef.current.delete(timerId);
        }
      };
    },
    [shouldMonitor]
  );

  return {
    shouldMonitor,
    trackMetric,
    measureAsync,
    measure,
    startTimer,
  };
}

/**
 * Hook to track component render time
 */
export function useRenderTimeTracking(componentName: string) {
  const { shouldMonitor, trackMetric } = useConditionalMonitoring();
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    if (!shouldMonitor) return;

    renderStartRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      trackMetric(`render.${componentName}`, renderTime, {
        component: componentName,
      });
    };
  });
}

/**
 * Hook to track API call performance
 */
export function useApiCallTracking() {
  const { shouldMonitor, measureAsync } = useConditionalMonitoring();

  const trackApiCall = useCallback(
    async <T,>(
      endpoint: string,
      fn: () => Promise<T>,
      tags?: Record<string, string>
    ): Promise<T> => {
      if (!shouldMonitor) {
        return fn();
      }

      return measureAsync(`api.${endpoint}`, fn, {
        endpoint,
        ...tags,
      });
    },
    [shouldMonitor, measureAsync]
  );

  return { trackApiCall };
}
