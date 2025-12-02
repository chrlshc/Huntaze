/**
 * Property-based tests for Azure Rollback Service
 * 
 * **Feature: huntaze-ai-azure-migration, Property 42: Rollback capability**
 * **Feature: huntaze-ai-azure-migration, Property 43: Data preservation during rollback**
 * **Validates: Requirements 15.1, 15.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  AzureRollbackService,
  AIProvider
} from '../../../lib/ai/azure/azure-rollback.service';

describe('AzureRollbackService - Property Tests', () => {
  let service: AzureRollbackService;

  beforeEach(() => {
    service = new AzureRollbackService({
      cooldownPeriodMs: 50 // Short cooldown for testing
    });
  });

  /**
   * Property 42: Rollback capability
   * *For any* provider configuration, rollback should switch to the fallback
   * provider and maintain system availability
   * **Validates: Requirements 15.1**
   */
  describe('Property 42: Rollback capability', () => {
    it('should always switch to fallback provider on rollback', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.constantFrom('manual', 'auto-error', 'auto-latency', 'auto-health'),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (current, fallback, reason, triggeredBy) => {
            // Skip if current and fallback are the same
            if (current === fallback) return;

            const testService = new AzureRollbackService({
              currentProvider: current as AIProvider,
              fallbackProvider: fallback as AIProvider,
              cooldownPeriodMs: 50
            });

            const event = await testService.rollback(
              reason as 'manual' | 'auto-error' | 'auto-latency' | 'auto-health',
              triggeredBy
            );

            // Should switch from current to fallback
            expect(event.fromProvider).toBe(current);
            expect(event.toProvider).toBe(fallback);
            expect(testService.getCurrentProvider()).toBe(fallback);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should track rollback count correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (rollbackCount) => {
            const testService = new AzureRollbackService({
              cooldownPeriodMs: 5
            });

            for (let i = 0; i < rollbackCount; i++) {
              // Wait for cooldown between rollbacks
              await new Promise(resolve => setTimeout(resolve, 10));
              
              // Alternate fallback provider
              const currentProvider = testService.getCurrentProvider();
              const fallback = currentProvider === 'azure' ? 'openai' : 'azure';
              testService.updateConfig({ fallbackProvider: fallback });
              
              await testService.rollback('manual', `test-${i}`);
            }

            const state = testService.getState();
            expect(state.rollbackCount).toBe(rollbackCount);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);
  });

  /**
   * Property 43: Data preservation during rollback
   * *For any* rollback operation, data should be preserved and verified
   * **Validates: Requirements 15.2**
   */
  describe('Property 43: Data preservation during rollback', () => {
    it('should preserve data for any rollback operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('manual', 'auto-error', 'auto-latency', 'auto-health'),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (reason, triggeredBy) => {
            service.reset();

            const event = await service.rollback(
              reason as 'manual' | 'auto-error' | 'auto-latency' | 'auto-health',
              triggeredBy
            );

            // Data should always be preserved
            expect(event.dataPreserved).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should record rollback events with complete information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('manual', 'auto-error', 'auto-latency', 'auto-health'),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (reason, triggeredBy) => {
            service.reset();

            await service.rollback(
              reason as 'manual' | 'auto-error' | 'auto-latency' | 'auto-health',
              triggeredBy
            );

            const history = service.getRollbackHistory();
            const lastEvent = history[history.length - 1];

            // Event should have all required fields
            expect(lastEvent.id).toBeDefined();
            expect(lastEvent.timestamp).toBeDefined();
            expect(lastEvent.fromProvider).toBeDefined();
            expect(lastEvent.toProvider).toBeDefined();
            expect(lastEvent.reason).toBe(reason);
            expect(lastEvent.triggeredBy).toBe(triggeredBy);
            expect(lastEvent.rollbackDurationMs).toBeGreaterThan(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });


  describe('Health monitoring properties', () => {
    it('should update health status based on error recordings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.integer({ min: 0, max: 20 }),
          (provider, errorCount) => {
            service.reset();

            for (let i = 0; i < errorCount; i++) {
              service.recordError(provider as AIProvider);
            }

            const health = service.getHealthStatus(provider as AIProvider);
            
            // Error rate should reflect recorded errors
            expect(health?.errorRate).toBe(errorCount);
            
            // Health should be false if errors exceed threshold
            if (errorCount >= 10) {
              expect(health?.healthy).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should calculate average latency correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.array(fc.integer({ min: 10, max: 1000 }), { minLength: 1, maxLength: 50 }),
          (provider, latencies) => {
            service.reset();

            for (const latency of latencies) {
              service.recordLatency(provider as AIProvider, latency);
            }

            const health = service.getHealthStatus(provider as AIProvider);
            
            // Average should be calculated
            expect(health?.averageLatencyMs).toBeGreaterThan(0);
            
            // Average should be within range of recorded values
            const minLatency = Math.min(...latencies);
            const maxLatency = Math.max(...latencies);
            expect(health?.averageLatencyMs).toBeGreaterThanOrEqual(minLatency);
            expect(health?.averageLatencyMs).toBeLessThanOrEqual(maxLatency);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Cooldown properties', () => {
    it('should enforce cooldown period after rollback', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 200 }),
          async (cooldownMs) => {
            const testService = new AzureRollbackService({
              cooldownPeriodMs: cooldownMs
            });

            await testService.rollback('manual', 'test');
            const state = testService.getState();

            // Should be in cooldown
            expect(state.inCooldown).toBe(true);
            expect(state.cooldownEndsAt).toBeDefined();
            
            // Cooldown end should be in the future
            expect(state.cooldownEndsAt!.getTime()).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Configuration properties', () => {
    it('should preserve all configuration values after update', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.boolean(),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 100, max: 10000 }),
          (current, fallback, autoEnabled, threshold, latencyThreshold) => {
            service.updateConfig({
              currentProvider: current as AIProvider,
              fallbackProvider: fallback as AIProvider,
              autoRollbackEnabled: autoEnabled,
              errorThreshold: threshold,
              latencyThreshold
            });

            const config = service.getConfig();
            
            expect(config.currentProvider).toBe(current);
            expect(config.fallbackProvider).toBe(fallback);
            expect(config.autoRollbackEnabled).toBe(autoEnabled);
            expect(config.errorThreshold).toBe(threshold);
            expect(config.latencyThreshold).toBe(latencyThreshold);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
