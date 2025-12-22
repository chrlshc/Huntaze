/**
 * Property-Based Tests for URL Date Range Round-Trip
 * 
 * Feature: creator-analytics-dashboard, Property 3: URL Date Range Round-Trip
 * Validates: Requirements 2.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { DateRange, DateRangePreset } from '@/lib/dashboard/types';
import {
  serializeDateRange,
  parseDateRange,
  areDateRangesEqual,
} from '@/lib/dashboard/date-utils';

describe('**Feature: creator-analytics-dashboard, Property 3: URL Date Range Round-Trip**', () => {
  // Arbitrary pour générer des presets valides
  const presetArbitrary = fc.constantFrom<DateRangePreset>('today', '7d', '30d', '12m');

  // Arbitrary pour générer des dates ISO valides
  const isoDateArbitrary = fc
    .date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2030-12-31T00:00:00Z') })
    .map((date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

  // Arbitrary pour générer des DateRange preset
  const presetDateRangeArbitrary = fc
    .record({
      type: fc.constant('preset' as const),
      preset: presetArbitrary,
    });

  // Arbitrary pour générer des DateRange custom
  const customDateRangeArbitrary = fc
    .tuple(isoDateArbitrary, isoDateArbitrary)
    .filter(([from, to]) => {
      // Ensure both dates are valid ISO format
      const isValidFormat = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
      return isValidFormat(from) && isValidFormat(to) && from <= to;
    })
    .map(([from, to]) => ({
      type: 'custom' as const,
      from,
      to,
    }));

  // Arbitrary pour générer n'importe quel DateRange
  const dateRangeArbitrary = fc.oneof(
    presetDateRangeArbitrary,
    customDateRangeArbitrary
  );

  describe('Round-trip property', () => {
    it('should preserve preset DateRange through serialize -> parse cycle', () => {
      fc.assert(
        fc.property(presetDateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          const parsed = parseDateRange(serialized);
          
          if (parsed === null) return false;
          
          return areDateRangesEqual(range, parsed);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve custom DateRange through serialize -> parse cycle', () => {
      fc.assert(
        fc.property(customDateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          const parsed = parseDateRange(serialized);
          
          if (parsed === null) return false;
          
          return areDateRangesEqual(range, parsed);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve any DateRange through serialize -> parse cycle', () => {
      fc.assert(
        fc.property(dateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          const parsed = parseDateRange(serialized);
          
          if (parsed === null) return false;
          
          return areDateRangesEqual(range, parsed);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Serialization format', () => {
    it('should serialize preset ranges to single "range" parameter', () => {
      fc.assert(
        fc.property(presetDateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          
          if (range.type !== 'preset') return false;
          
          return (
            'range' in serialized &&
            serialized.range === range.preset &&
            !('from' in serialized) &&
            !('to' in serialized)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should serialize custom ranges to "from" and "to" parameters', () => {
      fc.assert(
        fc.property(customDateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          
          if (range.type !== 'custom') return false;
          
          return (
            'from' in serialized &&
            'to' in serialized &&
            serialized.from === range.from &&
            serialized.to === range.to &&
            !('range' in serialized)
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Parsing behavior', () => {
    it('should parse valid preset parameters correctly', () => {
      fc.assert(
        fc.property(presetArbitrary, (preset) => {
          const params = { range: preset };
          const parsed = parseDateRange(params);
          
          return (
            parsed !== null &&
            parsed.type === 'preset' &&
            parsed.preset === preset
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should parse valid custom date parameters correctly', () => {
      fc.assert(
        fc.property(
          isoDateArbitrary,
          isoDateArbitrary,
          (from, to) => {
            // Skip if either date is invalid
            if (!from.match(/^\d{4}-\d{2}-\d{2}$/) || !to.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return true; // Skip this test case
            }
            
            if (from > to) [from, to] = [to, from]; // Swap if needed
            
            const params = { from, to };
            const parsed = parseDateRange(params);
            
            return (
              parsed !== null &&
              parsed.type === 'custom' &&
              parsed.from === from &&
              parsed.to === to
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for invalid preset values', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !['today', '7d', '30d', '12m'].includes(s)),
          (invalidPreset) => {
            const params = { range: invalidPreset };
            const parsed = parseDateRange(params);
            
            return parsed === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for invalid date formats', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
          (invalidDate) => {
            const params = { from: invalidDate, to: '2024-01-01' };
            const parsed = parseDateRange(params);
            
            return parsed === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when required parameters are missing', () => {
      const emptyParams = {};
      const parsed = parseDateRange(emptyParams);
      expect(parsed).toBeNull();
    });
  });

  describe('URLSearchParams compatibility', () => {
    it('should work with URLSearchParams for preset ranges', () => {
      fc.assert(
        fc.property(presetDateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          const searchParams = new URLSearchParams(serialized);
          const parsed = parseDateRange(searchParams);
          
          if (parsed === null) return false;
          
          return areDateRangesEqual(range, parsed);
        }),
        { numRuns: 100 }
      );
    });

    it('should work with URLSearchParams for custom ranges', () => {
      fc.assert(
        fc.property(customDateRangeArbitrary, (range: DateRange) => {
          const serialized = serializeDateRange(range);
          const searchParams = new URLSearchParams(serialized);
          const parsed = parseDateRange(searchParams);
          
          if (parsed === null) return false;
          
          return areDateRangesEqual(range, parsed);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Specific examples', () => {
    it('should handle "today" preset', () => {
      const range: DateRange = { type: 'preset', preset: 'today' };
      const serialized = serializeDateRange(range);
      const parsed = parseDateRange(serialized);
      
      expect(parsed).toEqual(range);
    });

    it('should handle "7d" preset', () => {
      const range: DateRange = { type: 'preset', preset: '7d' };
      const serialized = serializeDateRange(range);
      const parsed = parseDateRange(serialized);
      
      expect(parsed).toEqual(range);
    });

    it('should handle custom date range', () => {
      const range: DateRange = { type: 'custom', from: '2024-01-01', to: '2024-01-31' };
      const serialized = serializeDateRange(range);
      const parsed = parseDateRange(serialized);
      
      expect(parsed).toEqual(range);
    });

    it('should handle same-day custom range', () => {
      const range: DateRange = { type: 'custom', from: '2024-01-15', to: '2024-01-15' };
      const serialized = serializeDateRange(range);
      const parsed = parseDateRange(serialized);
      
      expect(parsed).toEqual(range);
    });
  });
});
