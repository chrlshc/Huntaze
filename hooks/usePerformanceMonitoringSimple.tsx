'use client';

import { useCallback, useEffect } from 'react';

interface PerformanceMonitoringOptions {
  pageName: string;
  trackScrollPerformance?: boolean;
  trackInteractions?: boolean;
}

export function usePerformanceMonitoring(options: PerformanceMonitoringOptions) {
  const trackAPIRequest = useCallback(async (
    endpoint: string,
    method: string,
    requestFn: () => Promise<any>
  ) => {
    const startTime = performance.now();
    try {
      const result = await requestFn();
      const duration = performance.now() - startTime;
      console.log(`API Request to ${endpoint} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API Request to ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return {
    trackAPIRequest,
  };
}
