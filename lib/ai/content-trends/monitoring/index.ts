/**
 * Monitoring Module Exports
 * Content & Trends AI Engine - Phase 6
 * 
 * Azure Monitor integration, metrics collection, alerting, and dashboards.
 */

// Types
export * from './types';

// Services
export { ContentTrendsMetricsCollector, createMetricsCollector, createMetric, aggregateMetrics } from './metrics-collector';
export { AzureMonitorService, createAzureMonitorService } from './azure-monitor-service';
export { ContentTrendsAlertingService, createAlertingService } from './alerting-service';
export { ContentTrendsDashboardService, createDashboardService } from './dashboard-service';
