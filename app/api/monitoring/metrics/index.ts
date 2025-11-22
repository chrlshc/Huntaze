/**
 * Monitoring Metrics API - Public Exports
 * 
 * Centralized exports for the monitoring metrics API.
 */

// Types
export type {
  MetricsSummary,
  AlarmInfo,
  MetricsSuccessResponse,
  MetricsErrorResponse,
  MetricsResponse,
} from './types';

export {
  isMetricsSuccess,
  isMetricsError,
} from './types';

// Client
export {
  MetricsClient,
  MetricsClientError,
  metricsClient,
  getMetrics,
  checkMetricsHealth,
} from './client';

export type {
  MetricsClientConfig,
  FetchMetricsOptions,
} from './client';
