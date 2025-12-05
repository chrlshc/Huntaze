/**
 * Property tests for AITeamCoordinator fallback mechanism
 * 
 * **Feature: azure-foundry-production-rollout, Property 4: Fallback on failure**
 * **Validates: Requirements 3.7, 6.1**
 * 
 * Tests that when Foundry agent fails and fallback is enabled,
 * the system invokes the legacy agent and returns a valid response.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock dependencies before importing coordinator
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

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-correlation-id'),
}));

import { AITeamCoordinator } from '../../../lib/ai/coordinator';
import { AIProviderConfig } from '../../../lib/ai/config/provider-config';
import { FoundryAgentRegistry } from '../../../lib/ai/foundry/agent-registry';
import { CircuitBreakerRegistry } from '../../../lib/ai/foundry/circuit-breaker';

describe('AITeamCoordinator Fallback - Property Tests', () => {
  /**
   * **Feature: azure-foundry-production-rollout, Property 4: Fallback on failure**
   * **Validates: Requirements 3.7, 6.1**
   */
  
  beforeEach(() => {
    // Reset singletons
    AIProviderConfig.resetInstance();
    FoundryAgentRegistry.resetInstance();
    CircuitBreakerRegistry.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Arbitrary for error messages
  const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);

  // Arbitrary for request types
  const requestTypeArb = fc.constantFrom(
    'fan_message',
    'analyze_performance',
    'optimize_sales',
    'generate_caption'
  );

  // Arbitrary for creator IDs
  const creatorIdArb = fc.integer({ min: 1, max: 1000000 });

  // Arbitrary for fan IDs
  const fanIdArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => /^[a-zA-Z0-9_-]+$/.test(s));

  describe('Property 4: Fallback on failure', () => {
    it('should fallback to legacy when Foundry fails and fallback is enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorMessageArb,
          creatorIdArb,
          fanIdArb,
          async (errorMessage, creatorId, fanId) => {
            // Setup: Enable Foundry with fallback
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail
            const mockError = new Error(errorMessage);
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(mockError);
            
            // Execute
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId,
              message: 'Hello',
            });
            
            // Verify: Should succeed via fallback
            expect(result.success).toBe(true);
            expect(result.metadata?.fallbackUsed).toBe(true);
            expect(result.metadata?.fallbackReason).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return error when Foundry fails and fallback is disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorMessageArb,
          creatorIdArb,
          async (errorMessage, creatorId) => {
            // Setup: Enable Foundry without fallback
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'false';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail
            const mockError = new Error(errorMessage);
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(mockError);
            
            // Execute
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId: 'fan123',
              message: 'Hello',
            });
            
            // Verify: Should fail without fallback
            expect(result.success).toBe(false);
            expect(result.error).toContain(errorMessage);
            expect(result.metadata?.fallbackUsed).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve correlation ID through fallback', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorMessageArb,
          requestTypeArb,
          creatorIdArb,
          async (errorMessage, requestType, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error(errorMessage));
            
            // Execute - build request based on type
            const request = requestType === 'fan_message' 
              ? { type: 'fan_message' as const, creatorId, fanId: 'fan123', message: 'Test' }
              : requestType === 'analyze_performance'
              ? { type: 'analyze_performance' as const, creatorId, metrics: {} }
              : requestType === 'optimize_sales'
              ? { type: 'optimize_sales' as const, creatorId, fanId: 'fan123', context: {} }
              : { type: 'generate_caption' as const, creatorId, platform: 'onlyfans', contentInfo: { type: 'photo' } };
            
            const result = await coordinator.route(request);
            
            // Verify: Correlation ID should be present
            expect(result.metadata?.correlationId).toBeDefined();
            expect(typeof result.metadata?.correlationId).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle double failure (Foundry + Legacy)', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorMessageArb,
          errorMessageArb,
          creatorIdArb,
          async (foundryError, legacyError, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock both to fail
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error(foundryError));
            vi.spyOn(coordinator as any, 'routeToLegacy').mockRejectedValue(new Error(legacyError));
            
            // Execute
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId: 'fan123',
              message: 'Hello',
            });
            
            // Verify: Should fail with both errors mentioned
            expect(result.success).toBe(false);
            expect(result.error).toContain(foundryError);
            expect(result.error).toContain(legacyError);
            expect(result.metadata?.fallbackUsed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not invoke fallback when using legacy provider', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestTypeArb,
          creatorIdArb,
          async (requestType, creatorId) => {
            // Setup: Use legacy provider
            process.env.AI_PROVIDER = 'legacy';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Spy on handleFallback
            const fallbackSpy = vi.spyOn(coordinator as any, 'handleFallback');
            
            // Execute - build request based on type
            const request = requestType === 'fan_message' 
              ? { type: 'fan_message' as const, creatorId, fanId: 'fan123', message: 'Test' }
              : requestType === 'analyze_performance'
              ? { type: 'analyze_performance' as const, creatorId, metrics: {} }
              : requestType === 'optimize_sales'
              ? { type: 'optimize_sales' as const, creatorId, fanId: 'fan123', context: {} }
              : { type: 'generate_caption' as const, creatorId, platform: 'onlyfans', contentInfo: { type: 'photo' } };
            
            const result = await coordinator.route(request);
            
            // Verify: Fallback should not be called
            expect(fallbackSpy).not.toHaveBeenCalled();
            expect(result.metadata?.provider).toBe('legacy');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record fallback reason accurately', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorMessageArb,
          creatorIdArb,
          async (errorMessage, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail with specific error
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error(errorMessage));
            
            // Execute
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId: 'fan123',
              message: 'Hello',
            });
            
            // Verify: Fallback reason should match error
            if (result.success) {
              expect(result.metadata?.fallbackReason).toBe(errorMessage);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Fallback timing requirements', () => {
    it('should complete fallback within reasonable time', async () => {
      await fc.assert(
        fc.asyncProperty(
          creatorIdArb,
          async (creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail immediately
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error('Foundry unavailable'));
            
            // Execute and measure time
            const startTime = Date.now();
            const result = await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId: 'fan123',
              message: 'Hello',
            });
            const elapsed = Date.now() - startTime;
            
            // Verify: Should complete quickly (mocked, so < 1s)
            expect(elapsed).toBeLessThan(1000);
            expect(result.metadata?.latencyMs).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Fallback with different request types', () => {
    it('should fallback correctly for all request types', async () => {
      await fc.assert(
        fc.asyncProperty(
          requestTypeArb,
          creatorIdArb,
          async (requestType, creatorId) => {
            // Setup
            process.env.AI_PROVIDER = 'foundry';
            process.env.AI_FALLBACK_ENABLED = 'true';
            AIProviderConfig.resetInstance();
            
            const coordinator = new AITeamCoordinator();
            
            // Mock Foundry to fail
            vi.spyOn(coordinator as any, 'routeToFoundry').mockRejectedValue(new Error('Foundry error'));
            
            // Execute - build request based on type
            const request = requestType === 'fan_message' 
              ? { type: 'fan_message' as const, creatorId, fanId: 'fan123', message: 'Test message' }
              : requestType === 'analyze_performance'
              ? { type: 'analyze_performance' as const, creatorId, metrics: { views: 100 } }
              : requestType === 'optimize_sales'
              ? { type: 'optimize_sales' as const, creatorId, fanId: 'fan123', context: {} }
              : { type: 'generate_caption' as const, creatorId, platform: 'onlyfans', contentInfo: { type: 'photo' } };
            
            const result = await coordinator.route(request);
            
            // Verify: Should succeed via fallback for all types
            expect(result.success).toBe(true);
            expect(result.metadata?.fallbackUsed).toBe(true);
            expect(result.agentsInvolved.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
