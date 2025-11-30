/**
 * Performance Diagnostics System
 * Analyzes page load times, identifies bottlenecks, and detects performance issues
 */

import { getCloudWatchMonitoring } from '@/lib/aws/cloudwatch';

// Types
export interface PageLoadReport {
  url: string;
  metrics: {
    ttfb: number; // Time to First Byte
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    tti: number; // Time to Interactive
  };
  bottlenecks: Bottleneck[];
  recommendations: string[];
  timestamp: Date;
}

export interface Bottleneck {
  type: 'network' | 'render' | 'script' | 'style' | 'image';
  description: string;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resource?: string;
}

export interface SlowRequestReport {
  endpoint: string;
  method: string;
  averageTime: number;
  p95Time: number;
  p99Time: number;
  frequency: number;
  suggestions: string[];
  samples: RequestSample[];
}

export interface RequestSample {
  timestamp: Date;
  duration: number;
  statusCode: number;
  error?: string;
}

export interface LoadingStateReport {
  totalLoadingStates: number;
  simultaneousLoadingStates: number;
  averageLoadingDuration: number;
  excessiveLoadingInstances: LoadingInstance[];
  recommendations: string[];
}

export interface LoadingInstance {
  component: string;
  duration: number;
  timestamp: Date;
  reason: string;
}

export interface RenderReport {
  component: string;
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  unnecessaryRenders: number;
  recommendations: string[];
}

// Performance thresholds
const THRESHOLDS = {
  ttfb: 800,
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  tti: 3800,
  apiResponse: 2000,
  renderTime: 16, // 60fps = 16ms per frame
};

/**
 * Performance Diagnostics Service
 */
export class PerformanceDiagnostics {
  private requestHistory: Map<string, RequestSample[]> = new Map();
  private renderHistory: Map<string, number[]> = new Map();
  private loadingStateHistory: LoadingInstance[] = [];

  /**
   * Analyze page load performance
   */
  analyzePageLoad(metrics: PageLoadReport['metrics'], url: string): PageLoadReport {
    const bottlenecks: Bottleneck[] = [];
    const recommendations: string[] = [];

    // Analyze TTFB
    if (metrics.ttfb > THRESHOLDS.ttfb) {
      bottlenecks.push({
        type: 'network',
        description: `High Time to First Byte (${metrics.ttfb}ms)`,
        duration: metrics.ttfb,
        severity: metrics.ttfb > THRESHOLDS.ttfb * 2 ? 'critical' : 'high',
      });
      recommendations.push('Consider using CDN or optimizing server response time');
      recommendations.push('Enable server-side caching');
    }

    // Analyze FCP
    if (metrics.fcp > THRESHOLDS.fcp) {
      bottlenecks.push({
        type: 'render',
        description: `Slow First Contentful Paint (${metrics.fcp}ms)`,
        duration: metrics.fcp,
        severity: metrics.fcp > THRESHOLDS.fcp * 1.5 ? 'high' : 'medium',
      });
      recommendations.push('Optimize critical rendering path');
      recommendations.push('Inline critical CSS');
      recommendations.push('Defer non-critical JavaScript');
    }

    // Analyze LCP
    if (metrics.lcp > THRESHOLDS.lcp) {
      bottlenecks.push({
        type: 'render',
        description: `Poor Largest Contentful Paint (${metrics.lcp}ms)`,
        duration: metrics.lcp,
        severity: metrics.lcp > THRESHOLDS.lcp * 1.5 ? 'critical' : 'high',
      });
      recommendations.push('Optimize largest content element (images, text blocks)');
      recommendations.push('Use responsive images with srcset');
      recommendations.push('Preload critical resources');
    }

    // Analyze FID
    if (metrics.fid > THRESHOLDS.fid) {
      bottlenecks.push({
        type: 'script',
        description: `High First Input Delay (${metrics.fid}ms)`,
        duration: metrics.fid,
        severity: metrics.fid > THRESHOLDS.fid * 2 ? 'high' : 'medium',
      });
      recommendations.push('Break up long JavaScript tasks');
      recommendations.push('Use web workers for heavy computations');
      recommendations.push('Implement code splitting');
    }

    // Analyze CLS
    if (metrics.cls > THRESHOLDS.cls) {
      bottlenecks.push({
        type: 'render',
        description: `High Cumulative Layout Shift (${metrics.cls.toFixed(3)})`,
        duration: metrics.cls * 1000, // Convert to ms for consistency
        severity: metrics.cls > THRESHOLDS.cls * 2 ? 'high' : 'medium',
      });
      recommendations.push('Add size attributes to images and videos');
      recommendations.push('Reserve space for dynamic content');
      recommendations.push('Avoid inserting content above existing content');
    }

    // Analyze TTI
    if (metrics.tti > THRESHOLDS.tti) {
      bottlenecks.push({
        type: 'script',
        description: `Slow Time to Interactive (${metrics.tti}ms)`,
        duration: metrics.tti,
        severity: metrics.tti > THRESHOLDS.tti * 1.5 ? 'high' : 'medium',
      });
      recommendations.push('Reduce JavaScript execution time');
      recommendations.push('Minimize main thread work');
      recommendations.push('Reduce third-party code impact');
    }

    // Send metrics to CloudWatch
    this.sendMetricsToCloudWatch(metrics, url);

    return {
      url,
      metrics,
      bottlenecks,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      timestamp: new Date(),
    };
  }

  /**
   * Track API request for slow request analysis
   */
  trackRequest(endpoint: string, method: string, duration: number, statusCode: number, error?: string): void {
    const key = `${method}:${endpoint}`;
    
    if (!this.requestHistory.has(key)) {
      this.requestHistory.set(key, []);
    }

    const samples = this.requestHistory.get(key)!;
    samples.push({
      timestamp: new Date(),
      duration,
      statusCode,
      error,
    });

    // Keep only last 100 samples
    if (samples.length > 100) {
      samples.shift();
    }

    // Send to CloudWatch
    const monitoring = getCloudWatchMonitoring();
    monitoring.putMetric({
      namespace: 'Huntaze/Performance',
      metricName: 'APIResponseTime',
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        Endpoint: endpoint,
        Method: method,
        Status: statusCode.toString(),
      },
    });
  }

  /**
   * Identify slow API requests
   */
  identifySlowRequests(): SlowRequestReport[] {
    const reports: SlowRequestReport[] = [];

    for (const [key, samples] of this.requestHistory.entries()) {
      if (samples.length < 5) continue; // Need at least 5 samples

      const [method, endpoint] = key.split(':');
      const durations = samples.map((s) => s.duration).sort((a, b) => a - b);
      
      const averageTime = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p95Index = Math.floor(durations.length * 0.95);
      const p99Index = Math.floor(durations.length * 0.99);
      const p95Time = durations[p95Index];
      const p99Time = durations[p99Index];

      // Only report if average is above threshold
      if (averageTime > THRESHOLDS.apiResponse) {
        const suggestions: string[] = [];

        if (averageTime > THRESHOLDS.apiResponse * 2) {
          suggestions.push('Critical: Response time is 2x above threshold');
        }

        if (p99Time > averageTime * 2) {
          suggestions.push('High variance in response times - investigate outliers');
        }

        suggestions.push('Consider implementing caching');
        suggestions.push('Optimize database queries');
        suggestions.push('Add pagination if returning large datasets');

        reports.push({
          endpoint,
          method,
          averageTime,
          p95Time,
          p99Time,
          frequency: samples.length,
          suggestions,
          samples: samples.slice(-10), // Last 10 samples
        });
      }
    }

    return reports.sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * Track loading state
   */
  trackLoadingState(component: string, duration: number, reason: string): void {
    this.loadingStateHistory.push({
      component,
      duration,
      timestamp: new Date(),
      reason,
    });

    // Keep only last 1000 instances
    if (this.loadingStateHistory.length > 1000) {
      this.loadingStateHistory.shift();
    }
  }

  /**
   * Analyze loading states
   */
  analyzeLoadingStates(): LoadingStateReport {
    const recentStates = this.loadingStateHistory.slice(-100);
    
    if (recentStates.length === 0) {
      return {
        totalLoadingStates: 0,
        simultaneousLoadingStates: 0,
        averageLoadingDuration: 0,
        excessiveLoadingInstances: [],
        recommendations: [],
      };
    }

    const totalLoadingStates = recentStates.length;
    const averageLoadingDuration =
      recentStates.reduce((sum, state) => sum + state.duration, 0) / totalLoadingStates;

    // Find simultaneous loading states (within 100ms of each other)
    let maxSimultaneous = 0;
    for (let i = 0; i < recentStates.length; i++) {
      let simultaneous = 1;
      const currentTime = recentStates[i].timestamp.getTime();
      
      for (let j = i + 1; j < recentStates.length; j++) {
        const timeDiff = recentStates[j].timestamp.getTime() - currentTime;
        if (timeDiff < 100) {
          simultaneous++;
        } else {
          break;
        }
      }
      
      maxSimultaneous = Math.max(maxSimultaneous, simultaneous);
    }

    // Find excessive loading instances (> 1 second)
    const excessiveLoadingInstances = recentStates.filter((state) => state.duration > 1000);

    const recommendations: string[] = [];

    if (maxSimultaneous > 3) {
      recommendations.push('Too many simultaneous loading states - consider batching requests');
    }

    if (averageLoadingDuration > 500) {
      recommendations.push('Average loading duration is high - implement caching');
    }

    if (excessiveLoadingInstances.length > totalLoadingStates * 0.2) {
      recommendations.push('Many loading states exceed 1 second - optimize data fetching');
    }

    return {
      totalLoadingStates,
      simultaneousLoadingStates: maxSimultaneous,
      averageLoadingDuration,
      excessiveLoadingInstances,
      recommendations,
    };
  }

  /**
   * Track component render
   */
  trackRender(component: string, renderTime: number): void {
    if (!this.renderHistory.has(component)) {
      this.renderHistory.set(component, []);
    }

    const renders = this.renderHistory.get(component)!;
    renders.push(renderTime);

    // Keep only last 100 renders
    if (renders.length > 100) {
      renders.shift();
    }
  }

  /**
   * Detect excessive re-renders
   */
  detectExcessiveRenders(): RenderReport[] {
    const reports: RenderReport[] = [];

    for (const [component, renders] of this.renderHistory.entries()) {
      if (renders.length < 10) continue; // Need at least 10 renders

      const renderCount = renders.length;
      const totalRenderTime = renders.reduce((a, b) => a + b, 0);
      const averageRenderTime = totalRenderTime / renderCount;
      const unnecessaryRenders = renders.filter((time) => time < 1).length; // Renders < 1ms likely unnecessary

      const recommendations: string[] = [];

      if (renderCount > 50) {
        recommendations.push('Component renders very frequently - check dependencies');
        recommendations.push('Consider using React.memo or useMemo');
      }

      if (averageRenderTime > THRESHOLDS.renderTime) {
        recommendations.push('Render time exceeds 16ms - optimize component logic');
        recommendations.push('Move heavy computations outside render');
      }

      if (unnecessaryRenders > renderCount * 0.3) {
        recommendations.push('Many unnecessary renders detected - optimize state updates');
      }

      if (recommendations.length > 0) {
        reports.push({
          component,
          renderCount,
          averageRenderTime,
          totalRenderTime,
          unnecessaryRenders,
          recommendations,
        });
      }
    }

    return reports.sort((a, b) => b.renderCount - a.renderCount);
  }

  /**
   * Send metrics to CloudWatch
   */
  private async sendMetricsToCloudWatch(metrics: PageLoadReport['metrics'], url: string): Promise<void> {
    const monitoring = getCloudWatchMonitoring();
    const dimensions = { Page: url };

    const metricPromises = [
      monitoring.putMetric({
        namespace: 'Huntaze/Performance',
        metricName: 'TTFB',
        value: metrics.ttfb,
        unit: 'Milliseconds',
        dimensions,
      }),
      monitoring.putMetric({
        namespace: 'Huntaze/Performance',
        metricName: 'FCP',
        value: metrics.fcp,
        unit: 'Milliseconds',
        dimensions,
      }),
      monitoring.putMetric({
        namespace: 'Huntaze/Performance',
        metricName: 'LCP',
        value: metrics.lcp,
        unit: 'Milliseconds',
        dimensions,
      }),
      monitoring.putMetric({
        namespace: 'Huntaze/Performance',
        metricName: 'FID',
        value: metrics.fid,
        unit: 'Milliseconds',
        dimensions,
      }),
      monitoring.putMetric({
        namespace: 'Huntaze/Performance',
        metricName: 'CLS',
        value: metrics.cls,
        unit: 'None',
        dimensions,
      }),
      monitoring.putMetric({
        namespace: 'Huntaze/Performance',
        metricName: 'TTI',
        value: metrics.tti,
        unit: 'Milliseconds',
        dimensions,
      }),
    ];

    await Promise.all(metricPromises);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    slowRequests: SlowRequestReport[];
    loadingStates: LoadingStateReport;
    excessiveRenders: RenderReport[];
    webVitals?: {
      lcp?: number;
      fid?: number;
      cls?: number;
      ttfb?: number;
      fcp?: number;
      tti?: number;
    };
    bottlenecks?: Bottleneck[];
  } {
    return {
      slowRequests: this.identifySlowRequests(),
      loadingStates: this.analyzeLoadingStates(),
      excessiveRenders: this.detectExcessiveRenders(),
      webVitals: undefined,
      bottlenecks: [],
    };
  }

  /**
   * Clear history (useful for testing)
   */
  clearHistory(): void {
    this.requestHistory.clear();
    this.renderHistory.clear();
    this.loadingStateHistory = [];
  }
}

// Singleton instance
let diagnosticsInstance: PerformanceDiagnostics | null = null;

/**
 * Get performance diagnostics instance
 */
export function getPerformanceDiagnostics(): PerformanceDiagnostics {
  if (!diagnosticsInstance) {
    diagnosticsInstance = new PerformanceDiagnostics();
  }
  return diagnosticsInstance;
}
