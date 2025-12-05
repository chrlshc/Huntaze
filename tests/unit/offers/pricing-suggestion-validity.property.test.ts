/**
 * Property Test: Pricing Suggestion Validity
 * 
 * **Feature: huntaze-ai-features-coming-soon, Property 9: Pricing Suggestion Validity**
 * **Validates: Requirements 6.2, 6.3**
 * 
 * For any pricing suggestion, the recommended price should be a positive number
 * and confidence should be between 0 and 1.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  OffersAIService,
  createOffersAIService,
  SuggestPricingRequest,
} from '@/lib/ai/offers-ai.service';
import { SalesData, PricingSuggestion } from '@/lib/offers/types';

// ============================================
// Arbitraries
// ============================================

const salesDataArbitrary: fc.Arbitrary<SalesData> = fc.record({
  contentId: fc.uuid(),
  price: fc.double({ min: 0.99, max: 999.99, noNaN: true }),
  salesCount: fc.integer({ min: 0, max: 10000 }),
  revenue: fc.double({ min: 0, max: 100000, noNaN: true }),
  period: fc.constantFrom('day', 'week', 'month', 'quarter'),
});

const pricingRequestArbitrary: fc.Arbitrary<SuggestPricingRequest> = fc.record({
  contentId: fc.uuid(),
  currentPrice: fc.option(fc.double({ min: 0.99, max: 999.99, noNaN: true }), { nil: undefined }),
  historicalSales: fc.array(salesDataArbitrary, { minLength: 0, maxLength: 10 }),
});

// Mock AI response arbitrary
const mockPricingSuggestionArbitrary: fc.Arbitrary<PricingSuggestion[]> = fc.array(
  fc.record({
    recommendedPrice: fc.double({ min: 0.01, max: 9999.99, noNaN: true }),
    expectedImpact: fc.string({ minLength: 1, maxLength: 200 }),
    confidence: fc.double({ min: 0, max: 1, noNaN: true }),
    reasoning: fc.string({ minLength: 1, maxLength: 500 }),
  }),
  { minLength: 1, maxLength: 5 }
);

// ============================================
// Tests
// ============================================

describe('Pricing Suggestion Validity Property Tests', () => {
  let service: OffersAIService;
  let mockAIService: { request: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAIService = {
      request: vi.fn(),
    };
    service = createOffersAIService(mockAIService as never);
  });

  /**
   * Property 9: Pricing Suggestion Validity
   * For any pricing suggestion, recommendedPrice > 0 and 0 <= confidence <= 1
   */
  it('should return suggestions with positive prices and valid confidence', async () => {
    await fc.assert(
      fc.asyncProperty(
        pricingRequestArbitrary,
        mockPricingSuggestionArbitrary,
        async (request, mockSuggestions) => {
          // Setup mock to return valid suggestions
          mockAIService.request.mockResolvedValueOnce({
            content: JSON.stringify(mockSuggestions),
          });

          const suggestions = await service.suggestPricing(request);

          // All suggestions must have positive prices
          for (const suggestion of suggestions) {
            expect(suggestion.recommendedPrice).toBeGreaterThan(0);
            expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
            expect(suggestion.confidence).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fallback suggestions are always valid
   */
  it('should return valid fallback suggestions when AI fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        pricingRequestArbitrary,
        async (request) => {
          // Setup mock to fail
          mockAIService.request.mockRejectedValueOnce(new Error('AI service unavailable'));

          const suggestions = await service.suggestPricing(request);

          // Should return fallback suggestions
          expect(suggestions.length).toBeGreaterThan(0);

          // All fallback suggestions must be valid
          for (const suggestion of suggestions) {
            expect(suggestion.recommendedPrice).toBeGreaterThan(0);
            expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
            expect(suggestion.confidence).toBeLessThanOrEqual(1);
            expect(typeof suggestion.expectedImpact).toBe('string');
            expect(typeof suggestion.reasoning).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid AI responses are filtered out
   */
  it('should filter out invalid suggestions from AI response', async () => {
    await fc.assert(
      fc.asyncProperty(
        pricingRequestArbitrary,
        async (request) => {
          // Setup mock to return mix of valid and invalid suggestions
          const invalidSuggestions = [
            { recommendedPrice: -10, confidence: 0.5, expectedImpact: 'test', reasoning: 'test' },
            { recommendedPrice: 0, confidence: 0.5, expectedImpact: 'test', reasoning: 'test' },
            { recommendedPrice: 10, confidence: 1.5, expectedImpact: 'test', reasoning: 'test' },
            { recommendedPrice: 10, confidence: -0.5, expectedImpact: 'test', reasoning: 'test' },
            { recommendedPrice: 25.99, confidence: 0.8, expectedImpact: 'valid', reasoning: 'valid' },
          ];

          mockAIService.request.mockResolvedValueOnce({
            content: JSON.stringify(invalidSuggestions),
          });

          const suggestions = await service.suggestPricing(request);

          // Only valid suggestions should remain
          for (const suggestion of suggestions) {
            expect(suggestion.recommendedPrice).toBeGreaterThan(0);
            expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
            expect(suggestion.confidence).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Prices are rounded to 2 decimal places
   */
  it('should round prices to 2 decimal places', async () => {
    await fc.assert(
      fc.asyncProperty(
        pricingRequestArbitrary,
        async (request) => {
          const mockSuggestions = [
            { recommendedPrice: 19.999, confidence: 0.8, expectedImpact: 'test', reasoning: 'test' },
            { recommendedPrice: 25.123456, confidence: 0.7, expectedImpact: 'test', reasoning: 'test' },
          ];

          mockAIService.request.mockResolvedValueOnce({
            content: JSON.stringify(mockSuggestions),
          });

          const suggestions = await service.suggestPricing(request);

          for (const suggestion of suggestions) {
            const decimalPlaces = (suggestion.recommendedPrice.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
