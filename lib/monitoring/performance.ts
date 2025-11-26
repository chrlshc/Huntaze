/**
 * Performance Monitoring Utilities
 * 
 * Tracks page loads, API response times, scroll performance, and user interactions
 * Requirements: 15.1, 15.2, 15.5
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PageLoadMetrics {
  pageUrl: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

interface ScrollMetrics {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  duration: number;
  timestamp: number;
}

interface InteractionMetrics {
  type: 'click' | 'navigation' | 'form_submit' | 'custom';
  target: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIMetrics[] = [];
  private scrollMetrics: ScrollMetrics[] = [];
  private interactionMetrics: InteractionMetrics[] = [];
  private isMonitoring: boolean = false;
  private scrollObserver: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializeNavigationTiming();
    }
  }

  /**
   * Initialize Web Vitals monitoring (Core Web Vitals)
   */
  private initializeWebVitals() {
    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.recordMetric('FCP', entry.startTime, {
          entryType: 'paint',
        });
      }
    });

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.recordMetric('LCP', entry.startTime, {
        entryType: 'largest-contentful-paint',
        element: (entry as any).element?.tagName,
      });
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entry) => {
      const fid = (entry as any).processingStart - entry.startTime;
      this.recordMetric('FID', fid, {
        entryType: 'first-input',
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entry) => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        this.recordMetric('CLS', clsValue, {
          entryType: 'layout-shift',
        });
      }
    });
  }

  /**
   * Initialize Navigation Timing API monitoring
   */
  private initializeNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (perfData) {
          const pageLoadMetrics: PageLoadMetrics = {
            pageUrl: window.location.href,
            loadTime: perfData.loadEventEnd - perfData.fetchStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            timeToInteractive: perfData.domInteractive - perfData.fetchStart,
          };

          this.recordMetric('PageLoad', pageLoadMetrics.loadTime, {
            ...pageLoadMetrics,
          });

          // Alert if page load is slow (> 3 seconds)
          if (pageLoadMetrics.loadTime > 3000) {
            console.warn('[Performance] Slow page load detected:', pageLoadMetrics);
          }
        }
      }, 0);
    });
  }

  /**
   * Observe performance entries of a specific type
   */
  private observePerformanceEntry(
    entryType: string,
    callback: (entry: PerformanceEntry) => void
  ) {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.error(`[Performance] Failed to observe ${entryType}:`, error);
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}:`, value.toFixed(2), 'ms', metadata);
    }

    // Send to analytics service (placeholder)
    this.sendToAnalytics(metric);
  }

  /**
   * Track API request performance
   */
  trackAPIRequest(
    endpoint: string,
    method: string,
    startTime: number,
    status: number,
    success: boolean
  ) {
    const duration = Date.now() - startTime;
    
    const apiMetric: APIMetrics = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      success,
    };

    this.apiMetrics.push(apiMetric);

    // Alert if API is slow (> 2 seconds)
    if (duration > 2000) {
      console.warn('[Performance] Slow API request:', apiMetric);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Performance] API ${method} ${endpoint}:`,
        duration.toFixed(2),
        'ms',
        `(${status})`
      );
    }

    this.sendToAnalytics({
      name: 'API_Request',
      value: duration,
      timestamp: Date.now(),
      metadata: apiMetric,
    });
  }

  /**
   * Start monitoring scroll performance (FPS)
   */
  startScrollMonitoring() {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;
    const frameTimes: number[] = [];
    let lastFrameTime = performance.now();
    let animationFrameId: number;

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      frameTimes.push(frameTime);
      lastFrameTime = currentTime;

      // Keep only last 60 frames (1 second at 60fps)
      if (frameTimes.length > 60) {
        frameTimes.shift();
      }

      animationFrameId = requestAnimationFrame(measureFrame);
    };

    animationFrameId = requestAnimationFrame(measureFrame);

    // Calculate FPS every 2 seconds
    const intervalId = setInterval(() => {
      if (frameTimes.length > 0) {
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const avgFPS = 1000 / avgFrameTime;
        const minFPS = 1000 / Math.max(...frameTimes);
        const maxFPS = 1000 / Math.min(...frameTimes);

        const scrollMetric: ScrollMetrics = {
          averageFPS: avgFPS,
          minFPS,
          maxFPS,
          duration: frameTimes.length * avgFrameTime,
          timestamp: Date.now(),
        };

        this.scrollMetrics.push(scrollMetric);

        // Alert if FPS drops below 30
        if (avgFPS < 30) {
          console.warn('[Performance] Low FPS detected:', scrollMetric);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Performance] Scroll FPS: ${avgFPS.toFixed(1)} (min: ${minFPS.toFixed(1)}, max: ${maxFPS.toFixed(1)})`
          );
        }
      }
    }, 2000);

    // Cleanup function
    this.scrollObserver = () => {
      this.isMonitoring = false;
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
    };
  }

  /**
   * Stop monitoring scroll performance
   */
  stopScrollMonitoring() {
    if (this.scrollObserver) {
      this.scrollObserver();
      this.scrollObserver = null;
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(
    type: InteractionMetrics['type'],
    target: string,
    metadata?: Record<string, any>
  ) {
    const interaction: InteractionMetrics = {
      type,
      target,
      timestamp: Date.now(),
      metadata,
    };

    this.interactionMetrics.push(interaction);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Interaction ${type}:`, target, metadata);
    }

    this.sendToAnalytics({
      name: 'User_Interaction',
      value: Date.now(),
      timestamp: Date.now(),
      metadata: interaction,
    });
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      performance: this.metrics,
      api: this.apiMetrics,
      scroll: this.scrollMetrics,
      interactions: this.interactionMetrics,
    };
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const avgAPITime =
      this.apiMetrics.length > 0
        ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / this.apiMetrics.length
        : 0;

    const avgFPS =
      this.scrollMetrics.length > 0
        ? this.scrollMetrics.reduce((sum, m) => sum + m.averageFPS, 0) / this.scrollMetrics.length
        : 0;

    const slowAPIs = this.apiMetrics.filter((m) => m.duration > 2000);
    const failedAPIs = this.apiMetrics.filter((m) => !m.success);

    return {
      totalMetrics: this.metrics.length,
      totalAPIRequests: this.apiMetrics.length,
      averageAPITime: avgAPITime.toFixed(2),
      slowAPIRequests: slowAPIs.length,
      failedAPIRequests: failedAPIs.length,
      averageFPS: avgFPS.toFixed(1),
      totalInteractions: this.interactionMetrics.length,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
    this.apiMetrics = [];
    this.scrollMetrics = [];
    this.interactionMetrics = [];
  }

  /**
   * Send metrics to analytics service
   * TODO: Integrate with actual analytics service (Google Analytics, Mixpanel, etc.)
   */
  private sendToAnalytics(metric: PerformanceMetric) {
    // Placeholder for analytics integration
    // Example: Google Analytics
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', 'performance_metric', {
    //     metric_name: metric.name,
    //     metric_value: metric.value,
    //     ...metric.metadata,
    //   });
    // }

    // Example: Custom analytics endpoint
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(console.error);
  }

  /**
   * Set up performance degradation alerts
   */
  setupAlerts(thresholds: {
    pageLoadTime?: number;
    apiResponseTime?: number;
    minFPS?: number;
  }) {
    const defaults = {
      pageLoadTime: 3000,
      apiResponseTime: 2000,
      minFPS: 30,
    };

    const config = { ...defaults, ...thresholds };

    // Monitor page load time
    if (config.pageLoadTime) {
      this.metrics
        .filter((m) => m.name === 'PageLoad' && m.value > config.pageLoadTime!)
        .forEach((m) => {
          console.warn('[Performance Alert] Slow page load:', m);
          // TODO: Send alert to monitoring service
        });
    }

    // Monitor API response time
    if (config.apiResponseTime) {
      this.apiMetrics
        .filter((m) => m.duration > config.apiResponseTime!)
        .forEach((m) => {
          console.warn('[Performance Alert] Slow API request:', m);
          // TODO: Send alert to monitoring service
        });
    }

    // Monitor FPS
    if (config.minFPS) {
      this.scrollMetrics
        .filter((m) => m.averageFPS < config.minFPS!)
        .forEach((m) => {
          console.warn('[Performance Alert] Low FPS:', m);
          // TODO: Send alert to monitoring service
        });
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type {
  PerformanceMetric,
  PageLoadMetrics,
  APIMetrics,
  ScrollMetrics,
  InteractionMetrics,
};
