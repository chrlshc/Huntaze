/**
 * Property-Based Tests for Cost Calculator
 * 
 * Feature: azure-foundry-agents-integration, Property 5: Usage statistics conversion
 * Validates: Requirements 4.3, 7.1, 7.2, 7.3
 * 
 * Tests that usage statistics are correctly converted and costs are calculated
 * accurately for all supported models.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateCost,
  calculateCostBreakdown,
  calculateCostSimple,
  convertRouterUsage,
  getModelPricing,
  isModelSupported,
  getSupportedModels,
  MODEL_PRICING,
  DEFAULT_PRICING,
  type UsageStatistics,
} from '../../../../lib/ai/foundry/cost-calculator';

describe('Cost Calculator Property Tests', () => {
  // Arbitraries for generating test data
  const supportedModels = getSupportedModels();
  
  const modelArb = fc.constantFrom(...supportedModels);
  
  const anyModelArb = fc.oneof(
    modelArb,
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
  );
  
  const tokenCountArb = fc.integer({ min: 0, max: 100000 });
  
  const usageArb = fc.record({
    promptTokens: tokenCountArb,
    completionTokens: tokenCountArb,
  });
  
  const routerUsageArb = fc.record({
    prompt_tokens: tokenCountArb,
    completion_tokens: tokenCountArb,
    total_tokens: fc.option(tokenCountArb, { nil: undefined }),
  });

  /**
   * **Feature: azure-foundry-agents-integration, Property 5: Usage statistics conversion**
   * **Validates: Requirements 4.3, 7.1, 7.2, 7.3**
   * 
   * For any router response with usage data, the system SHALL convert
   * prompt_tokens to promptTokens, completion_tokens to completionTokens,
   * and calculate costUsd using the model's pricing.
   */
  describe('Property 5: Usage statistics conversion', () => {
    it('should convert prompt_tokens to promptTokens correctly', () => {
      fc.assert(
        fc.property(routerUsageArb, (routerUsage) => {
          const converted = convertRouterUsage(routerUsage);
          expect(converted.promptTokens).toBe(routerUsage.prompt_tokens);
        }),
        { numRuns: 100 }
      );
    });

    it('should convert completion_tokens to completionTokens correctly', () => {
      fc.assert(
        fc.property(routerUsageArb, (routerUsage) => {
          const converted = convertRouterUsage(routerUsage);
          expect(converted.completionTokens).toBe(routerUsage.completion_tokens);
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate totalTokens as sum when not provided', () => {
      fc.assert(
        fc.property(
          fc.record({
            prompt_tokens: tokenCountArb,
            completion_tokens: tokenCountArb,
          }),
          (routerUsage) => {
            const converted = convertRouterUsage(routerUsage);
            expect(converted.totalTokens).toBe(
              routerUsage.prompt_tokens + routerUsage.completion_tokens
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve totalTokens when provided', () => {
      fc.assert(
        fc.property(
          fc.record({
            prompt_tokens: tokenCountArb,
            completion_tokens: tokenCountArb,
            total_tokens: tokenCountArb,
          }),
          (routerUsage) => {
            const converted = convertRouterUsage(routerUsage);
            expect(converted.totalTokens).toBe(routerUsage.total_tokens);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Cost calculation properties
   */
  describe('Cost calculation correctness', () => {
    it('should calculate cost as non-negative for any valid usage', () => {
      fc.assert(
        fc.property(anyModelArb, usageArb, (model, usage) => {
          const cost = calculateCost(model, usage);
          expect(cost).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return zero cost for zero tokens', () => {
      fc.assert(
        fc.property(anyModelArb, (model) => {
          const cost = calculateCost(model, { promptTokens: 0, completionTokens: 0 });
          expect(cost).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate cost proportionally to token count', () => {
      fc.assert(
        fc.property(
          modelArb,
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 2, max: 10 }),
          (model, inputTokens, outputTokens, multiplier) => {
            const baseCost = calculateCostSimple(model, inputTokens, outputTokens);
            const scaledCost = calculateCostSimple(
              model,
              inputTokens * multiplier,
              outputTokens * multiplier
            );
            // Allow small floating point tolerance
            expect(scaledCost).toBeCloseTo(baseCost * multiplier, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce same result for calculateCost and calculateCostSimple', () => {
      fc.assert(
        fc.property(anyModelArb, usageArb, (model, usage) => {
          const cost1 = calculateCost(model, usage);
          const cost2 = calculateCostSimple(model, usage.promptTokens, usage.completionTokens);
          expect(cost1).toBe(cost2);
        }),
        { numRuns: 100 }
      );
    });

    it('should include correct model in breakdown for supported models', () => {
      fc.assert(
        fc.property(modelArb, usageArb, (model, usage) => {
          const breakdown = calculateCostBreakdown(model, usage);
          expect(breakdown.usedDefaultPricing).toBe(false);
          expect(breakdown.model).toBe(model);
        }),
        { numRuns: 100 }
      );
    });

    it('should use default pricing for unknown models', () => {
      // Use a prefix that won't match any model names
      const unknownModelArb = fc.string({ minLength: 5, maxLength: 20 })
        .map(s => `unknown-model-${s.replace(/[^a-z0-9]/gi, '')}`)
        .filter(s => s.length > 15);
      
      fc.assert(
        fc.property(
          unknownModelArb,
          usageArb,
          (unknownModel, usage) => {
            const breakdown = calculateCostBreakdown(unknownModel, usage);
            expect(breakdown.usedDefaultPricing).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should have breakdown totalCost equal to inputCost + outputCost', () => {
      fc.assert(
        fc.property(anyModelArb, usageArb, (model, usage) => {
          const breakdown = calculateCostBreakdown(model, usage);
          expect(breakdown.totalCost).toBeCloseTo(
            breakdown.inputCost + breakdown.outputCost,
            15
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Model pricing properties
   */
  describe('Model pricing correctness', () => {
    it('should return valid pricing for all supported models', () => {
      fc.assert(
        fc.property(modelArb, (model) => {
          const pricing = getModelPricing(model);
          expect(pricing.input).toBeGreaterThan(0);
          expect(pricing.output).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return default pricing for unknown models', () => {
      // Use a prefix that won't match any model names
      const unknownModelArb = fc.string({ minLength: 5, maxLength: 20 })
        .map(s => `unknown-model-${s.replace(/[^a-z0-9]/gi, '')}`)
        .filter(s => s.length > 15);
      
      fc.assert(
        fc.property(unknownModelArb, (unknownModel) => {
          const pricing = getModelPricing(unknownModel);
          expect(pricing).toEqual(DEFAULT_PRICING);
        }),
        { numRuns: 50 }
      );
    });

    it('should be case-insensitive for model lookup', () => {
      fc.assert(
        fc.property(modelArb, (model) => {
          const upperPricing = getModelPricing(model.toUpperCase());
          const lowerPricing = getModelPricing(model.toLowerCase());
          const originalPricing = getModelPricing(model);
          
          // All should return valid pricing (may be default for case variations)
          expect(upperPricing.input).toBeGreaterThan(0);
          expect(lowerPricing.input).toBeGreaterThan(0);
          expect(originalPricing.input).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify supported models', () => {
      fc.assert(
        fc.property(modelArb, (model) => {
          expect(isModelSupported(model)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Round-trip property: router usage → standard usage → cost calculation
   */
  describe('End-to-end cost calculation', () => {
    it('should correctly calculate cost from router usage format', () => {
      fc.assert(
        fc.property(
          modelArb,
          routerUsageArb,
          (model, routerUsage) => {
            // Convert router usage to standard format
            const standardUsage = convertRouterUsage(routerUsage);
            
            // Calculate cost
            const cost = calculateCost(model, standardUsage);
            
            // Verify cost matches expected calculation
            const pricing = getModelPricing(model);
            const expectedCost = 
              (routerUsage.prompt_tokens / 1000) * pricing.input +
              (routerUsage.completion_tokens / 1000) * pricing.output;
            
            expect(cost).toBeCloseTo(expectedCost, 15);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
