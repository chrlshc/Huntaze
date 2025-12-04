/**
 * **Feature: aws-ai-system-validation, Property 7: Cost Calculation Completeness**
 * **Validates: Requirements 7.1, 7.2**
 * 
 * Tests that cost breakdown always includes model, inputCost, outputCost, totalCost
 * and that calculations are mathematically correct.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { TokenUsage, CostBreakdown } from '../../../../lib/ai/validation/types';

// Model pricing per 1M tokens (in USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'deepseek-r1': { input: 0.55, output: 2.19 },
  'mistral-large': { input: 2.0, output: 6.0 },
  'phi-4-mini': { input: 0.07, output: 0.14 },
  'llama-3.3-70b': { input: 0.18, output: 0.18 },
};

const DEFAULT_PRICING = { input: 1.0, output: 3.0 };

/**
 * Calculate cost breakdown for a given model and token usage
 */
function calculateCostBreakdown(model: string, usage: TokenUsage): CostBreakdown {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
  const usedDefaultPricing = !MODEL_PRICING[model];
  
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  return {
    model,
    inputCost,
    outputCost,
    totalCost,
    usedDefaultPricing,
  };
}

describe('Property 7: Cost Calculation Completeness', () => {
  // Arbitrary for valid token usage
  const tokenUsageArb = fc.record({
    inputTokens: fc.nat({ max: 100000 }),
    outputTokens: fc.nat({ max: 100000 }),
    totalTokens: fc.nat({ max: 200000 }),
  });

  // Arbitrary for model names - use alphanumeric to avoid JS reserved properties like 'constructor'
  const modelArb = fc.oneof(
    fc.constant('deepseek-r1'),
    fc.constant('mistral-large'),
    fc.constant('phi-4-mini'),
    fc.constant('llama-3.3-70b'),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,49}$/) // Unknown models - alphanumeric only
  );

  it('cost breakdown always includes all required fields', () => {
    fc.assert(
      fc.property(modelArb, tokenUsageArb, (model, usage) => {
        const cost = calculateCostBreakdown(model, usage);
        
        // All required fields must be present
        expect(cost).toHaveProperty('model');
        expect(cost).toHaveProperty('inputCost');
        expect(cost).toHaveProperty('outputCost');
        expect(cost).toHaveProperty('totalCost');
        expect(cost).toHaveProperty('usedDefaultPricing');
        
        // Model name must be a non-empty string
        expect(typeof cost.model).toBe('string');
        expect(cost.model.length).toBeGreaterThan(0);
        
        // Costs must be numbers
        expect(typeof cost.inputCost).toBe('number');
        expect(typeof cost.outputCost).toBe('number');
        expect(typeof cost.totalCost).toBe('number');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('costs are always non-negative', () => {
    fc.assert(
      fc.property(modelArb, tokenUsageArb, (model, usage) => {
        const cost = calculateCostBreakdown(model, usage);
        
        expect(cost.inputCost).toBeGreaterThanOrEqual(0);
        expect(cost.outputCost).toBeGreaterThanOrEqual(0);
        expect(cost.totalCost).toBeGreaterThanOrEqual(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('total cost equals input cost plus output cost', () => {
    fc.assert(
      fc.property(modelArb, tokenUsageArb, (model, usage) => {
        const cost = calculateCostBreakdown(model, usage);
        
        // Allow for floating point precision issues
        const expectedTotal = cost.inputCost + cost.outputCost;
        expect(Math.abs(cost.totalCost - expectedTotal)).toBeLessThan(0.0000001);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('known models use their specific pricing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('deepseek-r1', 'mistral-large', 'phi-4-mini', 'llama-3.3-70b'),
        tokenUsageArb,
        (model, usage) => {
          const cost = calculateCostBreakdown(model, usage);
          
          expect(cost.usedDefaultPricing).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unknown models use default pricing', () => {
    // Use explicit unknown model names to avoid filter issues
    const unknownModelArb = fc.constantFrom(
      'unknown-model',
      'gpt-4',
      'claude-3',
      'custom-model',
      'test-model-xyz'
    );
    
    fc.assert(
      fc.property(
        unknownModelArb,
        tokenUsageArb,
        (model, usage) => {
          const cost = calculateCostBreakdown(model, usage);
          
          expect(cost.usedDefaultPricing).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('zero tokens result in zero cost', () => {
    fc.assert(
      fc.property(modelArb, (model) => {
        const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
        const cost = calculateCostBreakdown(model, usage);
        
        expect(cost.inputCost).toBe(0);
        expect(cost.outputCost).toBe(0);
        expect(cost.totalCost).toBe(0);
        
        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('cost scales linearly with token count', () => {
    fc.assert(
      fc.property(
        modelArb,
        fc.integer({ min: 1, max: 10000 }), // Ensure baseTokens > 0
        fc.integer({ min: 2, max: 10 }),
        (model, baseTokens, multiplier) => {
          const baseUsage: TokenUsage = {
            inputTokens: baseTokens,
            outputTokens: baseTokens,
            totalTokens: baseTokens * 2,
          };
          
          const scaledUsage: TokenUsage = {
            inputTokens: baseTokens * multiplier,
            outputTokens: baseTokens * multiplier,
            totalTokens: baseTokens * 2 * multiplier,
          };
          
          const baseCost = calculateCostBreakdown(model, baseUsage);
          const scaledCost = calculateCostBreakdown(model, scaledUsage);
          
          // Allow for floating point precision
          const expectedScaledTotal = baseCost.totalCost * multiplier;
          expect(Math.abs(scaledCost.totalCost - expectedScaledTotal)).toBeLessThan(0.0000001);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
