/**
 * Monitoring Metrics API Types
 * 
 * TypeScript type definitions for the monitoring metrics endpoint.
 * These types ensure type safety across client and server code.
 */

/**
 * Metrics summary structure from Golden Signals
 */
export interface MetricsSummary {
  requests: {
    total: number;
    averageLatency: number;
    errorRate: number;
  };
  connections: {
    active: number;
  };
  cache: {
    hits: number;
    misses: number;
  };
  database: {
    queries: number;
    averageLatency: number;
    successRate: number;
  };
}

/**
 * CloudWatch alarm information
 */
export interface AlarmInfo {
  name: string;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
  reason: string;
  updatedAt: Date;
}

/**
 * Success response structure
 */
export interface MetricsSuccessResponse {
  success: true;
  data: {
    metrics: MetricsSummary;
    alarms: AlarmInfo[];
    timestamp: string;
  };
  duration: number;
}

/**
 * Error response structure
 */
export interface MetricsErrorResponse {
  success: false;
  error: string;
  correlationId: string;
  retryable: boolean;
}

/**
 * Response type (union)
 */
export type MetricsResponse = MetricsSuccessResponse | MetricsErrorResponse;

/**
 * Type guard to check if response is successful
 */
export function isMetricsSuccess(
  response: MetricsResponse
): response is MetricsSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isMetricsError(
  response: MetricsResponse
): response is MetricsErrorResponse {
  return response.success === false;
}
