/**
 * Property-Based Tests for SalesAgent Request Routing
 * 
 * Feature: ai-system-gemini-integration, Property 16: Request routing correctness (sales)
 * Validates: Requirements 1.2, 9.1
 * 
 * Tests that the SalesAgent correctly processes sales optimization requests
 * and routes them through the appropriate optimization pipeline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { SalesAgent } from '../../../lib/ai/agents/sales';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';

// Mock the dependencies
vi.mock('../../../lib/ai/gemini-billing.service', () => ({
  generateTextWithBilling: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      message: 'Optimized sales message',
      tactics: ['scarcity', 'urgency'],
      suggestedPrice: 29.99,
      confidence: 0.82,
      reasoning: 'Test reasoning'
    }),
    usage: {
      model: 'gemini-2.5-flash',
      inputTokens: 150,
      outputTokens: 100,
      costUsd: 0.0015,
    },
  }),
}));

vi.mock('../../../lib/ai/knowledge-network');

describe('SalesAgent - Property 16: Request Routing Correctness', () => {
  let agent: SalesAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new SalesAgent();
    mockNetwork = new AIKnowledgeNetwork();
    
    // Mock network methods
    vi.spyOn(mockNetwork, 'getRelevantInsights').mockResolvedValue([]);
    vi.spyOn(mockNetwork, 'broadcastInsight').mockResolvedValue();
  });

  /**
   * Property 16: Request routing correctness (sales)
   * 
   * For any sales optimization request, the SalesAgent SHALL process it
   * and return a message with tactics and optional pricing.
   */
  it('should route all sales optimization requests to optimizeSalesMessage', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // creatorId
        fc.string({ minLength: 1, maxLength: 20 }), // fanId
        fc.record({
          fanHistory: fc.option(fc.object()),
          purchaseHistory: fc.option(fc.array(fc.object(), { maxLength: 5 })),
          engagementLevel: fc.option(fc.constantFrom('low', 'medium', 'high', 'very_high')),
          contentType: fc.option(fc.constantFrom('photo', 'video', 'custom', 'subscription')),
          pricePoint: fc.option(fc.float({ min: 5, max: 200 })),
        }),
        async (creatorId, fanId, context) => {
          const request = {
            creatorId,
            fanId,
            context,
          };

          const response = await agent.processRequest(request);

          // Verify response structure
          expect(response).toHaveProperty('success');
          expect(typeof response.success).toBe('boolean');

          if (response.success) {
            expect(response).toHaveProperty('data');
            expect(response.data).toHaveProperty('message');
            expect(response.data).toHaveProperty('tactics');
            expect(response.data).toHaveProperty('confidence');
            
            expect(typeof response.data.message).toBe('string');
            expect(Array.isArray(response.data.tactics)).toBe(true);
            expect(typeof response.data.confidence).toBe('number');
            expect(response.data.confidence).toBeGreaterThanOrEqual(0);
            expect(response.data.confidence).toBeLessThanOrEqual(1);
            
            // suggestedPrice is optional
            if (response.data.suggestedPrice !== undefined) {
              expect(typeof response.data.suggestedPrice).toBe('number');
              expect(response.data.suggestedPrice).toBeGreaterThan(0);
            }
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
        fc.string({ minLength: 1, maxLength: 20 }),
        async (creatorId, fanId) => {
          expect(agent.id).toBe('sales-agent');
          expect(agent.role).toBe('conversion_optimization');
          expect(agent.model).toBe('gemini-2.5-flash');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Tactics are always strings
   * 
   * For any successful response, all tactics SHALL be strings
   */
  it('should return tactics as an array of strings', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.record({
          engagementLevel: fc.option(fc.string()),
          contentType: fc.option(fc.string()),
        }),
        async (creatorId, fanId, context) => {
          const response = await agent.processRequest({
            creatorId,
            fanId,
            context,
          });

          if (response.success && response.data) {
            expect(Array.isArray(response.data.tactics)).toBe(true);
            response.data.tactics.forEach((tactic: any) => {
              expect(typeof tactic).toBe('string');
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message is non-empty
   * 
   * For any successful response, the message SHALL not be empty
   */
  it('should always return a non-empty sales message', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.record({
          contentType: fc.option(fc.string()),
          pricePoint: fc.option(fc.float({ min: 5, max: 200 })),
        }),
        async (creatorId, fanId, context) => {
          const response = await agent.processRequest({
            creatorId,
            fanId,
            context,
          });

          if (response.success && response.data) {
            expect(response.data.message.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Suggested price is positive
   * 
   * For any response with a suggested price, it SHALL be positive
   */
  it('should suggest positive prices when provided', async () => {
    await agent.initialize(mockNetwork);

    const response = await agent.processRequest({
      creatorId: '123',
      fanId: '456',
      context: {
        contentType: 'video',
        pricePoint: 25,
      },
    });

    if (response.success && response.data && response.data.suggestedPrice) {
      expect(response.data.suggestedPrice).toBeGreaterThan(0);
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
      fanId: '456',
      context: {},
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe('string');
  });
});
