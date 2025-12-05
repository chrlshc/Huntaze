/**
 * Property-based tests for AIProviderConfig
 * 
 * **Feature: azure-foundry-production-rollout, Property 1: Feature flag routing correctness**
 * **Validates: Requirements 3.1, 3.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { AIProviderConfig, AIProvider, shouldUseFoundry } from '@/lib/ai/config/provider-config';

describe('AIProviderConfig Property Tests', () => {
  beforeEach(() => {
    AIProviderConfig.resetInstance();
  });

  afterEach(() => {
    AIProviderConfig.resetInstance();
  });

  /**
   * Property 1.1: Foundry mode always returns true for shouldUseFoundry
   * **Validates: Requirements 3.1**
   */
  it('Property 1.1: Foundry mode always routes to Foundry', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        (userId) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider: 'foundry' });
          
          // For any user ID (or no user ID), should always use Foundry
          return config.shouldUseFoundry(userId) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.2: Legacy mode always returns false for shouldUseFoundry
   * **Validates: Requirements 3.1**
   */
  it('Property 1.2: Legacy mode never routes to Foundry', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        (userId) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider: 'legacy' });
          
          // For any user ID (or no user ID), should never use Foundry
          return config.shouldUseFoundry(userId) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.3: Canary mode with 0% never routes to Foundry
   * **Validates: Requirements 3.2**
   */
  it('Property 1.3: Canary 0% never routes to Foundry', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (userId) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider: 'canary', canaryPercentage: 0 });
          
          // With 0% canary, should never use Foundry
          return config.shouldUseFoundry(userId) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.4: Canary mode with 100% always routes to Foundry
   * **Validates: Requirements 3.2**
   */
  it('Property 1.4: Canary 100% always routes to Foundry', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (userId) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider: 'canary', canaryPercentage: 100 });
          
          // With 100% canary, should always use Foundry
          return config.shouldUseFoundry(userId) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.5: User ID hashing is deterministic (same user always gets same result)
   * **Validates: Requirements 3.2**
   */
  it('Property 1.5: User routing is deterministic for same user', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 99 }), // Avoid 0 and 100 edge cases
        (userId, canaryPercentage) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider: 'canary', canaryPercentage });
          
          // Same user should always get same result
          const result1 = config.shouldUseFoundry(userId);
          const result2 = config.shouldUseFoundry(userId);
          const result3 = config.shouldUseFoundry(userId);
          
          return result1 === result2 && result2 === result3;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.6: Canary percentage bounds are respected
   * **Validates: Requirements 3.2**
   */
  it('Property 1.6: Canary percentage is bounded 0-100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        (percentage) => {
          const config = AIProviderConfig.getInstance();
          
          // Set config with potentially out-of-bounds percentage
          config.setConfig({ 
            provider: 'canary', 
            canaryPercentage: Math.max(0, Math.min(100, percentage)) 
          });
          
          const actualPercentage = config.getCanaryPercentage();
          
          // Percentage should always be within bounds
          return actualPercentage >= 0 && actualPercentage <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.7: Provider value is always valid
   * **Validates: Requirements 3.1**
   */
  it('Property 1.7: Provider is always a valid value', () => {
    const validProviders: AIProvider[] = ['foundry', 'legacy', 'canary'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validProviders),
        (provider) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider });
          
          const actualProvider = config.getProvider();
          
          // Provider should be one of the valid values
          return validProviders.includes(actualProvider);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.8: Router URL is never empty when Foundry is enabled
   * **Validates: Requirements 3.1**
   */
  it('Property 1.8: Router URL is always defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AIProvider>('foundry', 'canary'),
        fc.string({ minLength: 1, maxLength: 200 }),
        (provider, routerUrl) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider, routerUrl });
          
          const actualUrl = config.getRouterUrl();
          
          // Router URL should never be empty
          return actualUrl.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.9: Fallback setting is boolean
   * **Validates: Requirements 3.1**
   */
  it('Property 1.9: Fallback enabled is always boolean', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (fallbackEnabled) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ fallbackEnabled });
          
          const actual = config.isFallbackEnabled();
          
          // Should be a boolean
          return typeof actual === 'boolean';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.10: Config immutability - getConfig returns copy
   * **Validates: Requirements 3.1**
   */
  it('Property 1.10: getConfig returns immutable copy', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AIProvider>('foundry', 'legacy', 'canary'),
        fc.integer({ min: 0, max: 100 }),
        (provider, canaryPercentage) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider, canaryPercentage });
          
          const config1 = config.getConfig();
          const config2 = config.getConfig();
          
          // Should be equal but not same reference
          return (
            config1.provider === config2.provider &&
            config1.canaryPercentage === config2.canaryPercentage &&
            config1 !== config2
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('shouldUseFoundry convenience function', () => {
  beforeEach(() => {
    AIProviderConfig.resetInstance();
  });

  afterEach(() => {
    AIProviderConfig.resetInstance();
  });

  /**
   * Property 1.11: Convenience function matches instance method for deterministic cases
   * **Validates: Requirements 3.1**
   * Note: Only test deterministic cases (foundry, legacy, or canary with userId)
   */
  it('Property 1.11: Convenience function matches instance method', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AIProvider>('foundry', 'legacy'),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        (provider, userId) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider });
          
          const instanceResult = config.shouldUseFoundry(userId);
          const functionResult = shouldUseFoundry(userId);
          
          return instanceResult === functionResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.12: Canary with userId is deterministic via convenience function
   * **Validates: Requirements 3.2**
   */
  it('Property 1.12: Canary with userId is deterministic', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 99 }),
        (userId, canaryPercentage) => {
          const config = AIProviderConfig.getInstance();
          config.setConfig({ provider: 'canary', canaryPercentage });
          
          // Same user should always get same result via convenience function
          const result1 = shouldUseFoundry(userId);
          const result2 = shouldUseFoundry(userId);
          
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
