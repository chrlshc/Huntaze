/**
 * Type definitions for Redis Test API
 * 
 * Provides TypeScript types for request/response structures
 * to ensure type safety across the application.
 */

/**
 * Redis test result for individual operations
 */
export interface RedisTestResult {
  result?: string;
  value?: string;
  key?: string;
  duration: string;
}

/**
 * Connection information
 */
export interface RedisConnectionInfo {
  host: string;
  port: string;
  redisVersion?: string;
}

/**
 * Test results for all operations
 */
export interface RedisTestResults {
  ping: RedisTestResult;
  set: RedisTestResult;
  get: RedisTestResult;
  delete: RedisTestResult;
}

/**
 * Performance metrics
 */
export interface RedisPerformanceMetrics {
  totalDuration: string;
}

/**
 * Response metadata
 */
export interface RedisTestMetadata {
  timestamp: string;
  correlationId: string;
  retryable?: boolean;
}

/**
 * Troubleshooting information
 */
export interface RedisTroubleshooting {
  possibleCauses: string[];
  nextSteps: string[];
}

/**
 * Success response structure
 */
export interface RedisTestSuccessResponse {
  success: true;
  connection: RedisConnectionInfo & { redisVersion: string };
  tests: RedisTestResults;
  performance: RedisPerformanceMetrics;
  meta: Omit<RedisTestMetadata, 'retryable'>;
}

/**
 * Error response structure
 */
export interface RedisTestErrorResponse {
  success: false;
  error: string;
  errorType: string;
  connection: RedisConnectionInfo;
  troubleshooting: RedisTroubleshooting;
  meta: RedisTestMetadata;
}

/**
 * Response type (union)
 */
export type RedisTestResponse = RedisTestSuccessResponse | RedisTestErrorResponse;

/**
 * Type guard to check if response is successful
 */
export function isRedisTestSuccess(
  response: RedisTestResponse
): response is RedisTestSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isRedisTestError(
  response: RedisTestResponse
): response is RedisTestErrorResponse {
  return response.success === false;
}

/**
 * Parse duration string to milliseconds
 * 
 * @param duration - Duration string (e.g., "145ms")
 * @returns Duration in milliseconds
 */
export function parseDuration(duration: string): number {
  return parseInt(duration.replace('ms', ''), 10);
}

/**
 * Check if performance meets benchmarks
 * 
 * @param performance - Performance metrics
 * @returns True if performance is acceptable
 */
export function isPerformanceAcceptable(performance: RedisPerformanceMetrics): boolean {
  const totalMs = parseDuration(performance.totalDuration);
  return totalMs < 200; // Acceptable threshold
}

/**
 * Check if performance is optimal
 * 
 * @param performance - Performance metrics
 * @returns True if performance is optimal
 */
export function isPerformanceOptimal(performance: RedisPerformanceMetrics): boolean {
  const totalMs = parseDuration(performance.totalDuration);
  return totalMs < 100; // Optimal threshold
}
