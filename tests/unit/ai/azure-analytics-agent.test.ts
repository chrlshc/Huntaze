/**
 * Unit Tests - Azure AnalyticsAgent
 * 
 * Feature: huntaze-ai-azure-migration, Task 11
 * Requirements: 2.2, 10.1, 10.2
 * Validates: Property 4 (Agent model assignment - AnalyticsAI)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('AzureAnalyticsAgent', () => {
  let agent: AzureAnalyticsAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new AzureAnalyticsAgent();
    
    // Mock Knowledge Network
    mockNetwork = {
      getRelevantInsights: vi.fn().mockResolvedValue([]),
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  describe('Agent Configuration', () => {
    it('should be configured with GPT-4 Turbo model', () => {
      // Requirement 2.2: AnalyticsAI uses GPT-4 Turbo (premium tier)
      expect(agent.model).toBe('gpt-4-turbo');
    });

    it('should have correct agent ID and role', () => {
      expect(agent.id).toBe('analytics-agent-azure');
      expect(agent.name).toBe('Analytics Agent (Azure)');
      expect(agent.role).toBe('data_analysis');
    });

    it('should initialize with Knowledge Network', async () => {
      await agent.initialize(mockNetwork);
      expect(agent['network']).toBe(mockNetwork);
    });
  });

  describe('Data Analysis - Revenue', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should analyze revenue data and return structured insights', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [
            {
              category: 'revenue',
              finding: 'Revenue increased 25% month-over-month',
              confidence: 0.92,
              impact: 'high',
              actionable: true,
            },
          ],
          predictions: [
            {
              metric: 'monthly_revenue',
              predictedValue: 15000,
              confidence: 0.85,
              timeframe: 'next 30 days',
            },
          ],
          recommendations: [
            {
              action: 'Increase PPV content frequency',
              priority: 'high',
              expectedImpact: 'Additional $3000 revenue',
              confidence: 0.80,
            },
          ],
          summary: 'Strong revenue growth with positive trends',
          confidence: 0.88,
        }),
        usage: {
          promptTokens: 500,
          completionTokens: 300,
          totalTokens: 800,
        },
        cost: 0.024,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      const result = await agent.analyzeData(
        123,
        'revenue',
        {
          totalRevenue: 12000,
          subscriptions: 150,
          ppvSales: 3000,
          tips: 1500,
        },
        {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        undefined,
        'test-account',
        'pro'
      );

      // Verify structured output
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].category).toBe('revenue');
      expect(result.insights[0].confidence).toBeGreaterThan(0.9);
      
      expect(result.predictions).toHaveLength(1);
      expect(result.predictions[0].metric).toBe('monthly_revenue');
      
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].priority).toBe('high');
      
      expect(result.summary).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should use premium tier (GPT-4 Turbo) for analytics', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [],
          predictions: [],
          recommendations: [],
          summary: 'Analysis complete',
          confidence: 0.75,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Verify premium tier was used (Requirement 2.2)
      expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          tier: 'premium',
        })
      );
    });

    it('should enable JSON mode for structured output', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [],
          predictions: [],
          recommendations: [],
          summary: 'Test',
          confidence: 0.5,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Verify JSON mode was enabled (Requirement 10.2)
      expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          responseFormat: { type: 'json_object' },
        })
      );
    });
  });

  describe('Confidence Scoring', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should include confidence scores in all insights', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [
            { category: 'revenue', finding: 'Test', confidence: 0.85, impact: 'high', actionable: true },
            { category: 'engagement', finding: 'Test', confidence: 0.75, impact: 'medium', actionable: true },
          ],
          predictions: [
            { metric: 'test', predictedValue: 100, confidence: 0.80, timeframe: 'next 7 days' },
          ],
          recommendations: [
            { action: 'Test', priority: 'high', expectedImpact: 'Test', confidence: 0.78 },
          ],
          summary: 'Test',
          confidence: 0.82,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      const result = await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Requirement 2.2: All outputs should have confidence scores
      expect(result.insights[0].confidence).toBeDefined();
      expect(result.insights[1].confidence).toBeDefined();
      expect(result.predictions[0].confidence).toBeDefined();
      expect(result.recommendations[0].confidence).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should store high-confidence insights in Knowledge Network', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [
            { category: 'revenue', finding: 'High confidence insight', confidence: 0.92, impact: 'high', actionable: true },
            { category: 'engagement', finding: 'Low confidence insight', confidence: 0.45, impact: 'low', actionable: false },
          ],
          predictions: [
            { metric: 'revenue', predictedValue: 10000, confidence: 0.88, timeframe: 'next 30 days' },
          ],
          recommendations: [],
          summary: 'Test',
          confidence: 0.85,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Should broadcast high-confidence insights (>0.7)
      expect(mockNetwork.broadcastInsight).toHaveBeenCalled();
      
      // Should broadcast 2 insights: 1 high-confidence insight + 1 high-confidence prediction
      expect(mockNetwork.broadcastInsight).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cost Tracking', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should return usage metrics in response', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [],
          predictions: [],
          recommendations: [],
          summary: 'Test',
          confidence: 0.5,
        }),
        usage: { promptTokens: 500, completionTokens: 300, totalTokens: 800 },
        cost: 0.024,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      const result = await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account-123', 'pro');

      // Verify usage metrics are returned
      expect(result.usage).toBeDefined();
      expect(result.usage.model).toBe('gpt-4-turbo');
      expect(result.usage.inputTokens).toBe(500);
      expect(result.usage.outputTokens).toBe(300);
      expect(result.usage.costUsd).toBe(0.024);
    });

    it('should use lower temperature for analytical accuracy', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: JSON.stringify({
          insights: [],
          predictions: [],
          recommendations: [],
          summary: 'Test',
          confidence: 0.5,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Verify lower temperature for analytics (0.3 vs 0.8 for messaging)
      expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          temperature: 0.3,
        })
      );
    });
  });

  describe('Knowledge Network Integration', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should retrieve historical insights from Knowledge Network', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockHistoricalInsights = [
        {
          source: 'analytics-agent-azure',
          type: 'revenue_pattern',
          confidence: 0.85,
          data: { pattern: 'weekend_spike' },
          timestamp: new Date(),
        },
      ];

      vi.mocked(mockNetwork.getRelevantInsights).mockResolvedValue(mockHistoricalInsights);

      const mockResponse = {
        text: JSON.stringify({
          insights: [],
          predictions: [],
          recommendations: [],
          summary: 'Test',
          confidence: 0.5,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Should query for historical patterns, trends, and anomalies
      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(123, 'revenue_pattern', 5);
      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(123, 'revenue_trend', 5);
      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(123, 'anomaly', 3);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      const mockResponse = {
        text: 'Invalid JSON response',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        cost: 0.005,
        model: 'gpt-4-turbo',
        finishReason: 'stop',
        tier: 'premium',
        deployment: 'gpt-4-turbo-prod',
        region: 'westeurope',
      };

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue(mockResponse);

      const result = await agent.analyzeData(123, 'revenue', {}, undefined, undefined, 'test-account', 'pro');

      // Should return fallback structure
      expect(result.insights).toEqual([]);
      expect(result.predictions).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.summary).toBe('Invalid JSON response');
      expect(result.confidence).toBe(0.3);
    });

    it('should return error response when analysis fails', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockRejectedValue(new Error('API Error'));

      const result = await agent.processRequest({
        creatorId: 123,
        analysisType: 'revenue',
        data: {},
        accountId: 'test-account',
        plan: 'pro',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });
});
