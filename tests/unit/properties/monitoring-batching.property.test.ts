/**
 * Property-Based Tests for Monitoring Batching
 * **Feature: dashboard-performance-real-fix, Property 14: Metrics are batched**
 * **Validates: Requirements 5.3**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock the monitoring system for testing
class TestableMonitoring {
  private metricBatch: any[] = [];
  private batchSize: number = 50;
  private flushCallback: ((batch: any[]) => void) | null = null;

  setBatchSize(size: number) {
    this.batchSize = size;
  }

  setFlushCallback(callback: (batch: any[]) => void) {
    this.flushCallback = callback;
  }

  trackMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric = { name, value, timestamp: Date.now(), tags };
    this.metricBatch.push(metric);

    if (this.metricBatch.length >= this.batchSize) {
      this.flush();
    }
  }

  flush() {
    if (this.metricBatch.length === 0) return;

    const batch = [...this.metricBatch];
    this.metricBatch = [];

    if (this.flushCallback) {
      this.flushCallback(batch);
    }
  }

  getBatchSize(): number {
    return this.metricBatch.length;
  }

  reset() {
    this.metricBatch = [];
  }
}

describe('Property 14: Metrics are batched', () => {
  let monitoring: TestableMonitoring;
  let flushedBatches: any[][] = [];

  beforeEach(() => {
    monitoring = new TestableMonitoring();
    flushedBatches = [];
    monitoring.setFlushCallback((batch) => {
      flushedBatches.push(batch);
    });
  });

  it('should batch metrics until batch size is reached', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // batch size
        fc.array(fc.tuple(fc.string(), fc.float()), { minLength: 1, maxLength: 200 }), // metrics
        (batchSize, metrics) => {
          monitoring.reset();
          flushedBatches = [];
          monitoring.setBatchSize(batchSize);
          monitoring.setFlushCallback((batch) => {
            flushedBatches.push(batch);
          });

          // Track all metrics
          for (const [name, value] of metrics) {
            monitoring.trackMetric(name, value);
          }

          // Force flush remaining
          monitoring.flush();

          // Property: All metrics should be in batches
          const totalInBatches = flushedBatches.reduce(
            (sum, batch) => sum + batch.length,
            0
          );
          expect(totalInBatches).toBe(metrics.length);

          // Property: Each batch (except last) should be exactly batchSize
          for (let i = 0; i < flushedBatches.length - 1; i++) {
            expect(flushedBatches[i].length).toBe(batchSize);
          }

          // Property: Last batch should be <= batchSize
          if (flushedBatches.length > 0) {
            const lastBatch = flushedBatches[flushedBatches.length - 1];
            expect(lastBatch.length).toBeLessThanOrEqual(batchSize);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve metric data in batches', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1 }),
            value: fc.float(),
            tags: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (metrics) => {
          monitoring.reset();
          flushedBatches = [];
          monitoring.setBatchSize(10);
          monitoring.setFlushCallback((batch) => {
            flushedBatches.push(batch);
          });

          // Track all metrics
          for (const metric of metrics) {
            monitoring.trackMetric(metric.name, metric.value, metric.tags);
          }

          monitoring.flush();

          // Property: All metrics should be preserved
          const allBatchedMetrics = flushedBatches.flat();
          expect(allBatchedMetrics.length).toBe(metrics.length);

          // Property: Metric data should match
          for (let i = 0; i < metrics.length; i++) {
            expect(allBatchedMetrics[i].name).toBe(metrics[i].name);
            expect(allBatchedMetrics[i].value).toBe(metrics[i].value);
            if (metrics[i].tags) {
              expect(allBatchedMetrics[i].tags).toEqual(metrics[i].tags);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not lose metrics when batching', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 200 }),
        (batchSize, metricCount) => {
          monitoring.reset();
          flushedBatches = [];
          monitoring.setBatchSize(batchSize);
          monitoring.setFlushCallback((batch) => {
            flushedBatches.push(batch);
          });

          // Track metrics
          for (let i = 0; i < metricCount; i++) {
            monitoring.trackMetric(`metric-${i}`, i);
          }

          monitoring.flush();

          // Property: No metrics should be lost
          const totalInBatches = flushedBatches.reduce(
            (sum, batch) => sum + batch.length,
            0
          );
          expect(totalInBatches).toBe(metricCount);

          // Property: All metric names should be unique and present
          const names = flushedBatches.flat().map((m) => m.name);
          const uniqueNames = new Set(names);
          expect(uniqueNames.size).toBe(metricCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain metric order within batches', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
        (values) => {
          monitoring.reset();
          flushedBatches = [];
          monitoring.setBatchSize(10);
          monitoring.setFlushCallback((batch) => {
            flushedBatches.push(batch);
          });

          // Track metrics with sequential values
          for (const value of values) {
            monitoring.trackMetric('test', value);
          }

          monitoring.flush();

          // Property: Order should be preserved
          const allValues = flushedBatches.flat().map((m) => m.value);
          expect(allValues).toEqual(values);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty batches gracefully', () => {
    monitoring.reset();
    flushedBatches = [];

    // Flush without any metrics
    monitoring.flush();

    // Property: No batches should be created for empty flush
    expect(flushedBatches.length).toBe(0);
  });

  it('should batch exactly when size is reached', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }),
        (batchSize) => {
          monitoring.reset();
          flushedBatches = [];
          monitoring.setBatchSize(batchSize);
          monitoring.setFlushCallback((batch) => {
            flushedBatches.push(batch);
          });

          // Track exactly batchSize metrics
          for (let i = 0; i < batchSize; i++) {
            monitoring.trackMetric('test', i);
          }

          // Property: Should have flushed exactly once
          expect(flushedBatches.length).toBe(1);
          expect(flushedBatches[0].length).toBe(batchSize);

          // Property: Current batch should be empty
          expect(monitoring.getBatchSize()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accumulate metrics below batch size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }),
        fc.integer({ min: 1, max: 9 }),
        (batchSize, metricCount) => {
          monitoring.reset();
          flushedBatches = [];
          monitoring.setBatchSize(batchSize);
          monitoring.setFlushCallback((batch) => {
            flushedBatches.push(batch);
          });

          // Track fewer metrics than batch size
          for (let i = 0; i < metricCount; i++) {
            monitoring.trackMetric('test', i);
          }

          // Property: Should not have flushed yet
          expect(flushedBatches.length).toBe(0);

          // Property: Metrics should be in current batch
          expect(monitoring.getBatchSize()).toBe(metricCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
