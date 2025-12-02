/**
 * Property-Based Tests - Azure AnalyticsAgent
 * 
 * Feature: huntaze-ai-azure-migration, Task 11.1
 * Property 4: Agent model assignment (AnalyticsAI)
 * Validates: Requirements 2.2
 * 
 * Property: For any AnalyticsAI request, the system should use GPT-4 Turbo (premium tier)
 * and include confidence scoring in all outputs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AzureAnalyticsAgent } from '../../../lib/ai/agents/analytics.azure';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';

// Mock Azure OpenAI Router
vi.mock('../../../lib/ai/azure/azure-openai-router', () => ({
  azureOpenAIRouter: {
    chat: vi.fn(),
  },
}));

// Mock Cost Tracking Service
vi.mock('../../../lib/ai/azure/cost-tracking.service', () => ({
  getCostTrackingService: vi.fn(() => ({
    checkQuota: vi.fn().mockResolvedValue({ allowed: true, remaining: 1000, limit: 10000 }),
    logUsage: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('AzureAnalyticsAgent - Property-Based Tests', () => {
  let agent: AzureAnalyticsAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new AzureAnalyticsAgent();
    mockNetwork = {
      getRelevantInsights: vi.fn().mockResolvedValue([]),
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  /**
   * Property 4: Agent model assignment (AnalyticsAI)
   * For any AnalyticsAI request, the system should use GPT-4 Turbo (premium tier)
   */
  describe('Property 4: AnalyticsAI Model Assignment', () => {
    it('should always use GPT-4 Turbo (premium tier) for any analytics request', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('revenue', 'engagement', 'content', 'fan_behavior', 'predictive'),
          fc.record({
            totalRevenue: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
            subscriptions: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            likes: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
            comments: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
          }),
          fc.constantFrom('starter', 'pro', 'scale', 'enterprise'),
          async (creatorId, analysisType, data, plan) => {
            const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
            
            // Mock response with valid structure
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                insights: [
                  {
                    category: analysisType,
                    finding: 'Test finding',
                    confidence: 0.85,
                    impact: 'high',
                    actionable: true,
                  },
                ],
                predictions: [
                  {
                    metric: 'test_metric',
                    predictedValue: 1000,
                    confidence: 0.80,
                    timeframe: 'next 30 days',
                  },
                ],
                recommendations: [
                  {
                    action: 'Test action',
                    priority: 'high',
                    expectedImpact: 'Test impact',
                    confidence: 0.75,
                  },
                ],
                summary: 'Analysis complete',
                confidence: 0.82,
              }),
              usage: {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
              },
              cost: 0.005,
              model: 'gpt-4-turbo',
              finishReason: 'stop',
              tier: 'premium',
              deployment: 'gpt-4-turbo-prod',
              region: 'westeurope',
            });

            await agent.analyzeData(
              creatorId,
              analysisType as any,
              data,
              undefined,
              undefined,
              `account-${creatorId}`,
              plan as any
            );

            // Property: Should ALWAYS use premium tier (GPT-4 Turbo)
            expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
              expect.any(Array),
              expect.objectContaining({
                tier: 'premium',
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include confidence scores in all outputs', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('revenue', 'engagement', 'content', 'fan_behavior', 'predictive'),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          async (creatorId, analysisType, numInsights, numPredictions, numRecommendations) => {
            const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
            
            // Generate insights with confidence scores
            const insights = Array.from({ length: numInsights }, (_, i) => ({
              category: analysisType,
              finding: `Finding ${i + 1}`,
              confidence: 0.5 + Math.random() * 0.5,
              impact: 'high' as const,
              actionable: true,
            }));

            // Generate predictions with confidence scores
            const predictions = Array.from({ length: numPredictions }, (_, i) => ({
              metric: `metric_${i + 1}`,
              predictedValue: Math.random() * 10000,
              confidence: 0.5 + Math.random() * 0.5,
              timeframe: 'next 30 days',
            }));

            // Generate recommendations with confidence scores
            const recommendations = Array.from({ length: numRecommendations }, (_, i) => ({
              action: `Action ${i + 1}`,
              priority: 'high' as const,
              expectedImpact: `Impact ${i + 1}`,
              confidence: 0.5 + Math.random() * 0.5,
            }));

            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                insights,
                predictions,
                recommendations,
                summary: 'Analysis complete',
                confidence: 0.82,
              }),
              usage: {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
              },
              cost: 0.005,
              model: 'gpt-4-turbo',
              finishReason: 'stop',
              tier: 'premium',
              deployment: 'gpt-4-turbo-prod',
              region: 'westeurope',
            });

            const result = await agent.analyzeData(
              creatorId,
              analysisType as any,
              {},
              undefined,
              undefined,
              `account-${creatorId}`,
              'pro'
            );

            // Property: ALL insights must have confidence scores
            expect(result.insights).toHaveLength(numInsights);
            result.insights.forEach(insight => {
              expect(insight.confidence).toBeDefined();
              expect(typeof insight.confidence).toBe('number');
              expect(insight.confidence).toBeGreaterThanOrEqual(0);
              expect(insight.confidence).toBeLessThanOrEqual(1);
            });

            // Property: ALL predictions must have confidence scores
            expect(result.predictions).toHaveLength(numPredictions);
            result.predictions.forEach(prediction => {
              expect(prediction.confidence).toBeDefined();
              expect(typeof prediction.confidence).toBe('number');
              expect(prediction.confidence).toBeGreaterThanOrEqual(0);
              expect(prediction.confidence).toBeLessThanOrEqual(1);
            });

            // Property: ALL recommendations must have confidence scores
            expect(result.recommendations).toHaveLength(numRecommendations);
            result.recommendations.forEach(recommendation => {
              expect(recommendation.confidence).toBeDefined();
              expect(typeof recommendation.confidence).toBe('number');
              expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
              expect(recommendation.confidence).toBeLessThanOrEqual(1);
            });

            // Property: Overall analysis must have confidence score
            expect(result.confidence).toBeDefined();
            expect(typeof result.confidence).toBe('number');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always enable JSON mode for structured output', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('revenue', 'engagement', 'content', 'fan_behavior', 'predictive'),
          async (creatorId, analysisType) => {
            const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
            
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                insights: [],
                predictions: [],
                recommendations: [],
                summary: 'Test',
                confidence: 0.5,
              }),
              usage: {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
              },
              cost: 0.005,
              model: 'gpt-4-turbo',
              finishReason: 'stop',
              tier: 'premium',
              deployment: 'gpt-4-turbo-prod',
              region: 'westeurope',
            });

            await agent.analyzeData(
              creatorId,
              analysisType as any,
              {},
              undefined,
              undefined,
              `account-${creatorId}`,
              'pro'
            );

            // Property: JSON mode should ALWAYS be enabled
            expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
              expect.any(Array),
              expect.objectContaining({
                responseFormat: { type: 'json_object' },
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
