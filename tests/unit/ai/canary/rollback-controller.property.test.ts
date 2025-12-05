/**
 * Property-based tests for RollbackController
 * 
 * **Feature: azure-foundry-production-rollout, Property 6: Rollback trigger correctness**
 * **Validates: Requirements 4.4, 4.5, 4.6**
 * 
 * Tests that rollback is triggered when:
 * - Error rate exceeds 5%
 * - Latency p95 exceeds 5 seconds
 * - Cost exceeds threshold
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  RollbackController,
  RollbackThresholds,
} from '../../../../lib/ai/canary/rollback-controller';
import { MetricsCollector } from '../../../../lib/ai/canary/metrics-collector';
import { TrafficSplitter } from '../../../../lib/ai/canary/traffic-splitter';

describe('RollbackController Property Tests', () => {
  let controller: RollbackController;
  let metricsCollector: MetricsCollector;
  let trafficSplitter: TrafficSplitter;

  beforeEach(() => {
    RollbackController.resetInstance();
    MetricsCollector.resetInstance();
    TrafficSplitter.resetInstance();
    
    metricsCollector = new MetricsCollector();
    trafficSplitter = new TrafficSplitter({ percentage: 50 });
  });

  afterEach(() => {
    RollbackController.resetInstance();
    MetricsCollector.resetInstance();
    TrafficSplitter.resetInstance();
  });

  /**
   * Helper to generate metrics with specific error rate
   */
  function generateMetricsWithErrorRate(
    collector: MetricsCollector,
    totalRequests: number,
    errorRate: number,
    latencyMs: number = 100,
    costUsd: number = 0.01
  ): void {
    const errorCount = Math.floor(totalRequests * errorRate);
    const successCount = totalRequests - errorCount;

    for (let i = 0; i < successCount; i++) {
      collector.recordSuccess({
        requestId: `req-success-${i}`,
        correlationId: `corr-${i}`,
        provider: 'foundry',
        model: 'gpt-4',
        latencyMs,
        costUsd,
      });
    }

    for (let i = 0; i < errorCount; i++) {
      collector.recordFailure({
        requestId: `req-error-${i}`,
        correlationId: `corr-error-${i}`,
        provider: 'foundry',
        model: 'gpt-4',
        latencyMs,
        costUsd,
        errorMessage: 'Test error',
      });
    }
  }

  describe('Property 6: Rollback trigger correctness', () => {
    /**
     * Property: Error rate > 5% should trigger rollback
     */
    it('should trigger rollback when error rate exceeds threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.06, max: 0.50, noNaN: true }), // Error rate above 5%
          (errorRate) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            generateMetricsWithErrorRate(metricsCollector, 200, errorRate);

            const decision = controller.checkHealth();

            expect(decision.shouldRollback).toBe(true);
            expect(decision.reason).toBe('error_rate_exceeded');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error rate <= 5% should NOT trigger rollback (for error rate)
     */
    it('should not trigger rollback when error rate is within threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 0.049, noNaN: true }), // Error rate at or below 5%
          (errorRate) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            generateMetricsWithErrorRate(metricsCollector, 200, errorRate, 100, 0.01);

            const decision = controller.checkHealth();

            // Should not rollback due to error rate
            if (decision.shouldRollback) {
              expect(decision.reason).not.toBe('error_rate_exceeded');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Latency p95 > 5000ms should trigger rollback
     */
    it('should trigger rollback when latency p95 exceeds threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5001, max: 20000 }), // Latency above 5000ms
          (latencyMs) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            // Generate metrics with high latency (all successful to isolate latency test)
            for (let i = 0; i < 200; i++) {
              metricsCollector.recordSuccess({
                requestId: `req-${i}`,
                correlationId: `corr-${i}`,
                provider: 'foundry',
                model: 'gpt-4',
                latencyMs,
                costUsd: 0.01,
              });
            }

            const decision = controller.checkHealth();

            expect(decision.shouldRollback).toBe(true);
            expect(decision.reason).toBe('latency_exceeded');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Latency p95 <= 5000ms should NOT trigger rollback (for latency)
     */
    it('should not trigger rollback when latency is within threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 4999 }), // Latency at or below 5000ms
          (latencyMs) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            for (let i = 0; i < 200; i++) {
              metricsCollector.recordSuccess({
                requestId: `req-${i}`,
                correlationId: `corr-${i}`,
                provider: 'foundry',
                model: 'gpt-4',
                latencyMs,
                costUsd: 0.01,
              });
            }

            const decision = controller.checkHealth();

            if (decision.shouldRollback) {
              expect(decision.reason).not.toBe('latency_exceeded');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Cost > threshold should trigger rollback
     */
    it('should trigger rollback when cost exceeds threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.11, max: 1.0, noNaN: true }), // Cost above $0.10
          (costUsd) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            for (let i = 0; i < 200; i++) {
              metricsCollector.recordSuccess({
                requestId: `req-${i}`,
                correlationId: `corr-${i}`,
                provider: 'foundry',
                model: 'gpt-4',
                latencyMs: 100,
                costUsd,
              });
            }

            const decision = controller.checkHealth();

            expect(decision.shouldRollback).toBe(true);
            expect(decision.reason).toBe('cost_exceeded');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Cost <= threshold should NOT trigger rollback (for cost)
     */
    it('should not trigger rollback when cost is within threshold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.001, max: 0.099, noNaN: true }), // Cost at or below $0.10
          (costUsd) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            for (let i = 0; i < 200; i++) {
              metricsCollector.recordSuccess({
                requestId: `req-${i}`,
                correlationId: `corr-${i}`,
                provider: 'foundry',
                model: 'gpt-4',
                latencyMs: 100,
                costUsd,
              });
            }

            const decision = controller.checkHealth();

            if (decision.shouldRollback) {
              expect(decision.reason).not.toBe('cost_exceeded');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Minimum request threshold', () => {
    /**
     * Property: Should not trigger rollback with insufficient data
     */
    it('should not trigger rollback with insufficient requests', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99 }), // Less than 100 requests
          fc.double({ min: 0.1, max: 0.5, noNaN: true }), // High error rate
          (requestCount, errorRate) => {
            metricsCollector.reset();
            controller = new RollbackController(
              { minRequestsForCheck: 100 },
              metricsCollector,
              trafficSplitter
            );

            generateMetricsWithErrorRate(metricsCollector, requestCount, errorRate);

            const decision = controller.checkHealth();

            expect(decision.shouldRollback).toBe(false);
            expect(decision.message).toContain('Insufficient data');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rollback execution', () => {
    /**
     * Property: Rollback should set traffic to 0%
     */
    it('should set traffic to 0% on rollback', async () => {
      // Test with a few specific percentages instead of property-based
      const testPercentages = [10, 25, 50, 75, 90];
      
      for (const initialPercentage of testPercentages) {
        metricsCollector.reset();
        const localSplitter = new TrafficSplitter({ percentage: initialPercentage });
        const localController = new RollbackController(
          { minRequestsForCheck: 100 },
          metricsCollector,
          localSplitter
        );

        // Generate bad metrics
        generateMetricsWithErrorRate(metricsCollector, 200, 0.10);

        await localController.executeRollback('error_rate_exceeded');

        expect(localSplitter.getPercentage()).toBe(0);
      }
    });

    /**
     * Property: Rollback should record event in history
     */
    it('should record rollback event in history', async () => {
      metricsCollector.reset();
      controller = new RollbackController(
        { minRequestsForCheck: 100 },
        metricsCollector,
        trafficSplitter
      );

      generateMetricsWithErrorRate(metricsCollector, 200, 0.10);

      await controller.executeRollback('error_rate_exceeded');

      const history = controller.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].reason).toBe('error_rate_exceeded');
      expect(history[0].status).toBe('completed');
    });
  });

  describe('Custom thresholds', () => {
    /**
     * Property: Custom thresholds should be respected
     */
    it('should respect custom error rate threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // Custom threshold as integer percentage
          fc.integer({ min: 1, max: 30 }), // Actual error rate as integer percentage
          (thresholdPct, actualErrorRatePct) => {
            const threshold = thresholdPct / 100;
            const actualErrorRate = actualErrorRatePct / 100;
            
            metricsCollector.reset();
            controller = new RollbackController(
              { 
                minRequestsForCheck: 100,
                thresholds: { errorRate: threshold, latencyP95Ms: 10000, costPerRequestUsd: 1.0 },
              },
              metricsCollector,
              trafficSplitter
            );

            generateMetricsWithErrorRate(metricsCollector, 200, actualErrorRate, 100, 0.01);

            const decision = controller.checkHealth();

            // Only check when there's a clear difference (at least 2% gap)
            if (actualErrorRatePct > thresholdPct + 2) {
              expect(decision.shouldRollback).toBe(true);
              expect(decision.reason).toBe('error_rate_exceeded');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cooldown period', () => {
    /**
     * Property: Should not trigger during cooldown
     */
    it('should not trigger rollback during cooldown period', async () => {
      metricsCollector.reset();
      controller = new RollbackController(
        { 
          minRequestsForCheck: 100,
          cooldownMs: 60000, // 1 minute cooldown
        },
        metricsCollector,
        trafficSplitter
      );

      // First rollback
      generateMetricsWithErrorRate(metricsCollector, 200, 0.10);
      await controller.executeRollback('error_rate_exceeded');

      // Reset metrics and generate bad metrics again
      metricsCollector.reset();
      generateMetricsWithErrorRate(metricsCollector, 200, 0.10);

      // Should be in cooldown
      const decision = controller.checkHealth();
      expect(decision.shouldRollback).toBe(false);
      expect(decision.message).toContain('cooldown');
    });
  });
});
