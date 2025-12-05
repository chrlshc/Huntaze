/**
 * Property Test: Redemption Logging
 * 
 * **Feature: huntaze-ai-features-coming-soon, Property 12: Redemption Logging**
 * **Validates: Requirements 10.2**
 * 
 * Property: For any offer redemption, the logged entry must:
 * - Have a unique ID
 * - Match the offer ID, fan ID, and amount
 * - Have a valid redemption timestamp
 * - Metrics calculated from redemptions must be consistent
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createRedemptionEntry,
  validateRedemptionLogging,
  calculateRedemptionMetricsFromData,
  validateRedemptionMetrics
} from '../../../lib/offers/offer-analytics.service';

// ============================================
// Generators
// ============================================

const offerIdArb = fc.uuid();
const fanIdArb = fc.string({ minLength: 1, maxLength: 50 });
const amountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true });

const redemptionArb = fc.record({
  amount: amountArb
});

const redemptionListArb = fc.array(redemptionArb, { minLength: 0, maxLength: 50 });
const totalViewsArb = fc.integer({ min: 0, max: 10000 });

// ============================================
// Property Tests
// ============================================

describe('Property 12: Redemption Logging', () => {
  it('redemption entry contains correct offer ID', () => {
    fc.assert(
      fc.property(offerIdArb, fanIdArb, amountArb, (offerId, fanId, amount) => {
        const entry = createRedemptionEntry(offerId, fanId, amount);
        
        expect(entry.offerId).toBe(offerId);
      }),
      { numRuns: 100 }
    );
  });

  it('redemption entry contains correct fan ID', () => {
    fc.assert(
      fc.property(offerIdArb, fanIdArb, amountArb, (offerId, fanId, amount) => {
        const entry = createRedemptionEntry(offerId, fanId, amount);
        
        expect(entry.fanId).toBe(fanId);
      }),
      { numRuns: 100 }
    );
  });

  it('redemption entry contains correct amount', () => {
    fc.assert(
      fc.property(offerIdArb, fanIdArb, amountArb, (offerId, fanId, amount) => {
        const entry = createRedemptionEntry(offerId, fanId, amount);
        
        expect(entry.amount).toBe(amount);
      }),
      { numRuns: 100 }
    );
  });

  it('redemption entry has unique ID', () => {
    fc.assert(
      fc.property(offerIdArb, fanIdArb, amountArb, (offerId, fanId, amount) => {
        const entry1 = createRedemptionEntry(offerId, fanId, amount);
        const entry2 = createRedemptionEntry(offerId, fanId, amount);
        
        expect(entry1.id).not.toBe(entry2.id);
        expect(entry1.id.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('redemption entry has valid timestamp', () => {
    fc.assert(
      fc.property(offerIdArb, fanIdArb, amountArb, (offerId, fanId, amount) => {
        const before = new Date();
        const entry = createRedemptionEntry(offerId, fanId, amount);
        const after = new Date();
        
        expect(entry.redeemedAt).toBeInstanceOf(Date);
        expect(entry.redeemedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(entry.redeemedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it('validateRedemptionLogging returns true for valid entries', () => {
    fc.assert(
      fc.property(offerIdArb, fanIdArb, amountArb, (offerId, fanId, amount) => {
        const entry = createRedemptionEntry(offerId, fanId, amount);
        
        expect(validateRedemptionLogging(entry, offerId, fanId, amount)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('redemption metrics are consistent', () => {
    fc.assert(
      fc.property(redemptionListArb, totalViewsArb, (redemptions, totalViews) => {
        const metrics = calculateRedemptionMetricsFromData(redemptions, totalViews);
        
        expect(validateRedemptionMetrics(metrics)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('total redemptions equals input count', () => {
    fc.assert(
      fc.property(redemptionListArb, totalViewsArb, (redemptions, totalViews) => {
        const metrics = calculateRedemptionMetricsFromData(redemptions, totalViews);
        
        expect(metrics.totalRedemptions).toBe(redemptions.length);
      }),
      { numRuns: 100 }
    );
  });

  it('total revenue equals sum of amounts', () => {
    fc.assert(
      fc.property(redemptionListArb, totalViewsArb, (redemptions, totalViews) => {
        const metrics = calculateRedemptionMetricsFromData(redemptions, totalViews);
        const expectedRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0);
        
        expect(metrics.totalRevenue).toBeCloseTo(expectedRevenue, 5);
      }),
      { numRuns: 100 }
    );
  });

  it('empty redemptions produce zero metrics', () => {
    const metrics = calculateRedemptionMetricsFromData([], 100);
    
    expect(metrics.totalRedemptions).toBe(0);
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.averageAmount).toBe(0);
    expect(metrics.conversionRate).toBe(0);
  });
});
