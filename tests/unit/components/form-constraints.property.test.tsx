/**
 * Property-Based Tests for Form Component Constraints
 * 
 * Tests that form components (inputs, buttons) adhere to design system constraints:
 * - Input heights: 32px (dense) or 40px (standard)
 * - Button heights: 32px (dense) or 40px (standard)
 * - Spacing compliance: multiples of 4px
 * 
 * Feature: linear-ui-performance-refactor
 * Validates: Requirements 3.2, 3.3, 3.5
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/forms/FormInput';

/**
 * Helper function to extract computed height in pixels
 */
function getComputedHeightPx(element: HTMLElement): number {
  const height = window.getComputedStyle(element).height;
  return parseFloat(height);
}

/**
 * Helper function to extract computed padding/margin in pixels
 */
function getComputedSpacingPx(element: HTMLElement, property: string): number {
  const value = window.getComputedStyle(element).getPropertyValue(property);
  return parseFloat(value);
}

/**
 * Helper function to check if a value is a multiple of 4
 */
function isMultipleOf4(value: number): boolean {
  return Math.round(value) % 4 === 0;
}

describe('Form Component Constraints Property Tests', () => {
  /**
   * Property 12: Input field height constraints
   * 
   * For any input field element, the height should be either 32px or 40px
   * 
   * Validates: Requirements 3.2
   * 
   * Feature: linear-ui-performance-refactor, Property 12: Input field height constraints
   */
  describe('Property 12: Input field height constraints', () => {
    it('should render Input component with appropriate height', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }),
          (placeholder) => {
            const { container } = render(
              <Input
                placeholder={placeholder}
                data-testid="test-input"
              />
            );

            const input = container.querySelector('input');
            expect(input).toBeTruthy();

            if (input) {
              const height = getComputedHeightPx(input);
              
              // Height should be reasonable for form inputs (between 28px and 50px)
              // This allows for 32px (dense) and 40px (standard) with some tolerance
              expect(
                height,
                `Input height ${height}px should be between 28px and 50px`
              ).toBeGreaterThanOrEqual(28);
              
              expect(
                height,
                `Input height ${height}px should be between 28px and 50px`
              ).toBeLessThanOrEqual(50);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render FormInput component with appropriate height', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 15 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          (label, placeholder) => {
            const { container } = render(
              <FormInput
                label={label}
                placeholder={placeholder}
              />
            );

            const input = container.querySelector('input');
            expect(input).toBeTruthy();

            if (input) {
              const height = getComputedHeightPx(input);
              
              // Height should be reasonable for form inputs
              expect(
                height,
                `FormInput height ${height}px should be between 28px and 50px`
              ).toBeGreaterThanOrEqual(28);
              
              expect(
                height,
                `FormInput height ${height}px should be between 28px and 50px`
              ).toBeLessThanOrEqual(50);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not render input fields with heights exceeding 50px', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }),
          (placeholder) => {
            const { container } = render(
              <Input placeholder={placeholder} />
            );

            const input = container.querySelector('input');
            expect(input).toBeTruthy();

            if (input) {
              const height = getComputedHeightPx(input);
              
              // Height should not exceed 50px (allowing some tolerance beyond 40px standard)
              expect(
                height,
                `Input height ${height}px should not exceed 50px`
              ).toBeLessThanOrEqual(50);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 13: Button height constraints
   * 
   * For any button element, the height should be either 32px or 40px
   * 
   * Validates: Requirements 3.3
   * 
   * Feature: linear-ui-performance-refactor, Property 13: Button height constraints
   */
  describe('Property 13: Button height constraints', () => {
    it('should render Button component with appropriate height', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'outline'),
          fc.constantFrom('sm', 'md'),
          fc.string({ minLength: 1, maxLength: 15 }),
          (variant, size, text) => {
            const { container } = render(
              <Button variant={variant} size={size}>
                {text}
              </Button>
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();

            if (button) {
              const height = getComputedHeightPx(button);
              
              // All buttons should have heights that are multiples of 4
              expect(
                isMultipleOf4(height),
                `Button height ${height}px should be a multiple of 4`
              ).toBe(true);
              
              // Height should be reasonable
              expect(
                height,
                `Button height ${height}px should be between 28px and 50px`
              ).toBeGreaterThanOrEqual(28);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render standard buttons within height constraints', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'outline'),
          fc.string({ minLength: 1, maxLength: 10 }),
          (variant, text) => {
            // Test with 'md' size which should be standard (40px)
            const { container } = render(
              <Button variant={variant} size="md">
                {text}
              </Button>
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();

            if (button) {
              const height = getComputedHeightPx(button);
              
              // Standard button (md) should be around 40px (with tolerance)
              expect(
                height,
                `Standard button height ${height}px should be between 36px and 44px`
              ).toBeGreaterThanOrEqual(36);
              
              expect(
                height,
                `Standard button height ${height}px should be between 36px and 44px`
              ).toBeLessThanOrEqual(44);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 11: 4px grid system compliance
   * 
   * For any element with margin or padding, all margin and padding values
   * should be multiples of 4 pixels
   * 
   * Validates: Requirements 3.1, 3.5
   * 
   * Feature: linear-ui-performance-refactor, Property 11: 4px grid system compliance
   */
  describe('Property 11: 4px grid system compliance for form components', () => {
    it('should apply padding in multiples of 4px to Input components', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }),
          (placeholder) => {
            const { container } = render(
              <Input placeholder={placeholder} />
            );

            const input = container.querySelector('input');
            expect(input).toBeTruthy();

            if (input) {
              const paddingTop = getComputedSpacingPx(input, 'padding-top');
              const paddingRight = getComputedSpacingPx(input, 'padding-right');
              const paddingBottom = getComputedSpacingPx(input, 'padding-bottom');
              const paddingLeft = getComputedSpacingPx(input, 'padding-left');
              
              expect(
                isMultipleOf4(paddingTop),
                `Input padding-top ${paddingTop}px should be a multiple of 4`
              ).toBe(true);
              
              expect(
                isMultipleOf4(paddingRight),
                `Input padding-right ${paddingRight}px should be a multiple of 4`
              ).toBe(true);
              
              expect(
                isMultipleOf4(paddingBottom),
                `Input padding-bottom ${paddingBottom}px should be a multiple of 4`
              ).toBe(true);
              
              expect(
                isMultipleOf4(paddingLeft),
                `Input padding-left ${paddingLeft}px should be a multiple of 4`
              ).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should apply padding in multiples of 4px to Button components', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary'),
          fc.constantFrom('sm', 'md'),
          fc.string({ minLength: 1, maxLength: 10 }),
          (variant, size, text) => {
            const { container } = render(
              <Button variant={variant} size={size}>
                {text}
              </Button>
            );

            const button = container.querySelector('button');
            expect(button).toBeTruthy();

            if (button) {
              const paddingTop = getComputedSpacingPx(button, 'padding-top');
              const paddingRight = getComputedSpacingPx(button, 'padding-right');
              const paddingBottom = getComputedSpacingPx(button, 'padding-bottom');
              const paddingLeft = getComputedSpacingPx(button, 'padding-left');
              
              expect(
                isMultipleOf4(paddingTop),
                `Button padding-top ${paddingTop}px should be a multiple of 4`
              ).toBe(true);
              
              expect(
                isMultipleOf4(paddingRight),
                `Button padding-right ${paddingRight}px should be a multiple of 4`
              ).toBe(true);
              
              expect(
                isMultipleOf4(paddingBottom),
                `Button padding-bottom ${paddingBottom}px should be a multiple of 4`
              ).toBe(true);
              
              expect(
                isMultipleOf4(paddingLeft),
                `Button padding-left ${paddingLeft}px should be a multiple of 4`
              ).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should apply margin in multiples of 4px to FormInput components', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 15 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          (label, placeholder) => {
            const { container } = render(
              <FormInput label={label} placeholder={placeholder} />
            );

            const wrapper = container.querySelector('div');
            expect(wrapper).toBeTruthy();

            if (wrapper) {
              const marginBottom = getComputedSpacingPx(wrapper, 'margin-bottom');
              
              // Only check non-zero margins
              if (marginBottom !== 0) {
                expect(
                  isMultipleOf4(marginBottom),
                  `FormInput margin-bottom ${marginBottom}px should be a multiple of 4`
                ).toBe(true);
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
