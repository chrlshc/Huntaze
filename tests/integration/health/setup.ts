/**
 * Health Check Tests - Setup and Utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

/**
 * Global test setup
 */
export function setupHealthTests() {
  beforeAll(async () => {
    console.log('[Health Tests] Starting test suite');
  });

  afterAll(async () => {
    console.log('[Health Tests] Test suite completed');
  });

  beforeEach(() => {
    // Reset any test state if needed
  });

  afterEach(() => {
    // Cleanup after each test
  });
}

/**
 * Measure response time
 */
export async function measureResponseTime(
  fn: () => Promise<Response>
): Promise<{ response: Response; duration: number }> {
  const startTime = Date.now();
  const response = await fn();
  const duration = Date.now() - startTime;

  return { response, duration };
}

/**
 * Validate timestamp format
 */
export function isValidISOTimestamp(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    return date.toISOString() === timestamp;
  } catch {
    return false;
  }
}

/**
 * Check if timestamp is recent (within specified seconds)
 */
export function isRecentTimestamp(timestamp: string, maxAgeSeconds: number = 5): boolean {
  const now = Date.now();
  const timestampMs = new Date(timestamp).getTime();
  const ageMs = now - timestampMs;

  return ageMs >= 0 && ageMs <= maxAgeSeconds * 1000;
}

/**
 * Validate health response schema
 */
export interface HealthResponse {
  status: string;
  timestamp: string;
}

export function validateHealthResponse(data: unknown): data is HealthResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  return (
    typeof response.status === 'string' &&
    typeof response.timestamp === 'string' &&
    isValidISOTimestamp(response.timestamp)
  );
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  private responseTimes: number[] = [];

  addResponseTime(duration: number) {
    this.responseTimes.push(duration);
  }

  getAverage(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  getMedian(): number {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  getP95(): number {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index];
  }

  getP99(): number {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.99) - 1;
    return sorted[index];
  }

  getMin(): number {
    if (this.responseTimes.length === 0) return 0;
    return Math.min(...this.responseTimes);
  }

  getMax(): number {
    if (this.responseTimes.length === 0) return 0;
    return Math.max(...this.responseTimes);
  }

  getSummary() {
    return {
      count: this.responseTimes.length,
      average: this.getAverage(),
      median: this.getMedian(),
      p95: this.getP95(),
      p99: this.getP99(),
      min: this.getMin(),
      max: this.getMax(),
    };
  }

  reset() {
    this.responseTimes = [];
  }
}

/**
 * Concurrent request tester
 */
export async function testConcurrentRequests(
  requestFn: () => Promise<Response>,
  concurrency: number
): Promise<{
  responses: Response[];
  successCount: number;
  failureCount: number;
  averageTime: number;
}> {
  const metrics = new PerformanceMetrics();
  const requests = Array.from({ length: concurrency }, async () => {
    const { response, duration } = await measureResponseTime(requestFn);
    metrics.addResponseTime(duration);
    return response;
  });

  const responses = await Promise.all(requests);
  const successCount = responses.filter(r => r.status === 200).length;
  const failureCount = responses.length - successCount;

  return {
    responses,
    successCount,
    failureCount,
    averageTime: metrics.getAverage(),
  };
}

/**
 * Sequential request tester
 */
export async function testSequentialRequests(
  requestFn: () => Promise<Response>,
  count: number
): Promise<{
  responses: Response[];
  successCount: number;
  failureCount: number;
  metrics: ReturnType<PerformanceMetrics['getSummary']>;
}> {
  const performanceMetrics = new PerformanceMetrics();
  const responses: Response[] = [];

  for (let i = 0; i < count; i++) {
    const { response, duration } = await measureResponseTime(requestFn);
    performanceMetrics.addResponseTime(duration);
    responses.push(response);
  }

  const successCount = responses.filter(r => r.status === 200).length;
  const failureCount = responses.length - successCount;

  return {
    responses,
    successCount,
    failureCount,
    metrics: performanceMetrics.getSummary(),
  };
}
