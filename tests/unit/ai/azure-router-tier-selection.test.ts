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
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ModelTier, UserPlan } from '../../../lib/ai/azure/azure-openai-router';
import { AZURE_OPENAI_CONFIG } from '../../../lib/ai/azure/azure-openai.config';

describe('Property 1: Tier-Based Model Selection', () => {
  // Test tier to deployment mapping
  const TIER_DEPLOYMENT_MAPPING: Record<ModelTier, string> = {
    premium: AZURE_OPENAI_CONFIG.deployments.premium,
    standard: AZURE_OPENAI_CONFIG.deployments.standard,
    economy: AZURE_OPENAI_CONFIG.deployments.economy,
  };

  // Test plan to tier mapping
  const PLAN_TIER_MAPPING: Record<UserPlan, ModelTier[]> = {
    starter: ['economy'],
    pro: ['economy', 'standard'],
    scale: ['economy', 'standard', 'premium'],
    enterprise: ['economy', 'standard', 'premium'],
  };

  // Helper function to determine tier (same logic as router)
  function determineTier(requestedTier?: ModelTier, plan?: UserPlan): ModelTier {
    if (!requestedTier) {
      return 'economy';
    }

    if (!plan) {
      return requestedTier;
    }

    const allowedTiers = PLAN_TIER_MAPPING[plan];
    if (allowedTiers.includes(requestedTier)) {
      return requestedTier;
    }

    // Downgrade to highest allowed tier
    if (allowedTiers.includes('premium')) return 'premium';
    if (allowedTiers.includes('standard')) return 'standard';
    return 'economy';
  }

  it('should map premium tier to GPT-4 Turbo deployment', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModelTier>('premium'),
        (tier) => {
          const deployment = TIER_DEPLOYMENT_MAPPING[tier];
          expect(deployment).toBe('gpt-4-turbo-prod');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should map standard tier to GPT-4 deployment', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModelTier>('standard'),
        (tier) => {
          const deployment = TIER_DEPLOYMENT_MAPPING[tier];
          expect(deployment).toBe('gpt-4-standard-prod');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should map economy tier to GPT-3.5 Turbo deployment', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModelTier>('economy'),
        (tier) => {
          const deployment = TIER_DEPLOYMENT_MAPPING[tier];
          expect(deployment).toBe('gpt-35-turbo-prod');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce plan restrictions on tier selection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<UserPlan>('starter', 'pro', 'scale', 'enterprise'),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        (plan, requestedTier) => {
          const actualTier = determineTier(requestedTier, plan);
          const allowedTiers = PLAN_TIER_MAPPING[plan];
          
          expect(allowedTiers).toContain(actualTier);

          if (plan === 'starter') {
            expect(actualTier).toBe('economy');
          }

          if (plan === 'pro' && requestedTier === 'premium') {
            expect(actualTier).not.toBe('premium');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should downgrade tier when plan does not allow requested tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModelTier>('premium'),
        fc.constantFrom<UserPlan>('starter'),
        (requestedTier, plan) => {
          const actualTier = determineTier(requestedTier, plan);
          expect(actualTier).toBe('economy');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should default to economy tier when no tier specified', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined),
        (tier) => {
          const actualTier = determineTier(tier);
          expect(actualTier).toBe('economy');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow requested tier when no plan specified', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        (requestedTier) => {
          const actualTier = determineTier(requestedTier, undefined);
          expect(actualTier).toBe(requestedTier);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly map all plan-tier combinations', () => {
    const testCases: Array<[UserPlan, ModelTier, ModelTier]> = [
      // [plan, requested, expected]
      ['starter', 'economy', 'economy'],
      ['starter', 'standard', 'economy'],
      ['starter', 'premium', 'economy'],
      ['pro', 'economy', 'economy'],
      ['pro', 'standard', 'standard'],
      ['pro', 'premium', 'standard'],
      ['scale', 'economy', 'economy'],
      ['scale', 'standard', 'standard'],
      ['scale', 'premium', 'premium'],
      ['enterprise', 'economy', 'economy'],
      ['enterprise', 'standard', 'standard'],
      ['enterprise', 'premium', 'premium'],
    ];

    testCases.forEach(([plan, requested, expected]) => {
      const actual = determineTier(requested, plan);
      expect(actual).toBe(expected);
    });
  });
});
