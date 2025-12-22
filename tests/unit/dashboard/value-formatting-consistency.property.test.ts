/**
 * Property Test: Value Formatting Consistency
 * **Feature: creator-analytics-dashboard, Property 11: Value Formatting Consistency**
 * **Validates: Requirements 12.5, 12.6, 12.7**
 * 
 * For any numeric value, currency formatting SHALL produce a string matching pattern $X,XXX.XX or €X.XXX,XX.
 * For any percentage value, formatting SHALL produce a string with exactly one decimal place.
 * For any date, formatting SHALL use consistent locale format.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatNumber,
  formatDelta,
} from '@/lib/dashboard/formatters';

// ============================================
// Regex Patterns for Validation
// ============================================

// USD currency pattern: $X,XXX.XX or $X,XXX (no decimals for whole numbers)
// Matches: $0, $1, $12, $123, $1,234, $12,345.67, $1,234,567.89
const USD_CURRENCY_PATTERN = /^\$[\d,]+(\.\d{1,2})?$/;

// EUR currency pattern: €X.XXX,XX (European format with locale de-DE)
// Matches: €0, €1, €12, €123, €1.234, €12.345,67
const EUR_CURRENCY_PATTERN = /^[\d.,]+\s?€$/;

// Percentage pattern: X.X% (exactly one decimal place)
const PERCENTAGE_PATTERN = /^-?\d+\.\d%$/;

// Delta pattern: +X.X% or -X.X% or 0.0%
const DELTA_PATTERN = /^[+-]?\d+\.\d%$/;

// Date pattern for en-US short format: "Jan 1", "Dec 31", etc.
const DATE_SHORT_PATTERN = /^[A-Z][a-z]{2}\s\d{1,2}$/;

// DateTime pattern for en-US: "Jan 1, 12:00 PM" or similar
const DATETIME_PATTERN = /^[A-Z][a-z]{2}\s\d{1,2},?\s\d{1,2}:\d{2}\s?(AM|PM)?$/;

// ============================================
// Generators
// ============================================

// Generate valid numeric values for currency (non-negative, reasonable range)
const currencyValueArb = fc.double({ 
  min: 0, 
  max: 10000000, 
  noNaN: true,
  noDefaultInfinity: true,
});

// Generate percentage values (can be negative for deltas)
const percentageValueArb = fc.double({ 
  min: -1000, 
  max: 10000, 
  noNaN: true,
  noDefaultInfinity: true,
});

// Generate valid ISO date strings
const MIN_TIMESTAMP = new Date('2020-01-01').getTime();
const MAX_TIMESTAMP = new Date('2030-12-31').getTime();

const validDateStringArb = fc.integer({ min: MIN_TIMESTAMP, max: MAX_TIMESTAMP })
  .map(ts => new Date(ts).toISOString());

// ============================================
// Tests
// ============================================

describe('Value Formatting Consistency Property Tests', () => {
  /**
   * **Feature: creator-analytics-dashboard, Property 11: Value Formatting Consistency**
   * **Validates: Requirements 12.5**
   * 
   * Currency formatting SHALL produce a string matching pattern $X,XXX.XX
   */
  describe('Currency Formatting (Requirement 12.5)', () => {
    it('should format USD currency values with correct pattern', () => {
      fc.assert(
        fc.property(currencyValueArb, (value) => {
          const formatted = formatCurrency(value, 'USD', 'en-US');
          
          // Must start with $
          expect(formatted.startsWith('$')).toBe(true);
          
          // Must match USD pattern
          expect(formatted).toMatch(USD_CURRENCY_PATTERN);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should format EUR currency values with correct pattern', () => {
      fc.assert(
        fc.property(currencyValueArb, (value) => {
          const formatted = formatCurrency(value, 'EUR', 'de-DE');
          
          // Must contain € symbol
          expect(formatted).toContain('€');
          
          // Must match EUR pattern (€ at end for de-DE locale)
          expect(formatted).toMatch(EUR_CURRENCY_PATTERN);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve value magnitude in currency formatting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          (value) => {
            const formatted = formatCurrency(value, 'USD', 'en-US');
            
            // Extract numeric part and verify it represents the same magnitude
            const numericPart = formatted.replace(/[$,]/g, '');
            const parsedValue = parseFloat(numericPart);
            
            // Should be within rounding tolerance
            expect(Math.abs(parsedValue - value)).toBeLessThanOrEqual(0.01);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: creator-analytics-dashboard, Property 11: Value Formatting Consistency**
   * **Validates: Requirements 12.6**
   * 
   * Percentage formatting SHALL produce a string with exactly one decimal place
   */
  describe('Percentage Formatting (Requirement 12.6)', () => {
    it('should format percentages with exactly one decimal place', () => {
      fc.assert(
        fc.property(percentageValueArb, (value) => {
          const formatted = formatPercentage(value);
          
          // Must end with %
          expect(formatted.endsWith('%')).toBe(true);
          
          // Must match percentage pattern (X.X%)
          expect(formatted).toMatch(PERCENTAGE_PATTERN);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve sign in percentage formatting', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
          (value) => {
            const formatted = formatPercentage(value);
            
            // Extract numeric part (use + to convert -0 to 0)
            const numericPart = +parseFloat(formatted.replace('%', ''));
            
            // Sign should be preserved, accounting for rounding to 1 decimal place
            // Values very close to 0 may round to 0.0, so we check the rounded value
            const roundedValue = Math.round(value * 10) / 10;
            
            if (roundedValue > 0) {
              expect(numericPart).toBeGreaterThan(0);
            } else if (roundedValue < 0) {
              expect(numericPart).toBeLessThan(0);
            } else {
              // Value rounds to 0 (handle both 0 and -0)
              expect(Math.abs(numericPart)).toBe(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format delta values with sign prefix', () => {
      fc.assert(
        fc.property(percentageValueArb, (value) => {
          const result = formatDelta(value);
          
          // Must have text and trend
          expect(typeof result.text).toBe('string');
          expect(['up', 'down', 'neutral']).toContain(result.trend);
          
          // Text must match delta pattern
          expect(result.text).toMatch(DELTA_PATTERN);
          
          // Trend should match sign
          if (value > 0) {
            expect(result.trend).toBe('up');
            expect(result.text.startsWith('+')).toBe(true);
          } else if (value < 0) {
            expect(result.trend).toBe('down');
            expect(result.text.startsWith('-')).toBe(true);
          } else {
            expect(result.trend).toBe('neutral');
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: creator-analytics-dashboard, Property 11: Value Formatting Consistency**
   * **Validates: Requirements 12.7**
   * 
   * Date formatting SHALL use consistent locale format
   */
  describe('Date Formatting (Requirement 12.7)', () => {
    it('should format dates in consistent short format', () => {
      fc.assert(
        fc.property(validDateStringArb, (dateStr) => {
          const formatted = formatDate(dateStr, 'en-US');
          
          // Must match short date pattern (e.g., "Jan 1")
          expect(formatted).toMatch(DATE_SHORT_PATTERN);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should format datetime in consistent format', () => {
      fc.assert(
        fc.property(validDateStringArb, (dateStr) => {
          const formatted = formatDateTime(dateStr, 'en-US');
          
          // Must contain month abbreviation
          expect(formatted).toMatch(/[A-Z][a-z]{2}/);
          
          // Must contain time component
          expect(formatted).toMatch(/\d{1,2}:\d{2}/);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid dates from valid ISO strings', () => {
      fc.assert(
        fc.property(validDateStringArb, (dateStr) => {
          // Should not throw
          const formatted = formatDate(dateStr, 'en-US');
          
          // Result should be non-empty string
          expect(formatted.length).toBeGreaterThan(0);
          
          // Should not contain "Invalid"
          expect(formatted).not.toContain('Invalid');
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional consistency tests
   */
  describe('Number Formatting Consistency', () => {
    it('should format numbers with thousand separators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000000 }),
          (value) => {
            const formatted = formatNumber(value, 'en-US');
            
            // Should contain comma separators for values >= 1000
            expect(formatted).toContain(',');
            
            // Should not contain decimal point for integers
            expect(formatted).not.toContain('.');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve value in number formatting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          (value) => {
            const formatted = formatNumber(value, 'en-US');
            const parsed = parseInt(formatted.replace(/,/g, ''), 10);
            
            expect(parsed).toBe(value);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Idempotence and consistency tests
   */
  describe('Formatting Idempotence', () => {
    it('should produce consistent output for same input', () => {
      fc.assert(
        fc.property(currencyValueArb, (value) => {
          const first = formatCurrency(value, 'USD', 'en-US');
          const second = formatCurrency(value, 'USD', 'en-US');
          
          expect(first).toBe(second);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should produce consistent percentage output for same input', () => {
      fc.assert(
        fc.property(percentageValueArb, (value) => {
          const first = formatPercentage(value);
          const second = formatPercentage(value);
          
          expect(first).toBe(second);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
