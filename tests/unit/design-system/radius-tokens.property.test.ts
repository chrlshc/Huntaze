/**
 * **Feature: dashboard-design-refactor, Property 4: Radius tokens are valid CSS lengths**
 * **Validates: Requirements 1.4**
 * 
 * Property-based test ensuring all radius tokens are valid CSS length values.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  DEFAULT_RADIUS_TOKENS, 
  isValidCSSLength 
} from '@/lib/design-system';

describe('Property 4: Radius tokens are valid CSS lengths', () => {
  /**
   * Property: For any radius token in the design system,
   * its value SHALL be a valid CSS length value.
   */
  it('all default radius tokens are valid CSS lengths', () => {
    Object.entries(DEFAULT_RADIUS_TOKENS).forEach(([key, value]) => {
      expect(
        isValidCSSLength(value),
        `Radius token '${key}' with value '${value}' should be a valid CSS length`
      ).toBe(true);
    });
  });

  /**
   * Property-based test: Pixel values are valid CSS lengths
   */
  it('validates pixel values correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (value) => {
          return isValidCSSLength(`${value}px`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Rem values are valid CSS lengths
   */
  it('validates rem values correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        (value) => {
          return isValidCSSLength(`${value.toFixed(2)}rem`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Em values are valid CSS lengths
   */
  it('validates em values correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        (value) => {
          return isValidCSSLength(`${value.toFixed(2)}em`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero without unit is valid
   */
  it('accepts zero without unit', () => {
    expect(isValidCSSLength('0')).toBe(true);
  });

  /**
   * Property: Invalid length strings are rejected
   */
  it('rejects invalid length strings', () => {
    const invalidLengths = [
      'not-a-length',
      '',
      'auto',
      '10',  // number without unit (except 0)
      'px',
    ];

    invalidLengths.forEach(length => {
      expect(
        isValidCSSLength(length),
        `'${length}' should be rejected as invalid CSS length`
      ).toBe(false);
    });
  });

  /**
   * Property: Radius scale follows expected progression
   */
  it('radius scale follows expected progression', () => {
    const expectedValues: Record<string, string> = {
      sm: '4px',
      base: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    };

    Object.entries(expectedValues).forEach(([key, expected]) => {
      expect(DEFAULT_RADIUS_TOKENS[key as keyof typeof DEFAULT_RADIUS_TOKENS]).toBe(expected);
    });
  });

  /**
   * Property: All radius values (except full) are multiples of 4px
   */
  it('radius values follow 4px grid (except full)', () => {
    Object.entries(DEFAULT_RADIUS_TOKENS).forEach(([key, value]) => {
      if (key === 'full') {
        // Full is special case for pill shapes
        expect(value).toBe('9999px');
      } else {
        const numValue = parseInt(value, 10);
        expect(
          numValue % 4,
          `Radius '${key}' should be a multiple of 4px`
        ).toBe(0);
      }
    });
  });

  /**
   * Property: Percentage values are valid CSS lengths
   */
  it('validates percentage values correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (value) => {
          return isValidCSSLength(`${value}%`) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
