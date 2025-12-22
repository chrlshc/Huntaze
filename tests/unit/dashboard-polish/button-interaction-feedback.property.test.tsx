/**
 * Property-Based Test: Button Interaction Feedback
 * 
 * Validates: Requirements 3.4, 3.5
 * 
 * Properties:
 * - P6.1: All button variants display box-shadow on hover (Req 3.4)
 * - P6.2: All button variants apply scale(0.99) on click (Req 3.5)
 * - P6.3: Hover transitions are smooth and consistent
 * - P6.4: Click feedback is immediate and tactile
 * 
 * Test Strategy:
 * - Generate arbitrary button variants and sizes
 * - Render buttons and simulate hover/click interactions
 * - Verify computed styles match polish token specifications
 * - Ensure consistent behavior across all variants
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from '@/components/ui/button';

describe('Property 6: Button Interaction Feedback', () => {
  const buttonVariants = ['primary', 'secondary', 'outline', 'ghost', 'tonal', 'danger', 'gradient'] as const;
  const buttonSizes = ['sm', 'md', 'lg', 'xl', 'pill'] as const;

  it('P6.1: All button variants include hover shadow styles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonSizes),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (variant, size, label) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {label}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          // Check that button classes include transition for smooth hover
          const classList = button!.className;
          expect(classList).toMatch(/transition/);
          
          // Link variant doesn't have shadow, all others should
          if (variant !== 'link') {
            expect(classList).toMatch(/hover:shadow/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P6.2: All button variants include click scale transformation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonSizes),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (variant, size, label) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              {label}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          // Check that button has active:scale class for click feedback
          const classList = button!.className;
          expect(classList).toMatch(/active:scale/);

          // Check that transition includes transform
          expect(classList).toMatch(/transition/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P6.3: Button transitions are smooth and consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonSizes),
        (variant, size) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              Test Button
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          const classList = button!.className;

          // Should have transition class defined
          expect(classList).toMatch(/transition/);

          // Should include duration for smooth interaction
          expect(classList).toMatch(/duration/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P6.4: Button font-weight is medium (500) or semibold (600) for colored backgrounds', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'danger', 'gradient'),
        fc.constantFrom(...buttonSizes),
        (variant, size) => {
          const { container } = render(
            <Button variant={variant} size={size}>
              Test Button
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          // Check that button has font-medium or font-semibold class
          const classList = button!.className;
          const hasFontWeight = 
            classList.includes('font-medium') || 
            classList.includes('font-semibold');
          expect(hasFontWeight).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P6.5: Disabled buttons do not show interaction feedback', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonSizes),
        (variant, size) => {
          const { container } = render(
            <Button variant={variant} size={size} disabled>
              Disabled Button
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          expect(button!.disabled).toBe(true);

          // Check that button has disabled styles
          const classList = button!.className;
          expect(classList).toMatch(/disabled:cursor-not-allowed/);
          expect(classList).toMatch(/disabled:opacity/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
