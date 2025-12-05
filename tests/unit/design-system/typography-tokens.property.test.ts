/**
 * **Feature: dashboard-design-refactor, Property 5: Typography scale is constrained**
 * **Feature: dashboard-design-refactor, Property 6: Font weights are constrained**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * Property-based tests ensuring typography tokens follow the design system constraints.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  DEFAULT_TYPOGRAPHY_TOKENS,
  isAllowedFontSize,
  isAllowedFontWeight,
} from '@/lib/design-system';

describe('Property 5: Typography scale is constrained', () => {
  const ALLOWED_FONT_SIZES = ['12px', '14px', '16px', '20px', '24px', '28px'];

  /**
   * Property: For any font-size token in the design system,
   * its value SHALL be one of the allowed scale values.
   */
  it('all default font size tokens are in allowed scale', () => {
    Object.entries(DEFAULT_TYPOGRAPHY_TOKENS.sizes).forEach(([key, value]) => {
      expect(
        isAllowedFontSize(value),
        `Font size '${key}' with value '${value}' should be in allowed scale: ${ALLOWED_FONT_SIZES.join(', ')}`
      ).toBe(true);
    });
  });

  /**
   * Property-based test: Allowed font sizes are recognized
   */
  it('validates allowed font sizes correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_FONT_SIZES),
        (size) => {
          return isAllowedFontSize(size) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Non-allowed font sizes are rejected
   */
  it('rejects non-allowed font sizes', () => {
    const nonAllowedSizes = ['10px', '11px', '13px', '15px', '17px', '18px', '19px', '22px', '30px'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nonAllowedSizes),
        (size) => {
          return isAllowedFontSize(size) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Typography scale covers expected range
   */
  it('typography scale covers xs to 2xl range', () => {
    const expectedMapping: Record<string, string> = {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '28px',
    };

    Object.entries(expectedMapping).forEach(([key, expected]) => {
      expect(DEFAULT_TYPOGRAPHY_TOKENS.sizes[key as keyof typeof DEFAULT_TYPOGRAPHY_TOKENS.sizes]).toBe(expected);
    });
  });

  /**
   * Property: Invalid font size formats are rejected
   */
  it('rejects invalid font size formats', () => {
    const invalidFormats = ['16', '16rem', '1em', 'large', ''];
    
    invalidFormats.forEach(format => {
      expect(
        isAllowedFontSize(format),
        `'${format}' should be rejected as invalid font size`
      ).toBe(false);
    });
  });
});

describe('Property 6: Font weights are constrained', () => {
  const ALLOWED_FONT_WEIGHTS = [400, 500, 600];

  /**
   * Property: For any font-weight token in the design system,
   * its value SHALL be one of the allowed weights.
   */
  it('all default font weight tokens are in allowed values', () => {
    Object.entries(DEFAULT_TYPOGRAPHY_TOKENS.weights).forEach(([key, value]) => {
      expect(
        isAllowedFontWeight(value),
        `Font weight '${key}' with value '${value}' should be in allowed values: ${ALLOWED_FONT_WEIGHTS.join(', ')}`
      ).toBe(true);
    });
  });

  /**
   * Property-based test: Allowed font weights are recognized
   */
  it('validates allowed font weights correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_FONT_WEIGHTS),
        (weight) => {
          return isAllowedFontWeight(weight) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Non-allowed font weights are rejected
   */
  it('rejects non-allowed font weights', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 900 }).filter(w => !ALLOWED_FONT_WEIGHTS.includes(w)),
        (weight) => {
          return isAllowedFontWeight(weight) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Font weights map to semantic names
   */
  it('font weights have semantic names', () => {
    expect(DEFAULT_TYPOGRAPHY_TOKENS.weights.regular).toBe(400);
    expect(DEFAULT_TYPOGRAPHY_TOKENS.weights.medium).toBe(500);
    expect(DEFAULT_TYPOGRAPHY_TOKENS.weights.semibold).toBe(600);
  });

  /**
   * Property: Font family is defined
   */
  it('font family is defined and includes fallbacks', () => {
    const fontFamily = DEFAULT_TYPOGRAPHY_TOKENS.fontFamily;
    expect(fontFamily).toBeTruthy();
    expect(fontFamily).toContain('Inter');
    expect(fontFamily).toContain('sans-serif');
  });
});
