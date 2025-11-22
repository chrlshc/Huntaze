/**
 * Property-Based Tests for Billing Cost Calculation
 * 
 * Feature: ai-system-gemini-integration, Property 2: Cost calculation accuracy
 * Validates: Requirements 3.3, 5.1, 5.2
 * 
 * Tests that cost calculations are accurate across all models and token counts
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { computeCostUSD, MODEL_PRICING } from '../../../lib/ai/gemini-billing.service';
import type { GeminiUsageMetadata } from '../../../lib/ai/gemini-client';

describe('Property 2: Cost calculation accuracy', () => {
  test('cost calculation matches formula for any token counts and model', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }), // inputTokens
        fc.integer({ min: 0, max: 100_000 }),   // outputTokens
        fc.constantFrom(
          'gemini-2.5-pro',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
          'gemini-2.0-flash-exp',
          'unknown-model' // Test default pricing
        ),
        (inputTokens, outputTokens, model) => {
          const usage: GeminiUsageMetadata = {
            promptTokenCount: inputTokens,
            candidatesTokenCount: outputTokens,
            totalTokenCount: inputTokens + outputTokens,
          };

          const result = computeCostUSD(model, usage);

          // Get expected pricing
          const pricing = MODEL_PRICING[model] ?? MODEL_PRICING.default;
          
          // Calculate expected cost
          const expectedInputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMTokens;
          const expectedOutputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMTokens;
          const expectedTotalCost = expectedInputCost + expectedOutputCost;

          // Verify result structure
          expect(result.inputTokens).toBe(inputTokens);
          expect(result.outputTokens).toBe(outputTokens);
          
          // Verify cost calculation (with floating point tolerance)
          expect(Math.abs(result.costUsd - expectedTotalCost)).toBeLessThan(0.000001);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cost is zero when both token counts are zero', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'gemini-2.5-pro',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite'
        ),
        (model) => {
          const usage: GeminiUsageMetadata = {
            promptTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0,
          };

          const result = computeCostUSD(model, usage);

          expect(result.costUsd).toBe(0);
          expect(result.inputTokens).toBe(0);
          expect(result.outputTokens).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cost is non-negative for any valid token counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        fc.constantFrom(
          'gemini-2.5-pro',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite'
        ),
        (inputTokens, outputTokens, model) => {
          const usage: GeminiUsageMetadata = {
            promptTokenCount: inputTokens,
            candidatesTokenCount: outputTokens,
          };

          const result = computeCostUSD(model, usage);

          expect(result.costUsd).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cost increases monotonically with token count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500_000 }),
        fc.integer({ min: 0, max: 50_000 }),
        fc.integer({ min: 1, max: 100 }), // delta to add
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash'),
        (inputTokens, outputTokens, delta, model) => {
          const usage1: GeminiUsageMetadata = {
            promptTokenCount: inputTokens,
            candidatesTokenCount: outputTokens,
          };

          const usage2: GeminiUsageMetadata = {
            promptTokenCount: inputTokens + delta,
            candidatesTokenCount: outputTokens,
          };

          const result1 = computeCostUSD(model, usage1);
          const result2 = computeCostUSD(model, usage2);

          // Cost should increase when tokens increase (unless pricing is 0)
          const pricing = MODEL_PRICING[model];
          if (pricing.inputPricePerMTokens > 0) {
            expect(result2.costUsd).toBeGreaterThan(result1.costUsd);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('handles undefined token counts gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash'),
        (model) => {
          const usage: GeminiUsageMetadata = {
            promptTokenCount: undefined,
            candidatesTokenCount: undefined,
          };

          const result = computeCostUSD(model, usage);

          // Should treat undefined as 0
          expect(result.inputTokens).toBe(0);
          expect(result.outputTokens).toBe(0);
          expect(result.costUsd).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('gemini-2.0-flash-exp has zero cost', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (inputTokens, outputTokens) => {
          const usage: GeminiUsageMetadata = {
            promptTokenCount: inputTokens,
            candidatesTokenCount: outputTokens,
          };

          const result = computeCostUSD('gemini-2.0-flash-exp', usage);

          // Free model should have zero cost
          expect(result.costUsd).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
