/**
 * Performance Diagnostic Tool
 * Main interface for measuring and analyzing performance bottlenecks
 */

export { dbQueryTracker, createPrismaQueryMiddleware } from './db-query-tracker';
export type { QueryMetrics, QueryStats } from './db-query-tracker';

export { renderTimeTracker, withRenderTracking } from './render-time-tracker';
export type { RenderMetrics, RenderStats } from './render-time-tracker';

export { requestTracker, trackedFetch } from './request-tracker';
export type { DuplicateRequest, RequestStats } from './request-tracker';

export {
  monitoringOverheadTracker,
  trackOverhead,
  trackOverheadAsync,
} from './monitoring-overhead-tracker';
export type { OverheadMetrics } from './monitoring-overhead-tracker';

export { diagnosticReportGenerator } from './diagnostic-report';
export type {
  Bottleneck,
  Recommendation,
  ImpactEstimate,
  DiagnosticReport,
  BottleneckType,
  ImpactLevel,
} from './diagnostic-report';

import { dbQueryTracker, QueryStats } from './db-query-tracker';
import { renderTimeTracker, RenderStats } from './render-time-tracker';
import { requestTracker, DuplicateRequest } from './request-tracker';
import { monitoringOverheadTracker, OverheadMetrics } from './monitoring-overhead-tracker';
import { diagnosticReportGenerator, DiagnosticReport } from './diagnostic-report';

/**
 * Main Performance Diagnostic Tool
 */
export class PerformanceDiagnostic {
  private isRunning: boolean = false;

  /**
   * Start diagnostic session
   */
  start() {
    if (this.isRunning) {
      console.warn('Diagnostic session already running');
      return;
    }

    this.isRunning = true;
    dbQueryTracker.enable();
    renderTimeTracker.enable();
    requestTracker.enable();
    monitoringOverheadTracker.enable();

    console.log('Performance diagnostic started');
  }

  /**
   * Stop diagnostic session and generate report
   */
  stop(): DiagnosticReport {
    if (!this.isRunning) {
      console.warn('No diagnostic session running');
      return this.generateReport();
    }

    this.isRunning = false;
    dbQueryTracker.disable();
    renderTimeTracker.disable();
    requestTracker.disable();
    monitoringOverheadTracker.disable();

    console.log('Performance diagnostic stopped');
    return this.generateReport();
  }

  /**
   * Generate report from current data
   */
  generateReport(): DiagnosticReport {
    return diagnosticReportGenerator.generateReport();
  }

  /**
   * Format report as string
   */
  formatReport(report: DiagnosticReport): string {
    return diagnosticReportGenerator.formatReport(report);
  }

  /**
   * Reset all trackers
   */
  reset() {
    dbQueryTracker.reset();
    renderTimeTracker.reset();
    requestTracker.reset();
    monitoringOverheadTracker.reset();
  }

  /**
   * Check if diagnostic is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Measure database queries
   */
  async measureDatabaseQueries(): Promise<QueryStats> {
    return dbQueryTracker.getStats();
  }

  /**
   * Measure render times
   */
  async measureRenderTimes(): Promise<RenderStats> {
    return renderTimeTracker.getStats();
  }

  /**
   * Find duplicate requests
   */
  async findDuplicateRequests(): Promise<DuplicateRequest[]> {
    const stats = requestTracker.getStats();
    return stats.duplicateRequests;
  }

  /**
   * Measure monitoring overhead
   */
  async measureMonitoringOverhead(): Promise<OverheadMetrics> {
    return monitoringOverheadTracker.getMetrics();
  }

  /**
   * Set current page for request tracking
   */
  setCurrentPage(page: string) {
    requestTracker.setCurrentPage(page);
  }
}

// Singleton instance
export const performanceDiagnostic = new PerformanceDiagnostic();

// Export default instance
export default performanceDiagnostic;
