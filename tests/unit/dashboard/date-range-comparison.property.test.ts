/**
 * Property-Based Tests for Date Range Comparison Period
 * 
 * Feature: creator-analytics-dashboard, Property 2: Date Range Comparison Period Calculation
 * Validates: Requirements 2.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getComparisonPeriod, getDurationDays } from '@/lib/dashboard/date-utils';

describe('**Feature: creator-analytics-dashboard, Property 2: Date Range Comparison Period Calculation**', () => {
  // Helper pour formater une date en ISO (UTC)
  const formatDateISO = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Arbitrary pour générer des dates ISO valides
  const isoDateArbitrary = fc
    .date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2030-12-31T00:00:00Z') })
    .map(formatDateISO)
    .filter((dateStr) => {
      // Vérifier que la date est valide (pas NaN)
      const date = new Date(dateStr + 'T00:00:00Z');
      return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
    });

  // Arbitrary pour générer une paire de dates (from, to) où from <= to
  const dateRangeArbitrary = fc
    .tuple(isoDateArbitrary, isoDateArbitrary)
    .filter(([from, to]) => from <= to)
    .map(([from, to]) => ({ from, to }));

  it('should return comparison period with same duration as selected period', () => {
    fc.assert(
      fc.property(dateRangeArbitrary, ({ from, to }) => {
        const comparison = getComparisonPeriod(from, to);
        
        const selectedDuration = getDurationDays(from, to);
        const comparisonDuration = getDurationDays(comparison.from, comparison.to);
        
        // Les deux périodes doivent avoir la même durée
        return selectedDuration === comparisonDuration;
      }),
      { numRuns: 100 }
    );
  });

  it('should return comparison period that ends exactly before selected period starts', () => {
    fc.assert(
      fc.property(dateRangeArbitrary, ({ from, to }) => {
        const comparison = getComparisonPeriod(from, to);
        
        // La période de comparaison doit se terminer la veille du début de la période sélectionnée
        const comparisonToDate = new Date(comparison.to + 'T00:00:00Z');
        const selectedFromDate = new Date(from + 'T00:00:00Z');
        
        // Ajouter 1 jour à comparison.to devrait donner from
        comparisonToDate.setUTCDate(comparisonToDate.getUTCDate() + 1);
        
        return comparisonToDate.getTime() === selectedFromDate.getTime();
      }),
      { numRuns: 100 }
    );
  });

  it('should return comparison period that is entirely before selected period', () => {
    fc.assert(
      fc.property(dateRangeArbitrary, ({ from, to }) => {
        const comparison = getComparisonPeriod(from, to);
        
        // comparison.to doit être avant from
        return comparison.to < from;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle single-day periods correctly', () => {
    fc.assert(
      fc.property(isoDateArbitrary, (date) => {
        const comparison = getComparisonPeriod(date, date);
        
        // Pour une période d'un jour, la comparaison doit aussi être d'un jour
        const duration = getDurationDays(comparison.from, comparison.to);
        
        return duration === 1;
      }),
      { numRuns: 100 }
    );
  });

  it('should be consistent when called multiple times with same input', () => {
    fc.assert(
      fc.property(dateRangeArbitrary, ({ from, to }) => {
        const comparison1 = getComparisonPeriod(from, to);
        const comparison2 = getComparisonPeriod(from, to);
        
        return (
          comparison1.from === comparison2.from &&
          comparison1.to === comparison2.to
        );
      }),
      { numRuns: 100 }
    );
  });

  describe('Specific examples', () => {
    it('should handle 7-day period correctly', () => {
      const from = '2024-01-08';
      const to = '2024-01-14';
      const comparison = getComparisonPeriod(from, to);
      
      // Jan 8-14 is 7 days, comparison should be Jan 1-7 (also 7 days)
      expect(comparison.from).toBe('2024-01-01');
      expect(comparison.to).toBe('2024-01-07');
      expect(getDurationDays(comparison.from, comparison.to)).toBe(7);
    });

    it('should handle 30-day period correctly', () => {
      const from = '2024-02-01';
      const to = '2024-03-01'; // 30 days
      const comparison = getComparisonPeriod(from, to);
      
      const selectedDuration = getDurationDays(from, to);
      const comparisonDuration = getDurationDays(comparison.from, comparison.to);
      
      expect(comparisonDuration).toBe(selectedDuration);
      expect(comparison.to).toBe('2024-01-31');
    });

    it('should handle year boundary correctly', () => {
      const from = '2024-01-01';
      const to = '2024-01-07';
      const comparison = getComparisonPeriod(from, to);
      
      expect(comparison.from).toBe('2023-12-25');
      expect(comparison.to).toBe('2023-12-31');
    });

    it('should handle leap year correctly', () => {
      const from = '2024-03-01';
      const to = '2024-03-01';
      const comparison = getComparisonPeriod(from, to);
      
      expect(comparison.from).toBe('2024-02-29'); // 2024 is a leap year
      expect(comparison.to).toBe('2024-02-29');
    });
  });

  describe('Mathematical properties', () => {
    it('should maintain duration invariant: duration(selected) = duration(comparison)', () => {
      fc.assert(
        fc.property(dateRangeArbitrary, ({ from, to }) => {
          const comparison = getComparisonPeriod(from, to);
          
          const fromDate = new Date(from + 'T00:00:00Z');
          const toDate = new Date(to + 'T00:00:00Z');
          const compFromDate = new Date(comparison.from + 'T00:00:00Z');
          const compToDate = new Date(comparison.to + 'T00:00:00Z');
          
          const selectedDurationMs = toDate.getTime() - fromDate.getTime();
          const comparisonDurationMs = compToDate.getTime() - compFromDate.getTime();
          
          // Les durées doivent être égales (en millisecondes)
          return selectedDurationMs === comparisonDurationMs;
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain gap invariant: gap between periods = 1 day', () => {
      fc.assert(
        fc.property(dateRangeArbitrary, ({ from, to }) => {
          const comparison = getComparisonPeriod(from, to);
          
          const compToDate = new Date(comparison.to + 'T00:00:00Z');
          const selectedFromDate = new Date(from + 'T00:00:00Z');
          
          const gapMs = selectedFromDate.getTime() - compToDate.getTime();
          const gapDays = gapMs / (1000 * 60 * 60 * 24);
          
          // L'écart doit être exactement 1 jour
          return Math.abs(gapDays - 1) < 0.001;
        }),
        { numRuns: 100 }
      );
    });
  });
});
