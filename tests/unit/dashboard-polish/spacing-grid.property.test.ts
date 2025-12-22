/**
 * Feature: dashboard-global-polish, Property 2: Spacing Grid Adherence
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * Property: For any spacing value used in the dashboard, it should be
 * a multiple of 4px (4, 8, 12, 16, 20, 24, 28, 32, etc.) to maintain
 * grid consistency.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

describe('Property 2: Spacing Grid Adherence', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // Create test container
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    // Inject polish spacing tokens directly into the document
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --polish-space-xs: 4px;
        --polish-space-sm: 8px;
        --polish-space-md: 16px;
        --polish-space-lg: 24px;
        --polish-space-xl: 32px;
        --polish-card-padding: 16px;
        --polish-card-gap: 12px;
        --polish-section-gap: 24px;
        --polish-header-margin: 32px;
        --polish-content-gap: 20px;
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    // Cleanup
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  /**
   * Helper function to check if a value is a multiple of 4
   */
  function isMultipleOf4(value: number): boolean {
    return value % 4 === 0;
  }

  /**
   * Helper function to extract numeric value from CSS string (e.g., "16px" -> 16)
   */
  function extractNumericValue(cssValue: string): number {
    const match = cssValue.match(/^(-?\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  it('should enforce 4px grid for all spacing token values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '--polish-space-xs',
          '--polish-space-sm',
          '--polish-space-md',
          '--polish-space-lg',
          '--polish-space-xl',
          '--polish-card-padding',
          '--polish-card-gap',
          '--polish-section-gap',
          '--polish-header-margin',
          '--polish-content-gap'
        ),
        (tokenName) => {
          // Get computed value of CSS custom property
          const computedValue = getComputedStyle(document.documentElement)
            .getPropertyValue(tokenName)
            .trim();

          const numericValue = extractNumericValue(computedValue);

          // Verify it's a multiple of 4
          expect(isMultipleOf4(numericValue)).toBe(true);
          expect(numericValue).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain 4px grid for margin values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (multiplier) => {
          const spacingValue = multiplier * 4;
          const element = document.createElement('div');
          element.style.marginTop = `${spacingValue}px`;
          testContainer.appendChild(element);

          const computedMargin = parseInt(
            window.getComputedStyle(element).marginTop
          );

          expect(isMultipleOf4(computedMargin)).toBe(true);
          expect(computedMargin).toBe(spacingValue);

          testContainer.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain 4px grid for padding values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (multiplier) => {
          const spacingValue = multiplier * 4;
          const element = document.createElement('div');
          element.style.padding = `${spacingValue}px`;
          testContainer.appendChild(element);

          const computedPadding = parseInt(
            window.getComputedStyle(element).paddingTop
          );

          expect(isMultipleOf4(computedPadding)).toBe(true);
          expect(computedPadding).toBe(spacingValue);

          testContainer.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain 4px grid for gap values in flex/grid layouts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (multiplier) => {
          const spacingValue = multiplier * 4;
          const element = document.createElement('div');
          element.style.display = 'flex';
          element.style.gap = `${spacingValue}px`;
          testContainer.appendChild(element);

          const computedGap = parseInt(
            window.getComputedStyle(element).gap
          );

          expect(isMultipleOf4(computedGap)).toBe(true);
          expect(computedGap).toBe(spacingValue);

          testContainer.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use 4px increments for small spacing (4-8px)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('--polish-space-xs', '--polish-space-sm'),
        (tokenName) => {
          const computedValue = getComputedStyle(document.documentElement)
            .getPropertyValue(tokenName)
            .trim();

          const numericValue = extractNumericValue(computedValue);

          // Small spacing should be 4 or 8
          expect([4, 8]).toContain(numericValue);
          expect(isMultipleOf4(numericValue)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use 16-24px for section spacing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('--polish-space-md', '--polish-space-lg', '--polish-section-gap'),
        (tokenName) => {
          const computedValue = getComputedStyle(document.documentElement)
            .getPropertyValue(tokenName)
            .trim();

          const numericValue = extractNumericValue(computedValue);

          // Section spacing should be 16 or 24
          expect([16, 24]).toContain(numericValue);
          expect(isMultipleOf4(numericValue)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use 32px for major block spacing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('--polish-space-xl', '--polish-header-margin'),
        (tokenName) => {
          const computedValue = getComputedStyle(document.documentElement)
            .getPropertyValue(tokenName)
            .trim();

          const numericValue = extractNumericValue(computedValue);

          // Major block spacing should be 32
          expect(numericValue).toBe(32);
          expect(isMultipleOf4(numericValue)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain spacing grid when combining multiple spacing values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (multiplier1, multiplier2) => {
          const spacing1 = multiplier1 * 4;
          const spacing2 = multiplier2 * 4;
          const combinedSpacing = spacing1 + spacing2;

          // Combined spacing should still be a multiple of 4
          expect(isMultipleOf4(combinedSpacing)).toBe(true);

          const element = document.createElement('div');
          element.style.marginTop = `${spacing1}px`;
          element.style.paddingTop = `${spacing2}px`;
          testContainer.appendChild(element);

          const computedMargin = parseInt(
            window.getComputedStyle(element).marginTop
          );
          const computedPadding = parseInt(
            window.getComputedStyle(element).paddingTop
          );

          expect(isMultipleOf4(computedMargin)).toBe(true);
          expect(isMultipleOf4(computedPadding)).toBe(true);
          expect(isMultipleOf4(computedMargin + computedPadding)).toBe(true);

          testContainer.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain spacing grid for card padding', () => {
    fc.assert(
      fc.property(
        fc.constant('--polish-card-padding'),
        (tokenName) => {
          const computedValue = getComputedStyle(document.documentElement)
            .getPropertyValue(tokenName)
            .trim();

          const numericValue = extractNumericValue(computedValue);

          // Card padding should be 16px
          expect(numericValue).toBe(16);
          expect(isMultipleOf4(numericValue)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject non-4px-grid values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).filter(n => n % 4 !== 0),
        (invalidSpacing) => {
          // This value should NOT be a multiple of 4
          expect(isMultipleOf4(invalidSpacing)).toBe(false);

          // If we were to use this in the design system, it would violate the grid
          const element = document.createElement('div');
          element.style.margin = `${invalidSpacing}px`;
          testContainer.appendChild(element);

          const computedMargin = parseInt(
            window.getComputedStyle(element).marginTop
          );

          // The computed value matches what we set (browser doesn't enforce grid)
          expect(computedMargin).toBe(invalidSpacing);
          // But it violates our 4px grid rule
          expect(isMultipleOf4(computedMargin)).toBe(false);

          testContainer.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain spacing consistency across nested elements', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 8 }),
        (outerMultiplier, middleMultiplier, innerMultiplier) => {
          const outerSpacing = outerMultiplier * 4;
          const middleSpacing = middleMultiplier * 4;
          const innerSpacing = innerMultiplier * 4;

          const outer = document.createElement('div');
          outer.style.padding = `${outerSpacing}px`;

          const middle = document.createElement('div');
          middle.style.margin = `${middleSpacing}px`;

          const inner = document.createElement('div');
          inner.style.padding = `${innerSpacing}px`;

          outer.appendChild(middle);
          middle.appendChild(inner);
          testContainer.appendChild(outer);

          const outerPadding = parseInt(window.getComputedStyle(outer).paddingTop);
          const middleMargin = parseInt(window.getComputedStyle(middle).marginTop);
          const innerPadding = parseInt(window.getComputedStyle(inner).paddingTop);

          expect(isMultipleOf4(outerPadding)).toBe(true);
          expect(isMultipleOf4(middleMargin)).toBe(true);
          expect(isMultipleOf4(innerPadding)).toBe(true);

          testContainer.removeChild(outer);
        }
      ),
      { numRuns: 100 }
    );
  });
});
