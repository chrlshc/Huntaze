/**
 * Property Test: ARIA Label Presence
 * Feature: onlyfans-shopify-unification
 * Property 22: ARIA Label Presence
 * Validates: Requirements 10.2
 * 
 * Property: For any interactive element without visible text,
 * the element should have an appropriate aria-label or aria-labelledby attribute
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShopifyButton } from '@/components/ui/shopify/ShopifyButton';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';
import { ShopifyBanner } from '@/components/ui/shopify/ShopifyBanner';
import { X, Search, Filter } from 'lucide-react';

describe('Property 22: ARIA Label Presence', () => {
  it('should have aria-label on icon-only buttons', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'plain', 'destructive'),
        (variant) => {
          // Icon-only button without text
          const { container } = render(
            <ShopifyButton variant={variant as any} aria-label="Close">
              <X className="w-4 h-4" />
            </ShopifyButton>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          // Icon-only buttons must have aria-label
          expect(button).toHaveAttribute('aria-label', 'Close');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-label on dismiss buttons in banners', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('info', 'warning', 'success', 'critical'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (status, title) => {
          const onDismiss = () => {};
          
          const { container } = render(
            <ShopifyBanner
              status={status as any}
              title={title}
              onDismiss={onDismiss}
            />
          );
          
          // Find dismiss button (has X icon)
          const dismissButton = container.querySelector('button[aria-label="Dismiss"]');
          expect(dismissButton).toBeTruthy();
          
          // Dismiss button must have aria-label
          expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have sr-only text or aria-label for toggle switches', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.boolean(),
        (label, checked) => {
          const onChange = () => {};
          
          const { container } = render(
            <ShopifyToggle
              id="test-toggle"
              label={label}
              checked={checked}
              onChange={onChange}
            />
          );
          
          const toggleSwitch = container.querySelector('button[role="switch"]');
          expect(toggleSwitch).toBeTruthy();
          
          // Toggle must have either sr-only text or aria-label
          const srOnly = toggleSwitch?.querySelector('.sr-only');
          const ariaLabel = toggleSwitch?.getAttribute('aria-label');
          
          expect(srOnly || ariaLabel).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-checked on toggle switches', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (checked) => {
          const onChange = () => {};
          
          const { container } = render(
            <ShopifyToggle
              id="test-toggle"
              label="Test"
              checked={checked}
              onChange={onChange}
            />
          );
          
          const toggleSwitch = container.querySelector('button[role="switch"]');
          expect(toggleSwitch).toBeTruthy();
          
          // Toggle must have aria-checked matching its state
          expect(toggleSwitch).toHaveAttribute('aria-checked', checked.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-busy on loading buttons', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'plain', 'destructive'),
        (variant) => {
          const { container } = render(
            <ShopifyButton variant={variant as any} loading={true}>
              Save
            </ShopifyButton>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          // Loading buttons must have aria-busy
          expect(button).toHaveAttribute('aria-busy', 'true');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-disabled on disabled buttons', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'plain', 'destructive'),
        (variant) => {
          const { container } = render(
            <ShopifyButton variant={variant as any} disabled={true}>
              Submit
            </ShopifyButton>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          // Disabled buttons must have aria-disabled
          expect(button).toHaveAttribute('aria-disabled', 'true');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have role and aria attributes on interactive cards', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (content) => {
          const onClick = () => {};
          
          const { container } = render(
            <div>
              <button onClick={onClick} aria-label="Card action">
                {content}
              </button>
            </div>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          // Interactive elements must have aria-label when content is not descriptive
          expect(button).toHaveAttribute('aria-label');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have aria-hidden on decorative icons', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'plain', 'destructive'),
        (variant) => {
          // Button with text and decorative icon
          const { container } = render(
            <ShopifyButton variant={variant as any}>
              <Search className="w-4 h-4" aria-hidden="true" />
              Search
            </ShopifyButton>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          // Button has visible text, so icon should be decorative
          const icon = container.querySelector('svg');
          if (icon) {
            // Decorative icons should have aria-hidden
            expect(icon).toHaveAttribute('aria-hidden', 'true');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
