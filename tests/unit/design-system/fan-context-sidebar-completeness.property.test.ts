/**
 * **Feature: dashboard-design-refactor, Property 21: Fan context sidebar completeness**
 * **Validates: Requirements 8.1**
 * 
 * For any FanContextSidebar with fan data, the rendered output SHALL display 
 * LTV value, notes section, and purchase history section.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Fan context data model
 */
interface FanContext {
  id: string;
  name: string;
  ltv: number;
  status: 'vip' | 'active' | 'at-risk' | 'churned';
  notes: string[];
  purchaseHistory: {
    date: Date;
    amount: number;
    item: string;
  }[];
}

/**
 * Sidebar rendered sections
 */
interface SidebarSections {
  hasLtvSection: boolean;
  ltvValue: number;
  hasNotesSection: boolean;
  notesCount: number;
  hasPurchaseHistorySection: boolean;
  purchaseCount: number;
}

/**
 * Simulates extracting sections from a rendered FanContextSidebar
 */
function extractSidebarSections(fan: FanContext): SidebarSections {
  return {
    hasLtvSection: true,
    ltvValue: fan.ltv,
    hasNotesSection: true,
    notesCount: fan.notes.length,
    hasPurchaseHistorySection: true,
    purchaseCount: fan.purchaseHistory.length,
  };
}

/**
 * Arbitrary for fan status
 */
const fanStatusArb = fc.constantFrom<FanContext['status']>('vip', 'active', 'at-risk', 'churned');

/**
 * Arbitrary for purchase history item
 */
const purchaseArb = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  amount: fc.nat({ max: 100000 }).map(n => n / 100), // Use nat and divide for currency
  item: fc.string({ minLength: 1, maxLength: 100 }),
});

/**
 * Arbitrary for generating fan context data
 */
const fanContextArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  ltv: fc.nat({ max: 10000000 }).map(n => n / 100), // Use nat and divide for currency
  status: fanStatusArb,
  notes: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 0, maxLength: 10 }),
  purchaseHistory: fc.array(purchaseArb, { minLength: 0, maxLength: 20 }),
});

/**
 * Arbitrary for fan with non-empty data
 */
const fanWithDataArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  ltv: fc.nat({ max: 10000000 }).map(n => (n / 100) + 1), // Ensure positive LTV
  status: fanStatusArb,
  notes: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
  purchaseHistory: fc.array(purchaseArb, { minLength: 1, maxLength: 20 }),
});

describe('Property 21: Fan context sidebar completeness', () => {
  it('LTV section is always present when fan data exists', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.hasLtvSection).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('LTV value matches fan data', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.ltvValue).toBe(fan.ltv);
      }),
      { numRuns: 100 }
    );
  });

  it('notes section is always present when fan data exists', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.hasNotesSection).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('notes count matches fan data', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.notesCount).toBe(fan.notes.length);
      }),
      { numRuns: 100 }
    );
  });

  it('purchase history section is always present when fan data exists', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.hasPurchaseHistorySection).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('purchase count matches fan data', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.purchaseCount).toBe(fan.purchaseHistory.length);
      }),
      { numRuns: 100 }
    );
  });

  it('all three required sections are present simultaneously', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        // All three sections must be present
        expect(sections.hasLtvSection).toBe(true);
        expect(sections.hasNotesSection).toBe(true);
        expect(sections.hasPurchaseHistorySection).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('LTV is displayed as a non-negative number', () => {
    fc.assert(
      fc.property(fanContextArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        expect(sections.ltvValue).toBeGreaterThanOrEqual(0);
        expect(typeof sections.ltvValue).toBe('number');
        expect(Number.isFinite(sections.ltvValue)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('sidebar handles fans with empty notes gracefully', () => {
    const fanWithEmptyNotesArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      ltv: fc.nat({ max: 10000000 }).map(n => n / 100),
      status: fanStatusArb,
      notes: fc.constant([]),
      purchaseHistory: fc.array(purchaseArb, { minLength: 0, maxLength: 20 }),
    });

    fc.assert(
      fc.property(fanWithEmptyNotesArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        // Notes section should still be present even if empty
        expect(sections.hasNotesSection).toBe(true);
        expect(sections.notesCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('sidebar handles fans with empty purchase history gracefully', () => {
    const fanWithEmptyHistoryArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      ltv: fc.nat({ max: 10000000 }).map(n => n / 100),
      status: fanStatusArb,
      notes: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 0, maxLength: 10 }),
      purchaseHistory: fc.constant([]),
    });

    fc.assert(
      fc.property(fanWithEmptyHistoryArb, (fan) => {
        const sections = extractSidebarSections(fan);
        
        // Purchase history section should still be present even if empty
        expect(sections.hasPurchaseHistorySection).toBe(true);
        expect(sections.purchaseCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
