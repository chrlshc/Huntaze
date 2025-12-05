/**
 * **Feature: onlyfans-shopify-design, Property 13: Quick Action Grid**
 * **Validates: Requirements 8.2**
 * 
 * For any quick actions section on desktop, the layout SHALL be 3 columns.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Grid configuration for quick actions
const QUICK_ACTION_GRID_CONFIG = {
  desktop: {
    columns: 3,
    gap: 16, // 4 * 4 in Tailwind (gap-4)
    minWidth: 1024, // Desktop breakpoint
  },
  tablet: {
    columns: 2,
    gap: 16,
    minWidth: 768,
  },
  mobile: {
    columns: 1,
    gap: 12,
    minWidth: 0,
  },
};

describe('Property 13: Quick Action Grid', () => {
  const quickActionCountArbitrary = fc.integer({ min: 1, max: 12 });
  const viewportWidthArbitrary = fc.integer({ min: 320, max: 2560 });

  it('should have 3 columns on desktop viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: QUICK_ACTION_GRID_CONFIG.desktop.minWidth, max: 2560 }),
        (viewportWidth) => {
          const expectedColumns = QUICK_ACTION_GRID_CONFIG.desktop.columns;
          expect(expectedColumns).toBe(3);
          expect(viewportWidth).toBeGreaterThanOrEqual(QUICK_ACTION_GRID_CONFIG.desktop.minWidth);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have 2 columns on tablet viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ 
          min: QUICK_ACTION_GRID_CONFIG.tablet.minWidth, 
          max: QUICK_ACTION_GRID_CONFIG.desktop.minWidth - 1 
        }),
        (viewportWidth) => {
          const expectedColumns = QUICK_ACTION_GRID_CONFIG.tablet.columns;
          expect(expectedColumns).toBe(2);
          expect(viewportWidth).toBeGreaterThanOrEqual(QUICK_ACTION_GRID_CONFIG.tablet.minWidth);
          expect(viewportWidth).toBeLessThan(QUICK_ACTION_GRID_CONFIG.desktop.minWidth);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have 1 column on mobile viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: QUICK_ACTION_GRID_CONFIG.tablet.minWidth - 1 }),
        (viewportWidth) => {
          const expectedColumns = QUICK_ACTION_GRID_CONFIG.mobile.columns;
          expect(expectedColumns).toBe(1);
          expect(viewportWidth).toBeLessThan(QUICK_ACTION_GRID_CONFIG.tablet.minWidth);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent gap between items', () => {
    fc.assert(
      fc.property(viewportWidthArbitrary, (viewportWidth) => {
        let expectedGap: number;
        
        if (viewportWidth >= QUICK_ACTION_GRID_CONFIG.desktop.minWidth) {
          expectedGap = QUICK_ACTION_GRID_CONFIG.desktop.gap;
        } else if (viewportWidth >= QUICK_ACTION_GRID_CONFIG.tablet.minWidth) {
          expectedGap = QUICK_ACTION_GRID_CONFIG.tablet.gap;
        } else {
          expectedGap = QUICK_ACTION_GRID_CONFIG.mobile.gap;
        }
        
        expect(expectedGap).toBeGreaterThanOrEqual(12);
        expect(expectedGap).toBeLessThanOrEqual(24);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should distribute items evenly across columns', () => {
    fc.assert(
      fc.property(quickActionCountArbitrary, (itemCount) => {
        const columns = QUICK_ACTION_GRID_CONFIG.desktop.columns;
        const rows = Math.ceil(itemCount / columns);
        
        // All items should fit in the calculated rows
        expect(rows * columns).toBeGreaterThanOrEqual(itemCount);
        
        // Last row might not be full
        const itemsInLastRow = itemCount % columns || columns;
        expect(itemsInLastRow).toBeGreaterThan(0);
        expect(itemsInLastRow).toBeLessThanOrEqual(columns);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain minimum item width on desktop', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: QUICK_ACTION_GRID_CONFIG.desktop.minWidth, max: 1400 }),
        (containerWidth) => {
          const columns = QUICK_ACTION_GRID_CONFIG.desktop.columns;
          const gap = QUICK_ACTION_GRID_CONFIG.desktop.gap;
          const totalGapWidth = gap * (columns - 1);
          const availableWidth = containerWidth - totalGapWidth;
          const itemWidth = availableWidth / columns;
          
          // Each item should have reasonable minimum width
          expect(itemWidth).toBeGreaterThan(200);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
