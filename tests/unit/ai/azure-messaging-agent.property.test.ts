/**
 * Property-Based Tests for Azure MessagingAgent
 * 
 * Feature: huntaze-ai-azure-migration, Task 10.1
 * Property 4: Agent model assignment (MessagingAI)
 * Validates: Requirements 2.1
 * 
 * Property: For any MessagingAI request, the system should use GPT-4 
 * and include personality-aware context in the prompt.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
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

describe('AzureMessagingAgent - Property-Based Tests', () => {
  let agent: AzureMessagingAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new AzureMessagingAgent();
    mockNetwork = {
      getRelevantInsights: vi.fn().mockResolvedValue([]),
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  /**
   * Property 4: Agent model assignment (MessagingAI)
   * For any MessagingAI request, the system should use GPT-4 (standard tier)
   */
  describe('Property 4: MessagingAI Model Assignment', () => {
    it('should always use GPT-4 standard tier for any request', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.constantFrom('starter', 'pro', 'scale', 'enterprise'),
          async (creatorId, fanId, message, plan) => {
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

            await agent.generateResponse(creatorId, fanId, message, undefined, undefined, plan);

            // Verify GPT-4 standard tier is used
            expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
              expect.any(Array),
              expect.objectContaining({
                tier: 'standard',
              })
            );
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
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 500 }),
          async (creatorId, fanId, message) => {
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

            await agent.generateResponse(creatorId, fanId, message);

            // Verify JSON mode is enabled
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

    it('should set temperature to 0.8 for natural conversation', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 500 }),
          async (creatorId, fanId, message) => {
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

            await agent.generateResponse(creatorId, fanId, message);

            // Verify temperature is set to 0.8
            expect(azureOpenAIRouter.chat).toHaveBeenCalledWith(
              expect.any(Array),
              expect.objectContaining({
                temperature: 0.8,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
