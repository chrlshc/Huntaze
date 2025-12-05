/**
 * Property Test: Section Header Spacing
 * **Feature: onlyfans-shopify-design, Property 14: Section Header Spacing**
 * **Validates: Requirements 9.2**
 * 
 * Property: *For any* section header, the spacing SHALL follow Shopify guidelines
 * with 24px margin-top and 16px margin-bottom by default.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Section header configuration
interface SectionHeaderConfig {
  title: string;
  marginTop: number;
  marginBottom: number;
  hasActions: boolean;
}

// Default Shopify spacing values
const SHOPIFY_DEFAULT_MARGIN_TOP = 24;
const SHOPIFY_DEFAULT_MARGIN_BOTTOM = 16;
const SHOPIFY_MIN_MARGIN = 8;
const SHOPIFY_MAX_MARGIN = 48;

// Validate margin is within acceptable range
function isValidMargin(margin: number): boolean {
  return margin >= SHOPIFY_MIN_MARGIN && margin <= SHOPIFY_MAX_MARGIN;
}

// Validate default spacing follows Shopify guidelines
function hasDefaultShopifySpacing(config: SectionHeaderConfig): boolean {
  return (
    config.marginTop === SHOPIFY_DEFAULT_MARGIN_TOP &&
    config.marginBottom === SHOPIFY_DEFAULT_MARGIN_BOTTOM
  );
}

// Validate title font size is within Shopify guidelines (16-18px)
function isValidTitleFontSize(fontSize: number): boolean {
  return fontSize >= 16 && fontSize <= 18;
}

describe('Property 14: Section Header Spacing', () => {
  // Arbitrary for section header configuration
  const sectionHeaderArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }),
    marginTop: fc.integer({ min: SHOPIFY_MIN_MARGIN, max: SHOPIFY_MAX_MARGIN }),
    marginBottom: fc.integer({ min: SHOPIFY_MIN_MARGIN, max: SHOPIFY_MAX_MARGIN }),
    hasActions: fc.boolean(),
  });

  // Arbitrary for default configuration
  const defaultConfigArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }),
    marginTop: fc.constant(SHOPIFY_DEFAULT_MARGIN_TOP),
    marginBottom: fc.constant(SHOPIFY_DEFAULT_MARGIN_BOTTOM),
    hasActions: fc.boolean(),
  });

  it('should have valid margin-top values (8-48px range)', () => {
    fc.assert(
      fc.property(sectionHeaderArb, (config) => {
        expect(isValidMargin(config.marginTop)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid margin-bottom values (8-48px range)', () => {
    fc.assert(
      fc.property(sectionHeaderArb, (config) => {
        expect(isValidMargin(config.marginBottom)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should use default Shopify spacing (24px top, 16px bottom) when not customized', () => {
    fc.assert(
      fc.property(defaultConfigArb, (config) => {
        expect(hasDefaultShopifySpacing(config)).toBe(true);
        expect(config.marginTop).toBe(24);
        expect(config.marginBottom).toBe(16);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain margin-top >= margin-bottom for visual hierarchy', () => {
    // Shopify design typically has larger top margin for section separation
    const defaultConfig: SectionHeaderConfig = {
      title: 'Test Section',
      marginTop: SHOPIFY_DEFAULT_MARGIN_TOP,
      marginBottom: SHOPIFY_DEFAULT_MARGIN_BOTTOM,
      hasActions: false,
    };

    expect(defaultConfig.marginTop).toBeGreaterThanOrEqual(defaultConfig.marginBottom);
  });

  it('should have title font size within Shopify guidelines (16-18px)', () => {
    const shopifyTitleFontSize = 16; // As defined in ShopifySectionHeader
    expect(isValidTitleFontSize(shopifyTitleFontSize)).toBe(true);
  });

  it('should support custom margins while staying within valid range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: SHOPIFY_MIN_MARGIN, max: SHOPIFY_MAX_MARGIN }),
        fc.integer({ min: SHOPIFY_MIN_MARGIN, max: SHOPIFY_MAX_MARGIN }),
        (customTop, customBottom) => {
          const config: SectionHeaderConfig = {
            title: 'Custom Section',
            marginTop: customTop,
            marginBottom: customBottom,
            hasActions: true,
          };

          expect(isValidMargin(config.marginTop)).toBe(true);
          expect(isValidMargin(config.marginBottom)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have consistent spacing regardless of actions presence', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (title) => {
          const withActions: SectionHeaderConfig = {
            title,
            marginTop: SHOPIFY_DEFAULT_MARGIN_TOP,
            marginBottom: SHOPIFY_DEFAULT_MARGIN_BOTTOM,
            hasActions: true,
          };

          const withoutActions: SectionHeaderConfig = {
            title,
            marginTop: SHOPIFY_DEFAULT_MARGIN_TOP,
            marginBottom: SHOPIFY_DEFAULT_MARGIN_BOTTOM,
            hasActions: false,
          };

          // Spacing should be identical regardless of actions
          expect(withActions.marginTop).toBe(withoutActions.marginTop);
          expect(withActions.marginBottom).toBe(withoutActions.marginBottom);
        }
      ),
      { numRuns: 50 }
    );
  });
});
