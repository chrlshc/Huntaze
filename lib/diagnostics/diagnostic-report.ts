/**
 * Performance Diagnostic Report Generator
 * Aggregates all metrics and generates prioritized bottleneck report
 */

import { dbQueryTracker, QueryStats } from './db-query-tracker';
import { renderTimeTracker, RenderStats } from './render-time-tracker';
import { requestTracker, RequestStats } from './request-tracker';
import {
  monitoringOverheadTracker,
  OverheadMetrics,
} from './monitoring-overhead-tracker';

export type BottleneckType = 'db' | 'render' | 'network' | 'monitoring';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface Bottleneck {
  type: BottleneckType;
  description: string;
  impact: ImpactLevel;
  currentTime: number; // ms
  location: string;
  recommendation: string;
}

export interface Recommendation {
  priority: number; // 1-10, 10 being highest
  title: string;
  description: string;
  estimatedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ImpactEstimate {
  totalBottleneckTime: number; // ms
  estimatedImprovement: number; // percentage
  quickWins: Recommendation[];
  longTermOptimizations: Recommendation[];
}

export interface DiagnosticReport {
  timestamp: Date;
  environment: string;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  estimatedImpact: ImpactEstimate;
  rawMetrics: {
    database: QueryStats;
    rendering: RenderStats;
    requests: RequestStats;
    monitoring: OverheadMetrics;
  };
}

class DiagnosticReportGenerator {
  generateReport(): DiagnosticReport {
    const queryStats = dbQueryTracker.getStats();
    const renderStats = renderTimeTracker.getStats();
    const requestStats = requestTracker.getStats();
    const monitoringMetrics = monitoringOverheadTracker.getMetrics();

    const bottlenecks = this.identifyBottlenecks(
      queryStats,
      renderStats,
      requestStats,
      monitoringMetrics
    );

    const recommendations = this.generateRecommendations(bottlenecks);
    const estimatedImpact = this.estimateImpact(bottlenecks, recommendations);

    return {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      bottlenecks,
      recommendations,
      estimatedImpact,
      rawMetrics: {
        database: queryStats,
        rendering: renderStats,
        requests: requestStats,
        monitoring: monitoringMetrics,
      },
    };
  }

  private identifyBottlenecks(
    queryStats: QueryStats,
    renderStats: RenderStats,
    requestStats: RequestStats,
    monitoringMetrics: OverheadMetrics
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Database bottlenecks
    queryStats.slowQueries.forEach((query) => {
      const avgTime = query.duration / query.count;
      bottlenecks.push({
        type: 'db',
        description: `Slow database query: ${query.query}`,
        impact: this.calculateImpact(avgTime, query.count),
        currentTime: avgTime,
        location: query.calledFrom.join(', '),
        recommendation: `Optimize query or add database index`,
      });
    });

    // Render bottlenecks
    renderStats.slowRenders.forEach((render) => {
      const avgTime = render.renderTime / render.reRenderCount;
      bottlenecks.push({
        type: 'render',
        description: `Slow render: ${render.component} on ${render.page}`,
        impact: this.calculateImpact(avgTime, render.reRenderCount),
        currentTime: avgTime,
        location: `${render.page} > ${render.component}`,
        recommendation: `Optimize component rendering or use React.memo`,
      });
    });

    // Network bottlenecks (duplicate requests)
    requestStats.duplicateRequests.forEach((dup) => {
      bottlenecks.push({
        type: 'network',
        description: `Duplicate API calls to ${dup.endpoint}`,
        impact: this.calculateImpact(
          dup.potentialSavings / dup.count,
          dup.count
        ),
        currentTime: dup.potentialSavings,
        location: dup.pages.join(', '),
        recommendation: `Implement request deduplication with SWR or React Query`,
      });
    });

    // Monitoring overhead
    if (monitoringMetrics.avgOverheadPerRequest > 10) {
      bottlenecks.push({
        type: 'monitoring',
        description: `High monitoring overhead`,
        impact: this.calculateImpact(
          monitoringMetrics.avgOverheadPerRequest,
          monitoringMetrics.monitoringCallCount
        ),
        currentTime: monitoringMetrics.totalOverhead,
        location: 'Global monitoring',
        recommendation: `Disable monitoring in production or implement sampling`,
      });
    }

    // Sort by impact
    return bottlenecks.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  private calculateImpact(
    avgTime: number,
    frequency: number
  ): ImpactLevel {
    const totalImpact = avgTime * frequency;

    if (totalImpact > 1000 || avgTime > 500) {
      return 'high';
    } else if (totalImpact > 500 || avgTime > 200) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateRecommendations(
    bottlenecks: Bottleneck[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Group bottlenecks by type
    const dbBottlenecks = bottlenecks.filter((b) => b.type === 'db');
    const renderBottlenecks = bottlenecks.filter((b) => b.type === 'render');
    const networkBottlenecks = bottlenecks.filter((b) => b.type === 'network');
    const monitoringBottlenecks = bottlenecks.filter(
      (b) => b.type === 'monitoring'
    );

    // Database recommendations
    if (dbBottlenecks.length > 0) {
      recommendations.push({
        priority: 9,
        title: 'Optimize Database Queries',
        description: `Found ${dbBottlenecks.length} slow database queries. Add indexes, optimize queries, or implement caching.`,
        estimatedImprovement: '30-50% reduction in API response time',
        effort: 'medium',
      });
    }

    // Network recommendations
    if (networkBottlenecks.length > 0) {
      recommendations.push({
        priority: 10,
        title: 'Implement Request Deduplication',
        description: `Found ${networkBottlenecks.length} duplicate API calls. Configure SWR deduplication to eliminate redundant requests.`,
        estimatedImprovement: '40-60% reduction in network requests',
        effort: 'low',
      });
    }

    // Render recommendations
    if (renderBottlenecks.length > 0) {
      recommendations.push({
        priority: 7,
        title: 'Optimize Component Rendering',
        description: `Found ${renderBottlenecks.length} slow renders. Use React.memo, useMemo, or code splitting.`,
        estimatedImprovement: '20-30% improvement in page load time',
        effort: 'medium',
      });
    }

    // Monitoring recommendations
    if (monitoringBottlenecks.length > 0) {
      recommendations.push({
        priority: 8,
        title: 'Reduce Monitoring Overhead',
        description: `Monitoring is impacting performance. Disable in production or implement sampling.`,
        estimatedImprovement: '10-20% improvement in overall performance',
        effort: 'low',
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private estimateImpact(
    bottlenecks: Bottleneck[],
    recommendations: Recommendation[]
  ): ImpactEstimate {
    const totalBottleneckTime = bottlenecks.reduce(
      (sum, b) => sum + b.currentTime,
      0
    );

    // Estimate improvement based on bottleneck types
    const highImpactCount = bottlenecks.filter(
      (b) => b.impact === 'high'
    ).length;
    const mediumImpactCount = bottlenecks.filter(
      (b) => b.impact === 'medium'
    ).length;

    const estimatedImprovement =
      Math.min(70, highImpactCount * 15 + mediumImpactCount * 8);

    const quickWins = recommendations.filter((r) => r.effort === 'low');
    const longTermOptimizations = recommendations.filter(
      (r) => r.effort === 'medium' || r.effort === 'high'
    );

    return {
      totalBottleneckTime,
      estimatedImprovement,
      quickWins,
      longTermOptimizations,
    };
  }

  formatReport(report: DiagnosticReport): string {
    let output = '=== PERFORMANCE DIAGNOSTIC REPORT ===\n\n';
    output += `Generated: ${report.timestamp.toISOString()}\n`;
    output += `Environment: ${report.environment}\n\n`;

    output += '--- BOTTLENECKS ---\n';
    report.bottlenecks.forEach((b, i) => {
      output += `${i + 1}. [${b.impact.toUpperCase()}] ${b.description}\n`;
      output += `   Time: ${b.currentTime.toFixed(2)}ms\n`;
      output += `   Location: ${b.location}\n`;
      output += `   Recommendation: ${b.recommendation}\n\n`;
    });

    output += '--- RECOMMENDATIONS ---\n';
    report.recommendations.forEach((r, i) => {
      output += `${i + 1}. [Priority ${r.priority}] ${r.title}\n`;
      output += `   ${r.description}\n`;
      output += `   Estimated Improvement: ${r.estimatedImprovement}\n`;
      output += `   Effort: ${r.effort}\n\n`;
    });

    output += '--- IMPACT ESTIMATE ---\n';
    output += `Total Bottleneck Time: ${report.estimatedImpact.totalBottleneckTime.toFixed(2)}ms\n`;
    output += `Estimated Improvement: ${report.estimatedImpact.estimatedImprovement}%\n`;
    output += `Quick Wins: ${report.estimatedImpact.quickWins.length}\n`;
    output += `Long-term Optimizations: ${report.estimatedImpact.longTermOptimizations.length}\n`;

    return output;
  }
}

// Singleton instance
export const diagnosticReportGenerator = new DiagnosticReportGenerator();
