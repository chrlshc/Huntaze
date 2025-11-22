/**
 * Property Test: Multi-agent orchestration
 * Feature: ai-system-gemini-integration, Property 17: Multi-agent orchestration
 * Validates: Requirements 6.3, 9.2, 9.3
 * 
 * Property: For any request requiring multiple agents, the Coordinator SHALL invoke
 * all required agents and combine their responses into a single unified result.
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

describe('Property 17: Multi-agent orchestration', () => {
  let coordinator: AITeamCoordinator;

  beforeEach(async () => {
    vi.clearAllMocks();
    coordinator = new AITeamCoordinator();
    await coordinator.initialize();
  });

  test('fan_message requests invoke both messaging and sales agents when appropriate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.string({ minLength: 1 }), // fanId
        fc.constantFrom(
          'I want to buy exclusive content',
          'How much for your premium content?',
          'Can I purchase your special photos?'
        ), // messages with purchase intent
        async (creatorId, fanId, message) => {
          // Mock messaging agent response
          const mockMessagingResponse = {
            success: true,
            data: {
              response: 'Thank you for your interest!',
              confidence: 0.9,
              suggestedUpsell: null,
              usage: {
                model: 'gemini-2.5-flash',
                inputTokens: 100,
                outputTokens: 50,
                costUsd: 0.001,
              },
            },
          };

          // Mock sales agent response
          const mockSalesResponse = {
            success: true,
            data: {
              message: 'Special offer just for you!',
              tactics: ['scarcity', 'exclusivity'],
              suggestedPrice: 29.99,
              confidence: 0.85,
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
            message,
          });

          // Verify multi-agent orchestration
          expect(result.success).toBe(true);
          
          // Property: Both agents should be invoked
          expect(result.agentsInvolved).toContain('messaging-agent');
          expect(result.agentsInvolved).toContain('sales-agent');
          expect(result.agentsInvolved.length).toBeGreaterThanOrEqual(2);

          // Property: Results should be combined
          expect(result.data).toBeDefined();
          expect(result.data.response).toBe(mockMessagingResponse.data.response);
          expect(result.data.salesTactics).toEqual(mockSalesResponse.data.tactics);
          expect(result.data.suggestedPrice).toBe(mockSalesResponse.data.suggestedPrice);

          // Property: Usage should be aggregated
          expect(result.usage).toBeDefined();
          expect(result.usage!.totalInputTokens).toBe(
            mockMessagingResponse.data.usage.inputTokens + mockSalesResponse.data.usage.inputTokens
          );
          expect(result.usage!.totalOutputTokens).toBe(
            mockMessagingResponse.data.usage.outputTokens + mockSalesResponse.data.usage.outputTokens
          );
          expect(result.usage!.totalCostUsd).toBeCloseTo(
            mockMessagingResponse.data.usage.costUsd + mockSalesResponse.data.usage.costUsd,
            4
          );

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('caption generation invokes both analytics and content agents', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.constantFrom('instagram', 'twitter', 'tiktok', 'onlyfans'), // platform
        fc.record({
          type: fc.constantFrom('photo', 'video', 'story'),
          description: fc.string(),
          mood: fc.constantFrom('playful', 'sexy', 'professional'),
        }), // contentInfo
        async (creatorId, platform, contentInfo) => {
          // Mock analytics agent response
          const mockAnalyticsResponse = {
            success: true,
            data: {
              insights: ['Post at 8pm for best engagement'],
              patterns: ['Videos perform 2x better'],
              predictions: ['Expect 500+ likes'],
              recommendations: ['Use trending hashtags'],
              confidence: 0.8,
              usage: {
                model: 'gemini-2.5-pro',
                inputTokens: 200,
                outputTokens: 150,
                costUsd: 0.002,
              },
            },
          };

          // Mock content agent response
          const mockContentResponse = {
            success: true,
            data: {
              caption: 'Amazing new content! 🔥',
              hashtags: ['trending', 'exclusive', 'new'],
              confidence: 0.9,
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
            contentInfo,
          });

          // Verify multi-agent orchestration
          expect(result.success).toBe(true);

          // Property: Both agents should be invoked
          expect(result.agentsInvolved).toContain('analytics-agent');
          expect(result.agentsInvolved).toContain('content-agent');
          expect(result.agentsInvolved.length).toBeGreaterThanOrEqual(2);

          // Property: Results should be combined
          expect(result.data).toBeDefined();
          expect(result.data.caption).toBe(mockContentResponse.data.caption);
          expect(result.data.hashtags).toEqual(mockContentResponse.data.hashtags);
          expect(result.data.performanceInsights).toEqual(mockAnalyticsResponse.data.insights);

          // Property: Usage should be aggregated
          expect(result.usage).toBeDefined();
          expect(result.usage!.totalInputTokens).toBe(
            mockAnalyticsResponse.data.usage.inputTokens + mockContentResponse.data.usage.inputTokens
          );
          expect(result.usage!.totalOutputTokens).toBe(
            mockAnalyticsResponse.data.usage.outputTokens + mockContentResponse.data.usage.outputTokens
          );

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('single-agent requests only invoke one agent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.string({ minLength: 1 }), // fanId
        fc.record({
          engagementLevel: fc.constantFrom('low', 'medium'),
          purchaseHistory: fc.constant([]),
        }), // context without sales triggers
        async (creatorId, fanId, context) => {
          // Mock analytics agent response
          const mockAnalyticsResponse = {
            success: true,
            data: {
              insights: ['Performance is improving'],
              patterns: ['Consistent growth'],
              predictions: ['Continue upward trend'],
              recommendations: ['Keep current strategy'],
              confidence: 0.85,
              usage: {
                model: 'gemini-2.5-pro',
                inputTokens: 180,
                outputTokens: 120,
                costUsd: 0.0018,
              },
            },
          };

          // Setup mock
          vi.mocked(AnalyticsAgent.prototype.processRequest).mockResolvedValue(mockAnalyticsResponse);

          // Execute performance analysis (single-agent request)
          const result = await coordinator.route({
            type: 'analyze_performance',
            creatorId,
            metrics: {
              timeframe: 'last_30_days',
            },
          });

          // Verify single-agent orchestration
          expect(result.success).toBe(true);

          // Property: Only analytics agent should be invoked
          expect(result.agentsInvolved).toEqual(['analytics-agent']);
          expect(result.agentsInvolved.length).toBe(1);

          // Property: Results should match single agent output
          expect(result.data).toEqual(mockAnalyticsResponse.data);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('coordinator combines results from all successful agents', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // creatorId
        fc.boolean(), // whether to invoke sales agent
        async (creatorId, invokeSales) => {
          // Create mock responses
          const mockMessagingResponse = {
            success: true,
            data: {
              response: 'Message response',
              confidence: 0.9,
              usage: { model: 'test', inputTokens: 100, outputTokens: 50, costUsd: 0.001 },
            },
          };

          const mockSalesResponse = {
            success: true,
            data: {
              message: 'Sales message',
              tactics: ['scarcity'],
              confidence: 0.85,
              usage: { model: 'test', inputTokens: 120, outputTokens: 60, costUsd: 0.0012 },
            },
          };

          // Setup mocks
          vi.mocked(MessagingAgent.prototype.processRequest).mockResolvedValue(mockMessagingResponse);
          vi.mocked(SalesAgent.prototype.processRequest).mockResolvedValue(mockSalesResponse);

          // Execute with or without purchase intent
          const message = invokeSales ? 'I want to buy content' : 'Hello there';
          const result = await coordinator.route({
            type: 'fan_message',
            creatorId,
            fanId: 'test-fan',
            message,
          });

          // Property: Result should be successful
          expect(result.success).toBe(true);
          expect(result.agentsInvolved.length).toBeGreaterThanOrEqual(1);

          // Property: If sales should be invoked, both agents should be present
          if (invokeSales) {
            expect(result.agentsInvolved).toContain('messaging-agent');
            expect(result.agentsInvolved).toContain('sales-agent');
            expect(result.agentsInvolved.length).toBe(2);
          } else {
            // Only messaging agent should be invoked
            expect(result.agentsInvolved).toContain('messaging-agent');
            expect(result.agentsInvolved.length).toBe(1);
          }

          // Property: Combined usage should equal sum of all invoked agents
          if (result.usage) {
            expect(result.usage.totalInputTokens).toBeGreaterThan(0);
            expect(result.usage.totalOutputTokens).toBeGreaterThan(0);
            expect(result.usage.totalCostUsd).toBeGreaterThan(0);

            // Verify exact totals
            const expectedInputTokens = invokeSales ? 220 : 100;
            const expectedOutputTokens = invokeSales ? 110 : 50;
            expect(result.usage.totalInputTokens).toBe(expectedInputTokens);
            expect(result.usage.totalOutputTokens).toBe(expectedOutputTokens);
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
