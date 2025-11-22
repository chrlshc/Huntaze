/**
 * Property Test: Agent failure isolation
 * Feature: ai-system-gemini-integration, Property 18: Agent failure isolation
 * Validates: Requirements 6.4, 9.4
 * 
 * Property: For any multi-agent request where one agent fails, the Coordinator SHALL
 * return partial results from successful agents rather than failing the entire request.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { AITeamCoordinator } from '../../../lib/ai/coordinator';
import { MessagingAgent } from '../../../lib/ai/agents/messaging';
import { ContentAgent } from '../../../lib/ai/agents/content';
import { AnalyticsAgent } from '../../../lib/ai/agents/analytics';
import { SalesAgent } from '../../../lib/ai/agents/sales';

// Mock the agents
vi.mock('../../../lib/ai/agents/messaging');
vi.mock('../../../lib/ai/agents/content');
vi.mock('../../../lib/ai/agents/analytics');
vi.mock('../../../lib/ai/agents/sales');

// Mock the database
vi.mock('../../../lib/prisma', () => ({
  db: {
    aIInsight: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('Property 18: Agent failure isolation', () => {
  let coordinator: AITeamCoordinator;

  beforeEach(async () => {
    vi.clearAllMocks();
    coordinator = new AITeamCoordinator();
    await coordinator.initialize();
  });

  test('fan_message succeeds when messaging agent succeeds but sales agent fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.string({ minLength: 1 }), // fanId
        async (creatorId, fanId) => {
          // Mock messaging agent success
          const mockMessagingResponse = {
            success: true,
            data: {
              response: 'Thank you for your message!',
              confidence: 0.9,
              usage: {
                model: 'gemini-2.5-flash',
                inputTokens: 100,
                outputTokens: 50,
                costUsd: 0.001,
              },
            },
          };

          // Mock sales agent failure
          const mockSalesResponse = {
            success: false,
            error: 'Sales agent temporarily unavailable',
          };

          // Setup mocks
          vi.mocked(MessagingAgent.prototype.processRequest).mockResolvedValue(mockMessagingResponse);
          vi.mocked(SalesAgent.prototype.processRequest).mockResolvedValue(mockSalesResponse);

          // Execute with purchase intent (would normally invoke both agents)
          const result = await coordinator.route({
            type: 'fan_message',
            creatorId,
            fanId,
            message: 'I want to buy content',
          });

          // Property: Request should succeed despite sales agent failure
          expect(result.success).toBe(true);

          // Property: Should have messaging agent results
          expect(result.data).toBeDefined();
          expect(result.data.response).toBe(mockMessagingResponse.data.response);

          // Property: Should include messaging agent in involved agents
          expect(result.agentsInvolved).toContain('messaging-agent');

          // Property: Usage should only include successful agent
          expect(result.usage).toBeDefined();
          expect(result.usage!.totalInputTokens).toBe(100);
          expect(result.usage!.totalOutputTokens).toBe(50);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('caption generation succeeds when content agent succeeds but analytics agent fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.constantFrom('instagram', 'twitter', 'tiktok'), // platform
        async (creatorId, platform) => {
          // Mock analytics agent failure
          const mockAnalyticsResponse = {
            success: false,
            error: 'Analytics data temporarily unavailable',
          };

          // Mock content agent success
          const mockContentResponse = {
            success: true,
            data: {
              caption: 'Amazing content! 🔥',
              hashtags: ['trending', 'new'],
              confidence: 0.85,
              usage: {
                model: 'gemini-2.5-flash',
                inputTokens: 150,
                outputTokens: 80,
                costUsd: 0.0015,
              },
            },
          };

          // Setup mocks
          vi.mocked(AnalyticsAgent.prototype.processRequest).mockResolvedValue(mockAnalyticsResponse);
          vi.mocked(ContentAgent.prototype.processRequest).mockResolvedValue(mockContentResponse);

          // Execute
          const result = await coordinator.route({
            type: 'generate_caption',
            creatorId,
            platform,
            contentInfo: {
              type: 'photo',
              description: 'New content',
            },
          });

          // Property: Request should succeed despite analytics agent failure
          expect(result.success).toBe(true);

          // Property: Should have content agent results
          expect(result.data).toBeDefined();
          expect(result.data.caption).toBe(mockContentResponse.data.caption);
          expect(result.data.hashtags).toEqual(mockContentResponse.data.hashtags);

          // Property: Should include content agent in involved agents
          expect(result.agentsInvolved).toContain('content-agent');

          // Property: Usage should only include successful agent
          expect(result.usage).toBeDefined();
          expect(result.usage!.totalInputTokens).toBe(150);
          expect(result.usage!.totalOutputTokens).toBe(80);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('fan_message fails only when primary messaging agent fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.string({ minLength: 1 }), // fanId
        async (creatorId, fanId) => {
          // Mock messaging agent failure (primary agent)
          const mockMessagingResponse = {
            success: false,
            error: 'Messaging agent failed',
          };

          // Mock sales agent success (secondary agent)
          const mockSalesResponse = {
            success: true,
            data: {
              message: 'Special offer!',
              tactics: ['scarcity'],
              confidence: 0.8,
              usage: {
                model: 'gemini-2.5-flash',
                inputTokens: 120,
                outputTokens: 60,
                costUsd: 0.0012,
              },
            },
          };

          // Setup mocks
          vi.mocked(MessagingAgent.prototype.processRequest).mockResolvedValue(mockMessagingResponse);
          vi.mocked(SalesAgent.prototype.processRequest).mockResolvedValue(mockSalesResponse);

          // Execute
          const result = await coordinator.route({
            type: 'fan_message',
            creatorId,
            fanId,
            message: 'I want to buy content',
          });

          // Property: Request should fail when primary agent fails
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();

          // Property: Should still track which agents were attempted
          expect(result.agentsInvolved).toContain('messaging-agent');

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('agent exceptions are caught and isolated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.string({ minLength: 1 }), // fanId
        async (creatorId, fanId) => {
          // Mock messaging agent success
          const mockMessagingResponse = {
            success: true,
            data: {
              response: 'Hello!',
              confidence: 0.9,
              usage: {
                model: 'gemini-2.5-flash',
                inputTokens: 100,
                outputTokens: 50,
                costUsd: 0.001,
              },
            },
          };

          // Mock sales agent throwing exception
          vi.mocked(MessagingAgent.prototype.processRequest).mockResolvedValue(mockMessagingResponse);
          vi.mocked(SalesAgent.prototype.processRequest).mockRejectedValue(
            new Error('Unexpected sales agent error')
          );

          // Execute with purchase intent
          const result = await coordinator.route({
            type: 'fan_message',
            creatorId,
            fanId,
            message: 'I want to buy content',
          });

          // Property: Request should succeed despite exception in secondary agent
          expect(result.success).toBe(true);

          // Property: Should have messaging agent results
          expect(result.data).toBeDefined();
          expect(result.data.response).toBe(mockMessagingResponse.data.response);

          // Property: Should only include successful agent
          expect(result.agentsInvolved).toContain('messaging-agent');

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('multiple agent failures are handled gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.constantFrom('instagram', 'twitter'), // platform
        async (creatorId, platform) => {
          // Mock both agents failing
          const mockAnalyticsResponse = {
            success: false,
            error: 'Analytics failed',
          };

          const mockContentResponse = {
            success: false,
            error: 'Content generation failed',
          };

          // Setup mocks
          vi.mocked(AnalyticsAgent.prototype.processRequest).mockResolvedValue(mockAnalyticsResponse);
          vi.mocked(ContentAgent.prototype.processRequest).mockResolvedValue(mockContentResponse);

          // Execute
          const result = await coordinator.route({
            type: 'generate_caption',
            creatorId,
            platform,
            contentInfo: {
              type: 'photo',
            },
          });

          // Property: Request should fail when primary agent fails
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();

          // Property: Should track attempted agents
          expect(result.agentsInvolved.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('partial results include usage from only successful agents', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.integer({ min: 100, max: 500 }), // inputTokens
        fc.integer({ min: 50, max: 200 }), // outputTokens
        async (creatorId, inputTokens, outputTokens) => {
          const costUsd = (inputTokens * 0.0000003 + outputTokens * 0.0000025);

          // Mock messaging agent success with variable usage
          const mockMessagingResponse = {
            success: true,
            data: {
              response: 'Response',
              confidence: 0.9,
              usage: {
                model: 'gemini-2.5-flash',
                inputTokens,
                outputTokens,
                costUsd,
              },
            },
          };

          // Mock sales agent failure
          const mockSalesResponse = {
            success: false,
            error: 'Sales agent failed',
          };

          // Setup mocks
          vi.mocked(MessagingAgent.prototype.processRequest).mockResolvedValue(mockMessagingResponse);
          vi.mocked(SalesAgent.prototype.processRequest).mockResolvedValue(mockSalesResponse);

          // Execute
          const result = await coordinator.route({
            type: 'fan_message',
            creatorId,
            fanId: 'test-fan',
            message: 'I want to buy content',
          });

          // Property: Usage should only reflect successful agent
          expect(result.success).toBe(true);
          expect(result.usage).toBeDefined();
          expect(result.usage!.totalInputTokens).toBe(inputTokens);
          expect(result.usage!.totalOutputTokens).toBe(outputTokens);
          expect(result.usage!.totalCostUsd).toBeCloseTo(costUsd, 6);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
