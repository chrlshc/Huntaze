'use client';

/**
 * Web Vitals Hook with CloudWatch Integration
 * 
 * Measures and reports Core Web Vitals:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * 
 * Automatically sends metrics to CloudWatch for monitoring and alerting
 * 
 * Requirements: 2.2, 9.1, 9.4
 * Property 7: Web Vitals logging
 * Property 9: Performance alerts
 */

'use client';

import { useEffect, useState } from 'react';

export interface WebVitals {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  inp?: number; // Interaction to Next Paint (new metric)
}

export interface WebVitalsReport extends WebVitals {
  url: string;
  timestamp: number;
  userAgent: string;
  connection?: string;
}

/**
 * Hook to measure and report Web Vitals with CloudWatch integration
 */
export function useWebVitals(options?: {
  onReport?: (report: WebVitalsReport) => void;
  reportToAnalytics?: boolean;
  sendToCloudWatch?: boolean; // New option to send to CloudWatch
}) {
  const [vitals, setVitals] = useState<WebVitals>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    let isMounted = true;
    
    // Function to report vitals
    const reportVital = (name: string, value: number) => {
      if (!isMounted) return;
      
      setVitals(prev => ({
        ...prev,
        [name.toLowerCase()]: value,
      }));
      
      // Create full report
      const report: WebVitalsReport = {
        ...vitals,
        [name.toLowerCase()]: value,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType,
      };
      
      // Call custom report handler
      options?.onReport?.(report);
      
      // Send to analytics if enabled
      if (options?.reportToAnalytics) {
        sendToAnalytics(name, value);
      }
      
      // Send to CloudWatch if enabled (default: true)
      if (options?.sendToCloudWatch !== false) {
        sendToCloudWatch(name, value, report);
      }
    };
    
    // Measure FCP (First Contentful Paint)
    const measureFCP = () => {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        reportVital('FCP', fcpEntry.startTime);
      }
    };
    
    // Measure TTFB (Time to First Byte)
    const measureTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        reportVital('TTFB', ttfb);
      }
    };
    
    // Measure LCP (Largest Contentful Paint)
    const measureLCP = () => {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            reportVital('LCP', lastEntry.renderTime || lastEntry.loadTime);
          }
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        return () => observer.disconnect();
      } catch (e) {
        console.warn('LCP measurement not supported');
      }
    };
    
    // Measure FID (First Input Delay)
    const measureFID = () => {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0] as any;
          
          if (firstInput) {
            const fid = firstInput.processingStart - firstInput.startTime;
            reportVital('FID', fid);
          }
        });
        
        observer.observe({ type: 'first-input', buffered: true });
        
        return () => observer.disconnect();
      } catch (e) {
        console.warn('FID measurement not supported');
      }
    };
    
    // Measure CLS (Cumulative Layout Shift)
    const measureCLS = () => {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              reportVital('CLS', clsValue);
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        return () => observer.disconnect();
      } catch (e) {
        console.warn('CLS measurement not supported');
      }
    };
    
    // Measure INP (Interaction to Next Paint) - new metric
    const measureINP = () => {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          for (const entry of entries) {
            const inp = (entry as any).duration;
            reportVital('INP', inp);
          }
        });
        
        observer.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit & { durationThreshold?: number });
        
        return () => observer.disconnect();
      } catch (e) {
        // INP is a newer metric, might not be supported
      }
    };
    
    // Start measurements
    const cleanupFns: Array<(() => void) | undefined> = [];
    
    // Measure immediately available metrics
    measureFCP();
    measureTTFB();
    
    // Set up observers for other metrics
    cleanupFns.push(measureLCP());
    cleanupFns.push(measureFID());
    cleanupFns.push(measureCLS());
    cleanupFns.push(measureINP());
    
    setIsLoading(false);
    
    // Cleanup
    return () => {
      isMounted = false;
      cleanupFns.forEach(fn => fn?.());
    };
  }, [options?.onReport, options?.reportToAnalytics]);
  
  return {
    vitals,
    isLoading,
  };
}

/**
 * Send vitals to analytics
 */
function sendToAnalytics(name: string, value: number) {
  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(value),
      event_label: name,
      non_interaction: true,
    });
  }
  
  // Send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: name,
        value,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail - don't block user experience
    });
  }
}

/**
 * Send Web Vitals to CloudWatch
 * Property 7: Web Vitals logging - All Core Web Vitals should be logged
 */
function sendToCloudWatch(name: string, value: number, report: WebVitalsReport) {
  // Only send in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_CLOUDWATCH) {
    return;
  }
  
  // Send to CloudWatch metrics API endpoint
  fetch('/api/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      namespace: 'Huntaze/WebVitals',
      metricName: name,
      value,
      unit: name === 'CLS' ? 'None' : 'Milliseconds',
      dimensions: {
        Page: new URL(report.url).pathname,
        Connection: report.connection || 'unknown',
        UserAgent: getUserAgentCategory(report.userAgent),
      },
      timestamp: new Date(report.timestamp).toISOString(),
    }),
  }).catch((error) => {
    // Log error but don't block user experience
    console.warn('Failed to send Web Vitals to CloudWatch:', error);
  });
  
  // Check if metric exceeds threshold and needs alerting
  checkThresholdAndAlert(name, value, report);
}

/**
 * Check if metric exceeds threshold and trigger alert
 * Property 9: Performance alerts - Alerts should be triggered when thresholds are exceeded
 */
function checkThresholdAndAlert(name: string, value: number, report: WebVitalsReport) {
  const thresholds: Record<string, number> = {
    LCP: 2500,  // Good: < 2.5s
    FID: 100,   // Good: < 100ms
    CLS: 0.1,   // Good: < 0.1
    FCP: 1800,  // Good: < 1.8s
    TTFB: 800,  // Good: < 800ms
    INP: 200,   // Good: < 200ms
  };
  
  const threshold = thresholds[name];
  if (threshold && value > threshold) {
    // Send alert to CloudWatch
    fetch('/api/metrics/alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metricName: name,
        value,
        threshold,
        severity: getSeverity(name, value, threshold),
        context: {
          url: report.url,
          userAgent: report.userAgent,
          connection: report.connection,
          timestamp: report.timestamp,
        },
      }),
    }).catch(() => {
      // Silently fail
    });
  }
}

/**
 * Get severity level based on how much threshold is exceeded
 */
function getSeverity(name: string, value: number, threshold: number): 'warning' | 'critical' {
  const ratio = value / threshold;
  
  // Critical if exceeds threshold by 50% or more
  if (ratio >= 1.5) {
    return 'critical';
  }
  
  return 'warning';
}

/**
 * Categorize user agent for better grouping in CloudWatch
 */
function getUserAgentCategory(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

/**
 * Get performance grade based on Web Vitals
 */
export function getPerformanceGrade(vitals: WebVitals): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  details: Record<string, { value: number; grade: string; threshold: string }>;
} {
  const scores: Record<string, number> = {};
  const details: Record<string, { value: number; grade: string; threshold: string }> = {};
  
  // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
  if (vitals.lcp !== undefined) {
    const lcp = vitals.lcp;
    if (lcp <= 2500) {
      scores.lcp = 100;
      details.lcp = { value: lcp, grade: 'Good', threshold: '≤2.5s' };
    } else if (lcp <= 4000) {
      scores.lcp = 50;
      details.lcp = { value: lcp, grade: 'Needs Improvement', threshold: '2.5-4s' };
    } else {
      scores.lcp = 0;
      details.lcp = { value: lcp, grade: 'Poor', threshold: '>4s' };
    }
  }
  
  // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
  if (vitals.fid !== undefined) {
    const fid = vitals.fid;
    if (fid <= 100) {
      scores.fid = 100;
      details.fid = { value: fid, grade: 'Good', threshold: '≤100ms' };
    } else if (fid <= 300) {
      scores.fid = 50;
      details.fid = { value: fid, grade: 'Needs Improvement', threshold: '100-300ms' };
    } else {
      scores.fid = 0;
      details.fid = { value: fid, grade: 'Poor', threshold: '>300ms' };
    }
  }
  
  // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
  if (vitals.cls !== undefined) {
    const cls = vitals.cls;
    if (cls <= 0.1) {
      scores.cls = 100;
      details.cls = { value: cls, grade: 'Good', threshold: '≤0.1' };
    } else if (cls <= 0.25) {
      scores.cls = 50;
      details.cls = { value: cls, grade: 'Needs Improvement', threshold: '0.1-0.25' };
    } else {
      scores.cls = 0;
      details.cls = { value: cls, grade: 'Poor', threshold: '>0.25' };
    }
  }
  
  // FCP scoring (good: <1.8s, needs improvement: 1.8-3s, poor: >3s)
  if (vitals.fcp !== undefined) {
    const fcp = vitals.fcp;
    if (fcp <= 1800) {
      scores.fcp = 100;
      details.fcp = { value: fcp, grade: 'Good', threshold: '≤1.8s' };
    } else if (fcp <= 3000) {
      scores.fcp = 50;
      details.fcp = { value: fcp, grade: 'Needs Improvement', threshold: '1.8-3s' };
    } else {
      scores.fcp = 0;
      details.fcp = { value: fcp, grade: 'Poor', threshold: '>3s' };
    }
  }
  
  // Calculate average score
  const scoreValues = Object.values(scores);
  const avgScore = scoreValues.length > 0
    ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    : 0;
  
  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (avgScore >= 90) grade = 'A';
  else if (avgScore >= 75) grade = 'B';
  else if (avgScore >= 60) grade = 'C';
  else if (avgScore >= 50) grade = 'D';
  else grade = 'F';
  
  return {
    grade,
    score: Math.round(avgScore),
    details,
  };
}
