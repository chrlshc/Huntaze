/**
 * **Feature: onlyfans-shopify-unification, Property 10: Button Component Consistency**
 * 
 * *For any* button element, the button should use ShopifyButton component or equivalent styling 
 * with consistent padding, border-radius, and hover states
 * 
 * **Validates: Requirements 3.5, 5.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, fireEvent } from '@testing-library/react';
import { ShopifyButton, SHOPIFY_BUTTON_VARIANTS, SHOPIFY_BUTTON_SIZES } from '@/components/ui/shopify/ShopifyButton';
import React from 'react';

// Arbitrary generators for button props
const buttonPropsArbitrary = fc.record({
  variant: fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
  size: fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
  loading: fc.boolean(),
  disabled: fc.boolean(),
  fullWidth: fc.boolean(),
  content: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
});

describe('Property 10: Button Component Consistency', () => {
  it('should have consistent border-radius (8px) for all variants', () => {
    fc.assert(
      fc.property(buttonPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyButton
            variant={props.variant}
            size={props.size}
            data-testid="test-button"
          >
            {props.content}
          </ShopifyButton>
        );

        const button = container.querySelector('[data-testid="test-button"]');
        expect(button).toBeTruthy();

        if (button) {
          // Should have rounded-[8px] class
          expect(button.classList.contains('rounded-[8px]')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have consistent padding based on size', () => {
    const sizeMap = {
      sm: { height: 'h-8', padding: 'px-3' },
      md: { height: 'h-10', padding: 'px-4' },
      lg: { height: 'h-12', padding: 'px-6' },
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        (size) => {
          const { container } = render(
            <ShopifyButton size={size} data-testid="test-button">
              Button
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            const expected = sizeMap[size];
            expect(button.classList.contains(expected.height)).toBe(true);
            expect(button.classList.contains(expected.padding)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have hover states for all non-disabled buttons', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...buttonPropsArbitrary.value,
          disabled: fc.constant(false),
          loading: fc.constant(false),
        }),
        (props) => {
          const { container } = render(
            <ShopifyButton
              variant={props.variant}
              disabled={props.disabled}
              loading={props.loading}
              data-testid="test-button"
            >
              {props.content}
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            // Should have transition class
            const hasTransition = button.className.includes('transition');
            expect(hasTransition).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show loading spinner when loading prop is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...buttonPropsArbitrary.value,
          loading: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyButton
              variant={props.variant}
              loading={props.loading}
              data-testid="test-button"
            >
              {props.content}
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            // Should have loading spinner (svg with animate-spin)
            const spinner = button.querySelector('.animate-spin');
            expect(spinner).toBeTruthy();
            
            // Should be disabled
            expect(button.getAttribute('disabled')).not.toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be disabled when disabled prop is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...buttonPropsArbitrary.value,
          disabled: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyButton
              variant={props.variant}
              disabled={props.disabled}
              data-testid="test-button"
            >
              {props.content}
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            expect(button.getAttribute('disabled')).not.toBeNull();
            expect(button.classList.contains('disabled:opacity-50')).toBe(true);
            expect(button.classList.contains('disabled:cursor-not-allowed')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have full width when fullWidth prop is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...buttonPropsArbitrary.value,
          fullWidth: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyButton
              variant={props.variant}
              fullWidth={props.fullWidth}
              data-testid="test-button"
            >
              {props.content}
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            expect(button.classList.contains('w-full')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have variant-specific styling', () => {
    const variantChecks = {
      primary: (button: Element) => {
        const hasPrimaryBg = button.className.includes('bg-[var(--shopify-btn-primary-bg');
        expect(hasPrimaryBg).toBe(true);
      },
      secondary: (button: Element) => {
        const hasSecondaryBorder = button.className.includes('border-[var(--shopify-btn-secondary-border');
        expect(hasSecondaryBorder).toBe(true);
      },
      plain: (button: Element) => {
        const hasPlainStyle = button.className.includes('bg-transparent');
        expect(hasPlainStyle).toBe(true);
      },
      destructive: (button: Element) => {
        const hasDestructiveBg = button.className.includes('bg-[var(--shopify-accent-error');
        expect(hasDestructiveBg).toBe(true);
      },
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        (variant) => {
          const { container } = render(
            <ShopifyButton variant={variant} data-testid="test-button">
              Button
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            variantChecks[variant](button);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be clickable when not disabled or loading', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...buttonPropsArbitrary.value,
          disabled: fc.constant(false),
          loading: fc.constant(false),
        }),
        (props) => {
          let clicked = false;
          const { container } = render(
            <ShopifyButton
              variant={props.variant}
              onClick={() => { clicked = true; }}
              data-testid="test-button"
            >
              {props.content}
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            fireEvent.click(button);
            expect(clicked).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not be clickable when disabled', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...buttonPropsArbitrary.value,
          disabled: fc.constant(true),
        }),
        (props) => {
          let clicked = false;
          const { container } = render(
            <ShopifyButton
              variant={props.variant}
              disabled={props.disabled}
              onClick={() => { clicked = true; }}
              data-testid="test-button"
            >
              {props.content}
            </ShopifyButton>
          );

          const button = container.querySelector('[data-testid="test-button"]');
          expect(button).toBeTruthy();

          if (button) {
            fireEvent.click(button);
            // Click should not trigger because button is disabled
            expect(clicked).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have focus-visible styles', () => {
    fc.assert(
      fc.property(buttonPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyButton
            variant={props.variant}
            data-testid="test-button"
          >
            {props.content}
          </ShopifyButton>
        );

        const button = container.querySelector('[data-testid="test-button"]');
        expect(button).toBeTruthy();

        if (button) {
          // Should have focus-visible classes
          expect(button.classList.contains('focus-visible:outline-none')).toBe(true);
          expect(button.classList.contains('focus-visible:ring-2')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent styling across all button instances', () => {
    fc.assert(
      fc.property(
        fc.array(buttonPropsArbitrary, { minLength: 2, maxLength: 5 }),
        (buttonsProps) => {
          const buttons = buttonsProps.map((props, idx) => (
            <ShopifyButton
              key={idx}
              variant={props.variant}
              size={props.size}
              data-testid={`test-button-${idx}`}
            >
              {props.content}
            </ShopifyButton>
          ));

          const { container } = render(<div>{buttons}</div>);

          // All buttons should have consistent border-radius
          buttonsProps.forEach((_, idx) => {
            const button = container.querySelector(`[data-testid="test-button-${idx}"]`);
            expect(button).toBeTruthy();
            
            if (button) {
              expect(button.classList.contains('rounded-[8px]')).toBe(true);
              expect(button.classList.contains('inline-flex')).toBe(true);
              expect(button.classList.contains('items-center')).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
