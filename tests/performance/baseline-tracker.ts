/**
 * Performance Baseline Tracker
 * 
 * Tracks and compares performance metrics against established baselines
 * to detect regressions.
 */

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  timestamp: Date;
  duration: number;
  statusCode: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface PerformanceBaseline {
  endpoint: string;
  method: string;
  p50: number;
  p95: number;
  p99: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface PerformanceComparison {
  endpoint: string;
  method: string;
  current: PerformanceBaseline;
  baseline: PerformanceBaseline;
  regression: boolean;
  regressionPercentage: number;
  details: {
    p50Change: number;
    p95Change: number;
    p99Change: number;
    avgChange: number;
  };
}

export class BaselineTracker {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly regressionThreshold = 0.20; // 20% threshold

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const key = this.getKey(metric.endpoint, metric.method);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push(metric);
  }

  /**
   * Calculate baseline from recorded metrics
   */
  calculateBaseline(endpoint: string, method: string): PerformanceBaseline {
    const key = this.getKey(endpoint, method);
    const metrics = this.metrics.get(key) || [];
    
    if (metrics.length === 0) {
      throw new Error(`No metrics found for ${method} ${endpoint}`);
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const sampleSize = durations.length;

    return {
      endpoint,
      method,
      p50: this.percentile(durations, 0.50),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      avgDuration: durations.reduce((a, b) => a + b, 0) / sampleSize,
      minDuration: durations[0],
      maxDuration: durations[sampleSize - 1],
      sampleSize,
      lastUpdated: new Date(),
    };
  }

  /**
   * Save baseline for future comparisons
   */
  saveBaseline(endpoint: string, method: string): void {
    const baseline = this.calculateBaseline(endpoint, method);
    const key = this.getKey(endpoint, method);
    this.baselines.set(key, baseline);
  }

  /**
   * Load baseline from storage
   */
  loadBaseline(endpoint: string, method: string, baseline: PerformanceBaseline): void {
    const key = this.getKey(endpoint, method);
    this.baselines.set(key, baseline);
  }

  /**
   * Compare current metrics against baseline
   */
  compareToBaseline(endpoint: string, method: string): PerformanceComparison {
    const key = this.getKey(endpoint, method);
    const baseline = this.baselines.get(key);
    
    if (!baseline) {
      throw new Error(`No baseline found for ${method} ${endpoint}`);
    }

    const current = this.calculateBaseline(endpoint, method);
    
    // Calculate percentage changes
    const p50Change = this.calculateChange(baseline.p50, current.p50);
    const p95Change = this.calculateChange(baseline.p95, current.p95);
    const p99Change = this.calculateChange(baseline.p99, current.p99);
    const avgChange = this.calculateChange(baseline.avgDuration, current.avgDuration);

    // Determine if there's a regression (using p95 as primary indicator)
    const regression = p95Change > this.regressionThreshold;

    return {
      endpoint,
      method,
      current,
      baseline,
      regression,
      regressionPercentage: p95Change,
      details: {
        p50Change,
        p95Change,
        p99Change,
        avgChange,
      },
    };
  }

  /**
   * Get all baselines
   */
  getAllBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Export baselines to JSON
   */
  exportBaselines(): string {
    const baselines = this.getAllBaselines();
    return JSON.stringify(baselines, null, 2);
  }

  /**
   * Import baselines from JSON
   */
  importBaselines(json: string): void {
    const baselines = JSON.parse(json) as PerformanceBaseline[];
    baselines.forEach(baseline => {
      this.loadBaseline(baseline.endpoint, baseline.method, baseline);
    });
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const comparisons: PerformanceComparison[] = [];
    const regressions: PerformanceComparison[] = [];

    for (const [key, baseline] of this.baselines) {
      try {
        const comparison = this.compareToBaseline(baseline.endpoint, baseline.method);
        comparisons.push(comparison);
        
        if (comparison.regression) {
          regressions.push(comparison);
        }
      } catch (error) {
        // Skip if no current metrics
      }
    }

    return {
      timestamp: new Date(),
      totalEndpoints: this.baselines.size,
      regressionsDetected: regressions.length,
      comparisons,
      regressions,
      summary: this.generateSummary(comparisons),
    };
  }

  // Private helper methods

  private getKey(endpoint: string, method: string): string {
    return `${method}:${endpoint}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateChange(baseline: number, current: number): number {
    if (baseline === 0) return 0;
    return (current - baseline) / baseline;
  }

  private generateSummary(comparisons: PerformanceComparison[]): PerformanceSummary {
    if (comparisons.length === 0) {
      return {
        avgP95Change: 0,
        maxP95Change: 0,
        endpointsImproved: 0,
        endpointsRegressed: 0,
        endpointsStable: 0,
      };
    }

    const p95Changes = comparisons.map(c => c.details.p95Change);
    const avgP95Change = p95Changes.reduce((a, b) => a + b, 0) / p95Changes.length;
    const maxP95Change = Math.max(...p95Changes);

    const endpointsImproved = comparisons.filter(c => c.details.p95Change < -0.05).length;
    const endpointsRegressed = comparisons.filter(c => c.regression).length;
    const endpointsStable = comparisons.length - endpointsImproved - endpointsRegressed;

    return {
      avgP95Change,
      maxP95Change,
      endpointsImproved,
      endpointsRegressed,
      endpointsStable,
    };
  }
}

export interface PerformanceReport {
  timestamp: Date;
  totalEndpoints: number;
  regressionsDetected: number;
  comparisons: PerformanceComparison[];
  regressions: PerformanceComparison[];
  summary: PerformanceSummary;
}

export interface PerformanceSummary {
  avgP95Change: number;
  maxP95Change: number;
  endpointsImproved: number;
  endpointsRegressed: number;
  endpointsStable: number;
}

// Singleton instance
let trackerInstance: BaselineTracker | null = null;

export function getBaselineTracker(): BaselineTracker {
  if (!trackerInstance) {
    trackerInstance = new BaselineTracker();
  }
  return trackerInstance;
}

export function resetBaselineTracker(): void {
  trackerInstance = null;
}
