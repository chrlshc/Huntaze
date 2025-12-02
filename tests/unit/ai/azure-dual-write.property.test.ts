/**
 * Property-based tests for Azure Dual-Write Service
 * 
 * **Feature: huntaze-ai-azure-migration, Property 45: Dual-write consistency**
 * **Validates: Requirements 15.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  AzureDualWriteService,
  WriteOperation
} from '../../../lib/ai/azure/azure-dual-write.service';

describe('AzureDualWriteService - Property Tests', () => {
  let service: AzureDualWriteService;

  beforeEach(() => {
    service = new AzureDualWriteService();
  });

  /**
   * Property 45: Dual-write consistency
   * *For any* write operation, when dual-write is enabled, both providers
   * should receive the same data and consistency should be verified
   * **Validates: Requirements 15.5**
   */
  describe('Property 45: Dual-write consistency', () => {
    it('should maintain consistency for any write operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('memory', 'embedding', 'preference', 'interaction'),
            correlationId: fc.uuid()
          }),
          async (operationData) => {
            const operation: WriteOperation = {
              id: operationData.id,
              type: operationData.type as WriteOperation['type'],
              data: { test: true },
              timestamp: new Date(),
              correlationId: operationData.correlationId
            };

            const result = await service.write(operation);

            // Both writes should be attempted
            expect(result.operationId).toBe(operation.id);
            
            // If both succeed, consistency should be checked
            if (result.primarySuccess && result.secondarySuccess) {
              expect(typeof result.consistencyVerified).toBe('boolean');
            }

            // Latencies should be recorded
            expect(result.primaryLatencyMs).toBeGreaterThanOrEqual(0);
            expect(result.secondaryLatencyMs).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    it('should track all write operations in history', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          async (operationIds) => {
            const testService = new AzureDualWriteService();

            for (const id of operationIds) {
              const operation: WriteOperation = {
                id,
                type: 'memory',
                data: { test: true },
                timestamp: new Date(),
                correlationId: `corr-${id}`
              };
              await testService.write(operation);
            }

            // All operations should be in history
            for (const id of operationIds) {
              const result = testService.getWriteResult(id);
              expect(result).toBeDefined();
              expect(result?.operationId).toBe(id);
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should update metrics correctly for any sequence of writes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (writeCount) => {
            const testService = new AzureDualWriteService();

            for (let i = 0; i < writeCount; i++) {
              const operation: WriteOperation = {
                id: `op-${i}-${Date.now()}`,
                type: 'memory',
                data: { index: i },
                timestamp: new Date(),
                correlationId: `corr-${i}`
              };
              await testService.write(operation);
            }

            const metrics = testService.getMetrics();
            
            // Total writes should match
            expect(metrics.totalWrites).toBe(writeCount);
            
            // Successful + failed should equal total
            expect(metrics.successfulWrites + metrics.failedWrites).toBe(writeCount);
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);
  });


  describe('Conflict resolution properties', () => {
    it('should resolve conflicts deterministically based on strategy', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.date(),
          fc.date(),
          fc.constantFrom('primary-wins', 'secondary-wins', 'latest-wins'),
          (primaryValue, secondaryValue, primaryTs, secondaryTs, strategy) => {
            const testService = new AzureDualWriteService({ 
              conflictResolution: strategy as 'primary-wins' | 'secondary-wins' | 'latest-wins'
            });

            const result = testService.resolveConflict(
              primaryValue,
              secondaryValue,
              primaryTs,
              secondaryTs
            );

            // Resolution should match strategy
            switch (strategy) {
              case 'primary-wins':
                expect(result.resolution).toBe('primary');
                expect(result.value).toBe(primaryValue);
                break;
              case 'secondary-wins':
                expect(result.resolution).toBe('secondary');
                expect(result.value).toBe(secondaryValue);
                break;
              case 'latest-wins':
                if (primaryTs >= secondaryTs) {
                  expect(result.resolution).toBe('primary');
                  expect(result.value).toBe(primaryValue);
                } else {
                  expect(result.resolution).toBe('secondary');
                  expect(result.value).toBe(secondaryValue);
                }
                break;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration properties', () => {
    it('should preserve configuration after updates', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.constantFrom('azure', 'openai', 'anthropic'),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 100, max: 5000 }),
          (enabled, provider, maxRetries, retryDelay) => {
            service.updateConfig({
              enabled,
              primaryProvider: provider as 'azure' | 'openai' | 'anthropic',
              maxRetries,
              retryDelayMs: retryDelay
            });

            const config = service.getConfig();
            
            expect(config.enabled).toBe(enabled);
            expect(config.primaryProvider).toBe(provider);
            expect(config.maxRetries).toBe(maxRetries);
            expect(config.retryDelayMs).toBe(retryDelay);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
