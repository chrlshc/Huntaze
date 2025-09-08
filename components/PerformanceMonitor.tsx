'use client';

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and on client
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Web Vitals monitoring
    const reportWebVital = (metric: any) => {
      // Send to analytics or logging service
      console.log(`[Web Vital] ${metric.name}: ${metric.value}`);
      
      // Example: Send to Google Analytics
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
        });
      }
    };

    // Import web-vitals dynamically
    import('web-vitals').then((webVitals) => {
      webVitals.onCLS(reportWebVital);
      webVitals.onINP(reportWebVital); // FID is deprecated, use INP
      webVitals.onFCP(reportWebVital);
      webVitals.onLCP(reportWebVital);
      webVitals.onTTFB(reportWebVital);
    });

    // Performance Observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Report long tasks (> 50ms)
            if (entry.duration > 50) {
              console.warn('[Performance] Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Some browsers don't support longtask
      }
    }

    // Monitor memory usage (Chrome only)
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

        if (usedMB > totalMB * 0.9) {
          console.warn('[Performance] High memory usage:', {
            used: `${usedMB}MB`,
            total: `${totalMB}MB`,
            limit: `${limitMB}MB`
          });
        }
      };

      // Check memory every 30 seconds
      const memoryInterval = setInterval(checkMemory, 30000);
      
      return () => clearInterval(memoryInterval);
    }
  }, []);

  return null; // This component doesn't render anything
}