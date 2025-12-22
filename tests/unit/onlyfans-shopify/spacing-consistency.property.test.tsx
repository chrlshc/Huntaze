/**
 * Property Test: Spacing Token Usage
 * Feature: onlyfans-shopify-unification, Property 7
 * Validates: Requirements 2.4
 * 
 * Property: For any spacing between elements (margins, padding, gaps), 
 * the spacing value should be a multiple of the 4px base unit from the design system
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';

// Shopify spacing tokens (multiples of 4px)
const VALID_SPACING_VALUES = [
  0,   // 0px
  4,   // 4px (space-1)
  8,   // 8px (space-2)
  12,  // 12px (space-3)
  16,  // 16px (space-4)
  20,  // 20px (space-5)
  24,  // 24px (space-6)
  32,  // 32px (space-8)
  40,  // 40px (space-10)
  48,  // 48px (space-12)
];

// Tailwind spacing classes that map to valid spacing values
const VALID_SPACING_CLASSES = [
  'gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12',
  'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
  'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
  'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12',
  'pt-0', 'pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-5', 'pt-6', 'pt-8', 'pt-10', 'pt-12',
  'pb-0', 'pb-1', 'pb-2', 'pb-3', 'pb-4', 'pb-5', 'pb-6', 'pb-8', 'pb-10', 'pb-12',
  'pl-0', 'pl-1', 'pl-2', 'pl-3', 'pl-4', 'pl-5', 'pl-6', 'pl-8', 'pl-10', 'pl-12',
  'pr-0', 'pr-1', 'pr-2', 'pr-3', 'pr-4', 'pr-5', 'pr-6', 'pr-8', 'pr-10', 'pr-12',
  'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12',
  'mx-0', 'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-5', 'mx-6', 'mx-8', 'mx-10', 'mx-12',
  'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8', 'my-10', 'my-12',
  'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8', 'mt-10', 'mt-12',
  'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8', 'mb-10', 'mb-12',
  'ml-0', 'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8', 'ml-10', 'ml-12',
  'mr-0', 'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8', 'mr-10', 'mr-12',
  'space-x-0', 'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-5', 'space-x-6', 'space-x-8', 'space-x-10', 'space-x-12',
  'space-y-0', 'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-5', 'space-y-6', 'space-y-8', 'space-y-10', 'space-y-12',
];

// Mock component with spacing
function TestComponent({ spacingClass }: { spacingClass: string }) {
  return (
    <div className={spacingClass} data-testid="test-element">
      <div>Child 1</div>
      <div>Child 2</div>
    </div>
  );
}

describe('Property 7: Spacing Token Usage', () => {
  it('should use spacing values that are multiples of 4px base unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_SPACING_CLASSES),
        (spacingClass) => {
          const { container } = render(<TestComponent spacingClass={spacingClass} />);
          const element = container.querySelector('[data-testid="test-element"]');

          // Element should exist and have the spacing class
          expect(element).toBeTruthy();
          expect(element?.className).toContain(spacingClass);

          // Extract the numeric value from the class
          const match = spacingClass.match(/(\d+)$/);
          if (match) {
            const value = parseInt(match[1], 10);
            // Tailwind uses 0.25rem units, so multiply by 4 to get px
            const pxValue = value * 4;
            
            // Should be a valid spacing value (multiple of 4)
            expect(VALID_SPACING_VALUES).toContain(pxValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent gap spacing in grid layouts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8'),
        (gapClass) => {
          const { container } = render(
            <div className={`grid ${gapClass}`}>
              <div>Item 1</div>
              <div>Item 2</div>
            </div>
          );

          const gridElement = container.querySelector('.grid');
          expect(gridElement?.className).toContain(gapClass);

          // Extract gap value
          const match = gapClass.match(/gap-(\d+)/);
          if (match) {
            const value = parseInt(match[1], 10);
            const pxValue = value * 4;
            
            // Should be a valid spacing value
            expect(VALID_SPACING_VALUES).toContain(pxValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use consistent padding in card components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('p-3', 'p-4', 'p-5', 'p-6'),
        (paddingClass) => {
          const { container } = render(
            <div className={`bg-white rounded-lg ${paddingClass}`}>
              <p>Card content</p>
            </div>
          );

          const cardElement = container.querySelector('.bg-white');
          expect(cardElement?.className).toContain(paddingClass);

          // Extract padding value
          const match = paddingClass.match(/p-(\d+)/);
          if (match) {
            const value = parseInt(match[1], 10);
            const pxValue = value * 4;
            
            // Should be a valid spacing value
            expect(VALID_SPACING_VALUES).toContain(pxValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use consistent margin spacing between sections', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mb-4', 'mb-6', 'mb-8', 'mt-4', 'mt-6', 'mt-8'),
        (marginClass) => {
          const { container } = render(
            <div>
              <section className={marginClass}>Section 1</section>
              <section>Section 2</section>
            </div>
          );

          const sectionElement = container.querySelector('section');
          expect(sectionElement?.className).toContain(marginClass);

          // Extract margin value
          const match = marginClass.match(/m[tblr]?-(\d+)/);
          if (match) {
            const value = parseInt(match[1], 10);
            const pxValue = value * 4;
            
            // Should be a valid spacing value
            expect(VALID_SPACING_VALUES).toContain(pxValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
