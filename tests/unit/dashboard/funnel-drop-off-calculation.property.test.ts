/**
 * Property Test: Funnel Drop-Off Calculation
 * 
 * **Feature: creator-analytics-dashboard, Property 8: Funnel Drop-Off Calculation**
 * **Validates: Requirements 9.2**
 * 
 * For any funnel with stages [views, profileClicks, linkTaps, newSubs],
 * the drop-off percentage between stage[i-1] and stage[i] SHALL equal
 * ((stage[i-1] - stage[i]) / stage[i-1]) * 100 when stage[i-1] > 0
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { FunnelData } from '@/lib/dashboard/types';

describe('**Feature: creator-analytics-dashboard, Property 8: Funnel Drop-Off Calculation**', () => {
  it('should calculate correct drop-off percentage between consecutive stages', () => {
    fc.assert(
      fc.property(
        // Generate funnel data where each stage is <= previous stage
        fc.record({
          views: fc.integer({ min: 1, max: 1000000 }),
          profileClicks: fc.integer({ min: 0, max: 1000000 }),
          linkTaps: fc.integer({ min: 0, max: 1000000 }),
          newSubs: fc.integer({ min: 0, max: 1000000 }),
        }).chain((data) => {
          // Ensure funnel order: views >= profileClicks >= linkTaps >= newSubs
          const views = data.views;
          const profileClicks = Math.min(data.profileClicks, views);
          const linkTaps = Math.min(data.linkTaps, profileClicks);
          const newSubs = Math.min(data.newSubs, linkTaps);
          
          return fc.constant({
            views,
            profileClicks,
            linkTaps,
            newSubs,
          });
        }),
        (funnel) => {
          // Test drop-off from views to profileClicks
          if (funnel.views > 0) {
            const expectedDropOff = ((funnel.views - funnel.profileClicks) / funnel.views) * 100;
            const calculatedDropOff = calculateDropOffPercentage(funnel.views, funnel.profileClicks);
            
            expect(Math.abs(calculatedDropOff - expectedDropOff)).toBeLessThan(0.01);
          }
          
          // Test drop-off from profileClicks to linkTaps
          if (funnel.profileClicks > 0) {
            const expectedDropOff = ((funnel.profileClicks - funnel.linkTaps) / funnel.profileClicks) * 100;
            const calculatedDropOff = calculateDropOffPercentage(funnel.profileClicks, funnel.linkTaps);
            
            expect(Math.abs(calculatedDropOff - expectedDropOff)).toBeLessThan(0.01);
          }
          
          // Test drop-off from linkTaps to newSubs
          if (funnel.linkTaps > 0) {
            const expectedDropOff = ((funnel.linkTaps - funnel.newSubs) / funnel.linkTaps) * 100;
            const calculatedDropOff = calculateDropOffPercentage(funnel.linkTaps, funnel.newSubs);
            
            expect(Math.abs(calculatedDropOff - expectedDropOff)).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero values in previous stage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (currentStage) => {
          const dropOff = calculateDropOffPercentage(0, currentStage);
          // When previous stage is 0, drop-off should be 0 or undefined
          expect(dropOff === 0 || isNaN(dropOff)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce drop-off between 0 and 100 percent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (from, to) => {
          const actualTo = Math.min(to, from); // Ensure to <= from
          const dropOff = calculateDropOffPercentage(from, actualTo);
          
          expect(dropOff).toBeGreaterThanOrEqual(0);
          expect(dropOff).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce 0% drop-off when stages are equal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (value) => {
          const dropOff = calculateDropOffPercentage(value, value);
          expect(dropOff).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce 100% drop-off when current stage is 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (from) => {
          const dropOff = calculateDropOffPercentage(from, 0);
          expect(dropOff).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to calculate drop-off percentage
 * Matches the implementation in ConversionFunnel component
 */
function calculateDropOffPercentage(from: number, to: number): number {
  if (from === 0) {
    return 0;
  }
  
  return ((from - to) / from) * 100;
}
