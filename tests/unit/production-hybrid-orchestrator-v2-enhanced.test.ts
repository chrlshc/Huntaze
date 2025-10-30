/**
 * Tests Enhanced pour Production Hybrid Orchestrator V2
 * Teste les retry strategies, error handling, et cost tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  ProductionHybridOrchestrator,
  OpenAIExecutionError,
  AzureExecutionError,
  TimeoutError
} from '@/lib/services/production-hybrid-orchestrator-v2';

// Mock dependencies
const mockAIRouter = {
  routeRequest: vi.fn()
};

const mockAzurePlanner = vi.fn();

const mockCostMonitoring = {
  trackUsage: vi.fn()
};

const mockPrisma = {
  hybridWorkflow: {
    create: vi.fn(),
    update: vi.fn()
  },
  onlyFansMessage: {
    create: vi.fn()
  },
  $queryRaw: vi.fn(),
  $disconnect: vi.fn()
};

const mockSQS = {
  send: vi.fn()
};

const mockCloudWatch = {
  send: vi.fn()
};

vi.mock('@/lib/services/ai-router', () => ({
  AIRouter: vi.fn(() => mockAIRouter)
}));

vi.mock('@/src/lib/agents/azure-planner', () => ({
  azurePlannerAgent: mockAzurePlanner
}));

vi.mock('@/lib/services/cost-monitoring-service', () => ({
  costMonitoringService: mockCostMonitoring
}));

describe('ProductionHybridOrchestrator V2 - Enhanced Features', () => {
  let orchestrator: ProductionHybridOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockAIRouter.routeRequest.mockResolvedValue({
      success: true,
      data: { content: 'Generated content' }
    });

    mockAzurePlanner.mockResolvedValue({
      contents: [{ text: 'Azure generated content' }]
    });

    mockCostMonitoring.trackUsage.mockResolvedValue({ success: true });
    mockPrisma.hybridWorkflow.create.mockResolvedValue({});
    mockPrisma.hybridWorkflow.update.mockResolvedValue({});
    mockSQS.send.mockResolvedValue({ MessageId: 'msg-123' });
    mockCloudWatch.send.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Retry Strategy - OpenAI', () => {
    it('should retry on timeout error', async () => {
      // First 2 attempts timeout, 3rd succeeds
      mockAIRouter.routeRequest
        .mockRejectedValueOnce(new TimeoutError('Request timeout'))
        .mockRejectedValueOnce(new TimeoutError('Request timeout'))
        .mockResolvedValueOnce({
          success: true,
          data: { content: 'Success after retries' }
        });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-retry-test',
        data: { message: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-retry-test', intent);

      expect(result.success).toBe(true);
      expect(result.metadata.totalRetries).toBe(2);
      expect(result.metadata.attempt).toBe(3);
      expect(mockAIRouter.routeRequest).toHaveBeenCalledTimes(3);
    });

    it('should retry on rate limit error', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      mockAIRouter.routeRequest
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          success: true,
          data: { content: 'Success after rate limit' }
        });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-rate-limit',
        data: { message: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-rate-limit', intent);

      expect(result.success).toBe(true);
      expect(result.metadata.totalRetries).toBe(1);
      expect(mockAIRouter.routeRequest).toHaveBeenCalledTimes(2);
    });

    it('should retry on network error', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNRESET';

      mockAIRouter.routeRequest
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          success: true,
          data: { content: 'Success after network error' }
        });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-network-error',
        data: { message: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-network-error', intent);

      expect(result.success).toBe(true);
      expect(result.metadata.totalRetries).toBe(1);
    });

    it('should NOT retry on validation error', async () => {
      const validationError = new Error('Invalid request');
      (validationError as any).status = 400;

      mockAIRouter.routeRequest.mockRejectedValue(validationError);

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-validation-error',
        data: { message: 'test' }
      };

      await expect(
        orchestrator.executeWorkflow('user-validation-error', intent)
      ).rejects.toThrow();

      // Should only try once (no retries for validation errors)
      expect(mockAIRouter.routeRequest).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      mockAIRouter.routeRequest.mockRejectedValue(
        new TimeoutError('Persistent timeout')
      );

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-max-retries',
        data: { message: 'test' }
      };

      await expect(
        orchestrator.executeWorkflow('user-max-retries', intent)
      ).rejects.toThrow(OpenAIExecutionError);

      // Should try 4 times (initial + 3 retries)
      expect(mockAIRouter.routeRequest).toHaveBeenCalledTimes(4);
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      let lastCallTime = Date.now();

      mockAIRouter.routeRequest.mockImplementation(() => {
        const now = Date.now();
        if (delays.length > 0) {
          delays.push(now - lastCallTime);
        }
        lastCallTime = now;
        return Promise.reject(new TimeoutError('Timeout'));
      });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-backoff',
        data: { message: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-backoff', intent);
      } catch (error) {
        // Expected to fail
      }

      // Verify exponential backoff: ~1s, ~2s, ~5s
      expect(delays[0]).toBeGreaterThanOrEqual(900); // ~1s
      expect(delays[0]).toBeLessThan(1500);
      expect(delays[1]).toBeGreaterThanOrEqual(1900); // ~2s
      expect(delays[1]).toBeLessThan(2500);
      expect(delays[2]).toBeGreaterThanOrEqual(4900); // ~5s
      expect(delays[2]).toBeLessThan(5500);
    });
  });

  describe('Retry Strategy - Azure', () => {
    it('should retry Azure on timeout', async () => {
      mockAzurePlanner
        .mockRejectedValueOnce(new TimeoutError('Azure timeout'))
        .mockResolvedValueOnce({
          contents: [{ text: 'Success after retry' }]
        });

      const intent = {
        type: 'content_planning' as const,
        userId: 'user-azure-retry',
        data: { theme: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-azure-retry', intent);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('azure');
      expect(result.metadata.totalRetries).toBe(1);
      expect(mockAzurePlanner).toHaveBeenCalledTimes(2);
    });

    it('should have longer timeout for Azure (45s vs 30s)', async () => {
      const startTime = Date.now();
      
      mockAzurePlanner.mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 40000)) // 40s
      );

      const intent = {
        type: 'content_planning' as const,
        userId: 'user-azure-timeout',
        data: { theme: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-azure-timeout', intent);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Should timeout after ~45s (not 30s)
        expect(duration).toBeGreaterThan(44000);
        expect(duration).toBeLessThan(46000);
      }
    });
  });

  describe('Cost Tracking', () => {
    it('should track OpenAI costs correctly', async () => {
      mockAIRouter.routeRequest.mockResolvedValue({
        success: true,
        data: { content: 'Test content' },
        usage: { total_tokens: 1500 }
      });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-cost-tracking',
        data: { message: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-cost-tracking', intent);

      expect(mockCostMonitoring.trackUsage).toHaveBeenCalledWith(
        'openai',
        1500, // tokens
        0.003, // cost (1500/1000 * 0.002)
        'user-cost-tracking',
        expect.any(String), // workflowId
        'message_generation',
        expect.objectContaining({
          traceId: expect.any(String),
          duration: expect.any(Number),
          model: 'gpt-3.5-turbo',
          cacheHit: false,
          retryAttempt: 0
        })
      );

      expect(result.costInfo.tokens).toBe(1500);
      expect(result.costInfo.cost).toBe(0.003);
    });

    it('should track Azure costs correctly', async () => {
      mockAzurePlanner.mockResolvedValue({
        contents: [{ text: 'Azure content' }],
        usage: { total_tokens: 2000 }
      });

      const intent = {
        type: 'content_planning' as const,
        userId: 'user-azure-cost',
        data: { theme: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-azure-cost', intent);

      expect(mockCostMonitoring.trackUsage).toHaveBeenCalledWith(
        'azure',
        2000, // tokens
        0.02, // cost (2000/1000 * 0.01)
        'user-azure-cost',
        expect.any(String),
        'content_planning',
        expect.objectContaining({
          model: 'gpt-4-turbo',
          region: 'eastus'
        })
      );

      expect(result.costInfo.tokens).toBe(2000);
      expect(result.costInfo.cost).toBe(0.02);
    });

    it('should estimate tokens when not provided', async () => {
      const longContent = 'a'.repeat(4000); // ~1000 tokens
      
      mockAIRouter.routeRequest.mockResolvedValue({
        success: true,
        data: { content: longContent }
        // No usage info
      });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-estimate-tokens',
        data: { message: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-estimate-tokens', intent);

      // Should estimate ~1000 tokens
      expect(result.costInfo.tokens).toBeGreaterThan(900);
      expect(result.costInfo.tokens).toBeLessThan(1100);
    });

    it('should continue workflow if cost tracking fails', async () => {
      mockAIRouter.routeRequest.mockResolvedValue({
        success: true,
        data: { content: 'Test content' }
      });

      mockCostMonitoring.trackUsage.mockRejectedValue(
        new Error('Cost tracking service down')
      );

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-cost-fail',
        data: { message: 'test' }
      };

      // Should NOT throw, workflow should complete
      const result = await orchestrator.executeWorkflow('user-cost-fail', intent);

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test content');
    });

    it('should track retry attempts in cost metadata', async () => {
      mockAIRouter.routeRequest
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockResolvedValueOnce({
          success: true,
          data: { content: 'Success' }
        });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-retry-cost',
        data: { message: 'test' }
      };

      await orchestrator.executeWorkflow('user-retry-cost', intent);

      expect(mockCostMonitoring.trackUsage).toHaveBeenCalledWith(
        'openai',
        expect.any(Number),
        expect.any(Number),
        'user-retry-cost',
        expect.any(String),
        'message_generation',
        expect.objectContaining({
          retryAttempt: 1 // Second attempt
        })
      );
    });
  });

  describe('Error Classification', () => {
    it('should classify timeout errors', async () => {
      mockAIRouter.routeRequest.mockRejectedValue(
        new TimeoutError('Request timeout')
      );

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-classify-timeout',
        data: { message: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-classify-timeout', intent);
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIExecutionError);
        expect((error as OpenAIExecutionError).code).toBe('MAX_RETRIES_EXCEEDED');
      }
    });

    it('should classify rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit');
      (rateLimitError as any).status = 429;

      mockAIRouter.routeRequest.mockRejectedValue(rateLimitError);

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-classify-rate-limit',
        data: { message: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-classify-rate-limit', intent);
      } catch (error) {
        // Should fallback to queue
        expect(mockSQS.send).toHaveBeenCalled();
      }
    });

    it('should classify auth errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;

      mockAIRouter.routeRequest.mockRejectedValue(authError);

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-classify-auth',
        data: { message: 'test' }
      };

      await expect(
        orchestrator.executeWorkflow('user-classify-auth', intent)
      ).rejects.toThrow();

      // Should NOT retry auth errors
      expect(mockAIRouter.routeRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data in logs', async () => {
      const sensitiveData = {
        success: true,
        data: {
          content: 'Generated content',
          apiKey: 'sk-secret-key-123',
          password: 'super-secret',
          token: 'bearer-token-xyz'
        }
      };

      mockAIRouter.routeRequest.mockResolvedValue(sensitiveData);

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-sanitize',
        data: { message: 'test' }
      };

      await orchestrator.executeWorkflow('user-sanitize', intent);

      // Verify CloudWatch logs don't contain sensitive data
      const cloudWatchCalls = mockCloudWatch.send.mock.calls;
      const loggedData = JSON.stringify(cloudWatchCalls);

      expect(loggedData).not.toContain('sk-secret-key-123');
      expect(loggedData).not.toContain('super-secret');
      expect(loggedData).not.toContain('bearer-token-xyz');
    });

    it('should sanitize large results in logs', async () => {
      const largeResult = {
        success: true,
        data: {
          content: 'x'.repeat(10000), // 10KB of data
          metadata: { key1: 'value1', key2: 'value2', key3: 'value3' }
        }
      };

      mockAIRouter.routeRequest.mockResolvedValue(largeResult);

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-large-result',
        data: { message: 'test' }
      };

      await orchestrator.executeWorkflow('user-large-result', intent);

      // Verify logs contain summary, not full content
      const cloudWatchCalls = mockCloudWatch.send.mock.calls;
      const loggedData = JSON.stringify(cloudWatchCalls);

      // Should log metadata about data, not the data itself
      expect(loggedData).toContain('hasData');
      expect(loggedData).toContain('dataType');
      expect(loggedData).not.toContain('x'.repeat(100)); // Not the full content
    });
  });

  describe('Timeout Management', () => {
    it('should timeout OpenAI requests after 30s', async () => {
      const startTime = Date.now();

      mockAIRouter.routeRequest.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 35000)) // 35s
      );

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-openai-timeout',
        data: { message: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-openai-timeout', intent);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Should timeout after ~30s
        expect(duration).toBeGreaterThan(29000);
        expect(duration).toBeLessThan(31000);
        expect(error).toBeInstanceOf(TimeoutError);
      }
    });

    it('should timeout Azure requests after 45s', async () => {
      const startTime = Date.now();

      mockAzurePlanner.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 50000)) // 50s
      );

      const intent = {
        type: 'content_planning' as const,
        userId: 'user-azure-timeout',
        data: { theme: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-azure-timeout', intent);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Should timeout after ~45s
        expect(duration).toBeGreaterThan(44000);
        expect(duration).toBeLessThan(46000);
        expect(error).toBeInstanceOf(TimeoutError);
      }
    });
  });

  describe('Fallback Strategy', () => {
    it('should fallback from Azure to OpenAI on timeout', async () => {
      mockAzurePlanner.mockRejectedValue(new TimeoutError('Azure timeout'));
      mockAIRouter.routeRequest.mockResolvedValue({
        success: true,
        data: { content: 'OpenAI fallback content' }
      });

      const intent = {
        type: 'content_planning' as const,
        userId: 'user-fallback-azure-openai',
        data: { theme: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-fallback-azure-openai', intent);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('openai'); // Fallback to OpenAI
      expect(mockAzurePlanner).toHaveBeenCalled();
      expect(mockAIRouter.routeRequest).toHaveBeenCalled();
    });

    it('should fallback from OpenAI to Azure on timeout', async () => {
      mockAIRouter.routeRequest.mockRejectedValue(new TimeoutError('OpenAI timeout'));
      mockAzurePlanner.mockResolvedValue({
        contents: [{ text: 'Azure fallback content' }]
      });

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-fallback-openai-azure',
        data: { message: 'test' }
      };

      const result = await orchestrator.executeWorkflow('user-fallback-openai-azure', intent);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('azure'); // Fallback to Azure
      expect(mockAIRouter.routeRequest).toHaveBeenCalled();
      expect(mockAzurePlanner).toHaveBeenCalled();
    });

    it('should queue on rate limit', async () => {
      const rateLimitError = new Error('Rate limit');
      (rateLimitError as any).status = 429;

      mockAIRouter.routeRequest.mockRejectedValue(rateLimitError);

      const intent = {
        type: 'message_generation' as const,
        userId: 'user-queue-rate-limit',
        data: { message: 'test' }
      };

      try {
        await orchestrator.executeWorkflow('user-queue-rate-limit', intent);
      } catch (error) {
        // Should queue for retry
        expect(mockSQS.send).toHaveBeenCalledWith(
          expect.objectContaining({
            QueueUrl: expect.stringContaining('retry'),
            DelaySeconds: 60 // 60s delay for rate limit
          })
        );
      }
    });
  });
});
