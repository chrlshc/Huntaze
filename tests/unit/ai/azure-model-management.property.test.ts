/**
 * Azure Model Management Service - Property-Based Tests
 * 
 * Tests correctness properties for model management:
 * - Property 29: Traffic splitting for A/B tests
 * - Property 30: Automatic rollback on underperformance
 * 
 * **Feature: huntaze-ai-azure-migration**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureModelManagementService,
  type ModelVersion,
  type ModelMetrics,
  type RollbackConfig,
} from '../../../lib/ai/azure/azure-model-management.service';

describe('AzureModelManagementService - Property Tests', () => {
  let service: AzureModelManagementService;

  beforeEach(() => {
    service = new AzureModelManagementService();
  });

  /**
   * Property 29: Traffic splitting for A/B tests
   * **Feature: huntaze-ai-azure-migration, Property 29: Traffic splitting for A/B tests**
   * **Validates: Requirements 8.2**
   * 
   * For any A/B test configuration, traffic should be split between model versions
   * according to the specified percentages.
   */
  describe('Property 29: Traffic splitting for A/B tests', () => {
    it('should split traffic according to configured percentage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 100, max: 1000 }),
          (trafficSplit, sampleSize) => {
            const testService = new AzureModelManagementService();

            // Register models
            const controlModel = testService.registerModel({
              name: 'test-model',
              version: '1.0.0',
              deployment: 'control-deployment',
              status: 'active',
              config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            const treatmentModel = testService.registerModel({
              name: 'test-model',
              version: '2.0.0',
              deployment: 'treatment-deployment',
              status: 'inactive',
              config: { temperature: 0.8, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            // Create A/B test
            testService.createABTest({
              name: 'Traffic Split Test',
              controlModel: controlModel.id,
              treatmentModel: treatmentModel.id,
              trafficSplit,
              startDate: new Date(),
            });

            // Sample traffic decisions
            let treatmentCount = 0;
            for (let i = 0; i < sampleSize; i++) {
              const decision = testService.getTrafficDecision('test-model');
              if (!decision.isControl) {
                treatmentCount++;
              }
            }

            // Check that actual split is within reasonable bounds (±15% tolerance)
            const actualSplit = (treatmentCount / sampleSize) * 100;
            const tolerance = 15;
            
            expect(actualSplit).toBeGreaterThanOrEqual(Math.max(0, trafficSplit - tolerance));
            expect(actualSplit).toBeLessThanOrEqual(Math.min(100, trafficSplit + tolerance));
          }
        ),
        { numRuns: 20 } // Fewer runs due to statistical nature
      );
    });

    it('should provide consistent routing for same request ID', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 0, max: 100 }),
          (requestId, trafficSplit) => {
            const testService = new AzureModelManagementService();

            const controlModel = testService.registerModel({
              name: 'test-model',
              version: '1.0.0',
              deployment: 'control',
              status: 'active',
              config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            const treatmentModel = testService.registerModel({
              name: 'test-model',
              version: '2.0.0',
              deployment: 'treatment',
              status: 'inactive',
              config: { temperature: 0.8, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            testService.createABTest({
              name: 'Consistency Test',
              controlModel: controlModel.id,
              treatmentModel: treatmentModel.id,
              trafficSplit,
              startDate: new Date(),
            });

            // Same request ID should always get same routing
            const decision1 = testService.getTrafficDecision('test-model', requestId);
            const decision2 = testService.getTrafficDecision('test-model', requestId);
            const decision3 = testService.getTrafficDecision('test-model', requestId);

            expect(decision1.isControl).toBe(decision2.isControl);
            expect(decision2.isControl).toBe(decision3.isControl);
            expect(decision1.modelId).toBe(decision2.modelId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid model for any traffic decision', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (trafficSplit) => {
            const testService = new AzureModelManagementService();

            const controlModel = testService.registerModel({
              name: 'test-model',
              version: '1.0.0',
              deployment: 'control',
              status: 'active',
              config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            const treatmentModel = testService.registerModel({
              name: 'test-model',
              version: '2.0.0',
              deployment: 'treatment',
              status: 'inactive',
              config: { temperature: 0.8, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            testService.createABTest({
              name: 'Valid Model Test',
              controlModel: controlModel.id,
              treatmentModel: treatmentModel.id,
              trafficSplit,
              startDate: new Date(),
            });

            const decision = testService.getTrafficDecision('test-model');

            // Decision should reference a valid model
            expect(decision.modelId).toBeDefined();
            expect(decision.deployment).toBeDefined();
            expect([controlModel.id, treatmentModel.id]).toContain(decision.modelId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid traffic split values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: -1 }),
            fc.integer({ min: 101, max: 1000 })
          ),
          (invalidSplit) => {
            const testService = new AzureModelManagementService();

            const controlModel = testService.registerModel({
              name: 'test-model',
              version: '1.0.0',
              deployment: 'control',
              status: 'active',
              config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            const treatmentModel = testService.registerModel({
              name: 'test-model',
              version: '2.0.0',
              deployment: 'treatment',
              status: 'inactive',
              config: { temperature: 0.8, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
            });

            expect(() => {
              testService.createABTest({
                name: 'Invalid Split Test',
                controlModel: controlModel.id,
                treatmentModel: treatmentModel.id,
                trafficSplit: invalidSplit,
                startDate: new Date(),
              });
            }).toThrow('Traffic split must be between 0 and 100');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 30: Automatic rollback on underperformance
   * **Feature: huntaze-ai-azure-migration, Property 30: Automatic rollback on underperformance**
   * **Validates: Requirements 8.4**
   * 
   * For any model that underperforms based on defined thresholds, the system
   * should automatically rollback to the previous stable version.
   */
  describe('Property 30: Automatic rollback on underperformance', () => {
    it('should trigger rollback when error rate exceeds threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 11, max: 100 }).map(n => n / 100), // Above default 0.1 threshold
          fc.integer({ min: 100, max: 1000 }),
          (errorRate, requestCount) => {
            const testService = new AzureModelManagementService();

            const metrics: ModelMetrics = {
              latencyP50: 100,
              latencyP95: 200,
              latencyP99: 300,
              errorRate,
              successRate: 1 - errorRate,
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount,
              lastUpdated: new Date(),
            };

            const shouldRollback = testService.shouldRollback(metrics);
            expect(shouldRollback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger rollback when latency exceeds threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5001, max: 30000 }), // Above default 5000ms threshold
          fc.integer({ min: 100, max: 1000 }),
          (latencyP95, requestCount) => {
            const testService = new AzureModelManagementService();

            const metrics: ModelMetrics = {
              latencyP50: 100,
              latencyP95,
              latencyP99: latencyP95 + 1000,
              errorRate: 0.01,
              successRate: 0.99,
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount,
              lastUpdated: new Date(),
            };

            const shouldRollback = testService.shouldRollback(metrics);
            expect(shouldRollback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger rollback for healthy metrics', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }).map(n => n / 100), // Below threshold
          fc.integer({ min: 100, max: 4999 }), // Below latency threshold
          fc.integer({ min: 100, max: 1000 }),
          (errorRate, latencyP95, requestCount) => {
            const testService = new AzureModelManagementService();

            const metrics: ModelMetrics = {
              latencyP50: 50,
              latencyP95,
              latencyP99: latencyP95 + 100,
              errorRate,
              successRate: 1 - errorRate,
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount,
              lastUpdated: new Date(),
            };

            const shouldRollback = testService.shouldRollback(metrics);
            expect(shouldRollback).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger rollback with insufficient requests', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 100 }).map(n => n / 100), // High error rate
          fc.integer({ min: 0, max: 99 }), // Below minimum requests
          (errorRate, requestCount) => {
            const testService = new AzureModelManagementService();

            const metrics: ModelMetrics = {
              latencyP50: 100,
              latencyP95: 10000, // High latency
              latencyP99: 15000,
              errorRate,
              successRate: 1 - errorRate,
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount,
              lastUpdated: new Date(),
            };

            const shouldRollback = testService.shouldRollback(metrics);
            expect(shouldRollback).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect custom rollback configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }).map(n => n / 100), // 0.01 to 0.5
          fc.integer({ min: 1000, max: 10000 }),
          fc.integer({ min: 50, max: 500 }),
          (errorThreshold, latencyThreshold, minRequests) => {
            const testService = new AzureModelManagementService();

            const customConfig: RollbackConfig = {
              enabled: true,
              errorRateThreshold: errorThreshold,
              latencyThreshold,
              minRequestsBeforeRollback: minRequests,
              rollbackCooldown: 60000,
            };

            // Metrics that exceed custom thresholds
            const badMetrics: ModelMetrics = {
              latencyP50: 100,
              latencyP95: latencyThreshold + 100,
              latencyP99: latencyThreshold + 500,
              errorRate: errorThreshold + 0.01,
              successRate: 1 - (errorThreshold + 0.01),
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount: minRequests + 10,
              lastUpdated: new Date(),
            };

            const shouldRollback = testService.shouldRollback(badMetrics, customConfig);
            expect(shouldRollback).toBe(true);

            // Metrics within custom thresholds
            const goodMetrics: ModelMetrics = {
              latencyP50: 50,
              latencyP95: latencyThreshold - 100,
              latencyP99: latencyThreshold - 50,
              errorRate: errorThreshold - 0.005,
              successRate: 1 - (errorThreshold - 0.005),
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount: minRequests + 10,
              lastUpdated: new Date(),
            };

            const shouldNotRollback = testService.shouldRollback(goodMetrics, customConfig);
            expect(shouldNotRollback).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not rollback when disabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }).map(n => n / 100), // Very high error rate
          fc.integer({ min: 10000, max: 50000 }), // Very high latency
          (errorRate, latencyP95) => {
            const testService = new AzureModelManagementService();

            const disabledConfig: RollbackConfig = {
              enabled: false,
              errorRateThreshold: 0.1,
              latencyThreshold: 5000,
              minRequestsBeforeRollback: 100,
              rollbackCooldown: 60000,
            };

            const metrics: ModelMetrics = {
              latencyP50: 100,
              latencyP95,
              latencyP99: latencyP95 + 1000,
              errorRate,
              successRate: 1 - errorRate,
              avgTokensPerRequest: 500,
              costPerRequest: 0.01,
              requestCount: 1000,
              lastUpdated: new Date(),
            };

            const shouldRollback = testService.shouldRollback(metrics, disabledConfig);
            expect(shouldRollback).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Model version management consistency
   */
  describe('Model version management consistency', () => {
    it('should maintain only one active version after explicit activation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          ),
          fc.integer({ min: 0, max: 4 }),
          (versions, activateIndex) => {
            const testService = new AzureModelManagementService();
            const uniqueVersions = [...new Set(versions)];
            if (uniqueVersions.length < 2) return; // Need at least 2 versions

            // Register all versions as inactive
            const registeredModels: string[] = [];
            for (const v of uniqueVersions) {
              const model = testService.registerModel({
                name: 'test-model',
                version: v,
                deployment: `deployment-${v}`,
                status: 'inactive',
                config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
              });
              registeredModels.push(model.id);
            }

            // Activate one version
            const indexToActivate = activateIndex % registeredModels.length;
            testService.updateModelStatus(registeredModels[indexToActivate], 'active');

            // Count active versions
            const allVersions = testService.getModelVersions('test-model');
            const activeCount = allVersions.filter(m => m.status === 'active').length;

            // Should have exactly one active version
            expect(activeCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique IDs for each model', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              version: fc.string({ minLength: 1, maxLength: 10 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (models) => {
            const testService = new AzureModelManagementService();
            const ids = new Set<string>();

            for (const m of models) {
              const registered = testService.registerModel({
                name: m.name,
                version: m.version,
                deployment: `deployment-${m.name}-${m.version}`,
                status: 'inactive',
                config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
              });

              // Each ID should be unique
              expect(ids.has(registered.id)).toBe(false);
              ids.add(registered.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
