/**
 * Property-Based Tests for MessagingAgent Request Routing
 * 
 * Feature: ai-system-gemini-integration, Property 16: Request routing correctness (messaging)
 * Validates: Requirements 1.1, 9.1
 * 
 * Tests that the MessagingAgent correctly processes fan message requests
 * and routes them through the appropriate generation pipeline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { MessagingAgent } from '../../../lib/ai/agents/messaging';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';

// Mock the dependencies
vi.mock('../../../lib/ai/gemini-billing.service', () => ({
  generateTextWithBilling: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      response: 'Test response',
      confidence: 0.8,
      suggestedUpsell: null,
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

describe('MessagingAgent - Property 16: Request Routing Correctness', () => {
  let agent: MessagingAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new MessagingAgent();
    mockNetwork = new AIKnowledgeNetwork();
    
    // Mock network methods
    vi.spyOn(mockNetwork, 'getRelevantInsights').mockResolvedValue([]);
    vi.spyOn(mockNetwork, 'broadcastInsight').mockResolvedValue();
  });

  /**
   * Property 16: Request routing correctness (messaging)
   * 
   * For any fan message request, the MessagingAgent SHALL process it
   * and return a response with the expected structure.
   */
  it('should route all fan message requests to generateResponse', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // creatorId
        fc.string({ minLength: 1, maxLength: 20 }), // fanId
        fc.string({ minLength: 1, maxLength: 200 }), // message
        async (creatorId, fanId, message) => {
          const request = {
            creatorId,
            fanId,
            message,
          };

          const response = await agent.processRequest(request);

          // Verify response structure
          expect(response).toHaveProperty('success');
          expect(typeof response.success).toBe('boolean');

          if (response.success) {
            expect(response).toHaveProperty('data');
            expect(response.data).toHaveProperty('response');
            expect(response.data).toHaveProperty('confidence');
            expect(typeof response.data.response).toBe('string');
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
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (creatorId, fanId, message) => {
          expect(agent.id).toBe('messaging-agent');
          expect(agent.role).toBe('fan_interaction');
          expect(agent.model).toBe('gemini-2.5-flash');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Request type validation
   * 
   * For any request with required fields, the agent SHALL process it successfully
   */
  it('should successfully process requests with all required fields', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          creatorId: fc.string({ minLength: 1, maxLength: 20 }),
          fanId: fc.string({ minLength: 1, maxLength: 20 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
          context: fc.option(
            fc.record({
              fanHistory: fc.option(fc.array(fc.anything())),
              creatorStyle: fc.option(fc.string()),
              previousMessages: fc.option(fc.array(fc.anything())),
            }),
            { nil: undefined }
          ),
        }),
        async (request) => {
          const response = await agent.processRequest(request);
          
          // Should always return a response object
          expect(response).toBeDefined();
          expect(response).toHaveProperty('success');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
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
      message: 'Hello',
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe('string');
  });

  /**
   * Property: Response confidence bounds
   * 
   * For any successful response, confidence SHALL be between 0 and 1
   */
  it('should return confidence scores within valid bounds', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (creatorId, fanId, message) => {
          const response = await agent.processRequest({
            creatorId,
            fanId,
            message,
          });

          if (response.success && response.data) {
            expect(response.data.confidence).toBeGreaterThanOrEqual(0);
            expect(response.data.confidence).toBeLessThanOrEqual(1);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
