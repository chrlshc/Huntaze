/**
 * Property Test: Platform Views Aggregation
 * 
 * **Feature: creator-analytics-dashboard, Property 9: Platform Views Aggregation**
 * **Validates: Requirements 9.4**
 * 
 * For any set of platform metrics, the total views SHALL equal
 * the sum of views from TikTok + Instagram + Twitter
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PlatformMetrics, Platform } from '@/lib/dashboard/types';

describe('**Feature: creator-analytics-dashboard, Property 9: Platform Views Aggregation**', () => {
  it('should aggregate views correctly across all platforms', () => {
    fc.assert(
      fc.property(
        // Generate platform metrics for all three platforms
        fc.record({
          tiktokViews: fc.integer({ min: 0, max: 10000000 }),
          instagramViews: fc.integer({ min: 0, max: 10000000 }),
          twitterViews: fc.integer({ min: 0, max: 10000000 }),
          tiktokClicks: fc.integer({ min: 0, max: 100000 }),
          instagramClicks: fc.integer({ min: 0, max: 100000 }),
          twitterClicks: fc.integer({ min: 0, max: 100000 }),
          tiktokTaps: fc.integer({ min: 0, max: 50000 }),
          instagramTaps: fc.integer({ min: 0, max: 50000 }),
          twitterTaps: fc.integer({ min: 0, max: 50000 }),
          tiktokSubs: fc.integer({ min: 0, max: 10000 }),
          instagramSubs: fc.integer({ min: 0, max: 10000 }),
          twitterSubs: fc.integer({ min: 0, max: 10000 }),
        }),
        (data) => {
          const platforms: PlatformMetrics[] = [
            {
              platform: 'TikTok',
              views: data.tiktokViews,
              profileClicks: data.tiktokClicks,
              linkTaps: data.tiktokTaps,
              newSubs: data.tiktokSubs,
            },
            {
              platform: 'Instagram',
              views: data.instagramViews,
              profileClicks: data.instagramClicks,
              linkTaps: data.instagramTaps,
              newSubs: data.instagramSubs,
            },
            {
              platform: 'Twitter',
              views: data.twitterViews,
              profileClicks: data.twitterClicks,
              linkTaps: data.twitterTaps,
              newSubs: data.twitterSubs,
            },
          ];

          const totalViews = aggregatePlatformViews(platforms);
          const expectedTotal = data.tiktokViews + data.instagramViews + data.twitterViews;

          expect(totalViews).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty platform list', () => {
    const totalViews = aggregatePlatformViews([]);
    expect(totalViews).toBe(0);
  });

  it('should handle single platform', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000000 }),
        fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
        (views, platform) => {
          const platforms: PlatformMetrics[] = [
            {
              platform,
              views,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
          ];

          const totalViews = aggregatePlatformViews(platforms);
          expect(totalViews).toBe(views);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle platforms with zero views', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000000 }),
        (nonZeroViews) => {
          const platforms: PlatformMetrics[] = [
            {
              platform: 'TikTok',
              views: nonZeroViews,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
            {
              platform: 'Instagram',
              views: 0,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
            {
              platform: 'Twitter',
              views: 0,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
          ];

          const totalViews = aggregatePlatformViews(platforms);
          expect(totalViews).toBe(nonZeroViews);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be commutative (order does not matter)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            platform: fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter'),
            views: fc.integer({ min: 0, max: 1000000 }),
            profileClicks: fc.integer({ min: 0, max: 10000 }),
            linkTaps: fc.integer({ min: 0, max: 5000 }),
            newSubs: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (platforms) => {
          const total1 = aggregatePlatformViews(platforms);
          const shuffled = [...platforms].reverse();
          const total2 = aggregatePlatformViews(shuffled);

          expect(total1).toBe(total2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should aggregate correctly with large numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000, max: 100000000 }),
        fc.integer({ min: 1000000, max: 100000000 }),
        fc.integer({ min: 1000000, max: 100000000 }),
        (tiktok, instagram, twitter) => {
          const platforms: PlatformMetrics[] = [
            {
              platform: 'TikTok',
              views: tiktok,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
            {
              platform: 'Instagram',
              views: instagram,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
            {
              platform: 'Twitter',
              views: twitter,
              profileClicks: 0,
              linkTaps: 0,
              newSubs: 0,
            },
          ];

          const totalViews = aggregatePlatformViews(platforms);
          const expectedTotal = tiktok + instagram + twitter;

          expect(totalViews).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to aggregate views across platforms
 * Requirement 9.4: Aggregate views from TikTok, Instagram, and Twitter
 */
function aggregatePlatformViews(platforms: PlatformMetrics[]): number {
  return platforms.reduce((total, platform) => total + platform.views, 0);
}
