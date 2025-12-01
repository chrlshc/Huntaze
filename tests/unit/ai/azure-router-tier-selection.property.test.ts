/**
 * Property Test: Tier-Based Model Selection
 * 
 * **Feature: huntaze-ai-azure-migration, Property 1: Tier-based model selection**
 * 
 * *For any* request classified with a specific tier (premium/standard/economy), 
 * the router should invoke the corresponding Azure OpenAI deployment with 
 * appropriate parameters matching that tier's configuration.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * This property test verifies that:
 * 1. Premium tier requests use GPT-4 Turbo deployment
 * 2. Standard tier requests use GPT-4 deployment
 * 3. Economy tier requests use GPT-3.5 Turbo deployment
 * 4. Plan restrictions are enforced (e.g., starter plan can only use economy)
 * 5. Tier downgrade happens when plan doesn't allow requested tier
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AzureOpenAIRouter, type ModelTier, type UserPlan } from '@/lib/ai/azure/azure-openai-router';
import { AZURE_OPENAI_CONFIG } from '@/lib/ai/azure/azure-openai.config';

// Mock Azure OpenAI Service to avoid actual API calls
vi.mock('@/lib/ai/azure/azure-openai.service', () => ({
  AzureOpenAIService: vi.fn().mockImplementation((deployment) => ({
    setDeployment: vi.fn(),
    chat: vi.fn().mockResolvedValue({
      text: 'Mock response',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      finishReason: 'stop',
      model: deployment || 'gpt-4-turbo-prod',
    }),
    chatStream: vi.fn().mockImplementation(async function* () {
      yield { content: 'Mock', finishReason: undefined };
      yield { content: ' stream', finishReason: 'stop' };
    }),
  })),
}));

describe('Property 1: Tier-Based Model Selection', () => {
  let router: AzureOpenAIRouter;

  beforeEach(() => {
    router = new AzureOpenAIRouter();
  });

  it('should route premium tier to GPT-4 Turbo deployment', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }), // prompt
        fc.record({
          temperature: fc.double({ min: 0, max: 2 }),
          maxTokens: fc.integer({ min: 1, max: 4000 }),
        }), // options
        async (prompt, options) => {
          const response = await router.generateText(prompt, {
            ...options,
            tier: 'premium',
          });

          // Verify premium tier uses GPT-4 Turbo
          expect(response.tier).toBe('premium');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.premium);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should route standard tier to GPT-4 deployment', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          temperature: fc.double({ min: 0, max: 2 }),
          maxTokens: fc.integer({ min: 1, max: 4000 }),
        }),
        async (prompt, options) => {
          const response = await router.generateText(prompt, {
            ...options,
            tier: 'standard',
          });

          // Verify standard tier uses GPT-4
          expect(response.tier).toBe('standard');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.standard);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should route economy tier to GPT-3.5 Turbo deployment', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          temperature: fc.double({ min: 0, max: 2 }),
          maxTokens: fc.integer({ min: 1, max: 2000 }),
        }),
        async (prompt, options) => {
          const response = await router.generateText(prompt, {
            ...options,
            tier: 'economy',
          });

          // Verify economy tier uses GPT-3.5 Turbo
          expect(response.tier).toBe('economy');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.economy);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce plan restrictions on tier selection', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom<UserPlan>('starter', 'pro', 'scale', 'enterprise'),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        async (prompt, plan, requestedTier) => {
          const response = await router.generateText(prompt, {
            tier: requestedTier,
            plan,
          });

          // Verify tier respects plan restrictions
          const allowedTiers = router.getAvailableTiers(plan);
          expect(allowedTiers).toContain(response.tier);

          // Starter plan should always get economy
          if (plan === 'starter') {
            expect(response.tier).toBe('economy');
          }

          // Pro plan should never get premium
          if (plan === 'pro' && requestedTier === 'premium') {
            expect(response.tier).not.toBe('premium');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should downgrade tier when plan does not allow requested tier', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          // Starter plan requesting premium should get economy
          const response = await router.generateText(prompt, {
            tier: 'premium',
            plan: 'starter',
          });

          expect(response.tier).toBe('economy');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.economy);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle chat messages with tier-based routing', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom('system', 'user', 'assistant'),
            content: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        async (messages, tier) => {
          const response = await router.chat(
            messages as any,
            { tier }
          );

          // Verify correct tier and deployment
          expect(response.tier).toBe(tier);
          expect(response.deployment).toBe(router.getDeploymentForTier(tier));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate cost based on deployment and usage', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        async (prompt, tier) => {
          const response = await router.generateText(prompt, { tier });

          // Verify cost is calculated
          expect(response.cost).toBeGreaterThanOrEqual(0);
          expect(typeof response.cost).toBe('number');

          // Cost should be based on token usage
          if (response.usage.totalTokens > 0) {
            expect(response.cost).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should default to economy tier when no tier specified', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          const response = await router.generateText(prompt, {});

          // Should default to economy
          expect(response.tier).toBe('economy');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.economy);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include region information in response', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        async (prompt, tier) => {
          const response = await router.generateText(prompt, { tier });

          // Verify region is included
          expect(response.region).toBeDefined();
          expect(typeof response.region).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain tier consistency across multiple requests', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        fc.constantFrom<UserPlan>('starter', 'pro', 'scale', 'enterprise'),
        async (prompts, tier, plan) => {
          const responses = await Promise.all(
            prompts.map(prompt => router.generateText(prompt, { tier, plan }))
          );

          // All responses should have the same tier (after plan enforcement)
          const tiers = responses.map(r => r.tier);
          const uniqueTiers = new Set(tiers);
          expect(uniqueTiers.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
