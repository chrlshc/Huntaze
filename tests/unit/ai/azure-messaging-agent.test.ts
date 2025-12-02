/**
 * Unit Tests for Azure MessagingAgent
 * 
 * Feature: huntaze-ai-azure-migration, Task 10.1
 * Validates: Property 6 (MessagingAI Model Selection)
 * Requirements: 2.1, 10.1, 10.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AzureMessagingAgent } from '../../../lib/ai/agents/messaging.azure';
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

describe('AzureMessagingAgent', () => {
  let agent: AzureMessagingAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new AzureMessagingAgent();
    mockNetwork = {
      getRelevantInsights: vi.fn().mockResolvedValue([]),
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  describe('Agent Configuration', () => {
    it('should use GPT-4 model for messaging', () => {
      expect(agent.model).toBe('gpt-4');
    });

    it('should have correct agent ID', () => {
      expect(agent.id).toBe('messaging-agent-azure');
    });

    it('should have fan_interaction role', () => {
      expect(agent.role).toBe('fan_interaction');
    });
  });

  describe('Initialization', () => {
    it('should initialize with Knowledge Network', async () => {
      await agent.initialize(mockNetwork);
      expect(agent['network']).toBe(mockNetwork);
    });
  });

  describe('Request Processing', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should process fan message request successfully', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Hey! Thanks for your message!',
          confidence: 0.9,
          suggestedUpsell: null,
          reasoning: 'Friendly greeting response',
        }),
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      const result = await agent.processRequest({
        creatorId: 123,
        fanId: 'fan-456',
        message: 'Hey! How are you?',
        accountId: 'acc-789',
        plan: 'pro',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.response).toBe('Hey! Thanks for your message!');
    });

    it('should handle errors gracefully', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockRejectedValue(new Error('API Error'));

      const result = await agent.processRequest({
        creatorId: 123,
        fanId: 'fan-456',
        message: 'Hey!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle quota check errors', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      // Mock router to throw quota error
      vi.mocked(azureOpenAIRouter.chat).mockRejectedValue(new Error('Quota exceeded for this account'));

      const result = await agent.processRequest({
        creatorId: 123,
        fanId: 'fan-456',
        message: 'Hey!',
        accountId: 'acc-789',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });
  });

  describe('Response Generation', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should use standard tier for messaging', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Test response',
          confidence: 0.8,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      await agent.generateResponse(123, 'fan-456', 'Test message');

      expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          tier: 'standard',
        })
      );
    });

    it('should enable JSON mode for structured output', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Test response',
          confidence: 0.8,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      await agent.generateResponse(123, 'fan-456', 'Test message');

      expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          responseFormat: { type: 'json_object' },
        })
      );
    });

    it('should accept personality profile in context', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Test response',
          confidence: 0.8,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      const result = await agent.generateResponse(123, 'fan-456', 'Test message', {
        personalityProfile: { tone: 'playful', style: 'casual' },
      });

      // Verify the call was made successfully with personality context
      expect(result.response).toBe('Test response');
      expect(azureOpenAIRouter.chat).toHaveBeenCalled();
    });

    it('should return usage metrics in response', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Test response',
          confidence: 0.8,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      const result = await agent.generateResponse(
        123,
        'fan-456',
        'Test message',
        undefined,
        'acc-789'
      );

      // Verify usage metrics are returned
      expect(result.usage).toBeDefined();
      expect(result.usage.model).toBe('gpt-4');
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      expect(result.usage.costUsd).toBe(0.0045);
    });
  });

  describe('Knowledge Network Integration', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should fetch insights from Knowledge Network', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(mockNetwork.getRelevantInsights).mockResolvedValue([
        {
          source: 'sales-agent',
          type: 'sales_tactic',
          confidence: 0.9,
          data: { tactic: 'exclusive_offer' },
          timestamp: new Date(),
        },
      ]);

      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Test response',
          confidence: 0.8,
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      await agent.generateResponse(123, 'fan-456', 'Test message');

      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(123, 'fan_preference', 3);
      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(123, 'sales_tactic', 3);
      expect(mockNetwork.getRelevantInsights).toHaveBeenCalledWith(123, 'engagement_pattern', 3);
    });

    it('should broadcast successful interactions', async () => {
      const { azureOpenAIRouter } = await import('../../../lib/ai/azure/azure-openai-router');
      
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          response: 'Great response!',
          confidence: 0.9, // High confidence
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        finishReason: 'stop',
        model: 'gpt-4',
        tier: 'standard',
        deployment: 'gpt-4-standard-prod',
        region: 'westeurope',
        cost: 0.0045,
      });

      await agent.generateResponse(123, 'fan-456', 'Test message');

      expect(mockNetwork.broadcastInsight).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          source: 'messaging-agent-azure',
          type: 'successful_interaction',
          data: expect.objectContaining({
            fanId: 'fan-456',
            model: 'gpt-4',
            provider: 'azure',
          }),
        })
      );
    });
  });

  describe('Message Classification', () => {
    it('should classify greeting messages', () => {
      const messageType = agent['classifyMessage']('Hey! How are you?');
      expect(messageType).toBe('greeting');
    });

    it('should classify question messages', () => {
      const messageType = agent['classifyMessage']('What content do you have?');
      expect(messageType).toBe('question');
    });

    it('should classify compliment messages', () => {
      const messageType = agent['classifyMessage']('You look beautiful today!');
      expect(messageType).toBe('compliment');
    });

    it('should classify purchase intent messages', () => {
      const messageType = agent['classifyMessage']('I want to buy your content');
      expect(messageType).toBe('purchase_intent');
    });

    it('should classify general messages', () => {
      const messageType = agent['classifyMessage']('Just wanted to chat');
      expect(messageType).toBe('general');
    });
  });

  describe('Response Classification', () => {
    it('should classify upsell responses', () => {
      const strategy = agent['classifyResponse']('Check out my exclusive content!');
      expect(strategy).toBe('upsell');
    });

    it('should classify appreciation responses', () => {
      const strategy = agent['classifyResponse']('Thank you so much!');
      expect(strategy).toBe('appreciation');
    });

    it('should classify engagement question responses', () => {
      const strategy = agent['classifyResponse']('What would you like to see?');
      expect(strategy).toBe('engagement_question');
    });

    it('should classify conversational responses', () => {
      const strategy = agent['classifyResponse']('Having a great day!');
      expect(strategy).toBe('conversational');
    });
  });
});
