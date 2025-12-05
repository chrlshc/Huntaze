/**
 * Property-based tests for FoundryMessagingAgent
 * 
 * Feature: azure-foundry-agents-integration, Property 6: Interface compatibility
 * Validates: Requirements 5.1, 5.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { FoundryMessagingAgent, MessagingRequest } from '../../../../lib/ai/agents/messaging.foundry';
import { RouterClient, RouterResponse } from '../../../../lib/ai/foundry/router-client';

// Mock the cost tracking service
vi.mock('../../../../lib/ai/azure/cost-tracking.service', () => ({
  getCostTrackingService: () => ({
    checkQuota: vi.fn().mockResolvedValue({ allowed: true, remaining: 1000, limit: 1000 }),
    logUsage: vi.fn().mockResolvedValue(undefined),
  }),
}));

// =============================================================================
// Arbitraries
// =============================================================================

/**
 * Generate valid MessagingRequest objects
 */
const messagingRequestArb = fc.record({
  creatorId: fc.integer({ min: 1, max: 1000000 }),
  fanId: fc.string({ minLength: 1, maxLength: 50 }),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  accountId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  plan: fc.option(
    fc.constantFrom('enterprise', 'scale', 'pro', 'starter', undefined),
    { nil: undefined }
  ),
});

/**
 * Generate valid JSON response strings from the model
 */
const validJsonResponseArb = fc.record({
  response: fc.string({ minLength: 1, maxLength: 500 }),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
  suggestedUpsell: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  reasoning: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
}).map(obj => JSON.stringify(obj));

/**
 * Generate valid RouterResponse objects
 */
const routerResponseArb = (output: string): fc.Arbitrary<RouterResponse> => fc.record({
  model: fc.constantFrom('Llama-3.3-70B', 'DeepSeek-R1', 'Mistral-Large-2411'),
  deployment: fc.string({ minLength: 1, maxLength: 50 }),
  region: fc.constantFrom('eastus2', 'westeurope', 'francecentral'),
  routing: fc.record({
    type: fc.constantFrom('chat', 'math', 'creative', 'coding'),
    complexity: fc.constantFrom('simple', 'medium', 'complex'),
    language: fc.constantFrom('en', 'fr', 'other'),
    client_tier: fc.constantFrom('standard', 'vip'),
  }),
  output: fc.constant(output),
  usage: fc.option(
    fc.record({
      prompt_tokens: fc.integer({ min: 1, max: 10000 }),
      completion_tokens: fc.integer({ min: 1, max: 5000 }),
      total_tokens: fc.integer({ min: 2, max: 15000 }),
    }),
    { nil: undefined }
  ),
});

// =============================================================================
// Property Tests
// =============================================================================

describe('FoundryMessagingAgent Property Tests', () => {
  /**
   * **Feature: azure-foundry-agents-integration, Property 6: Interface compatibility**
   * **Validates: Requirements 5.1, 5.2**
   * 
   * For any agent processRequest call, the response SHALL contain success (boolean),
   * and if successful, data with the agent-specific structure and usage with
   * model/inputTokens/outputTokens/costUsd.
   */
  describe('Property 6: Interface compatibility', () => {
    it('response contains success boolean and proper structure on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          messagingRequestArb,
          validJsonResponseArb,
          async (request, jsonOutput) => {
            // Create mock router client
            const mockRouterClient = {
              route: vi.fn(),
              routeStream: vi.fn(),
              healthCheck: vi.fn(),
            } as unknown as RouterClient;

            // Generate a valid router response
            const routerResponse = await fc.sample(routerResponseArb(jsonOutput), 1)[0];
            (mockRouterClient.route as ReturnType<typeof vi.fn>).mockResolvedValue(routerResponse);

            // Create agent with mock client
            const agent = new FoundryMessagingAgent(mockRouterClient);

            // Process request
            const response = await agent.processRequest(request);

            // Property: response must have success boolean
            expect(typeof response.success).toBe('boolean');

            if (response.success) {
              // Property: successful response must have data
              expect(response.data).toBeDefined();
              
              // Property: data must have response string
              expect(typeof response.data.response).toBe('string');
              
              // Property: data must have confidence number
              expect(typeof response.data.confidence).toBe('number');
              expect(response.data.confidence).toBeGreaterThanOrEqual(0);
              expect(response.data.confidence).toBeLessThanOrEqual(1);

              // Property: usage must be present with required fields
              expect(response.usage).toBeDefined();
              expect(typeof response.usage!.model).toBe('string');
              expect(typeof response.usage!.inputTokens).toBe('number');
              expect(typeof response.usage!.outputTokens).toBe('number');
              expect(typeof response.usage!.costUsd).toBe('number');
              expect(response.usage!.costUsd).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('response contains error string on failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          messagingRequestArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          async (request, errorMessage) => {
            // Create mock router client that throws
            const mockRouterClient = {
              route: vi.fn().mockRejectedValue(new Error(errorMessage)),
              routeStream: vi.fn(),
              healthCheck: vi.fn(),
            } as unknown as RouterClient;

            // Create agent with mock client
            const agent = new FoundryMessagingAgent(mockRouterClient);

            // Process request
            const response = await agent.processRequest(request);

            // Property: response must have success = false
            expect(response.success).toBe(false);

            // Property: failed response must have error string
            expect(typeof response.error).toBe('string');
            expect(response.error!.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Usage statistics are correctly calculated
   */
  describe('Usage statistics calculation', () => {
    it('cost is calculated correctly based on model and tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          messagingRequestArb,
          validJsonResponseArb,
          fc.integer({ min: 100, max: 5000 }),
          fc.integer({ min: 50, max: 2000 }),
          async (request, jsonOutput, promptTokens, completionTokens) => {
            // Create mock router client
            const mockRouterClient = {
              route: vi.fn(),
              routeStream: vi.fn(),
              healthCheck: vi.fn(),
            } as unknown as RouterClient;

            const routerResponse: RouterResponse = {
              model: 'Llama-3.3-70B',
              deployment: 'llama33-70b-us',
              region: 'eastus2',
              routing: {
                type: 'chat',
                complexity: 'medium',
                language: 'en',
                client_tier: 'standard',
              },
              output: jsonOutput,
              usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens,
              },
            };

            (mockRouterClient.route as ReturnType<typeof vi.fn>).mockResolvedValue(routerResponse);

            const agent = new FoundryMessagingAgent(mockRouterClient);
            const response = await agent.processRequest(request);

            if (response.success && response.usage) {
              // Property: inputTokens matches prompt_tokens
              expect(response.usage.inputTokens).toBe(promptTokens);
              
              // Property: outputTokens matches completion_tokens
              expect(response.usage.outputTokens).toBe(completionTokens);
              
              // Property: cost is positive when tokens are used
              expect(response.usage.costUsd).toBeGreaterThan(0);
              
              // Property: cost calculation is correct for Llama-3.3-70B
              // Pricing: $0.00099 per 1K tokens for both input and output
              const expectedCost = 
                (promptTokens / 1000) * 0.00099 + 
                (completionTokens / 1000) * 0.00099;
              expect(response.usage.costUsd).toBeCloseTo(expectedCost, 6);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
