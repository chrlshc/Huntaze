/**
 * Property-Based Tests - Azure Sales Agent
 * 
 * Feature: huntaze-ai-azure-migration, Task 12.1
 * Property 4: Agent model assignment (SalesAI)
 * Validates: Requirements 2.3
 * 
 * Tests universal properties that should hold across all inputs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
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

describe('AzureSalesAgent - Property-Based Tests', () => {
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

  /**
   * Property 4: Agent model assignment (SalesAI)
   * 
   * For any sales optimization request, the system should use GPT-3.5 Turbo
   * (economy tier) to minimize costs while maintaining quality.
   * 
   * Validates: Requirements 2.3
   */
  describe('Property 4: SalesAI Model Assignment', () => {
    it('should always use GPT-3.5 Turbo (economy tier) for any sales request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }), // creatorId
          fc.string({ minLength: 5, maxLength: 20 }), // fanId
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'), // optimizationType
          fc.constantFrom('high', 'medium', 'low'), // engagementLevel
          fc.constantFrom('starter', 'pro', 'scale', 'enterprise'), // plan
          async (creatorId, fanId, optimizationType, engagementLevel, plan) => {
            await agent.initialize(mockNetwork);

            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                optimizedMessage: 'Test message',
                confidence: 0.75,
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
              creatorId,
              fanId,
              { fanEngagementLevel: engagementLevel },
              optimizationType as any,
              `account-${creatorId}`,
              plan as any
            );

            expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
              expect.any(Array),
              expect.objectContaining({
                tier: 'economy',
              })
            );

            const callOptions = vi.mocked(azureOpenAIRouter.chat).mock.calls[0][1];
            expect(callOptions.maxTokens).toBeLessThanOrEqual(400);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a valid sales optimization response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'),
          async (creatorId, fanId, optimizationType) => {
            await agent.initialize(mockNetwork);

            const mockResponse = {
              optimizedMessage: `Optimized message for ${optimizationType}`,
              suggestedPrice: Math.random() * 50 + 10,
              confidence: Math.random() * 0.5 + 0.5,
              reasoning: 'Generated reasoning',
              expectedConversionRate: Math.random() * 0.5 + 0.2,
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
              creatorId,
              fanId,
              {},
              optimizationType as any
            );

            expect(result).toHaveProperty('optimizedMessage');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('reasoning');
            expect(result).toHaveProperty('expectedConversionRate');
            expect(result).toHaveProperty('usage');

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);

            expect(result.expectedConversionRate).toBeGreaterThanOrEqual(0);
            expect(result.expectedConversionRate).toBeLessThanOrEqual(1);

            expect(result.usage.model).toBe('gpt-35-turbo');
            expect(result.usage.inputTokens).toBeGreaterThan(0);
            expect(result.usage.outputTokens).toBeGreaterThan(0);
            expect(result.usage.costUsd).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include few-shot examples in prompts for all optimization types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'),
          async (creatorId, fanId, optimizationType) => {
            await agent.initialize(mockNetwork);

            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                optimizedMessage: 'Test',
                confidence: 0.7,
                reasoning: 'Test',
                expectedConversionRate: 0.3,
                alternativeApproaches: [],
              }),
              usage: { promptTokens: 150, completionTokens: 50, totalTokens: 200 },
              cost: 0.0012,
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            await agent.optimizeForSales(
              creatorId,
              fanId,
              {},
              optimizationType as any
            );

            const messages = vi.mocked(azureOpenAIRouter.chat).mock.calls[0][0];
            const systemMessage = messages.find(m => m.role === 'system');

            expect(systemMessage).toBeDefined();
            expect(systemMessage?.content).toContain('Few-shot Examples');
            expect(systemMessage?.content).toContain('Example 1');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Prompt Caching Consistency', () => {
    it('should generate consistent cache keys for same context', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'),
          fc.constantFrom('high', 'medium', 'low'),
          (creatorId, optimizationType, engagementLevel) => {
            const context = { fanEngagementLevel: engagementLevel };

            const key1 = agent['generateCacheKey'](creatorId, optimizationType, context);
            const key2 = agent['generateCacheKey'](creatorId, optimizationType, context);

            expect(key1).toBe(key2);
            expect(key1).toContain(creatorId.toString());
            expect(key1).toContain(optimizationType);
            expect(key1).toContain(engagementLevel);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cache and retrieve prompts correctly', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'),
          (creatorId, optimizationType) => {
            const cacheKey = `test-${creatorId}-${optimizationType}`;
            const prompt = `System prompt for ${optimizationType}`;

            agent['cachePrompt'](cacheKey, prompt);

            const retrieved = agent['getCachedPrompt'](cacheKey);
            expect(retrieved).toBe(prompt);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Knowledge Network Integration', () => {
    it('should broadcast high-confidence sales tactics to network', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'),
          fc.float({ min: Math.fround(0.71), max: Math.fround(1.0), noNaN: true }),
          async (creatorId, fanId, optimizationType, confidence) => {
            // Reset mocks for each iteration
            vi.clearAllMocks();
            
            // Reinitialize agent and network
            agent = new AzureSalesAgent();
            mockNetwork = {
              broadcastInsight: vi.fn().mockResolvedValue(undefined),
              getRelevantInsights: vi.fn().mockResolvedValue([]),
            } as any;
            
            await agent.initialize(mockNetwork);

            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                optimizedMessage: 'Test message',
                suggestedPrice: 25,
                confidence,
                reasoning: 'Test reasoning',
                expectedConversionRate: 0.35,
                alternativeApproaches: [],
              }),
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              cost: 0.001,
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            await agent.optimizeForSales(
              creatorId,
              fanId,
              { fanEngagementLevel: 'high' },
              optimizationType as any
            );

            expect(mockNetwork.broadcastInsight).toHaveBeenCalledWith(
              creatorId,
              expect.objectContaining({
                source: 'sales-agent-azure',
                type: `sales_tactic_${optimizationType}`,
                confidence,
                data: expect.objectContaining({
                  fanId,
                  optimizationType,
                  model: 'gpt-35-turbo',
                  provider: 'azure',
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not broadcast low-confidence tactics', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('upsell', 'ppv_suggestion', 'tip_request', 'subscription_renewal'),
          fc.float({ min: Math.fround(0.0), max: Math.fround(0.7), noNaN: true }),
          async (creatorId, fanId, optimizationType, confidence) => {
            // Reset mocks for each iteration
            vi.clearAllMocks();
            
            // Reinitialize agent and network
            agent = new AzureSalesAgent();
            mockNetwork = {
              broadcastInsight: vi.fn().mockResolvedValue(undefined),
              getRelevantInsights: vi.fn().mockResolvedValue([]),
            } as any;
            
            await agent.initialize(mockNetwork);

            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                optimizedMessage: 'Test',
                confidence,
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
              creatorId,
              fanId,
              {},
              optimizationType as any
            );

            expect(mockNetwork.broadcastInsight).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
