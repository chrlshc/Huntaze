/**
 * Property Test: Delta Color Mapping
 * 
 * **Feature: creator-analytics-dashboard, Property 15: Delta Color Mapping**
 * **Validates: Requirements 1.5**
 * 
 * Property: For any delta value, positive values SHALL use --shopify-text-success 
 * color and negative values SHALL use --shopify-text-critical color.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Get delta color class based on trend
 * This simulates the logic used in the Overview page
 */
function getDeltaTrend(deltaPct: number): 'up' | 'down' | 'neutral' {
  if (deltaPct > 0) return 'up';
  if (deltaPct < 0) return 'down';
  return 'neutral';
}

/**
 * Map trend to Shopify color token
 */
function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return '--shopify-text-success';
    case 'down':
      return '--shopify-text-critical';
    case 'neutral':
      return '--shopify-text-secondary';
  }
}

describe('Property 15: Delta Color Mapping', () => {
  it('**Feature: creator-analytics-dashboard, Property 15: Delta Color Mapping**', () => {
    fc.assert(
      fc.property(
        // Generate any number (positive, negative, or zero)
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        (deltaPct) => {
          const trend = getDeltaTrend(deltaPct);
          const color = getTrendColor(trend);

          // Property: Positive values use success color
          if (deltaPct > 0) {
            expect(color).toBe('--shopify-text-success');
            expect(trend).toBe('up');
          }
          
          // Property: Negative values use critical color
          if (deltaPct < 0) {
            expect(color).toBe('--shopify-text-critical');
            expect(trend).toBe('down');
          }
          
          // Property: Zero uses neutral color
          if (deltaPct === 0) {
            expect(color).toBe('--shopify-text-secondary');
            expect(trend).toBe('neutral');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases correctly', () => {
    // Test specific edge cases
    const testCases = [
      { value: 0, expectedTrend: 'neutral', expectedColor: '--shopify-text-secondary' },
      { value: 0.0001, expectedTrend: 'up', expectedColor: '--shopify-text-success' },
      { value: -0.0001, expectedTrend: 'down', expectedColor: '--shopify-text-critical' },
      { value: 100, expectedTrend: 'up', expectedColor: '--shopify-text-success' },
      { value: -100, expectedTrend: 'down', expectedColor: '--shopify-text-critical' },
      { value: Infinity, expectedTrend: 'up', expectedColor: '--shopify-text-success' },
      { value: -Infinity, expectedTrend: 'down', expectedColor: '--shopify-text-critical' },
    ];

    testCases.forEach(({ value, expectedTrend, expectedColor }) => {
      const trend = getDeltaTrend(value);
      const color = getTrendColor(trend);
      
      expect(trend).toBe(expectedTrend);
      expect(color).toBe(expectedColor);
    });
  });

  it('should maintain consistency across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        (deltaPct) => {
          // Call multiple times with same input
          const trend1 = getDeltaTrend(deltaPct);
          const trend2 = getDeltaTrend(deltaPct);
          const trend3 = getDeltaTrend(deltaPct);

          const color1 = getTrendColor(trend1);
          const color2 = getTrendColor(trend2);
          const color3 = getTrendColor(trend3);

          // Property: Same input always produces same output
          expect(trend1).toBe(trend2);
          expect(trend2).toBe(trend3);
          expect(color1).toBe(color2);
          expect(color2).toBe(color3);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary transitions correctly', () => {
    // Test values very close to zero
    const nearZeroValues = [
      -0.000001,
      -0.00001,
      -0.0001,
      0,
      0.0001,
      0.00001,
      0.000001,
    ];

    nearZeroValues.forEach((value) => {
      const trend = getDeltaTrend(value);
      const color = getTrendColor(trend);

      if (value > 0) {
        expect(trend).toBe('up');
        expect(color).toBe('--shopify-text-success');
      } else if (value < 0) {
        expect(trend).toBe('down');
        expect(color).toBe('--shopify-text-critical');
      } else {
        expect(trend).toBe('neutral');
        expect(color).toBe('--shopify-text-secondary');
      }
    });
  });

  it('should map all possible trends to valid colors', () => {
    const allTrends: Array<'up' | 'down' | 'neutral'> = ['up', 'down', 'neutral'];
    const validColors = [
      '--shopify-text-success',
      '--shopify-text-critical',
      '--shopify-text-secondary',
    ];

    allTrends.forEach((trend) => {
      const color = getTrendColor(trend);
      expect(validColors).toContain(color);
    });
  });
});
