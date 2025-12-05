/**
 * Property Test: Bundle Composition
 * 
 * **Feature: huntaze-ai-features-coming-soon, Property 10: Bundle Composition**
 * **Validates: Requirements 7.2, 7.3**
 * 
 * For any bundle suggestion, the bundle should contain at least 2 content items
 * and the suggested price should be less than the sum of individual prices.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  OffersAIService,
  createOffersAIService,
  SuggestBundlesRequest,
} from '@/lib/ai/offers-ai.service';
import { ContentItem, BundleSuggestion } from '@/lib/offers/types';

// ============================================
// Arbitraries
// ============================================

const contentItemArbitrary: fc.Arbitrary<ContentItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('photo', 'video', 'audio', 'text'),
  price: fc.double({ min: 1, max: 500, noNaN: true }),
  salesCount: fc.integer({ min: 0, max: 10000 }),
});

const bundleRequestArbitrary: fc.Arbitrary<SuggestBundlesRequest> = fc.record({
  userId: fc.integer({ min: 1, max: 1000000 }),
  contentItems: fc.array(contentItemArbitrary, { minLength: 2, maxLength: 20 }),
  fanPreferences: fc.constant(undefined),
});

// Mock bundle suggestion that references actual content IDs
const createMockBundleSuggestion = (contentItems: ContentItem[]): BundleSuggestion[] => {
  if (contentItems.length < 2) return [];
  
  const selectedItems = contentItems.slice(0, Math.min(3, contentItems.length));
  const sumPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
  
  return [{
    name: 'Test Bundle',
    contentIds: selectedItems.map(i => i.id),
    suggestedPrice: sumPrice * 0.8, // 20% discount
    expectedValue: 'Great value',
    reasoning: 'Test reasoning',
  }];
};

// ============================================
// Tests
// ============================================

describe('Bundle Composition Property Tests', () => {
  let service: OffersAIService;
  let mockAIService: { request: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAIService = {
      request: vi.fn(),
    };
    service = createOffersAIService(mockAIService as never);
  });

  /**
   * Property 10: Bundle Composition
   * Bundles must have >= 2 items and price < sum of individual prices
   */
  it('should return bundles with at least 2 items and discounted price', async () => {
    await fc.assert(
      fc.asyncProperty(
        bundleRequestArbitrary,
        async (request) => {
          // Create valid mock response based on actual content items
          const mockBundles = createMockBundleSuggestion(request.contentItems);
          
          mockAIService.request.mockResolvedValueOnce({
            content: JSON.stringify(mockBundles),
          });

          const suggestions = await service.suggestBundles(request);

          // Build content map for price lookup
          const contentMap = new Map(request.contentItems.map(c => [c.id, c]));

          for (const bundle of suggestions) {
            // Must have at least 2 items
            expect(bundle.contentIds.length).toBeGreaterThanOrEqual(2);

            // Calculate sum of individual prices
            const sumPrice = bundle.contentIds.reduce((sum, id) => {
              const item = contentMap.get(id);
              return sum + (item?.price || 0);
            }, 0);

            // Bundle price must be less than sum
            expect(bundle.suggestedPrice).toBeLessThan(sumPrice);
            expect(bundle.suggestedPrice).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty result for insufficient content
   */
  it('should return empty array when less than 2 content items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(contentItemArbitrary, { minLength: 0, maxLength: 1 }),
        fc.integer({ min: 1, max: 1000000 }),
        async (contentItems, userId) => {
          const request: SuggestBundlesRequest = {
            userId,
            contentItems,
          };

          const suggestions = await service.suggestBundles(request);

          // Should return empty array
          expect(suggestions).toEqual([]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: All content IDs in bundle must exist in input
   */
  it('should only include valid content IDs in bundles', async () => {
    await fc.assert(
      fc.asyncProperty(
        bundleRequestArbitrary,
        async (request) => {
          // Create mock with some invalid IDs
          const validIds = request.contentItems.map(c => c.id);
          const mockBundles = [
            {
              name: 'Mixed Bundle',
              contentIds: [...validIds.slice(0, 2), 'invalid-id-1', 'invalid-id-2'],
              suggestedPrice: 10,
              expectedValue: 'test',
              reasoning: 'test',
            },
          ];

          mockAIService.request.mockResolvedValueOnce({
            content: JSON.stringify(mockBundles),
          });

          const suggestions = await service.suggestBundles(request);

          const validIdSet = new Set(validIds);

          for (const bundle of suggestions) {
            // All IDs must be valid
            for (const id of bundle.contentIds) {
              expect(validIdSet.has(id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Fallback bundles are valid
   */
  it('should return valid fallback bundles when AI fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        bundleRequestArbitrary,
        async (request) => {
          // Setup mock to fail
          mockAIService.request.mockRejectedValueOnce(new Error('AI service unavailable'));

          const suggestions = await service.suggestBundles(request);

          const contentMap = new Map(request.contentItems.map(c => [c.id, c]));

          for (const bundle of suggestions) {
            // Must have at least 2 items
            expect(bundle.contentIds.length).toBeGreaterThanOrEqual(2);

            // All IDs must be valid
            for (const id of bundle.contentIds) {
              expect(contentMap.has(id)).toBe(true);
            }

            // Calculate sum of individual prices
            const sumPrice = bundle.contentIds.reduce((sum, id) => {
              const item = contentMap.get(id);
              return sum + (item?.price || 0);
            }, 0);

            // Bundle price must be less than sum
            expect(bundle.suggestedPrice).toBeLessThan(sumPrice);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Bundle prices are rounded to 2 decimal places
   */
  it('should round bundle prices to 2 decimal places', async () => {
    await fc.assert(
      fc.asyncProperty(
        bundleRequestArbitrary,
        async (request) => {
          const mockBundles = createMockBundleSuggestion(request.contentItems);
          
          mockAIService.request.mockResolvedValueOnce({
            content: JSON.stringify(mockBundles),
          });

          const suggestions = await service.suggestBundles(request);

          for (const bundle of suggestions) {
            const decimalPlaces = (bundle.suggestedPrice.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
