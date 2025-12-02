/**
 * Azure Model Management Service - Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureModelManagementService,
  type ModelVersion,
  type ModelMetrics,
} from '../../../lib/ai/azure/azure-model-management.service';

describe('AzureModelManagementService', () => {
  let service: AzureModelManagementService;

  beforeEach(() => {
    service = new AzureModelManagementService();
  });

  describe('Model Version Management', () => {
    it('should register a new model', () => {
      const model = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod',
        status: 'active',
        config: {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      });

      expect(model.id).toBeDefined();
      expect(model.name).toBe('gpt-4');
      expect(model.version).toBe('1.0.0');
      expect(model.createdAt).toBeInstanceOf(Date);
    });

    it('should get model by ID', () => {
      const registered = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const retrieved = service.getModel(registered.id);
      expect(retrieved).toEqual(registered);
    });

    it('should return undefined for unknown model', () => {
      const result = service.getModel('unknown-id');
      expect(result).toBeUndefined();
    });

    it('should get all versions of a model', () => {
      service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod-v1',
        status: 'inactive',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      service.registerModel({
        name: 'gpt-4',
        version: '2.0.0',
        deployment: 'gpt-4-prod-v2',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const versions = service.getModelVersions('gpt-4');
      expect(versions.length).toBe(2);
    });

    it('should get active model', () => {
      service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod-v1',
        status: 'inactive',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      service.registerModel({
        name: 'gpt-4',
        version: '2.0.0',
        deployment: 'gpt-4-prod-v2',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const active = service.getActiveModel('gpt-4');
      expect(active?.version).toBe('2.0.0');
    });

    it('should update model status', () => {
      const model = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod',
        status: 'inactive',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const result = service.updateModelStatus(model.id, 'active');
      expect(result).toBe(true);
      expect(service.getModel(model.id)?.status).toBe('active');
    });

    it('should deactivate other versions when activating', () => {
      const model1 = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod-v1',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const model2 = service.registerModel({
        name: 'gpt-4',
        version: '2.0.0',
        deployment: 'gpt-4-prod-v2',
        status: 'inactive',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      service.updateModelStatus(model2.id, 'active');

      expect(service.getModel(model1.id)?.status).toBe('inactive');
      expect(service.getModel(model2.id)?.status).toBe('active');
    });

    it('should update model metrics', () => {
      const model = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      service.updateModelMetrics(model.id, {
        latencyP50: 100,
        latencyP95: 200,
        requestCount: 1000,
      });

      const updated = service.getModel(model.id);
      expect(updated?.metrics.latencyP50).toBe(100);
      expect(updated?.metrics.latencyP95).toBe(200);
      expect(updated?.metrics.requestCount).toBe(1000);
    });
  });

  describe('A/B Testing', () => {
    let controlModel: ModelVersion;
    let treatmentModel: ModelVersion;

    beforeEach(() => {
      controlModel = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod-v1',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      treatmentModel = service.registerModel({
        name: 'gpt-4',
        version: '2.0.0',
        deployment: 'gpt-4-prod-v2',
        status: 'inactive',
        config: { temperature: 0.8, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });
    });

    it('should create an A/B test', () => {
      const test = service.createABTest({
        name: 'GPT-4 Temperature Test',
        controlModel: controlModel.id,
        treatmentModel: treatmentModel.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      expect(test.id).toBeDefined();
      expect(test.status).toBe('running');
      expect(test.trafficSplit).toBe(50);
    });

    it('should throw for invalid traffic split', () => {
      expect(() => {
        service.createABTest({
          name: 'Invalid Test',
          controlModel: controlModel.id,
          treatmentModel: treatmentModel.id,
          trafficSplit: 150,
          startDate: new Date(),
        });
      }).toThrow('Traffic split must be between 0 and 100');
    });

    it('should throw for non-existent models', () => {
      expect(() => {
        service.createABTest({
          name: 'Invalid Test',
          controlModel: 'non-existent',
          treatmentModel: treatmentModel.id,
          trafficSplit: 50,
          startDate: new Date(),
        });
      }).toThrow('Control model not found');
    });

    it('should get traffic decision', () => {
      service.createABTest({
        name: 'GPT-4 Test',
        controlModel: controlModel.id,
        treatmentModel: treatmentModel.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      const decision = service.getTrafficDecision('gpt-4');
      expect(decision.modelId).toBeDefined();
      expect(decision.deployment).toBeDefined();
      expect(typeof decision.isControl).toBe('boolean');
    });

    it('should use consistent routing with request ID', () => {
      service.createABTest({
        name: 'GPT-4 Test',
        controlModel: controlModel.id,
        treatmentModel: treatmentModel.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      const requestId = 'test-request-123';
      const decision1 = service.getTrafficDecision('gpt-4', requestId);
      const decision2 = service.getTrafficDecision('gpt-4', requestId);

      expect(decision1.isControl).toBe(decision2.isControl);
    });

    it('should record A/B test results', () => {
      const test = service.createABTest({
        name: 'GPT-4 Test',
        controlModel: controlModel.id,
        treatmentModel: treatmentModel.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      service.recordABTestResult(test.id, true, true, 100, 0.01);
      service.recordABTestResult(test.id, false, true, 150, 0.015);

      const updated = service.getABTest(test.id);
      expect(updated?.metrics.controlRequests).toBe(1);
      expect(updated?.metrics.treatmentRequests).toBe(1);
    });

    it('should complete A/B test with winner', () => {
      const test = service.createABTest({
        name: 'GPT-4 Test',
        controlModel: controlModel.id,
        treatmentModel: treatmentModel.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      const result = service.completeABTest(test.id, 'treatment');
      expect(result).toBe(true);

      const completed = service.getABTest(test.id);
      expect(completed?.status).toBe('completed');
      expect(service.getModel(treatmentModel.id)?.status).toBe('active');
      expect(service.getModel(controlModel.id)?.status).toBe('deprecated');
    });

    it('should pause and resume A/B test', () => {
      const test = service.createABTest({
        name: 'GPT-4 Test',
        controlModel: controlModel.id,
        treatmentModel: treatmentModel.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      service.pauseABTest(test.id);
      expect(service.getABTest(test.id)?.status).toBe('paused');

      service.resumeABTest(test.id);
      expect(service.getABTest(test.id)?.status).toBe('running');
    });
  });

  describe('Automatic Rollback', () => {
    it('should detect rollback condition based on error rate', () => {
      const metrics: ModelMetrics = {
        latencyP50: 100,
        latencyP95: 200,
        latencyP99: 300,
        errorRate: 0.15, // 15% - above threshold
        successRate: 0.85,
        avgTokensPerRequest: 500,
        costPerRequest: 0.01,
        requestCount: 200,
        lastUpdated: new Date(),
      };

      const shouldRollback = service.shouldRollback(metrics);
      expect(shouldRollback).toBe(true);
    });

    it('should detect rollback condition based on latency', () => {
      const metrics: ModelMetrics = {
        latencyP50: 100,
        latencyP95: 6000, // Above 5000ms threshold
        latencyP99: 8000,
        errorRate: 0.01,
        successRate: 0.99,
        avgTokensPerRequest: 500,
        costPerRequest: 0.01,
        requestCount: 200,
        lastUpdated: new Date(),
      };

      const shouldRollback = service.shouldRollback(metrics);
      expect(shouldRollback).toBe(true);
    });

    it('should not rollback with insufficient requests', () => {
      const metrics: ModelMetrics = {
        latencyP50: 100,
        latencyP95: 6000,
        latencyP99: 8000,
        errorRate: 0.15,
        successRate: 0.85,
        avgTokensPerRequest: 500,
        costPerRequest: 0.01,
        requestCount: 50, // Below minimum
        lastUpdated: new Date(),
      };

      const shouldRollback = service.shouldRollback(metrics);
      expect(shouldRollback).toBe(false);
    });

    it('should perform rollback to previous version', () => {
      const model1 = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod-v1',
        status: 'inactive',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const model2 = service.registerModel({
        name: 'gpt-4',
        version: '2.0.0',
        deployment: 'gpt-4-prod-v2',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      // Update model2 with bad metrics
      service.updateModelMetrics(model2.id, {
        errorRate: 0.15,
        requestCount: 200,
      });

      // Check rollback occurred
      expect(service.getModel(model2.id)?.status).toBe('rollback');
      expect(service.getModel(model1.id)?.status).toBe('active');
    });
  });

  describe('Statistics', () => {
    it('should return model statistics', () => {
      service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      service.registerModel({
        name: 'gpt-3.5',
        version: '1.0.0',
        deployment: 'gpt-35-prod',
        status: 'deprecated',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const stats = service.getModelStats();
      expect(stats.totalModels).toBe(2);
      expect(stats.activeModels).toBe(1);
      expect(stats.deprecatedModels).toBe(1);
    });

    it('should get all models', () => {
      service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const models = service.getAllModels();
      expect(models.length).toBe(1);
    });

    it('should get all A/B tests', () => {
      const model1 = service.registerModel({
        name: 'gpt-4',
        version: '1.0.0',
        deployment: 'gpt-4-prod-v1',
        status: 'active',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      const model2 = service.registerModel({
        name: 'gpt-4',
        version: '2.0.0',
        deployment: 'gpt-4-prod-v2',
        status: 'inactive',
        config: { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      });

      service.createABTest({
        name: 'Test 1',
        controlModel: model1.id,
        treatmentModel: model2.id,
        trafficSplit: 50,
        startDate: new Date(),
      });

      const tests = service.getAllABTests();
      expect(tests.length).toBe(1);
    });
  });
});
