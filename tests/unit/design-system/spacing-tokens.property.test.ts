/**
 * **Feature: dashboard-design-refactor, Property 1: Spacing tokens are multiples of 4px**
 * **Validates: Requirements 1.1**
 * 
 * Property-based test ensuring all spacing tokens follow the 4px grid system.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  DEFAULT_SPACING_TOKENS, 
  SpacingTokens,
  isMultipleOf4px 
} from '@/lib/design-system';

describe('Property 1: Spacing tokens are multiples of 4px', () => {
  /**
   * Property: For any spacing token in the design system, 
   * its numeric value SHALL be a multiple of 4 pixels.
   */
  it('all default spacing tokens are multiples of 4px', () => {
    Object.entries(DEFAULT_SPACING_TOKENS).forEach(([key, value]) => {
      expect(
        isMultipleOf4px(value),
        `Spacing token '${key}' with value '${value}' should be a multiple of 4px`
      ).toBe(true);
    });
  });

  /**
   * Property-based test: For any generated spacing value that is a multiple of 4,
   * the isMultipleOf4px validator should return true.
   */
  it('validates multiples of 4px correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (multiplier) => {
          const value = `${multiplier * 4}px`;
          return isMultipleOf4px(value) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: For any generated spacing value that is NOT a multiple of 4,
   * the isMultipleOf4px validator should return false.
   */
  it('rejects non-multiples of 4px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).filter(n => n % 4 !== 0),
        (value) => {
          return isMultipleOf4px(`${value}px`) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero is a valid spacing value
   */
  it('accepts zero as valid spacing', () => {
    expect(isMultipleOf4px('0')).toBe(true);
    expect(isMultipleOf4px('0px')).toBe(true);
  });

  /**
   * Property: All spacing token keys map to expected pixel values
   */
  it('spacing scale follows 4px grid progression', () => {
    const expectedValues: Record<keyof SpacingTokens, number> = {
      '0': 0,
      '1': 4,
      '2': 8,
      '3': 12,
      '4': 16,
      '5': 20,
      '6': 24,
      '7': 28,
      '8': 32,
      '10': 40,
      '12': 48,
      '16': 64,
      '20': 80,
      '24': 96,
      '32': 128,
    };

    Object.entries(expectedValues).forEach(([key, expectedPx]) => {
      const tokenValue = DEFAULT_SPACING_TOKENS[key as keyof SpacingTokens];
      const actualPx = parseInt(tokenValue, 10);
      expect(actualPx).toBe(expectedPx);
      expect(actualPx % 4).toBe(0);
    });
  });
});
