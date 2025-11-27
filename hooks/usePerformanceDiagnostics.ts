'use client';

/**
 * React Hook for Performance Diagnostics
 * Provides easy access to performance diagnostics from React components
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { PageLoadReport } from '@/lib/performance/diagnostics';

/**
 * Hook to track page load performance
 */
export function usePageLoadDiagnostics(url?: string) {
  const reportedRef = useRef(false);

  useEffect(() => {
    if (reportedRef.current) return;
    if (typeof window === 'undefined') return;

    const currentUrl = url || window.location.pathname;

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      collectAndReportMetrics(currentUrl);
      reportedRef.current = true;
    } else {
      window.addEventListener('load', () => {
        collectAndReportMetrics(currentUrl);
        reportedRef.current = true;
      });
    }
  }, [url]);
}

/**
 * Collect Web Vitals and send to diagnostics API
 */
async function collectAndReportMetrics(url: string) {
  try {
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return;

    const metrics = {
      ttfb: navigation.responseStart - navigation.requestStart,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      tti: 0,
    };

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime;
    }

    // Try to get Web Vitals from PerformanceObserver
    if ('PerformanceObserver' in window) {
      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }
    }

    // Estimate TTI (simplified)
    metrics.tti = navigation.domInteractive - navigation.fetchStart;

    // Wait a bit for observers to collect data
    setTimeout(async () => {
      // Send to diagnostics API
      await fetch('/api/performance/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, metrics }),
      });
    }, 1000);
  } catch (error) {
    console.debug('Failed to collect performance metrics:', error);
  }
}

/**
 * Hook to track API request performance
 */
export function useApiDiagnostics() {
  const trackRequest = useCallback(
    async (endpoint: string, method: string, duration: number, statusCode: number, error?: string) => {
      try {
        await fetch('/api/performance/track-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, method, duration, statusCode, error }),
        });
      } catch (e) {
        console.debug('Failed to track request:', e);
      }
    },
    []
  );

  return { trackRequest };
}

/**
 * Hook to track loading states
 */
export function useLoadingStateDiagnostics(component: string) {
  const startTimeRef = useRef<number | null>(null);

  const startLoading = useCallback((reason: string = 'data-fetch') => {
    startTimeRef.current = Date.now();
  }, []);

  const endLoading = useCallback(
    async (reason: string = 'data-fetch') => {
      if (startTimeRef.current === null) return;

      const duration = Date.now() - startTimeRef.current;
      startTimeRef.current = null;

      try {
        await fetch('/api/performance/track-loading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ component, duration, reason }),
        });
      } catch (e) {
        console.debug('Failed to track loading state:', e);
      }
    },
    [component]
  );

  return { startLoading, endLoading };
}

/**
 * Hook to track component render performance
 */
export function useRenderDiagnostics(component: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartRef.current;

      // Send to diagnostics API (async, non-blocking)
      fetch('/api/performance/track-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, renderTime }),
      }).catch(() => {
        // Silently fail
      });
    };
  });
}
