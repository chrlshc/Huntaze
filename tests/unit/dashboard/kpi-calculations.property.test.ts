/**
 * Property-Based Tests for KPI Calculations
 * 
 * Feature: creator-analytics-dashboard, Property 1: KPI Calculations Mathematical Correctness
 * Validates: Requirements 3.2, 3.4, 3.5, 8.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateNetRevenue,
  calculateConversionRate,
  calculateLTV,
  calculateRPM,
  type RevenueData,
} from '@/lib/dashboard/calculations';

describe('**Feature: creator-analytics-dashboard, Property 1: KPI Calculations Mathematical Correctness**', () => {
  describe('calculateNetRevenue', () => {
    it('should calculate net revenue correctly for any revenue data', () => {
      fc.assert(
        fc.property(
          fc.record({
            subscriptions: fc.nat(),
            ppv: fc.nat(),
            tips: fc.nat(),
            customs: fc.nat(),
            refunds: fc.nat(),
            chargebacks: fc.nat(),
            fees: fc.nat(),
          }),
          (data: RevenueData) => {
            const expected =
              data.subscriptions +
              data.ppv +
              data.tips +
              data.customs -
              data.refunds -
              data.chargebacks -
              data.fees;
            
            const result = calculateNetRevenue(data);
            
            return result === expected;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero values correctly', () => {
      const data: RevenueData = {
        subscriptions: 0,
        ppv: 0,
        tips: 0,
        customs: 0,
        refunds: 0,
        chargebacks: 0,
        fees: 0,
      };
      
      expect(calculateNetRevenue(data)).toBe(0);
    });

    it('should handle negative net revenue when deductions exceed income', () => {
      const data: RevenueData = {
        subscriptions: 100,
        ppv: 50,
        tips: 25,
        customs: 25,
        refunds: 150,
        chargebacks: 50,
        fees: 50,
      };
      
      const result = calculateNetRevenue(data);
      expect(result).toBe(-50);
    });
  });

  describe('calculateConversionRate', () => {
    it('should calculate conversion rate correctly for any positive values', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.integer({ min: 1, max: 100000 }),
          (newSubs: number, linkTaps: number) => {
            const expected = (newSubs / linkTaps) * 100;
            const result = calculateConversionRate(newSubs, linkTaps);
            
            // Allow small floating point differences
            return result !== null && Math.abs(result - expected) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when linkTaps is zero', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          (newSubs: number) => {
            const result = calculateConversionRate(newSubs, 0);
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle 100% conversion rate', () => {
      const result = calculateConversionRate(100, 100);
      expect(result).toBe(100);
    });

    it('should handle conversion rate > 100% (edge case)', () => {
      const result = calculateConversionRate(150, 100);
      expect(result).toBe(150);
    });
  });

  describe('calculateLTV', () => {
    it('should calculate LTV correctly for any positive values', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.integer({ min: 1, max: 100000 }),
          (totalRevenue: number, uniqueFans: number) => {
            const expected = totalRevenue / uniqueFans;
            const result = calculateLTV(totalRevenue, uniqueFans);
            
            // Allow small floating point differences
            return result !== null && Math.abs(result - expected) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when uniqueFans is zero', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          (totalRevenue: number) => {
            const result = calculateLTV(totalRevenue, 0);
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero revenue', () => {
      const result = calculateLTV(0, 100);
      expect(result).toBe(0);
    });
  });

  describe('calculateRPM', () => {
    it('should calculate RPM correctly for any positive values', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.integer({ min: 1, max: 100000 }),
          (attributedRevenue: number, messagesSent: number) => {
            const expected = attributedRevenue / messagesSent;
            const result = calculateRPM(attributedRevenue, messagesSent);
            
            // Allow small floating point differences
            return result !== null && Math.abs(result - expected) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when messagesSent is zero', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          (attributedRevenue: number) => {
            const result = calculateRPM(attributedRevenue, 0);
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero attributed revenue', () => {
      const result = calculateRPM(0, 100);
      expect(result).toBe(0);
    });
  });

  describe('Mathematical properties', () => {
    it('net revenue should be commutative for income components', () => {
      fc.assert(
        fc.property(
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          fc.nat(),
          (subs, ppv, tips, customs, refunds, chargebacks, fees) => {
            const data1: RevenueData = {
              subscriptions: subs,
              ppv: ppv,
              tips: tips,
              customs: customs,
              refunds: refunds,
              chargebacks: chargebacks,
              fees: fees,
            };
            
            // Swap subscriptions and ppv
            const data2: RevenueData = {
              subscriptions: ppv,
              ppv: subs,
              tips: tips,
              customs: customs,
              refunds: refunds,
              chargebacks: chargebacks,
              fees: fees,
            };
            
            return calculateNetRevenue(data1) === calculateNetRevenue(data2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('conversion rate should scale proportionally', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 2, max: 10 }),
          (newSubs, linkTaps, multiplier) => {
            const rate1 = calculateConversionRate(newSubs, linkTaps);
            const rate2 = calculateConversionRate(newSubs * multiplier, linkTaps * multiplier);
            
            if (rate1 === null || rate2 === null) return false;
            
            // Rates should be equal when both are scaled by same factor
            return Math.abs(rate1 - rate2) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('LTV should scale linearly with revenue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 2, max: 10 }),
          (revenue, fans, multiplier) => {
            const ltv1 = calculateLTV(revenue, fans);
            const ltv2 = calculateLTV(revenue * multiplier, fans);
            
            if (ltv1 === null || ltv2 === null) return false;
            
            // LTV should scale by multiplier
            return Math.abs(ltv2 - ltv1 * multiplier) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
