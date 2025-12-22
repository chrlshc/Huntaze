/**
 * Property-Based Test: Keyboard Focus Visibility
 * 
 * Validates: Requirements 3.2, 4.2, 4.5
 * 
 * Properties:
 * - P4.1: All interactive elements display visible focus indicators (Req 3.2, 4.5)
 * - P4.2: Focus rings meet accessibility standards (Req 4.2)
 * - P4.3: Focus indicators are distinct from hover states
 * - P4.4: Focus-visible is used for keyboard-only focus
 * 
 * Test Strategy:
 * - Generate arbitrary button variants and interactive elements
 * - Verify focus-visible outline styles are present
 * - Ensure focus indicators meet WCAG requirements
 * - Validate focus ring color and offset specifications
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from '@/components/ui/button';

describe('Property 4: Keyboard Focus Visibility', () => {
  const buttonVariants = ['primary', 'secondary', 'outline', 'ghost', 'tonal', 'danger', 'gradient', 'link'] as const;
  const buttonSizes = ['sm', 'md', 'lg', 'xl', 'pill'] as const;

  it('P4.1: All button variants include focus-visible outline styles', () => {
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

          // Check that button has focus-visible styles
          const classList = button!.className;
          expect(classList).toMatch(/focus-visible:outline/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P4.2: Focus indicators use accessible colors (violet with sufficient opacity)', () => {
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

          // Check that focus outline uses violet color (139, 92, 246)
          const classList = button!.className;
          
          // Should have focus-visible outline with rgba(139,92,246,0.8)
          expect(classList).toMatch(/focus-visible:outline-\[rgba\(139,92,246,0\.8\)\]/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P4.3: Focus indicators have appropriate offset for visibility', () => {
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

          // Check that focus outline has offset
          const classList = button!.className;
          expect(classList).toMatch(/focus-visible:outline-offset/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P4.4: Focus-visible removes default outline', () => {
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

          // Check that default outline is removed
          const classList = button!.className;
          expect(classList).toMatch(/focus-visible:outline-none/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P4.5: Focus indicators are consistent across all button variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonSizes),
        (variant1, variant2, size) => {
          const { container: container1 } = render(
            <Button variant={variant1} size={size}>
              Button 1
            </Button>
          );

          const { container: container2 } = render(
            <Button variant={variant2} size={size}>
              Button 2
            </Button>
          );

          const button1 = container1.querySelector('button');
          const button2 = container2.querySelector('button');

          expect(button1).toBeTruthy();
          expect(button2).toBeTruthy();

          // Extract focus-visible classes
          const getFocusClasses = (classList: string) => {
            return classList
              .split(' ')
              .filter(c => c.includes('focus-visible'))
              .sort()
              .join(' ');
          };

          const focus1 = getFocusClasses(button1!.className);
          const focus2 = getFocusClasses(button2!.className);

          // Focus styles should be identical across variants
          expect(focus1).toBe(focus2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P4.6: Disabled buttons maintain focus indicator structure', () => {
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

          // Even disabled buttons should have focus-visible styles
          // (though they won't be focusable in practice)
          const classList = button!.className;
          expect(classList).toMatch(/focus-visible:outline/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P4.7: Loading buttons maintain focus indicator structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        fc.constantFrom(...buttonSizes),
        (variant, size) => {
          const { container } = render(
            <Button variant={variant} size={size} loading>
              Loading Button
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          // Loading buttons should maintain focus-visible styles
          const classList = button!.className;
          expect(classList).toMatch(/focus-visible:outline/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
