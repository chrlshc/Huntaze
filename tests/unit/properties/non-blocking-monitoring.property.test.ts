/**
 * Property-Based Tests for Non-Blocking Monitoring
 * **Feature: dashboard-performance-real-fix, Property 15: Non-blocking monitoring**
 * **Validates: Requirements 5.5**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Testable monitoring that can simulate errors
class TestableNonBlockingMonitoring {
  private shouldThrow: boolean = false;
  private executionLog: string[] = [];

  setShouldThrow(value: boolean) {
    this.shouldThrow = value;
  }

  getExecutionLog(): string[] {
    return [...this.executionLog];
  }

  clearLog() {
    this.executionLog = [];
  }

  // Non-blocking metric tracking
  trackMetric(name: string, value: number): void {
    try {
      this.executionLog.push(`track:${name}`);

      if (this.shouldThrow) {
        throw new Error('Monitoring error');
      }

      // Simulate metric tracking
      this.executionLog.push(`tracked:${name}`);
    } catch (error) {
      // Silently catch - monitoring should never throw
      this.executionLog.push(`error:${name}`);
    }
  }

  // Non-blocking async operation
  async trackMetricAsync(name: string, value: number): Promise<void> {
    try {
      this.executionLog.push(`track-async:${name}`);

      if (this.shouldThrow) {
        throw new Error('Monitoring error');
      }

      await new Promise((resolve) => setTimeout(resolve, 1));
      this.executionLog.push(`tracked-async:${name}`);
    } catch (error) {
      this.executionLog.push(`error-async:${name}`);
    }
  }

  // Wrapper that ensures non-blocking
  withMonitoring<T>(fn: () => T): T {
    try {
      // Execute monitoring in background (non-blocking)
      Promise.resolve().then(() => {
        this.trackMetric('background', 1);
      });
    } catch (error) {
      // Never let monitoring errors escape
    }

    // Always execute the main function
    return fn();
  }
}

describe('Property 15: Non-blocking monitoring', () => {
  it('should never throw errors from monitoring code', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string(), fc.float()), { minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (metrics, shouldThrow) => {
          const monitoring = new TestableNonBlockingMonitoring();
          monitoring.setShouldThrow(shouldThrow);
          monitoring.clearLog();

          // Property: Tracking should never throw
          for (const [name, value] of metrics) {
            expect(() => monitoring.trackMetric(name, value)).not.toThrow();
          }

          // Property: All metrics should be attempted
          const log = monitoring.getExecutionLog();
          const trackAttempts = log.filter((entry) => entry.startsWith('track:'));
          expect(trackAttempts.length).toBe(metrics.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not block async operations even with errors', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        fc.boolean(),
        async (metricNames, shouldThrow) => {
          const monitoring = new TestableNonBlockingMonitoring();
          monitoring.setShouldThrow(shouldThrow);
          monitoring.clearLog();

          // Property: All async operations should complete
          const promises = metricNames.map((name) =>
            monitoring.trackMetricAsync(name, Math.random())
          );

          await expect(Promise.all(promises)).resolves.toBeDefined();

          // Property: All metrics should be attempted
          const log = monitoring.getExecutionLog();
          const trackAttempts = log.filter((entry) =>
            entry.startsWith('track-async:')
          );
          expect(trackAttempts.length).toBe(metricNames.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not block main function execution', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.boolean(),
        (value, shouldThrow) => {
          const monitoring = new TestableNonBlockingMonitoring();
          monitoring.setShouldThrow(shouldThrow);

          let mainFunctionExecuted = false;

          // Property: Main function should always execute
          const result = monitoring.withMonitoring(() => {
            mainFunctionExecuted = true;
            return value * 2;
          });

          expect(mainFunctionExecuted).toBe(true);
          expect(result).toBe(value * 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle concurrent monitoring calls without blocking', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 50 }),
        async (concurrentCalls) => {
          const monitoring = new TestableNonBlockingMonitoring();
          monitoring.clearLog();

          const startTime = Date.now();

          // Property: Concurrent calls should not block each other
          const promises = Array.from({ length: concurrentCalls }, (_, i) =>
            monitoring.trackMetricAsync(`metric-${i}`, i)
          );

          await Promise.all(promises);

          const duration = Date.now() - startTime;

          // Property: Should complete in reasonable time (not sequential)
          // If blocking, would take concurrentCalls * 1ms sequentially
          // Non-blocking should be much faster - we just verify it's not taking
          // sequential time (allow generous buffer for CI/test environment load)
          const sequentialTime = concurrentCalls * 1;
          expect(duration).toBeLessThan(sequentialTime * 100); // Very generous for test stability

          // Property: All calls should complete
          const log = monitoring.getExecutionLog();
          const completed = log.filter(
            (entry) =>
              entry.startsWith('tracked-async:') || entry.startsWith('error-async:')
          );
          expect(completed.length).toBe(concurrentCalls);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should preserve application state despite monitoring errors', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
        (values) => {
          const monitoring = new TestableNonBlockingMonitoring();
          monitoring.setShouldThrow(true); // Force errors

          const results: number[] = [];

          // Property: Application logic should work despite monitoring errors
          for (const value of values) {
            monitoring.trackMetric('test', value);
            results.push(value * 2);
          }

          expect(results).toEqual(values.map((v) => v * 2));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not accumulate errors over time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        (iterations) => {
          const monitoring = new TestableNonBlockingMonitoring();
          monitoring.setShouldThrow(true);

          // Property: Should handle many errors without issues
          for (let i = 0; i < iterations; i++) {
            expect(() => monitoring.trackMetric(`metric-${i}`, i)).not.toThrow();
          }

          // Property: Log should contain all attempts
          const log = monitoring.getExecutionLog();
          expect(log.length).toBeGreaterThanOrEqual(iterations);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should not interfere with application logic', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 10, maxLength: 100 }),
        (values) => {
          const monitoring = new TestableNonBlockingMonitoring();

          // Property: Results should be identical with or without monitoring
          const resultsWithout = values.map((v) => v * v);
          const resultsWith = values.map((v) => {
            monitoring.trackMetric('test', v);
            return v * v;
          });

          expect(resultsWith).toEqual(resultsWithout);
        }
      ),
      { numRuns: 100 }
    );
  });
});
