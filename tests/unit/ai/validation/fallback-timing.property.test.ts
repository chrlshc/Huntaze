/**
 * Property Test: Fallback Timing Guarantee
 * 
 * **Feature: aws-ai-system-validation, Property 5: Fallback Timing Guarantee**
 * **Validates: Requirements 6.1, 6.2**
 * 
 * Tests that:
 * 1. Fallback always completes within 5000ms
 * 2. Fallback metadata is always present when fallback is triggered
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  FallbackValidatorService,
  createMockFallbackResult,
  isValidFallbackResult,
} from '@/lib/ai/validation/fallback-validator';
import { FallbackValidationResult } from '@/lib/ai/validation/types';

// Constants
const MAX_FALLBACK_TIME_MS = 5000;

// Helper to generate valid ISO timestamp strings
const timestampArb = fc.integer({ min: 0, max: 4102444800000 }) // Up to year 2100
  .map(ts => new Date(ts).toISOString());

// Arbitraries for generating test data
const fallbackReasonArb = fc.constantFrom(
  'primary_unavailable',
  'rate_limited',
  'timeout',
  'circuit_open',
  'model_unavailable'
);

const fallbackTimeArb = fc.integer({ min: 0, max: 10000 });

const metadataArb = fc.option(
  fc.record({
    primaryProvider: fc.constantFrom('azure-openai', 'aws-bedrock', 'openai'),
    fallbackProvider: fc.constantFrom('openai-legacy', 'anthropic', 'local'),
    timestamp: timestampArb,
    attemptCount: fc.integer({ min: 1, max: 5 }),
  }),
  { nil: undefined }
);

const fallbackResultArb: fc.Arbitrary<FallbackValidationResult> = fc.record({
  fallbackTriggered: fc.boolean(),
  fallbackTimeMs: fallbackTimeArb,
  fallbackReason: fallbackReasonArb,
  legacyProviderUsed: fc.boolean(),
  metadata: metadataArb,
  error: fc.option(fc.string(), { nil: undefined }),
});

describe('Property 5: Fallback Timing Guarantee', () => {
  describe('Requirement 6.1: Fallback completes within 5000ms', () => {
    it('should validate that fallback time is within acceptable range', () => {
      fc.assert(
        fc.property(fallbackTimeArb, (timeMs) => {
          const result: FallbackValidationResult = {
            fallbackTriggered: true,
            fallbackTimeMs: timeMs,
            fallbackReason: 'primary_unavailable',
            legacyProviderUsed: true,
            metadata: { timestamp: new Date().toISOString() },
          };

          const validator = new FallbackValidatorService({ timeoutMs: MAX_FALLBACK_TIME_MS });
          const isWithinLimit = validator.validateFallbackTiming(result);

          // Property: timing validation should correctly identify if within limit
          expect(isWithinLimit).toBe(timeMs <= MAX_FALLBACK_TIME_MS);
        }),
        { numRuns: 100 }
      );
    });

    it('should always report valid timing for results under 5000ms', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_FALLBACK_TIME_MS }),
          (timeMs) => {
            const result = createMockFallbackResult({ fallbackTimeMs: timeMs });
            const validation = isValidFallbackResult(result, MAX_FALLBACK_TIME_MS);

            // Property: any time under limit should not have timing issues
            const hasTimingIssue = validation.issues.some((i: string) => i.includes('exceeds limit'));
            expect(hasTimingIssue).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always report invalid timing for results over 5000ms', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FALLBACK_TIME_MS + 1, max: 20000 }),
          (timeMs) => {
            const result = createMockFallbackResult({ fallbackTimeMs: timeMs });
            const validation = isValidFallbackResult(result, MAX_FALLBACK_TIME_MS);

            // Property: any time over limit should have timing issues
            const hasTimingIssue = validation.issues.some((i: string) => i.includes('exceeds limit'));
            expect(hasTimingIssue).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Requirement 6.2: Fallback metadata is always present', () => {
    it('should validate metadata presence when fallback is triggered', () => {
      fc.assert(
        fc.property(fallbackResultArb, (result) => {
          const validator = new FallbackValidatorService();
          const hasMetadata = validator.validateFallbackMetadata(result);

          // Property: metadata validation should match actual metadata presence
          if (result.metadata && 'timestamp' in result.metadata) {
            expect(hasMetadata).toBe(true);
          } else {
            expect(hasMetadata).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should report missing metadata as an issue when fallback is triggered', () => {
      fc.assert(
        fc.property(
          fc.record({
            fallbackTriggered: fc.constant(true),
            fallbackTimeMs: fc.integer({ min: 0, max: 1000 }),
            fallbackReason: fallbackReasonArb,
            legacyProviderUsed: fc.boolean(),
          }),
          (partialResult) => {
            const result: FallbackValidationResult = {
              ...partialResult,
              metadata: undefined, // No metadata
            };

            const validation = isValidFallbackResult(result);

            // Property: triggered fallback without metadata should be flagged
            const hasMetadataIssue = validation.issues.some((i: string) => 
              i.includes('no metadata present')
            );
            expect(hasMetadataIssue).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not report metadata issues when metadata is present', () => {
      fc.assert(
        fc.property(
          fc.record({
            fallbackTriggered: fc.boolean(),
            fallbackTimeMs: fc.integer({ min: 0, max: MAX_FALLBACK_TIME_MS }),
            fallbackReason: fallbackReasonArb,
            legacyProviderUsed: fc.boolean(),
            metadata: fc.record({
              timestamp: timestampArb,
              primaryProvider: fc.string(),
            }),
          }),
          (result) => {
            const validation = isValidFallbackResult(result as FallbackValidationResult);

            // Property: with metadata present, no metadata issues should be reported
            const hasMetadataIssue = validation.issues.some((i: string) => 
              i.includes('no metadata present')
            );
            expect(hasMetadataIssue).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined validation', () => {
    it('should correctly identify valid fallback results', () => {
      fc.assert(
        fc.property(
          fc.record({
            fallbackTriggered: fc.boolean(),
            fallbackTimeMs: fc.integer({ min: 0, max: MAX_FALLBACK_TIME_MS }),
            fallbackReason: fallbackReasonArb,
            legacyProviderUsed: fc.boolean(),
            metadata: fc.record({
              timestamp: timestampArb,
            }),
          }),
          (result) => {
            const validation = isValidFallbackResult(result as FallbackValidationResult);

            // Property: results with valid timing and metadata should be valid
            expect(validation.valid).toBe(true);
            expect(validation.issues).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accumulate multiple issues when multiple validations fail', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FALLBACK_TIME_MS + 1, max: 20000 }),
          (timeMs) => {
            const result: FallbackValidationResult = {
              fallbackTriggered: true,
              fallbackTimeMs: timeMs,
              fallbackReason: 'primary_unavailable',
              legacyProviderUsed: true,
              metadata: undefined, // Missing metadata
            };

            const validation = isValidFallbackResult(result);

            // Property: multiple failures should result in multiple issues
            expect(validation.valid).toBe(false);
            expect(validation.issues.length).toBeGreaterThanOrEqual(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
