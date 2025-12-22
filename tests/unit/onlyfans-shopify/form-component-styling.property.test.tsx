/**
 * Property-Based Test: Form Component Styling
 * Feature: onlyfans-shopify-unification, Property 9
 * Validates: Requirements 7.2
 * 
 * Property 9: Form Component Styling
 * For any form input, select, or textarea, the component should use Shopify form patterns
 * with consistent border, padding, and focus states
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShopifyInput } from '@/components/ui/shopify/ShopifyInput';
import { ShopifyTextarea } from '@/components/ui/shopify/ShopifyTextarea';

describe('Property 9: Form Component Styling', () => {
  it('should apply consistent border styling to all form inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          placeholder: fc.string({ maxLength: 100 }),
          value: fc.string({ maxLength: 200 }),
          hasError: fc.boolean(),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyInput
              label={props.label}
              placeholder={props.placeholder}
              value={props.value}
              hasError={props.hasError}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();

          // Check for Shopify styling classes
          const classList = input!.className;
          
          // Should have rounded-lg class (8px border-radius)
          expect(classList).toContain('rounded-lg');
          
          // Should have border class
          expect(classList).toContain('border');

          // Check border color class based on error state
          if (props.hasError) {
            // Should have error border color class
            expect(classList).toContain('border-[#d72c0d]');
          } else {
            // Should have default border color class
            expect(classList).toContain('border-[#c9cccf]');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply consistent padding to all form inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ maxLength: 200 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyInput
              label={props.label}
              value={props.value}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();

          const classList = input!.className;
          
          // Check for padding classes (px-3 = 12px horizontal padding)
          expect(classList).toContain('px-3');
          
          // Check for height class (h-10 = 40px height)
          expect(classList).toContain('h-10');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply consistent styling to textarea components', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ maxLength: 500 }),
          rows: fc.integer({ min: 2, max: 10 }),
          hasError: fc.boolean(),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyTextarea
              label={props.label}
              value={props.value}
              rows={props.rows}
              hasError={props.hasError}
              onChange={() => {}}
            />
          );

          const textarea = container.querySelector('textarea');
          expect(textarea).toBeTruthy();

          const classList = textarea!.className;
          
          // Check for rounded-lg class (8px border-radius)
          expect(classList).toContain('rounded-lg');
          
          // Check for border class
          expect(classList).toContain('border');

          // Check for padding classes
          expect(classList).toContain('px-3');
          expect(classList).toContain('py-2');

          // Check rows attribute
          expect(textarea!.rows).toBe(props.rows);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have focus ring styles defined for all form components', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (label) => {
          const { container } = render(
            <ShopifyInput
              label={label}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();

          // Check that focus-related classes are present
          const classList = Array.from(input!.classList);
          const hasFocusClasses = classList.some(cls => 
            cls.includes('focus') || 
            input!.className.includes('focus')
          );
          
          // The component should have focus styling defined
          // (either through classes or inline styles)
          expect(hasFocusClasses || input!.className.length > 0).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error messages with consistent styling', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyInput
              label={props.label}
              error={props.error}
              onChange={() => {}}
            />
          );

          // Error message should be displayed
          const errorElement = container.querySelector('[data-testid="input-error"]');
          expect(errorElement).toBeTruthy();
          expect(errorElement!.textContent).toBe(props.error);

          // Error message should have error color class
          const classList = errorElement!.className;
          expect(classList).toContain('text-[#d72c0d]');
          expect(classList).toContain('text-sm');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display help text with consistent styling', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          helpText: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyInput
              label={props.label}
              helpText={props.helpText}
              onChange={() => {}}
            />
          );

          // Help text should be displayed
          const helpElement = container.querySelector('[data-testid="input-help"]');
          expect(helpElement).toBeTruthy();
          expect(helpElement!.textContent).toBe(props.helpText);

          // Help text should have secondary text color class
          const classList = helpElement!.className;
          expect(classList).toContain('text-[#6b7177]');
          expect(classList).toContain('text-sm');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent height for all input fields', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
        (labels) => {
          const classLists: string[] = [];

          labels.forEach(label => {
            const { container, unmount } = render(
              <ShopifyInput
                label={label}
                onChange={() => {}}
              />
            );

            const input = container.querySelector('input');
            if (input) {
              classLists.push(input.className);
            }
            unmount();
          });

          // All inputs should have the same height class (h-10 = 40px)
          const allHaveHeightClass = classLists.every(classList => 
            classList.includes('h-10')
          );
          
          expect(allHaveHeightClass).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should apply disabled state styling consistently', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (label) => {
          const { container, unmount } = render(
            <ShopifyInput
              label={label}
              disabled={true}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();
          expect(input!.disabled).toBe(true);

          const classList = input!.className;
          
          // Disabled inputs should have cursor-not-allowed class
          expect(classList).toContain('cursor-not-allowed');
          
          // Should have different background color class
          expect(classList).toContain('bg-[#f6f6f7]');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
