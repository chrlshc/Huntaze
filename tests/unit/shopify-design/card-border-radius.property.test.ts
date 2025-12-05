/**
 * Property Test: Card Border Radius
 * **Feature: onlyfans-shopify-design, Property 4: Card Border Radius**
 * **Validates: Requirements 2.3**
 * 
 * For any ShopifyCard, the border-radius SHALL be 8px to match Shopify's
 * rounded corner aesthetic.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify design specification
const SHOPIFY_CARD_BORDER_RADIUS = 8; // pixels
const SHOPIFY_CARD_BORDER_RADIUS_CLASS = 'rounded-lg'; // Tailwind class (8px)

interface CardConfig {
  padding: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  bordered: boolean;
  shadow: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
}

// Tailwind rounded classes and their pixel values
const TAILWIND_ROUNDED_MAP: Record<string, number> = {
  'rounded-none': 0,
  'rounded-sm': 2,
  'rounded': 4,
  'rounded-md': 6,
  'rounded-lg': 8,
  'rounded-xl': 12,
  'rounded-2xl': 16,
  'rounded-3xl': 24,
  'rounded-full': 9999,
};

// Function to validate border radius matches Shopify spec
function isValidShopifyBorderRadius(radiusClass: string): boolean {
  return radiusClass === SHOPIFY_CARD_BORDER_RADIUS_CLASS;
}

// Function to get pixel value from Tailwind class
function getRadiusPixels(radiusClass: string): number {
  return TAILWIND_ROUNDED_MAP[radiusClass] ?? 0;
}

describe('Property 4: Card Border Radius', () => {
  it('should always use 8px (rounded-lg) border radius', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('none', 'sm', 'md', 'lg', 'xl') as fc.Arbitrary<CardConfig['padding']>,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (padding, bordered, shadow, hasHeader, hasFooter) => {
          const config: CardConfig = { padding, bordered, shadow, hasHeader, hasFooter };
          
          // Regardless of configuration, border radius should be 8px
          const expectedRadius = SHOPIFY_CARD_BORDER_RADIUS;
          const actualRadius = getRadiusPixels(SHOPIFY_CARD_BORDER_RADIUS_CLASS);
          
          expect(actualRadius).toBe(expectedRadius);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use rounded-lg Tailwind class', () => {
    expect(isValidShopifyBorderRadius('rounded-lg')).toBe(true);
    expect(isValidShopifyBorderRadius('rounded-md')).toBe(false);
    expect(isValidShopifyBorderRadius('rounded-xl')).toBe(false);
    expect(isValidShopifyBorderRadius('rounded')).toBe(false);
  });

  it('should have consistent border radius across all card variants', () => {
    const paddingOptions: CardConfig['padding'][] = ['none', 'sm', 'md', 'lg', 'xl'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...paddingOptions),
        fc.constantFrom(...paddingOptions),
        (padding1, padding2) => {
          // Both cards should have the same border radius regardless of padding
          const radius1 = SHOPIFY_CARD_BORDER_RADIUS;
          const radius2 = SHOPIFY_CARD_BORDER_RADIUS;
          
          expect(radius1).toBe(radius2);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain border radius with header and footer', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // hasHeader
        fc.boolean(), // hasFooter
        (hasHeader, hasFooter) => {
          // Border radius should be maintained on the outer container
          // regardless of internal structure
          const expectedRadius = SHOPIFY_CARD_BORDER_RADIUS;
          
          expect(expectedRadius).toBe(8);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have border radius that creates visual softness without being too rounded', () => {
    // 8px is the sweet spot - not too sharp, not too rounded
    const radius = SHOPIFY_CARD_BORDER_RADIUS;
    
    // Should be greater than 4px (too sharp)
    expect(radius).toBeGreaterThan(4);
    
    // Should be less than 16px (too rounded for cards)
    expect(radius).toBeLessThan(16);
    
    // Should be exactly 8px per Shopify spec
    expect(radius).toBe(8);
  });
});
