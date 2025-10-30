/**
 * Tests for Fargate Cost Optimizer API Integration
 * Tests error handling, retry strategies, caching, and logging
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  FargateTaskOptimizer,
  AutoOptimizationService,
  FargateOptimizerError,
  CloudWatchError,
  ECSError
} from '../../lib/services/fargate-cost-optimizer';

// Mock AWS SDK clients
const mockCloudWatch = {
  send: vi.fn()
};

const mockECS = {
  send: vi.fn()
};

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Mock cache
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
};

describe('FargateTaskOptimizer API Integration', () => {
  let optimizer: FargateTaskOptimizer;
  let autoService: AutoOptimizationService;

  beforeEach(() => {
    optimizer = new FargateTaskOptimizer(
      mockCloudWatch as any,
      mockECS as any,
      mockLogger,
      mockCache
    );
    autoService = new AutoOptimizationService(optimizer, mockLogger);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle CloudWatch API errors gracefully', async () => {
      const cloudWatchError = new Error('CloudWatch service unavailable');
      mockCloudWatch.send.mockRejectedValue(cloudWatchError);
      mockCache.get.mockResolvedValue(null);

      await expect(
        optimizer.analyzeAndOptimize('test-task')
      ).rejects.toThrow(CloudWatchError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch CloudWatch metrics',
        cloudWatchError,
        { taskDefinition: 'test-task' }
      );
    });

    it('should handle ECS API errors gracefully', async () => {
      // Mock successful CloudWatch calls
      mockCloudWatch.send.mockResolvedValue({
        Datapoints: [
          { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
        ]
      });
      mockCache.get.mockResolvedValue(null);

      // Mock ECS error
      const ecsError = new Error('ECS service unavailable');
      mockECS.send.mockRejectedValue(ecsError);

      await expect(
        optimizer.analyzeAndOptimize('test-task')
      ).rejects.toThrow(ECSError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to check Graviton compatibility',
        ecsError,
        { taskDefinition: 'test-task' }
      );
    });

    it('should handle invalid task definition names', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCloudWatch.send.mockResolvedValue({ Datapoints: [] });

      const result = await optimizer.analyzeAndOptimize('invalid-task');

      expect(result.recommendedConfig.cpu).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No datapoints found in metrics',
        expect.any(Object)
      );
    });
  });

  describe('Retry Strategies', () => {
    it('should retry failed CloudWatch requests', async () => {
      mockCache.get.mockResolvedValue(null);
      
      // First two calls fail, third succeeds
      mockCloudWatch.send
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue({
          Datapoints: [
            { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
          ]
        });

      // Mock ECS success
      mockECS.send.mockResolvedValue({
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      });

      const result = await optimizer.analyzeAndOptimize('test-task');

      expect(result).toBeDefined();
      expect(mockCloudWatch.send).toHaveBeenCalledTimes(6); // 3 retries × 2 metrics
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt'),
        expect.any(Object)
      );
    });

    it('should not retry non-retryable errors', async () => {
      mockCache.get.mockResolvedValue(null);
      
      const nonRetryableError = new FargateOptimizerError(
        'Invalid parameters',
        'INVALID_PARAMS',
        400,
        false // not retryable
      );
      
      mockCloudWatch.send.mockRejectedValue(nonRetryableError);

      await expect(
        optimizer.analyzeAndOptimize('test-task')
      ).rejects.toThrow(nonRetryableError);

      expect(mockCloudWatch.send).toHaveBeenCalledTimes(1); // No retries
    });

    it('should respect maximum retry attempts', async () => {
      mockCache.get.mockResolvedValue(null);
      
      const persistentError = new Error('Persistent failure');
      mockCloudWatch.send.mockRejectedValue(persistentError);

      await expect(
        optimizer.analyzeAndOptimize('test-task')
      ).rejects.toThrow(CloudWatchError);

      // Should try initial + 3 retries = 4 times per metric = 8 total
      expect(mockCloudWatch.send).toHaveBeenCalledTimes(8);
    });
  });

  describe('Caching', () => {
    it('should use cached optimization results', async () => {
      const cachedPlan = {
        currentCost: 100,
        recommendedConfig: {
          cpu: '512',
          memory: '1024',
          estimatedSavings: 0.3,
          spotEligible: true,
          reasoning: 'Cached result'
        },
        spotStrategy: { capacityProviderStrategy: [] },
        potentialSavings: 30,
        gravitonCompatible: true
      };

      mockCache.get.mockResolvedValue(cachedPlan);

      const result = await optimizer.analyzeAndOptimize('test-task');

      expect(result).toEqual(cachedPlan);
      expect(mockCloudWatch.send).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Returning cached optimization plan',
        { taskDefinition: 'test-task' }
      );
    });

    it('should cache successful optimization results', async () => {
      mockCache.get.mockResolvedValue(null);
      
      // Mock successful API calls
      mockCloudWatch.send.mockResolvedValue({
        Datapoints: [
          { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
        ]
      });
      
      mockECS.send.mockResolvedValue({
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      });

      await optimizer.analyzeAndOptimize('test-task');

      expect(mockCache.set).toHaveBeenCalledWith(
        'optimization:test-task',
        expect.any(Object),
        3600 // 1 hour TTL
      );
    });

    it('should use cached metrics', async () => {
      const cachedMetrics = {
        cpuMetrics: {
          Datapoints: [
            { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
          ]
        },
        memoryMetrics: {
          Datapoints: [
            { Average: 1024, ExtendedStatistics: { p99: 1500, p95: 1300, p90: 1200 } }
          ]
        }
      };

      mockCache.get
        .mockResolvedValueOnce(null) // No cached optimization
        .mockResolvedValueOnce(cachedMetrics) // Cached metrics
        .mockResolvedValueOnce(true); // Cached Graviton compatibility

      const result = await optimizer.analyzeAndOptimize('test-task');

      expect(result).toBeDefined();
      expect(mockCloudWatch.send).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using cached metrics',
        { taskDefinition: 'test-task' }
      );
    });
  });

  describe('Logging and Debugging', () => {
    it('should log optimization workflow steps', async () => {
      mockCache.get.mockResolvedValue(null);
      
      mockCloudWatch.send.mockResolvedValue({
        Datapoints: [
          { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
        ]
      });
      
      mockECS.send.mockResolvedValue({
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      });

      await optimizer.analyzeAndOptimize('test-task');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting optimization analysis',
        { taskDefinition: 'test-task' }
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Fetching CloudWatch metrics',
        { taskDefinition: 'test-task' }
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Optimization analysis completed',
        expect.objectContaining({
          taskDefinition: 'test-task',
          duration: expect.any(Number)
        })
      );
    });

    it('should log performance metrics', async () => {
      mockCache.get.mockResolvedValue(null);
      
      mockCloudWatch.send.mockResolvedValue({
        Datapoints: [
          { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
        ]
      });
      
      mockECS.send.mockResolvedValue({
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      });

      const startTime = Date.now();
      await optimizer.analyzeAndOptimize('test-task');
      const endTime = Date.now();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Optimization analysis completed',
        expect.objectContaining({
          duration: expect.any(Number)
        })
      );

      // Verify duration is reasonable
      const logCall = mockLogger.info.mock.calls.find(call => 
        call[0] === 'Optimization analysis completed'
      );
      const duration = logCall?.[1]?.duration;
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });

    it('should log detailed error information', async () => {
      mockCache.get.mockResolvedValue(null);
      
      const detailedError = new Error('Detailed CloudWatch error');
      detailedError.stack = 'Error stack trace...';
      
      mockCloudWatch.send.mockRejectedValue(detailedError);

      await expect(
        optimizer.analyzeAndOptimize('test-task')
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Optimization analysis failed',
        detailedError,
        expect.objectContaining({
          taskDefinition: 'test-task',
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('AutoOptimizationService', () => {
    it('should process multiple tasks with controlled concurrency', async () => {
      const taskDefinitions = ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'];
      
      // Mock successful optimization for all tasks
      vi.spyOn(optimizer, 'analyzeAndOptimize').mockResolvedValue({
        currentCost: 100,
        recommendedConfig: {
          cpu: '512',
          memory: '1024',
          estimatedSavings: 0.3,
          spotEligible: true,
          reasoning: 'Test optimization'
        },
        spotStrategy: { capacityProviderStrategy: [] },
        potentialSavings: 30,
        gravitonCompatible: true
      });

      const result = await autoService.optimizeAllTasks(taskDefinitions);

      expect(result.optimizedTasks).toBe(5);
      expect(result.failedTasks).toBe(0);
      expect(result.totalMonthlySavings).toBe(150); // 5 × 30
      expect(optimizer.analyzeAndOptimize).toHaveBeenCalledTimes(5);
    });

    it('should handle partial failures in batch optimization', async () => {
      const taskDefinitions = ['success-task', 'fail-task', 'success-task-2'];
      
      vi.spyOn(optimizer, 'analyzeAndOptimize')
        .mockResolvedValueOnce({
          currentCost: 100,
          recommendedConfig: {
            cpu: '512',
            memory: '1024',
            estimatedSavings: 0.3,
            spotEligible: true,
            reasoning: 'Success'
          },
          spotStrategy: { capacityProviderStrategy: [] },
          potentialSavings: 30,
          gravitonCompatible: true
        })
        .mockRejectedValueOnce(new Error('Optimization failed'))
        .mockResolvedValueOnce({
          currentCost: 200,
          recommendedConfig: {
            cpu: '1024',
            memory: '2048',
            estimatedSavings: 0.4,
            spotEligible: false,
            reasoning: 'Success 2'
          },
          spotStrategy: { capacityProviderStrategy: [] },
          potentialSavings: 80,
          gravitonCompatible: false
        });

      const result = await autoService.optimizeAllTasks(taskDefinitions);

      expect(result.optimizedTasks).toBe(2);
      expect(result.failedTasks).toBe(1);
      expect(result.totalMonthlySavings).toBe(110); // 30 + 80
      
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
    });

    it('should log batch optimization progress', async () => {
      const taskDefinitions = ['task-1', 'task-2'];
      
      vi.spyOn(optimizer, 'analyzeAndOptimize').mockResolvedValue({
        currentCost: 100,
        recommendedConfig: {
          cpu: '512',
          memory: '1024',
          estimatedSavings: 0.3,
          spotEligible: true,
          reasoning: 'Test'
        },
        spotStrategy: { capacityProviderStrategy: [] },
        potentialSavings: 30,
        gravitonCompatible: true
      });

      await autoService.optimizeAllTasks(taskDefinitions);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting batch optimization',
        {
          taskCount: 2,
          tasks: taskDefinitions
        }
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch optimization completed',
        expect.objectContaining({
          duration: expect.any(Number),
          optimizedTasks: 2,
          failedTasks: 0,
          totalMonthlySavings: 60
        })
      );
    });
  });

  describe('Type Safety and API Contracts', () => {
    it('should return properly typed optimization plan', async () => {
      mockCache.get.mockResolvedValue(null);
      
      mockCloudWatch.send.mockResolvedValue({
        Datapoints: [
          { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
        ]
      });
      
      mockECS.send.mockResolvedValue({
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      });

      const result = await optimizer.analyzeAndOptimize('test-task');

      // Verify all required properties exist with correct types
      expect(typeof result.currentCost).toBe('number');
      expect(typeof result.potentialSavings).toBe('number');
      expect(typeof result.gravitonCompatible).toBe('boolean');
      
      expect(result.recommendedConfig).toHaveProperty('cpu');
      expect(result.recommendedConfig).toHaveProperty('memory');
      expect(result.recommendedConfig).toHaveProperty('estimatedSavings');
      expect(result.recommendedConfig).toHaveProperty('spotEligible');
      expect(result.recommendedConfig).toHaveProperty('reasoning');
      
      expect(result.spotStrategy).toHaveProperty('capacityProviderStrategy');
      expect(Array.isArray(result.spotStrategy.capacityProviderStrategy)).toBe(true);
    });

    it('should handle empty or malformed API responses', async () => {
      mockCache.get.mockResolvedValue(null);
      
      // Mock empty CloudWatch response
      mockCloudWatch.send.mockResolvedValue({
        Datapoints: []
      });
      
      // Mock empty ECS response
      mockECS.send.mockResolvedValue({
        taskDefinition: {
          containerDefinitions: []
        }
      });

      const result = await optimizer.analyzeAndOptimize('test-task');

      expect(result).toBeDefined();
      expect(result.recommendedConfig.cpu).toBeDefined();
      expect(result.recommendedConfig.memory).toBeDefined();
      expect(result.gravitonCompatible).toBe(false);
    });
  });
});