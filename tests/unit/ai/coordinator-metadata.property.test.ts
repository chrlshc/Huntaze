/**
 * Property tests for AITeamCoordinator response metadata
 * 
 * **Feature: azure-foundry-production-rollout, Property 3: Response metadata completeness**
 * **Validates: Requirements 3.8, 5.1**
 * 
 * Tests that successful Foundry agent responses include
 * model name, deployment name, region, and cost.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock dependencies
vi.mock('../../../lib/ai/knowledge-network', () => ({
  AIKnowledgeNetwork: class MockAIKnowledgeNetwork {
    getInsights = vi.fn().mockResolvedValue([]);
    addInsight = vi.fn();
  },
}));

vi.mock('../../../lib/ai/agents/messaging', () => ({
  MessagingAgent: class MockMessagingAgent {
    initialize = vi.fn().mockResolvedValue(undefined);
    processRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { response: 'Legacy response', confidence: 0.9 },
    });
  },
}));

vi.mock('../../../lib/ai/agents/content', () => ({
  ContentAgent: class MockContentAgent {
    initialize = vi.fn().mockResolvedValue(undefined);
    processRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { caption: 'Test caption', hashtags: ['#test'] },
    });
  },
}));

vi.mock('../../../lib/ai/agents/analytics', () => ({
  AnalyticsAgent: class MockAnalyticsAgent {
    initialize = vi.fn().mockResolvedValue(undefined);
    processRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { insights: ['Test insight'] },
    });
  },
}));

vi.mock('../../../lib/ai/agents/sales', () => ({
  SalesAgent: class MockSalesAgent {
    initialize = vi.fn().mockResolvedValue(undefined);
    processRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { message: 'Sales message', tactics: ['upsell'] },
    });
  },
}));

import { AITeamCoordinator, ResponseMetadata, CoordinatorResponse } from '../../../lib/ai/coordinator';
import { AIProviderConfig } from '../../../lib/ai/config/provider-config';
import { FoundryAgentRegistry } from '../../../lib/ai/foundry/agent-registry';
import { CircuitBreakerRegistry } from '../../../lib/ai/foundry/circuit-breaker';

describe('AITeamCoordinator Response Metadata - Property Tests', () => {
  /**
   * **Feature: azure-foundry-production-rollout, Property 3: Response metadata completeness**
   * **Validates: Requirements 3.8, 5.1**
   */
  
  beforeEach(() => {
    AIProviderConfig.resetInstance();
    FoundryAgentRegistry.resetInstance();
    CircuitBreakerRegistry.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Arbitrary for model names
  const modelNameArb = fc.constantFrom(
    'deepseek-r1',
    'llama-3.3-70b',
    'mistral-large-2411',
    'phi-4-mini'
  );

  // Arbitrary for deployment names
  const deploymentNameArb = fc.string({ minLength: 5, maxLength: 30 })
    .filter(s => /^[a-zA-Z0-9-]+$/.test(s));

  // Arbitrary for regions
  const regionArb = fc.constantFrom(
    'eastus2',
    'westus2',
    'northeurope',
    'westeurope'
  );

  // Arbitrary for costs
  const costArb = fc.float({ min: Math.fround(0.0001), max: Math.fround(1.0), noNaN: true });

  // Arbitrary for token counts
  const tokenCountArb = fc.integer({ min: 1, max: 10000 });

  // Arbitrary for latency
  const latencyArb = fc.integer({ min: 10, max: 5000 });

  // Arbitrary for correlation IDs
  const correlationIdArb = fc.uuid();

  // Arbitrary for request types
  const requestTypeArb = fc.constantFrom(
    'fan_message',
    'analyze_performance',
    'optimize_sales',
    'generate_caption'
  );

  // Arbitrary for creator IDs
  const creatorIdArb = fc.integer({ min: 1, max: 1000000 });

  // Helper to build typed request
  const buildRequest = (requestType: string, creatorId: number) => {
    switch (requestType) {
      case 'fan_message':
        return { type: 'fan_message' as const, creatorId, fanId: 'fan123', message: 'Test' };
      case 'analyze_performance':
        return { type: 'analyze_performance' as const, creatorId, metrics: {} };
      case 'optimize_sales':
        return { type: 'optimize_sales' as const, creatorId, fanId: 'fan123', context: {} };
      default:
        return { type: 'generate_caption' as const, creatorId, platform: 'onlyfans', contentInfo: { type: 'photo' } };
    }
  };

  describe('Property 3: Response metadata completeness', () => {
    it('should include correlation ID in all responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestTypeArb,
          creatorIdArb,
          async (requestType, creatorId) => {
            // Setup: Use legacy provider for simplicity
            process.env.AI_PROVIDER = 'legacy';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Execute
            const result = await coordinator.route(buildRequest(requestType, creatorId));
            
            // Verify: Correlation ID must be present
            expect(result.metadata).toBeDefined();
            expect(result.metadata?.correlationId).toBeDefined();
            expect(typeof result.metadata?.correlationId).toBe('string');
            expect(result.metadata?.correlationId.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include provider in all responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('foundry', 'legacy'),
          requestTypeArb,
          creatorIdArb,
          async (provider, requestType, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = provider;
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail so we get legacy
            if (provider === 'foundry') {
              vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error('Mock error'));
            }
            
            // Execute
            const result = await coordinator.route(buildRequest(requestType, creatorId));
            
            // Verify: Provider must be present
            expect(result.metadata?.provider).toBeDefined();
            expect(['foundry', 'legacy']).toContain(result.metadata?.provider);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include latency in all responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestTypeArb,
          creatorIdArb,
          async (requestType, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'legacy';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Execute
            const result = await coordinator.route(buildRequest(requestType, creatorId));
            
            // Verify: Latency must be present and non-negative
            expect(result.metadata?.latencyMs).toBeDefined();
            expect(typeof result.metadata?.latencyMs).toBe('number');
            expect(result.metadata?.latencyMs).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include fallbackUsed flag in all responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestTypeArb,
          creatorIdArb,
          async (requestType, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'legacy';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Execute
            const result = await coordinator.route(buildRequest(requestType, creatorId));
            
            // Verify: fallbackUsed must be present
            expect(result.metadata?.fallbackUsed).toBeDefined();
            expect(typeof result.metadata?.fallbackUsed).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('enrichResponseMetadata function', () => {
    it('should enrich response with all provided metadata fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          correlationIdArb,
          modelNameArb,
          deploymentNameArb,
          regionArb,
          latencyArb,
          fc.boolean(),
          async (correlationId, model, deployment, region, latencyMs, fallbackUsed) => {
            const coordinator = new AITeamCoordinator();
            
            const baseResponse: CoordinatorResponse = {
              success: true,
              data: { response: 'Test' },
              agentsInvolved: ['test-agent'],
            };
            
            const metadata: Partial<ResponseMetadata> = {
              correlationId,
              provider: 'foundry',
              model,
              deployment,
              region,
              latencyMs,
              fallbackUsed,
            };
            
            // Execute
            const enriched = coordinator.enrichResponseMetadata(baseResponse, metadata);
            
            // Verify: All fields should be present
            expect(enriched.metadata?.correlationId).toBe(correlationId);
            expect(enriched.metadata?.provider).toBe('foundry');
            expect(enriched.metadata?.model).toBe(model);
            expect(enriched.metadata?.deployment).toBe(deployment);
            expect(enriched.metadata?.region).toBe(region);
            expect(enriched.metadata?.latencyMs).toBe(latencyMs);
            expect(enriched.metadata?.fallbackUsed).toBe(fallbackUsed);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve original response data when enriching', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          tokenCountArb,
          tokenCountArb,
          costArb,
          async (responseText, agents, inputTokens, outputTokens, cost) => {
            const coordinator = new AITeamCoordinator();
            
            const baseResponse: CoordinatorResponse = {
              success: true,
              data: { response: responseText },
              agentsInvolved: agents,
              usage: {
                totalInputTokens: inputTokens,
                totalOutputTokens: outputTokens,
                totalCostUsd: cost,
              },
            };
            
            // Execute
            const enriched = coordinator.enrichResponseMetadata(baseResponse, {
              correlationId: 'test-id',
              provider: 'legacy',
              latencyMs: 100,
              fallbackUsed: false,
            });
            
            // Verify: Original data preserved
            expect(enriched.success).toBe(true);
            expect(enriched.data?.response).toBe(responseText);
            expect(enriched.agentsInvolved).toEqual(agents);
            expect(enriched.usage?.totalInputTokens).toBe(inputTokens);
            expect(enriched.usage?.totalOutputTokens).toBe(outputTokens);
            expect(enriched.usage?.totalCostUsd).toBe(cost);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate correlation ID if not provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('foundry', 'legacy') as fc.Arbitrary<'foundry' | 'legacy'>,
          latencyArb,
          async (provider, latencyMs) => {
            const coordinator = new AITeamCoordinator();
            
            const baseResponse: CoordinatorResponse = {
              success: true,
              data: {},
              agentsInvolved: [],
            };
            
            // Execute without correlationId
            const enriched = coordinator.enrichResponseMetadata(baseResponse, {
              provider,
              latencyMs,
              fallbackUsed: false,
            });
            
            // Verify: Correlation ID should be generated
            expect(enriched.metadata?.correlationId).toBeDefined();
            expect(typeof enriched.metadata?.correlationId).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Metadata consistency', () => {
    it('should have consistent provider value based on actual routing', async () => {
      await fc.assert(
        fc.asyncProperty(
          creatorIdArb,
          async (creatorId) => {
            // Setup: Use legacy
            process.env.AI_PROVIDER = 'legacy';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Execute
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId: 'fan123',
              message: 'Hello',
            });
            
            // Verify: Provider should be legacy
            expect(result.metadata?.provider).toBe('legacy');
            expect(result.metadata?.fallbackUsed).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark fallbackUsed=true when fallback occurs', async () => {
      await fc.assert(
        fc.asyncProperty(
          creatorIdArb,
          async (creatorId) => {
            // Setup: Use Foundry with fallback
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error('Foundry error'));
            
            // Execute
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId: 'fan123',
              message: 'Hello',
            });
            
            // Verify: Fallback should be marked
            expect(result.metadata?.fallbackUsed).toBe(true);
            expect(result.metadata?.fallbackReason).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Usage statistics in metadata', () => {
    it('should include usage stats when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          tokenCountArb,
          tokenCountArb,
          costArb,
          async (inputTokens, outputTokens, cost) => {
            const coordinator = new AITeamCoordinator();
            
            const baseResponse: CoordinatorResponse = {
              success: true,
              data: {},
              agentsInvolved: ['test'],
              usage: {
                totalInputTokens: inputTokens,
                totalOutputTokens: outputTokens,
                totalCostUsd: cost,
                model: 'test-model',
                deployment: 'test-deployment',
                region: 'eastus2',
              },
            };
            
            const enriched = coordinator.enrichResponseMetadata(baseResponse, {
              correlationId: 'test',
              provider: 'foundry',
              latencyMs: 100,
              fallbackUsed: false,
            });
            
            // Verify: Model info should be in metadata
            expect(enriched.metadata?.model).toBe('test-model');
            expect(enriched.metadata?.deployment).toBe('test-deployment');
            expect(enriched.metadata?.region).toBe('eastus2');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
