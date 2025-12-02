/**
 * Azure Fine-Tuning Service - Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureFineTuningService,
  type TrainingExample,
} from '../../../lib/ai/azure/azure-fine-tuning.service';

describe('AzureFineTuningService', () => {
  let service: AzureFineTuningService;

  beforeEach(() => {
    service = new AzureFineTuningService({
      minExamplesRequired: 10, // Lower for testing
    });
  });

  describe('Training Data Collection', () => {
    it('should add training example', () => {
      const example = service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        quality: 'high',
        category: 'greeting',
      });

      expect(example.id).toBeDefined();
      expect(example.creatorId).toBe('creator-1');
      expect(example.quality).toBe('high');
    });

    it('should get training examples for creator', () => {
      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test' }, { role: 'assistant', content: 'Response' }],
        quality: 'high',
        category: 'test',
      });

      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test 2' }, { role: 'assistant', content: 'Response 2' }],
        quality: 'medium',
        category: 'test',
      });

      const examples = service.getTrainingExamples('creator-1');
      expect(examples.length).toBe(2);
    });

    it('should filter examples by quality', () => {
      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test' }, { role: 'assistant', content: 'Response' }],
        quality: 'high',
        category: 'test',
      });

      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test 2' }, { role: 'assistant', content: 'Response 2' }],
        quality: 'low',
        category: 'test',
      });

      const highQuality = service.getTrainingExamples('creator-1', { quality: 'high' });
      expect(highQuality.length).toBe(1);
    });

    it('should filter examples by category', () => {
      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test' }, { role: 'assistant', content: 'Response' }],
        quality: 'high',
        category: 'greeting',
      });

      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test 2' }, { role: 'assistant', content: 'Response 2' }],
        quality: 'high',
        category: 'sales',
      });

      const greetings = service.getTrainingExamples('creator-1', { category: 'greeting' });
      expect(greetings.length).toBe(1);
    });

    it('should get training stats', () => {
      for (let i = 0; i < 5; i++) {
        service.addTrainingExample({
          creatorId: 'creator-1',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'high',
          category: 'test',
        });
      }

      for (let i = 0; i < 3; i++) {
        service.addTrainingExample({
          creatorId: 'creator-1',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'medium',
          category: 'sales',
        });
      }

      const stats = service.getTrainingStats('creator-1');
      expect(stats.totalExamples).toBe(8);
      expect(stats.byQuality.high).toBe(5);
      expect(stats.byQuality.medium).toBe(3);
      expect(stats.byCategory.test).toBe(5);
      expect(stats.byCategory.sales).toBe(3);
    });

    it('should indicate readiness for fine-tuning', () => {
      // Add enough examples
      for (let i = 0; i < 10; i++) {
        service.addTrainingExample({
          creatorId: 'creator-1',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'high',
          category: 'test',
        });
      }

      const stats = service.getTrainingStats('creator-1');
      expect(stats.readyForFineTuning).toBe(true);
    });

    it('should prune low quality examples', () => {
      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test' }, { role: 'assistant', content: 'Response' }],
        quality: 'high',
        category: 'test',
      });

      service.addTrainingExample({
        creatorId: 'creator-1',
        messages: [{ role: 'user', content: 'Test 2' }, { role: 'assistant', content: 'Response 2' }],
        quality: 'low',
        category: 'test',
      });

      const removed = service.pruneExamples('creator-1', 'low');
      expect(removed).toBe(1);

      const remaining = service.getTrainingExamples('creator-1');
      expect(remaining.length).toBe(1);
    });
  });

  describe('Fine-Tuning Job Management', () => {
    beforeEach(() => {
      // Add enough examples for fine-tuning
      for (let i = 0; i < 15; i++) {
        service.addTrainingExample({
          creatorId: 'creator-1',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'high',
          category: 'test',
        });
      }
    });

    it('should create fine-tuning job', () => {
      const job = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');

      expect(job.id).toBeDefined();
      expect(job.creatorId).toBe('creator-1');
      expect(job.baseModel).toBe('gpt-3.5-turbo');
      expect(job.status).toBe('pending');
    });

    it('should throw if insufficient examples', () => {
      expect(() => {
        service.createFineTuningJob('creator-2', 'gpt-3.5-turbo');
      }).toThrow('Insufficient training data');
    });

    it('should get job by ID', () => {
      const created = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      const retrieved = service.getJob(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should get creator jobs', () => {
      service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      service.createFineTuningJob('creator-1', 'gpt-4');

      const jobs = service.getCreatorJobs('creator-1');
      expect(jobs.length).toBe(2);
    });

    it('should cancel job', () => {
      const job = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      const result = service.cancelJob(job.id);

      expect(result).toBe(true);
      expect(service.getJob(job.id)?.status).toBe('cancelled');
    });

    it('should not cancel completed job', () => {
      const job = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      service.updateJobStatus(job.id, 'succeeded', {
        trainingLoss: 0.1,
        trainingTokens: 10000,
        trainedSeconds: 300,
      });

      const result = service.cancelJob(job.id);
      expect(result).toBe(false);
    });

    it('should update job status', () => {
      const job = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      
      service.updateJobStatus(job.id, 'running');
      expect(service.getJob(job.id)?.status).toBe('running');

      service.updateJobStatus(job.id, 'succeeded', {
        trainingLoss: 0.1,
        trainingTokens: 10000,
        trainedSeconds: 300,
      });

      const updated = service.getJob(job.id);
      expect(updated?.status).toBe('succeeded');
      expect(updated?.metrics?.trainingLoss).toBe(0.1);
      expect(updated?.resultModel).toBeDefined();
    });
  });

  describe('Fine-Tuned Model Deployment', () => {
    let jobId: string;

    beforeEach(() => {
      // Add examples and create successful job
      for (let i = 0; i < 15; i++) {
        service.addTrainingExample({
          creatorId: 'creator-1',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'high',
          category: 'test',
        });
      }

      const job = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      jobId = job.id;
      service.updateJobStatus(jobId, 'succeeded', {
        trainingLoss: 0.1,
        trainingTokens: 10000,
        trainedSeconds: 300,
      });
    });

    it('should deploy fine-tuned model', () => {
      const model = service.deployFineTunedModel(jobId);

      expect(model.id).toBeDefined();
      expect(model.creatorId).toBe('creator-1');
      expect(model.jobId).toBe(jobId);
      expect(model.deployment).toBeDefined();
    });

    it('should throw if job not succeeded', () => {
      // Add examples for creator-2
      for (let i = 0; i < 15; i++) {
        service.addTrainingExample({
          creatorId: 'creator-2',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'high',
          category: 'test',
        });
      }

      const pendingJob = service.createFineTuningJob('creator-2', 'gpt-3.5-turbo');

      expect(() => {
        service.deployFineTunedModel(pendingJob.id);
      }).toThrow('Job not succeeded');
    });

    it('should get fine-tuned model', () => {
      const deployed = service.deployFineTunedModel(jobId);
      const retrieved = service.getFineTunedModel(deployed.id);

      expect(retrieved).toEqual(deployed);
    });

    it('should get creator models', () => {
      service.deployFineTunedModel(jobId);

      const models = service.getCreatorModels('creator-1');
      expect(models.length).toBe(1);
    });

    it('should deactivate model', () => {
      const model = service.deployFineTunedModel(jobId);
      
      // Wait for deployment to complete
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = service.deactivateModel(model.id);
          expect(result).toBe(true);
          expect(service.getFineTunedModel(model.id)?.status).toBe('inactive');
          resolve();
        }, 150);
      });
    });

    it('should delete model', () => {
      const model = service.deployFineTunedModel(jobId);
      const result = service.deleteModel(model.id);

      expect(result).toBe(true);
      expect(service.getFineTunedModel(model.id)?.status).toBe('deleted');
    });
  });

  describe('Performance Comparison', () => {
    let modelId: string;

    beforeEach(() => {
      // Setup fine-tuned model
      for (let i = 0; i < 15; i++) {
        service.addTrainingExample({
          creatorId: 'creator-1',
          messages: [{ role: 'user', content: `Test ${i}` }, { role: 'assistant', content: `Response ${i}` }],
          quality: 'high',
          category: 'test',
        });
      }

      const job = service.createFineTuningJob('creator-1', 'gpt-3.5-turbo');
      service.updateJobStatus(job.id, 'succeeded', {
        trainingLoss: 0.1,
        trainingTokens: 10000,
        trainedSeconds: 300,
      });

      const model = service.deployFineTunedModel(job.id);
      modelId = model.id;
    });

    it('should update model performance', () => {
      service.updateModelPerformance(modelId, 100, 0.9, 0.01);
      service.updateModelPerformance(modelId, 120, 0.85, 0.012);

      const model = service.getFineTunedModel(modelId);
      expect(model?.performance.requestCount).toBe(2);
      expect(model?.performance.avgLatency).toBe(110);
    });

    it('should compare to base model', () => {
      service.updateModelPerformance(modelId, 80, 0.95, 0.015);
      service.updateModelPerformance(modelId, 90, 0.92, 0.014);

      const comparison = service.compareToBase(modelId, {
        avgLatency: 100,
        avgQualityScore: 0.85,
        costPerRequest: 0.01,
      });

      expect(comparison.latencyImprovement).toBeGreaterThan(0); // Faster
      expect(comparison.qualityImprovement).toBeGreaterThan(0); // Better quality
    });

    it('should get performance summary', () => {
      service.updateModelPerformance(modelId, 100, 0.9, 0.01);

      const summary = service.getPerformanceSummary('creator-1');
      expect(summary.models.length).toBe(1);
    });
  });
});
