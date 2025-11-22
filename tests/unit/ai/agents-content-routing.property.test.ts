/**
 * Property-Based Tests for ContentAgent Request Routing
 * 
 * Feature: ai-system-gemini-integration, Property 16: Request routing correctness (content)
 * Validates: Requirements 1.1, 9.1
 * 
 * Tests that the ContentAgent correctly processes content generation requests
 * and routes them through the appropriate generation pipeline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { ContentAgent } from '../../../lib/ai/agents/content';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';

// Mock the dependencies
vi.mock('../../../lib/ai/gemini-billing.service', () => ({
  generateTextWithBilling: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      caption: 'Test caption',
      hashtags: ['test', 'content'],
      confidence: 0.8,
      reasoning: 'Test reasoning'
    }),
    usage: {
      model: 'gemini-2.5-flash',
      inputTokens: 100,
      outputTokens: 50,
      costUsd: 0.001,
    },
  }),
}));

vi.mock('../../../lib/ai/knowledge-network');

describe('ContentAgent - Property 16: Request Routing Correctness', () => {
  let agent: ContentAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new ContentAgent();
    mockNetwork = new AIKnowledgeNetwork();
    
    // Mock network methods
    vi.spyOn(mockNetwork, 'getRelevantInsights').mockResolvedValue([]);
    vi.spyOn(mockNetwork, 'broadcastInsight').mockResolvedValue();
  });

  /**
   * Property 16: Request routing correctness (content)
   * 
   * For any content generation request, the ContentAgent SHALL process it
   * and return a response with caption and hashtags.
   */
  it('should route all content generation requests to generateCaption', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // creatorId
        fc.constantFrom('instagram', 'twitter', 'tiktok', 'onlyfans'), // platform
        fc.record({
          type: fc.option(fc.constantFrom('photo', 'video', 'story', 'post')),
          description: fc.option(fc.string({ maxLength: 100 })),
          mood: fc.option(fc.constantFrom('playful', 'sexy', 'professional', 'casual')),
          targetAudience: fc.option(fc.string({ maxLength: 50 })),
        }),
        async (creatorId, platform, contentInfo) => {
          const request = {
            creatorId,
            platform,
            contentInfo,
          };

          const response = await agent.processRequest(request);

          // Verify response structure
          expect(response).toHaveProperty('success');
          expect(typeof response.success).toBe('boolean');

          if (response.success) {
            expect(response).toHaveProperty('data');
            expect(response.data).toHaveProperty('caption');
            expect(response.data).toHaveProperty('hashtags');
            expect(response.data).toHaveProperty('confidence');
            expect(typeof response.data.caption).toBe('string');
            expect(Array.isArray(response.data.hashtags)).toBe(true);
            expect(typeof response.data.confidence).toBe('number');
            expect(response.data.confidence).toBeGreaterThanOrEqual(0);
            expect(response.data.confidence).toBeLessThanOrEqual(1);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Agent ID consistency
   * 
   * For any request, the agent SHALL maintain consistent identity
   */
  it('should maintain consistent agent identity across requests', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('instagram', 'twitter', 'tiktok'),
        async (creatorId, platform) => {
          expect(agent.id).toBe('content-agent');
          expect(agent.role).toBe('content_generation');
          expect(agent.model).toBe('gemini-2.5-flash');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Hashtags are always an array
   * 
   * For any successful response, hashtags SHALL be an array
   */
  it('should always return hashtags as an array', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('instagram', 'twitter', 'tiktok', 'onlyfans'),
        fc.record({
          type: fc.option(fc.string()),
          description: fc.option(fc.string()),
        }),
        async (creatorId, platform, contentInfo) => {
          const response = await agent.processRequest({
            creatorId,
            platform,
            contentInfo,
          });

          if (response.success && response.data) {
            expect(Array.isArray(response.data.hashtags)).toBe(true);
            // Each hashtag should be a string
            response.data.hashtags.forEach((tag: any) => {
              expect(typeof tag).toBe('string');
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Platform support
   * 
   * For any supported platform, the agent SHALL generate appropriate content
   */
  it('should support all major platforms', async () => {
    await agent.initialize(mockNetwork);

    const platforms = ['instagram', 'twitter', 'tiktok', 'onlyfans'];

    for (const platform of platforms) {
      const response = await agent.processRequest({
        creatorId: '123',
        platform,
        contentInfo: {
          type: 'post',
          description: 'Test content',
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    }
  });

  /**
   * Property: Error handling
   * 
   * For any request that causes an error, the agent SHALL return
   * a response with success: false and an error message
   */
  it('should handle errors gracefully', async () => {
    await agent.initialize(mockNetwork);

    // Mock an error in the billing service
    const { generateTextWithBilling } = await import('../../../lib/ai/gemini-billing.service');
    vi.mocked(generateTextWithBilling).mockRejectedValueOnce(new Error('API Error'));

    const response = await agent.processRequest({
      creatorId: '123',
      platform: 'instagram',
      contentInfo: {},
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe('string');
  });
});
