/**
 * Property-based tests for Azure AI Foundry mapping utilities
 * 
 * Tests the correctness properties for plan-to-tier mapping,
 * agent type hint mapping, and French language detection.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  planToTier,
  agentTypeHint,
  detectFrenchLanguage,
  type UserPlan,
  type AgentType,
  type ClientTier,
  type TypeHint,
} from '../../../../lib/ai/foundry/mapping';

describe('Mapping Property Tests', () => {
  /**
   * **Feature: azure-foundry-agents-integration, Property 4: Plan to tier mapping**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * *For any* user plan, the system SHALL map to the correct client tier:
   * enterprise/scale→"vip", pro/starter/undefined→"standard".
   */
  describe('Property 4: Plan to tier mapping', () => {
    it('should map enterprise and scale plans to vip tier', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('enterprise', 'scale') as fc.Arbitrary<UserPlan>,
          (plan) => {
            const tier = planToTier(plan);
            expect(tier).toBe('vip');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map pro and starter plans to standard tier', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('pro', 'starter') as fc.Arbitrary<UserPlan>,
          (plan) => {
            const tier = planToTier(plan);
            expect(tier).toBe('standard');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map undefined and null plans to standard tier', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, null) as fc.Arbitrary<UserPlan>,
          (plan) => {
            const tier = planToTier(plan);
            expect(tier).toBe('standard');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a valid tier for any plan', () => {
      const validPlans: UserPlan[] = ['enterprise', 'scale', 'pro', 'starter', undefined, null];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validPlans),
          (plan) => {
            const tier = planToTier(plan);
            expect(['standard', 'vip']).toContain(tier);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same plan always returns same tier', () => {
      const validPlans: UserPlan[] = ['enterprise', 'scale', 'pro', 'starter', undefined, null];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validPlans),
          (plan) => {
            const tier1 = planToTier(plan);
            const tier2 = planToTier(plan);
            expect(tier1).toBe(tier2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: azure-foundry-agents-integration, Property 3: Agent type hint mapping**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   * 
   * *For any* agent type, the system SHALL map to the correct type hint:
   * MessagingAgent→"chat", AnalyticsAgent→"math", SalesAgent→"creative", ComplianceAgent→"chat".
   */
  describe('Property 3: Agent type hint mapping', () => {
    const expectedMappings: Record<AgentType, TypeHint> = {
      messaging: 'chat',
      analytics: 'math',
      sales: 'creative',
      compliance: 'chat',
    };

    it('should map each agent type to its correct type hint', () => {
      const agentTypes: AgentType[] = ['messaging', 'analytics', 'sales', 'compliance'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...agentTypes),
          (agentType) => {
            const hint = agentTypeHint(agentType);
            expect(hint).toBe(expectedMappings[agentType]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map messaging agent to chat hint', () => {
      fc.assert(
        fc.property(
          fc.constant('messaging' as AgentType),
          (agentType) => {
            expect(agentTypeHint(agentType)).toBe('chat');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map analytics agent to math hint', () => {
      fc.assert(
        fc.property(
          fc.constant('analytics' as AgentType),
          (agentType) => {
            expect(agentTypeHint(agentType)).toBe('math');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map sales agent to creative hint', () => {
      fc.assert(
        fc.property(
          fc.constant('sales' as AgentType),
          (agentType) => {
            expect(agentTypeHint(agentType)).toBe('creative');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map compliance agent to chat hint', () => {
      fc.assert(
        fc.property(
          fc.constant('compliance' as AgentType),
          (agentType) => {
            expect(agentTypeHint(agentType)).toBe('chat');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a valid type hint', () => {
      const agentTypes: AgentType[] = ['messaging', 'analytics', 'sales', 'compliance'];
      const validHints: TypeHint[] = ['math', 'coding', 'creative', 'chat'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...agentTypes),
          (agentType) => {
            const hint = agentTypeHint(agentType);
            expect(validHints).toContain(hint);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same agent always returns same hint', () => {
      const agentTypes: AgentType[] = ['messaging', 'analytics', 'sales', 'compliance'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...agentTypes),
          (agentType) => {
            const hint1 = agentTypeHint(agentType);
            const hint2 = agentTypeHint(agentType);
            expect(hint1).toBe(hint2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: azure-foundry-agents-integration, Property 9: French language detection**
   * **Validates: Requirements 2.5**
   * 
   * *For any* prompt containing French text (detected by common French words or patterns),
   * the system SHALL include language_hint "fr" in the router request.
   */
  describe('Property 9: French language detection', () => {
    // French text samples with common French words
    const frenchTexts = [
      'Bonjour, comment allez-vous?',
      'Je suis très content de vous voir',
      'Merci beaucoup pour votre aide',
      'C\'est une belle journée aujourd\'hui',
      'Nous sommes dans la maison',
      'Il fait beau dehors',
      'Elle est très gentille',
      'Qu\'est-ce que vous faites?',
      'Je voudrais un café s\'il vous plaît',
      'Les enfants jouent dans le jardin',
    ];

    // Non-French text samples
    const nonFrenchTexts = [
      'Hello, how are you?',
      'This is a test message',
      'The quick brown fox jumps',
      'Good morning everyone',
      'I love programming',
      'Testing the system',
      'Random words here',
      'Simple English text',
    ];

    it('should detect French in texts with multiple French indicators', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...frenchTexts),
          (text) => {
            const result = detectFrenchLanguage(text);
            expect(result).toBe('fr');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect French in pure English texts', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...nonFrenchTexts),
          (text) => {
            const result = detectFrenchLanguage(text);
            expect(result).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return undefined for empty or invalid input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', null, undefined) as fc.Arbitrary<string | null | undefined>,
          (text) => {
            // @ts-expect-error - testing invalid input
            const result = detectFrenchLanguage(text);
            expect(result).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect French when text contains French special characters', () => {
      const textsWithFrenchChars = [
        'Café et croissant',
        'Être ou ne pas être',
        'Ça va très bien',
        'Où est la bibliothèque?',
        'Naïve et élégant',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...textsWithFrenchChars),
          (text) => {
            const result = detectFrenchLanguage(text);
            expect(result).toBe('fr');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same text always returns same result', () => {
      const allTexts = [...frenchTexts, ...nonFrenchTexts];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allTexts),
          (text) => {
            const result1 = detectFrenchLanguage(text);
            const result2 = detectFrenchLanguage(text);
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only return "fr" or undefined', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (text) => {
            const result = detectFrenchLanguage(text);
            expect([undefined, 'fr']).toContain(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect French in mixed language text with sufficient French content', () => {
      const mixedTexts = [
        'Hello, je suis content de vous voir today',
        'This is très important pour nous',
        'We need to faire attention à cela',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...mixedTexts),
          (text) => {
            const result = detectFrenchLanguage(text);
            expect(result).toBe('fr');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Combined property: Mapping functions are pure and side-effect free
   */
  describe('Purity properties', () => {
    it('planToTier should be a pure function', () => {
      const plans: UserPlan[] = ['enterprise', 'scale', 'pro', 'starter', undefined, null];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...plans),
          fc.integer({ min: 1, max: 10 }),
          (plan, iterations) => {
            const results: ClientTier[] = [];
            for (let i = 0; i < iterations; i++) {
              results.push(planToTier(plan));
            }
            // All results should be identical
            expect(new Set(results).size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('agentTypeHint should be a pure function', () => {
      const agents: AgentType[] = ['messaging', 'analytics', 'sales', 'compliance'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...agents),
          fc.integer({ min: 1, max: 10 }),
          (agent, iterations) => {
            const results: TypeHint[] = [];
            for (let i = 0; i < iterations; i++) {
              results.push(agentTypeHint(agent));
            }
            // All results should be identical
            expect(new Set(results).size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
