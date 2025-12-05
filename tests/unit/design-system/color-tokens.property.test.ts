/**
 * **Feature: dashboard-design-refactor, Property 2: Color tokens are valid CSS colors**
 * **Validates: Requirements 1.2**
 * 
 * Property-based test ensuring all color tokens are valid CSS color values.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  DEFAULT_COLOR_TOKENS, 
  isValidCSSColor 
} from '@/lib/design-system';

describe('Property 2: Color tokens are valid CSS colors', () => {
  /**
   * Property: For any color token in the design system,
   * its value SHALL be a valid CSS color string.
   */
  it('all surface color tokens are valid CSS colors', () => {
    Object.entries(DEFAULT_COLOR_TOKENS.surface).forEach(([key, value]) => {
      expect(
        isValidCSSColor(value),
        `Surface color '${key}' with value '${value}' should be a valid CSS color`
      ).toBe(true);
    });
  });

  it('all text color tokens are valid CSS colors', () => {
    Object.entries(DEFAULT_COLOR_TOKENS.text).forEach(([key, value]) => {
      expect(
        isValidCSSColor(value),
        `Text color '${key}' with value '${value}' should be a valid CSS color`
      ).toBe(true);
    });
  });

  it('all action color tokens are valid CSS colors', () => {
    Object.entries(DEFAULT_COLOR_TOKENS.action).forEach(([key, value]) => {
      expect(
        isValidCSSColor(value),
        `Action color '${key}' with value '${value}' should be a valid CSS color`
      ).toBe(true);
    });
  });

  it('all status color tokens are valid CSS colors', () => {
    Object.entries(DEFAULT_COLOR_TOKENS.status).forEach(([key, value]) => {
      expect(
        isValidCSSColor(value),
        `Status color '${key}' with value '${value}' should be a valid CSS color`
      ).toBe(true);
    });
  });

  it('all border color tokens are valid CSS colors', () => {
    Object.entries(DEFAULT_COLOR_TOKENS.border).forEach(([key, value]) => {
      expect(
        isValidCSSColor(value),
        `Border color '${key}' with value '${value}' should be a valid CSS color`
      ).toBe(true);
    });
  });

  /**
   * Property-based test: Valid hex colors are recognized
   */
  it('validates hex colors correctly', () => {
    // 3-digit hex using stringMatching
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9A-Fa-f]{3}$/),
        (hex) => {
          return isValidCSSColor(`#${hex}`) === true;
        }
      ),
      { numRuns: 100 }
    );

    // 6-digit hex
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9A-Fa-f]{6}$/),
        (hex) => {
          return isValidCSSColor(`#${hex}`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Valid RGB colors are recognized
   */
  it('validates rgb colors correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          return isValidCSSColor(`rgb(${r}, ${g}, ${b})`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Valid RGBA colors are recognized
   */
  it('validates rgba colors correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (r, g, b, a) => {
          const alpha = a.toFixed(2);
          return isValidCSSColor(`rgba(${r}, ${g}, ${b}, ${alpha})`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid color strings are rejected
   */
  it('rejects invalid color strings', () => {
    // Note: rgb(300, 0, 0) is technically valid CSS - browsers clamp values
    const invalidColors = [
      'not-a-color',
      '#GGG',
      '',
      '123',
      'rgb()',
    ];

    invalidColors.forEach(color => {
      expect(
        isValidCSSColor(color),
        `'${color}' should be rejected as invalid CSS color`
      ).toBe(false);
    });
  });

  /**
   * Property: Named colors are recognized
   */
  it('validates named colors correctly', () => {
    const namedColors = ['transparent', 'currentColor', 'inherit', 'black', 'white'];
    
    namedColors.forEach(color => {
      expect(
        isValidCSSColor(color),
        `Named color '${color}' should be valid`
      ).toBe(true);
    });
  });
});
