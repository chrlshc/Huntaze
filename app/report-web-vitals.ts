// Real User Monitoring for Core Web Vitals
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Initialize Web Vitals reporting
export function initWebVitals(sendToAnalytics: (metric: WebVitalMetric) => void) {
  // Core Web Vitals
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);  
  onLCP(sendToAnalytics);
  
  // Additional metrics
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// Example analytics sender (replace with your analytics service)
export function sendToAnalytics(metric: WebVitalMetric) {
  // Send to your analytics service
  if (typeof window !== 'undefined') {
    // Example: Google Analytics 4
    if ('gtag' in window) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta,
          navigation_type: metric.navigationType
        }
      });
    }
    
    // Example: Custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        page: window.location.pathname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      })
    }).catch(console.error);
  }
}

// Performance budget alerts
export function checkPerformanceBudgets(metric: WebVitalMetric) {
  const budgets = {
    LCP: 2500,  // 2.5s
    INP: 200,   // 200ms  
    CLS: 0.1,   // 0.1
    FCP: 1800,  // 1.8s
    TTFB: 600   // 600ms
  };
  
  const budget = budgets[metric.name as keyof typeof budgets];
  if (budget && metric.value > budget) {
    console.warn(`⚠️ Performance budget exceeded for ${metric.name}:`, {
      actual: metric.value,
      budget,
      rating: metric.rating,
      page: window.location.pathname
    });
    
    // Send alert to monitoring service
    if (metric.rating === 'poor') {
      sendPerformanceAlert(metric, budget);
    }
  }
}

function sendPerformanceAlert(metric: WebVitalMetric, budget: number) {
  // Send to monitoring service (e.g., Sentry, DataDog)
  fetch('/api/monitoring/performance-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert: 'Performance Budget Exceeded',
      metric: metric.name,
      value: metric.value,
      budget,
      severity: metric.rating === 'poor' ? 'high' : 'medium',
      page: window.location.pathname,
      timestamp: Date.now()
    })
  }).catch(console.error);
}