/**
 * Unit Tests - Azure Sales Agent
 * 
 * Feature: huntaze-ai-azure-migration, Task 12
 * Requirements: 2.3, 10.3, 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AzureSalesAgent } from '../../../lib/ai/agents/sales.azure';
import type { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';

// Mock dependencies
vi.mock('../../../lib/ai/azure/azure-openai-router', () => ({
  azureOpenAIRouter: {
    chat: vi.fn(),
  },
}));

vi.mock('../../../lib/ai/azure/cost-tracking.service', () => ({
  getCostTrackingService: vi.fn(() => ({
    checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
    logUsage: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { azureOpenAIRouter } from '../../../lib/ai/azure/azure-openai-router';

describe('AzureSalesAgent', () => {
  let agent: AzureSalesAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new AzureSalesAgent();
    
    mockNetwork = {
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
      getRelevantInsights: vi.fn().mockResolvedValue([]),
    } as any;

    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct agent properties', () => {
      expect(agent.id).toBe('sales-agent-azure');
      expect(agent.name).toBe('Sales Agent (Azure)');
      expect(agent.role).toBe('sales_optimization');
      expect(agent.model).toBe('gpt-35-turbo');
    });

    it('should initialize with Knowledge Network', async () => {
      await agent.initialize(mockNetwork);
      expect(agent['network']).toBe(mockNetwork);
    });
  });

  describe('Model Selection - Requirement 2.3', () => {
    it('should use GPT-3.5 Turbo for sales optimization', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test message',
          confidence: 0.8,
          reasoning: 'Test reasoning',
          expectedConversionRate: 0.3,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        { fanEngagementLevel: 'high' },
        'upsell',
        'account-123',
        'pro'
      );

      expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          tier: 'economy', // Should use economy tier
          maxTokens: 400, // Reduced tokens for economy
        })
      );
    });

    it('should use economy tier for cost optimization', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test',
          confidence: 0.7,
          reasoning: 'Test',
          expectedConversionRate: 0.25,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 },
        cost: 0.0008,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'ppv_suggestion'
      );

      const callArgs = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        tier: 'economy',
      });
    });
  });

  describe('Sales Optimization - Requirement 2.3', () => {
    it('should generate optimized sales message', async () => {
      await agent.initialize(mockNetwork);

      const mockResponse = {
        optimizedMessage: 'Check out my new exclusive content! 🔥',
        suggestedPrice: 25.00,
        confidence: 0.85,
        reasoning: 'Fan has high engagement and purchase history',
        expectedConversionRate: 0.38,
        alternativeApproaches: ['Bundle offer', 'Limited time discount'],
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify(mockResponse),
        usage: { promptTokens: 150, completionTokens: 80, totalTokens: 230 },
        cost: 0.0015,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.optimizeForSales(
        123,
        'fan-456',
        {
          fanEngagementLevel: 'high',
          fanPurchaseHistory: [{ amount: 20, date: '2024-01-01' }],
        },
        'upsell'
      );

      expect(result.optimizedMessage).toBe(mockResponse.optimizedMessage);
      expect(result.suggestedPrice).toBe(25.00);
      expect(result.confidence).toBe(0.85);
      expect(result.expectedConversionRate).toBe(0.38);
      expect(result.alternativeApproaches).toHaveLength(2);
    });

    it('should handle different optimization types', async () => {
      await agent.initialize(mockNetwork);

      const optimizationTypes = ['upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'] as const;

      for (const type of optimizationTypes) {
        vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
          text: JSON.stringify({
            optimizedMessage: `Message for ${type}`,
            confidence: 0.75,
            reasoning: 'Test',
            expectedConversionRate: 0.3,
            alternativeApproaches: [],
          }),
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
          cost: 0.001,
          model: 'gpt-35-turbo',
          finishReason: 'stop',
        });

        const result = await agent.optimizeForSales(
          123,
          'fan-456',
          {},
          type
        );

        expect(result.optimizedMessage).toContain(type);
      }
    });

    it('should include pricing suggestions when appropriate', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'New PPV content available!',
          suggestedPrice: 30.00,
          confidence: 0.82,
          reasoning: 'Based on fan purchase history',
          expectedConversionRate: 0.35,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 120, completionTokens: 60, totalTokens: 180 },
        cost: 0.0012,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.optimizeForSales(
        123,
        'fan-456',
        {
          fanPurchaseHistory: [
            { amount: 25, type: 'ppv' },
            { amount: 35, type: 'ppv' },
          ],
        },
        'ppv_suggestion'
      );

      expect(result.suggestedPrice).toBe(30.00);
      expect(result.suggestedPrice).toBeGreaterThan(0);
    });
  });

  describe('Prompt Caching - Requirement 10.3', () => {
    it('should cache prompts for repeated contexts', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test',
          confidence: 0.7,
          reasoning: 'Test',
          expectedConversionRate: 0.25,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      // First call - should build and cache prompt
      await agent.optimizeForSales(
        123,
        'fan-1',
        { fanEngagementLevel: 'high' },
        'upsell'
      );

      // Second call with same creator and type - should use cached prompt
      await agent.optimizeForSales(
        123,
        'fan-2',
        { fanEngagementLevel: 'high' },
        'upsell'
      );

      // Verify cache is being used (implementation detail)
      const cacheKey = agent['generateCacheKey'](123, 'upsell', { fanEngagementLevel: 'high' });
      const cached = agent['getCachedPrompt'](cacheKey);
      expect(cached).toBeDefined();
    });

    it('should generate different cache keys for different contexts', () => {
      const key1 = agent['generateCacheKey'](123, 'upsell', { fanEngagementLevel: 'high' });
      const key2 = agent['generateCacheKey'](123, 'upsell', { fanEngagementLevel: 'low' });
      const key3 = agent['generateCacheKey'](123, 'ppv_suggestion', { fanEngagementLevel: 'high' });

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should expire cached prompts after TTL', async () => {
      const cacheKey = 'test-key';
      const prompt = 'test prompt';

      agent['cachePrompt'](cacheKey, prompt);

      // Should be available immediately
      expect(agent['getCachedPrompt'](cacheKey)).toBe(prompt);

      // Mock time passing beyond TTL
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 3700000); // 1 hour + 100 seconds

      // Should be expired
      expect(agent['getCachedPrompt'](cacheKey)).toBeUndefined();

      Date.now = originalNow;
    });
  });

  describe('Few-Shot Examples - Requirement 10.5', () => {
    it('should include few-shot examples in prompts', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test',
          confidence: 0.7,
          reasoning: 'Test',
          expectedConversionRate: 0.25,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 200, completionTokens: 50, totalTokens: 250 },
        cost: 0.0015,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'upsell'
      );

      const messages = vi.mocked(azureOpenAIRouter.chat).mock.calls[0][0];
      const systemMessage = messages.find(m => m.role === 'system');

      expect(systemMessage?.content).toContain('Few-shot Examples');
      expect(systemMessage?.content).toContain('Example 1');
    });

    it('should provide examples for each optimization type', () => {
      const types = ['upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'];

      types.forEach(type => {
        const examples = agent['getFewShotExamples'](type);
        expect(examples).toContain('Few-shot Examples');
        expect(examples).toContain('Example 1');
      });
    });
  });

  describe('Knowledge Network Integration', () => {
    it('should retrieve sales insights from network', async () => {
      await agent.initialize(mockNetwork);

      const mockInsights = [
        {
          source: 'sales-agent',
          type: 'sales_tactic_upsell',
          confidence: 0.85,
          data: { conversionRate: 0.4 },
          timestamp: new Date(),
        },
      ];

      vi.mocked(mockNetwork.getRelevantInsights).mockResolvedValue(mockInsights);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test',
          confidence: 0.8,
          reasoning: 'Test',
          expectedConversionRate: 0.3,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'upsell'
      );

      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(
        123,
        'sales_tactic_upsell',
        3
      );
    });

    it('should broadcast successful sales tactics', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test message',
          suggestedPrice: 25,
          confidence: 0.85, // High confidence
          reasoning: 'Test',
          expectedConversionRate: 0.4,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        { fanEngagementLevel: 'high' },
        'upsell'
      );

      expect(mockNetwork.broadcastInsight).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          source: 'sales-agent-azure',
          type: 'sales_tactic_upsell',
          confidence: 0.85,
        })
      );
    });

    it('should not broadcast low-confidence tactics', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test',
          confidence: 0.5, // Low confidence
          reasoning: 'Test',
          expectedConversionRate: 0.2,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'upsell'
      );

      expect(mockNetwork.broadcastInsight).not.toHaveBeenCalled();
    });
  });

  describe('Response Parsing', () => {
    it('should parse valid JSON responses', async () => {
      await agent.initialize(mockNetwork);

      const mockResponse = {
        optimizedMessage: 'Test message',
        suggestedPrice: 20.00,
        confidence: 0.8,
        reasoning: 'Test reasoning',
        expectedConversionRate: 0.35,
        alternativeApproaches: ['Approach 1', 'Approach 2'],
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify(mockResponse),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'upsell'
      );

      expect(result.optimizedMessage).toBe(mockResponse.optimizedMessage);
      expect(result.suggestedPrice).toBe(mockResponse.suggestedPrice);
      expect(result.confidence).toBe(mockResponse.confidence);
      expect(result.reasoning).toBe(mockResponse.reasoning);
      expect(result.expectedConversionRate).toBe(mockResponse.expectedConversionRate);
      expect(result.alternativeApproaches).toEqual(mockResponse.alternativeApproaches);
    });

    it('should handle malformed JSON gracefully', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: 'This is not valid JSON',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'upsell'
      );

      expect(result.optimizedMessage).toBe('This is not valid JSON');
      expect(result.confidence).toBe(0.4); // Fallback confidence
      expect(result.reasoning).toContain('Failed to parse');
    });
  });

  describe('Cost Tracking', () => {
    it('should log usage to cost tracking service', async () => {
      await agent.initialize(mockNetwork);

      const mockCostTracker = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: true }),
        logUsage: vi.fn().mockResolvedValue(undefined),
      };

      agent['costTracker'] = mockCostTracker as any;

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          optimizedMessage: 'Test',
          confidence: 0.7,
          reasoning: 'Test',
          expectedConversionRate: 0.25,
          alternativeApproaches: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.001,
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.optimizeForSales(
        123,
        'fan-456',
        {},
        'upsell',
        'account-123'
      );

      expect(mockCostTracker.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          model: 'gpt-35-turbo',
          estimatedCost: 0.001,
        }),
        expect.objectContaining({
          accountId: 'account-123',
          creatorId: '123',
          operation: 'sales_upsell',
        })
      );
    });

    it('should check quota before making requests', async () => {
      await agent.initialize(mockNetwork);

      const mockCostTracker = {
        checkQuota: vi.fn().mockResolvedValue({ allowed: false }),
        logUsage: vi.fn(),
      };

      agent['costTracker'] = mockCostTracker as any;

      await expect(
        agent.optimizeForSales(
          123,
          'fan-456',
          {},
          'upsell',
          'account-123'
        )
      ).rejects.toThrow('Quota exceeded');

      expect(mockCostTracker.checkQuota).toHaveBeenCalledWith('account-123');
      expect(azureOpenAIRouter.chat).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Azure OpenAI errors gracefully', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockRejectedValue(
        new Error('Azure OpenAI service unavailable')
      );

      await expect(
        agent.optimizeForSales(
          123,
          'fan-456',
          {},
          'upsell'
        )
      ).rejects.toThrow('Azure OpenAI service unavailable');
    });

    it('should return error response through processRequest', async () => {
      await agent.initialize(mockNetwork);

      vi.mocked(azureOpenAIRouter.chat).mockRejectedValue(
        new Error('Test error')
      );

      const result = await agent.processRequest({
        creatorId: 123,
        fanId: 'fan-456',
        context: {},
        optimizationType: 'upsell',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
});
