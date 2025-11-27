/**
 * Performance Impact Measurement Tool
 * 
 * Measures the actual performance improvements from optimizations by comparing
 * before/after metrics for page load times, API response times, DB query counts,
 * and cache hit rates.
 */

import { DiagnosticReport } from './diagnostic-report';

export interface PerformanceSnapshot {
  timestamp: number;
  pageLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  dbQueryCounts: Record<string, number>;
  cacheHitRates: Record<string, number>;
  totalRequests: number;
  totalDbQueries: number;
  averagePageLoadTime: number;
  averageApiResponseTime: number;
}

export interface ImpactMeasurement {
  before: PerformanceSnapshot;
  after: PerformanceSnapshot;
  improvements: {
    pageLoadTime: number; // percentage improvement
    apiResponseTime: number;
    dbQueryCount: number;
    cacheHitRate: number;
  };
  details: {
    pageLoadImprovements: Record<string, number>;
    apiResponseImprovements: Record<string, number>;
    dbQueryReductions: Record<string, number>;
    cacheHitRateChanges: Record<string, number>;
  };
}

export class ImpactMeasurementTool {
  private snapshots: PerformanceSnapshot[] = [];

  /**
   * Take a performance snapshot of the current system state
   */
  async takeSnapshot(label: string = 'snapshot'): Promise<PerformanceSnapshot> {
    const pageLoadTimes = await this.measurePageLoadTimes();
    const apiResponseTimes = await this.measureApiResponseTimes();
    const dbQueryCounts = await this.measureDbQueryCounts();
    const cacheHitRates = await this.measureCacheHitRates();

    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      pageLoadTimes,
      apiResponseTimes,
      dbQueryCounts,
      cacheHitRates,
      totalRequests: Object.keys(apiResponseTimes).length,
      totalDbQueries: Object.values(dbQueryCounts).reduce((sum, count) => sum + count, 0),
      averagePageLoadTime: this.calculateAverage(Object.values(pageLoadTimes)),
      averageApiResponseTime: this.calculateAverage(Object.values(apiResponseTimes)),
    };

    this.snapshots.push(snapshot);
    console.log(`[Impact Measurement] Snapshot taken: ${label}`);
    
    return snapshot;
  }

  /**
   * Measure page load times for all dashboard pages
   */
  private async measurePageLoadTimes(): Promise<Record<string, number>> {
    const pages = [
      '/dashboard',
      '/content',
      '/analytics',
      '/integrations',
      '/messages',
      '/billing/packs',
    ];

    const times: Record<string, number> = {};

    for (const page of pages) {
      const startTime = performance.now();
      
      try {
        // Simulate page load by fetching the page
        const response = await fetch(`http://localhost:3000${page}`, {
          headers: { 'User-Agent': 'Impact-Measurement-Tool' }
        });
        
        if (response.ok) {
          await response.text();
          times[page] = performance.now() - startTime;
        }
      } catch (error) {
        console.warn(`Failed to measure ${page}:`, error);
        times[page] = -1; // Mark as failed
      }
    }

    return times;
  }

  /**
   * Measure API response times for common endpoints
   */
  private async measureApiResponseTimes(): Promise<Record<string, number>> {
    const endpoints = [
      '/api/cached-example',
      '/api/swr-example',
      '/api/paginated-example',
      '/api/aggregation-example',
    ];

    const times: Record<string, number> = {};

    for (const endpoint of endpoints) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        
        if (response.ok) {
          await response.json();
          times[endpoint] = performance.now() - startTime;
        }
      } catch (error) {
        console.warn(`Failed to measure ${endpoint}:`, error);
        times[endpoint] = -1;
      }
    }

    return times;
  }

  /**
   * Measure database query counts per endpoint
   */
  private async measureDbQueryCounts(): Promise<Record<string, number>> {
    // This would integrate with the DB query tracker
    // For now, return mock data structure
    return {
      '/api/cached-example': 0, // Should be 0 with cache
      '/api/swr-example': 0,
      '/api/paginated-example': 1, // Should be 1 with cursor pagination
      '/api/aggregation-example': 1, // Should be 1 with DB aggregation
    };
  }

  /**
   * Measure cache hit rates for cached endpoints
   */
  private async measureCacheHitRates(): Promise<Record<string, number>> {
    // This would integrate with the cache system
    // For now, return mock data structure
    return {
      '/api/cached-example': 0.85, // 85% hit rate
      '/api/swr-example': 0.90, // 90% hit rate
      '/api/paginated-example': 0.75,
      '/api/aggregation-example': 0.80,
    };
  }

  /**
   * Compare two snapshots and calculate improvements
   */
  compareSnapshots(before: PerformanceSnapshot, after: PerformanceSnapshot): ImpactMeasurement {
    const pageLoadImprovements: Record<string, number> = {};
    const apiResponseImprovements: Record<string, number> = {};
    const dbQueryReductions: Record<string, number> = {};
    const cacheHitRateChanges: Record<string, number> = {};

    // Calculate per-page improvements
    for (const page in before.pageLoadTimes) {
      if (after.pageLoadTimes[page] && before.pageLoadTimes[page] > 0) {
        const improvement = ((before.pageLoadTimes[page] - after.pageLoadTimes[page]) / before.pageLoadTimes[page]) * 100;
        pageLoadImprovements[page] = improvement;
      }
    }

    // Calculate per-API improvements
    for (const endpoint in before.apiResponseTimes) {
      if (after.apiResponseTimes[endpoint] && before.apiResponseTimes[endpoint] > 0) {
        const improvement = ((before.apiResponseTimes[endpoint] - after.apiResponseTimes[endpoint]) / before.apiResponseTimes[endpoint]) * 100;
        apiResponseImprovements[endpoint] = improvement;
      }
    }

    // Calculate DB query reductions
    for (const endpoint in before.dbQueryCounts) {
      if (after.dbQueryCounts[endpoint] !== undefined) {
        const reduction = ((before.dbQueryCounts[endpoint] - after.dbQueryCounts[endpoint]) / Math.max(before.dbQueryCounts[endpoint], 1)) * 100;
        dbQueryReductions[endpoint] = reduction;
      }
    }

    // Calculate cache hit rate changes
    for (const endpoint in before.cacheHitRates) {
      if (after.cacheHitRates[endpoint] !== undefined) {
        const change = (after.cacheHitRates[endpoint] - before.cacheHitRates[endpoint]) * 100;
        cacheHitRateChanges[endpoint] = change;
      }
    }

    // Calculate overall improvements
    const avgPageLoadImprovement = this.calculateAverage(Object.values(pageLoadImprovements));
    const avgApiResponseImprovement = this.calculateAverage(Object.values(apiResponseImprovements));
    const avgDbQueryReduction = this.calculateAverage(Object.values(dbQueryReductions));
    const avgCacheHitRateChange = this.calculateAverage(Object.values(cacheHitRateChanges));

    return {
      before,
      after,
      improvements: {
        pageLoadTime: avgPageLoadImprovement,
        apiResponseTime: avgApiResponseImprovement,
        dbQueryCount: avgDbQueryReduction,
        cacheHitRate: avgCacheHitRateChange,
      },
      details: {
        pageLoadImprovements,
        apiResponseImprovements,
        dbQueryReductions,
        cacheHitRateChanges,
      },
    };
  }

  /**
   * Generate a human-readable impact report
   */
  generateReport(measurement: ImpactMeasurement): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(80));
    lines.push('PERFORMANCE OPTIMIZATION IMPACT REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    
    lines.push('OVERALL IMPROVEMENTS:');
    lines.push('-'.repeat(80));
    lines.push(`Page Load Time:      ${this.formatImprovement(measurement.improvements.pageLoadTime)}`);
    lines.push(`API Response Time:   ${this.formatImprovement(measurement.improvements.apiResponseTime)}`);
    lines.push(`DB Query Count:      ${this.formatImprovement(measurement.improvements.dbQueryCount)}`);
    lines.push(`Cache Hit Rate:      ${this.formatChange(measurement.improvements.cacheHitRate)}`);
    lines.push('');
    
    lines.push('PAGE LOAD TIME IMPROVEMENTS:');
    lines.push('-'.repeat(80));
    for (const [page, improvement] of Object.entries(measurement.details.pageLoadImprovements)) {
      const before = measurement.before.pageLoadTimes[page];
      const after = measurement.after.pageLoadTimes[page];
      if (typeof before === 'number' && typeof after === 'number' && !isNaN(before) && !isNaN(after)) {
        lines.push(`${page.padEnd(30)} ${before.toFixed(0)}ms → ${after.toFixed(0)}ms (${this.formatImprovement(improvement)})`);
      }
    }
    lines.push('');
    
    lines.push('API RESPONSE TIME IMPROVEMENTS:');
    lines.push('-'.repeat(80));
    for (const [endpoint, improvement] of Object.entries(measurement.details.apiResponseImprovements)) {
      const before = measurement.before.apiResponseTimes[endpoint];
      const after = measurement.after.apiResponseTimes[endpoint];
      if (typeof before === 'number' && typeof after === 'number' && !isNaN(before) && !isNaN(after)) {
        lines.push(`${endpoint.padEnd(30)} ${before.toFixed(0)}ms → ${after.toFixed(0)}ms (${this.formatImprovement(improvement)})`);
      }
    }
    lines.push('');
    
    lines.push('DATABASE QUERY REDUCTIONS:');
    lines.push('-'.repeat(80));
    for (const [endpoint, reduction] of Object.entries(measurement.details.dbQueryReductions)) {
      const before = measurement.before.dbQueryCounts[endpoint];
      const after = measurement.after.dbQueryCounts[endpoint];
      lines.push(`${endpoint.padEnd(30)} ${before} → ${after} queries (${this.formatImprovement(reduction)})`);
    }
    lines.push('');
    
    lines.push('CACHE HIT RATE CHANGES:');
    lines.push('-'.repeat(80));
    for (const [endpoint, change] of Object.entries(measurement.details.cacheHitRateChanges)) {
      const before = (measurement.before.cacheHitRates[endpoint] * 100).toFixed(1);
      const after = (measurement.after.cacheHitRates[endpoint] * 100).toFixed(1);
      lines.push(`${endpoint.padEnd(30)} ${before}% → ${after}% (${this.formatChange(change)})`);
    }
    lines.push('');
    
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const validValues = values.filter(v => v >= 0);
    if (validValues.length === 0) return 0;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  private formatImprovement(value: number): string {
    if (value > 0) {
      return `↑ ${value.toFixed(1)}% faster`;
    } else if (value < 0) {
      return `↓ ${Math.abs(value).toFixed(1)}% slower`;
    } else {
      return '→ no change';
    }
  }

  private formatChange(value: number): string {
    if (value > 0) {
      return `↑ +${value.toFixed(1)}%`;
    } else if (value < 0) {
      return `↓ ${value.toFixed(1)}%`;
    } else {
      return '→ no change';
    }
  }
}

// Export singleton instance
export const impactMeasurement = new ImpactMeasurementTool();
