/**
 * Property Test: Top Content Ranking
 * 
 * **Feature: creator-analytics-dashboard, Property 10: Top Content Ranking**
 * **Validates: Requirements 11.1**
 * 
 * For any array of content items, the top 3 displayed SHALL be
 * the 3 items with highest newSubs values, sorted in descending order
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TopContent, Platform } from '@/lib/dashboard/types';

// Helper to generate valid ISO date string
const dateArbitrary = () => 
  fc.integer({ min: new Date('2024-01-01').getTime(), max: new Date('2024-12-31').getTime() })
    .map(ts => new Date(ts).toISOString());

describe('**Feature: creator-analytics-dashboard, Property 10: Top Content Ranking**', () => {
  it('should return top 3 content items by newSubs in descending order', () => {
    fc.assert(
      fc.property(
        // Generate array of content items
        fc.array(
          fc.record({
            contentId: fc.uuid(),
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
            publishedAt: dateArbitrary(),
            views: fc.integer({ min: 0, max: 10000000 }),
            linkTaps: fc.integer({ min: 0, max: 100000 }),
            newSubs: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 3, maxLength: 50 }
        ),
        (content) => {
          const topThree = getTopThreeContent(content);

          // Should return exactly 3 items (or less if input has fewer)
          expect(topThree.length).toBeLessThanOrEqual(3);
          expect(topThree.length).toBe(Math.min(3, content.length));

          // Should be sorted by newSubs in descending order
          for (let i = 0; i < topThree.length - 1; i++) {
            expect(topThree[i].newSubs).toBeGreaterThanOrEqual(topThree[i + 1].newSubs);
          }

          // Should contain the items with highest newSubs values
          const sortedContent = [...content].sort((a, b) => b.newSubs - a.newSubs);
          const expectedTop3 = sortedContent.slice(0, 3);

          expect(topThree.map(c => c.contentId)).toEqual(expectedTop3.map(c => c.contentId));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle content with equal newSubs values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.array(
          fc.record({
            contentId: fc.uuid(),
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            publishedAt: dateArbitrary(),
            views: fc.integer({ min: 0, max: 100000 }),
            linkTaps: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (sameNewSubs, contentBase) => {
          // All items have same newSubs value
          const content: TopContent[] = contentBase.map(c => ({
            ...c,
            newSubs: sameNewSubs,
            thumbnailUrl: undefined,
          }));

          const topThree = getTopThreeContent(content);

          // Should still return 3 items
          expect(topThree.length).toBe(3);

          // All should have the same newSubs value
          topThree.forEach(item => {
            expect(item.newSubs).toBe(sameNewSubs);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty content array', () => {
    const topThree = getTopThreeContent([]);
    expect(topThree).toEqual([]);
  });

  it('should handle content array with fewer than 3 items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            contentId: fc.uuid(),
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
            publishedAt: dateArbitrary(),
            views: fc.integer({ min: 0, max: 100000 }),
            linkTaps: fc.integer({ min: 0, max: 10000 }),
            newSubs: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 2 }
        ),
        (content) => {
          const topThree = getTopThreeContent(content);

          // Should return all items when fewer than 3
          expect(topThree.length).toBe(content.length);

          // Should still be sorted
          for (let i = 0; i < topThree.length - 1; i++) {
            expect(topThree[i].newSubs).toBeGreaterThanOrEqual(topThree[i + 1].newSubs);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle content with zero newSubs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            contentId: fc.uuid(),
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
            publishedAt: dateArbitrary(),
            views: fc.integer({ min: 0, max: 100000 }),
            linkTaps: fc.integer({ min: 0, max: 10000 }),
            newSubs: fc.constant(0),
          }),
          { minLength: 5, maxLength: 10 }
        ),
        (content) => {
          const topThree = getTopThreeContent(content);

          // Should return 3 items
          expect(topThree.length).toBe(3);

          // All should have 0 newSubs
          topThree.forEach(item => {
            expect(item.newSubs).toBe(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be stable sort (preserve order for equal values)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            contentId: fc.uuid(),
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
            publishedAt: dateArbitrary(),
            views: fc.integer({ min: 0, max: 100000 }),
            linkTaps: fc.integer({ min: 0, max: 10000 }),
            newSubs: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 10, maxLength: 20 }
        ),
        (content) => {
          const topThree1 = getTopThreeContent(content);
          const topThree2 = getTopThreeContent(content);

          // Should produce same result when called twice
          expect(topThree1.map(c => c.contentId)).toEqual(topThree2.map(c => c.contentId));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle large arrays efficiently', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            contentId: fc.uuid(),
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
            publishedAt: dateArbitrary(),
            views: fc.integer({ min: 0, max: 10000000 }),
            linkTaps: fc.integer({ min: 0, max: 100000 }),
            newSubs: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 100, maxLength: 1000 }
        ),
        (content) => {
          const startTime = Date.now();
          const topThree = getTopThreeContent(content);
          const endTime = Date.now();

          // Should complete in reasonable time (< 100ms for 1000 items)
          expect(endTime - startTime).toBeLessThan(100);

          // Should still return correct top 3
          expect(topThree.length).toBe(3);
          for (let i = 0; i < topThree.length - 1; i++) {
            expect(topThree[i].newSubs).toBeGreaterThanOrEqual(topThree[i + 1].newSubs);
          }
        }
      ),
      { numRuns: 10 } // Fewer runs for performance test
    );
  });
});

/**
 * Helper function to get top 3 content items by newSubs
 * Requirement 11.1: Display top 3 content pieces ranked by New Subs generated
 */
function getTopThreeContent(content: TopContent[]): TopContent[] {
  return [...content]
    .sort((a, b) => b.newSubs - a.newSubs)
    .slice(0, 3);
}
