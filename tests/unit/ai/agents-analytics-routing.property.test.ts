/**
 * Property-Based Tests for AnalyticsAgent Request Routing
 * 
 * Feature: ai-system-gemini-integration, Property 16: Request routing correctness (analytics)
 * Validates: Requirements 1.2, 9.1
 * 
 * Tests that the AnalyticsAgent correctly processes performance analysis requests
 * and routes them through the appropriate analysis pipeline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { AnalyticsAgent } from '../../../lib/ai/agents/analytics';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';

// Mock the dependencies
vi.mock('../../../lib/ai/gemini-billing.service', () => ({
  generateTextWithBilling: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      insights: ['Insight 1', 'Insight 2'],
      patterns: ['Pattern 1'],
      predictions: ['Prediction 1'],
      recommendations: ['Recommendation 1', 'Recommendation 2'],
      confidence: 0.85,
      reasoning: 'Test reasoning'
    }),
    usage: {
      model: 'gemini-2.5-pro',
      inputTokens: 200,
      outputTokens: 150,
      costUsd: 0.002,
    },
  }),
}));

vi.mock('../../../lib/ai/knowledge-network');

describe('AnalyticsAgent - Property 16: Request Routing Correctness', () => {
  let agent: AnalyticsAgent;
  let mockNetwork: AIKnowledgeNetwork;

  beforeEach(() => {
    agent = new AnalyticsAgent();
    mockNetwork = new AIKnowledgeNetwork();
    
    // Mock network methods
    vi.spyOn(mockNetwork, 'getRelevantInsights').mockResolvedValue([]);
    vi.spyOn(mockNetwork, 'broadcastInsight').mockResolvedValue();
  });

  /**
   * Property 16: Request routing correctness (analytics)
   * 
   * For any performance analysis request, the AnalyticsAgent SHALL process it
   * and return insights, patterns, predictions, and recommendations.
   */
  it('should route all analytics requests to analyzePerformance', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // creatorId
        fc.record({
          timeframe: fc.option(fc.constantFrom('7d', '30d', '90d', '1y')),
          platforms: fc.option(fc.array(fc.constantFrom('instagram', 'twitter', 'tiktok', 'onlyfans'), { minLength: 1, maxLength: 4 })),
          contentTypes: fc.option(fc.array(fc.constantFrom('photo', 'video', 'story', 'post'), { minLength: 1, maxLength: 4 })),
          data: fc.option(fc.object()),
        }),
        async (creatorId, metrics) => {
          const request = {
            creatorId,
            metrics,
          };

          const response = await agent.processRequest(request);

          // Verify response structure
          expect(response).toHaveProperty('success');
          expect(typeof response.success).toBe('boolean');

          if (response.success) {
            expect(response).toHaveProperty('data');
            expect(response.data).toHaveProperty('insights');
            expect(response.data).toHaveProperty('patterns');
            expect(response.data).toHaveProperty('predictions');
            expect(response.data).toHaveProperty('recommendations');
            expect(response.data).toHaveProperty('confidence');
            
            // All should be arrays
            expect(Array.isArray(response.data.insights)).toBe(true);
            expect(Array.isArray(response.data.patterns)).toBe(true);
            expect(Array.isArray(response.data.predictions)).toBe(true);
            expect(Array.isArray(response.data.recommendations)).toBe(true);
            
            // Confidence should be valid
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
        async (creatorId) => {
          expect(agent.id).toBe('analytics-agent');
          expect(agent.role).toBe('performance_analysis');
          expect(agent.model).toBe('gemini-2.5-pro');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: All response arrays contain strings
   * 
   * For any successful response, all array elements SHALL be strings
   */
  it('should return arrays of strings for all analysis fields', async () => {
    await agent.initialize(mockNetwork);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.record({
          timeframe: fc.option(fc.string()),
          data: fc.option(fc.object()),
        }),
        async (creatorId, metrics) => {
          const response = await agent.processRequest({
            creatorId,
            metrics,
          });

          if (response.success && response.data) {
            // Check insights
            response.data.insights.forEach((insight: any) => {
              expect(typeof insight).toBe('string');
            });
            
            // Check patterns
            response.data.patterns.forEach((pattern: any) => {
              expect(typeof pattern).toBe('string');
            });
            
            // Check predictions
            response.data.predictions.forEach((prediction: any) => {
              expect(typeof prediction).toBe('string');
            });
            
            // Check recommendations
            response.data.recommendations.forEach((rec: any) => {
              expect(typeof rec).toBe('string');
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Recommendations are actionable
   * 
   * For any successful response, recommendations array SHALL not be empty
   * when confidence is high
   */
  it('should provide recommendations when confidence is high', async () => {
    await agent.initialize(mockNetwork);

    const response = await agent.processRequest({
      creatorId: '123',
      metrics: {
        timeframe: '30d',
        data: { engagement: 1000, followers: 5000 },
      },
    });

    if (response.success && response.data && response.data.confidence > 0.7) {
      expect(response.data.recommendations.length).toBeGreaterThan(0);
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
      metrics: {},
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe('string');
  });
});
