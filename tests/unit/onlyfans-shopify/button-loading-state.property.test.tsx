/**
 * Property-Based Test: Button Loading State
 * 
 * Property 19: For any button during action processing, the button should display 
 * a loading spinner and be disabled
 * 
 * Validates: Requirements 9.4
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShopifyButton, SHOPIFY_BUTTON_VARIANTS, SHOPIFY_BUTTON_SIZES } from '@/components/ui/shopify/ShopifyButton';

describe('Property 19: Button Loading State', () => {
  it('should display loading spinner when loading prop is true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton variant={variant} size={size} loading={true}>
              {buttonText}
            </ShopifyButton>
          );

          // Should have loading spinner (Loader2 icon with animate-spin class)
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toBeTruthy();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be disabled when loading prop is true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              size={size} 
              loading={true}
            >
              {buttonText}
            </ShopifyButton>
          );

          const button = container.querySelector('button');
          
          // Button should be disabled
          expect(button).toBeDisabled();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-busy attribute when loading', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              size={size} 
              loading={true}
            >
              {buttonText}
            </ShopifyButton>
          );

          const button = container.querySelector('button');
          
          // Should have aria-busy for accessibility
          expect(button).toHaveAttribute('aria-busy');
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display loading spinner when loading prop is false', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton variant={variant} size={size} loading={false}>
              {buttonText}
            </ShopifyButton>
          );

          // Should NOT have loading spinner
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toBeFalsy();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not be disabled when loading prop is false and disabled is not set', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              size={size} 
              loading={false}
            >
              {buttonText}
            </ShopifyButton>
          );

          const button = container.querySelector('button');
          
          // Button should NOT be disabled
          expect(button).not.toBeDisabled();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should hide icon when loading', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              size={size} 
              loading={true}
              icon={<span data-testid="button-icon">Icon</span>}
            >
              {buttonText}
            </ShopifyButton>
          );

          // Icon should not be rendered when loading
          const icon = container.querySelector('[data-testid="button-icon"]');
          expect(icon).toBeFalsy();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain button text visibility when loading', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              size={size} 
              loading={true}
            >
              {buttonText}
            </ShopifyButton>
          );

          // Button text should still be visible
          expect(container.textContent).toContain(buttonText);
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply loading state regardless of variant', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              loading={true}
            >
              {buttonText}
            </ShopifyButton>
          );

          const button = container.querySelector('button');
          const spinner = container.querySelector('.animate-spin');
          
          // All variants should show spinner and be disabled when loading
          expect(spinner).toBeTruthy();
          expect(button).toBeDisabled();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply loading state regardless of size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_SIZES),
        fc.string({ minLength: 1, maxLength: 50 }),
        (size, buttonText) => {
          const { container, unmount } = render(
            <ShopifyButton 
              size={size} 
              loading={true}
            >
              {buttonText}
            </ShopifyButton>
          );

          const button = container.querySelector('button');
          const spinner = container.querySelector('.animate-spin');
          
          // All sizes should show spinner and be disabled when loading
          expect(spinner).toBeTruthy();
          expect(button).toBeDisabled();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain fullWidth prop when loading', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SHOPIFY_BUTTON_VARIANTS),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (variant, buttonText, fullWidth) => {
          const { container, unmount } = render(
            <ShopifyButton 
              variant={variant} 
              loading={true}
              fullWidth={fullWidth}
            >
              {buttonText}
            </ShopifyButton>
          );

          const button = container.querySelector('button');
          
          // Should maintain fullWidth class when loading
          if (fullWidth) {
            expect(button).toHaveClass('w-full');
          } else {
            expect(button).not.toHaveClass('w-full');
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
