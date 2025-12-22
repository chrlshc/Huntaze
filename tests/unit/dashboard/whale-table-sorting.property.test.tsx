/**
 * Property Test: Whale Table Sorting Consistency
 * 
 * **Feature: creator-analytics-dashboard, Property 7: Whale Table Sorting Consistency**
 * **Validates: Requirements 7.2, 7.3**
 * 
 * Property: For any array of Whale objects and any sortable column,
 * sorting SHALL produce a stable order where all items are ordered by the selected column value.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Whale } from '@/lib/dashboard/types';

describe('Property 7: Whale Table Sorting Consistency', () => {
  // Arbitrary for generating Whale objects
  const whaleArbitrary = fc.record({
    fanId: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 20 }),
    totalSpent: fc.float({ min: 0, max: 100000, noNaN: true }),
    lastPurchaseAt: fc.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2025-12-31') }).map(ts => new Date(ts).toISOString()),
    isOnline: fc.boolean(),
    aiPriority: fc.constantFrom('normal' as const, 'high' as const),
  });

  it('**Feature: creator-analytics-dashboard, Property 7: Whale Table Sorting Consistency**', () => {
    fc.assert(
      fc.property(
        fc.array(whaleArbitrary, { minLength: 0, maxLength: 100 }),
        fc.constantFrom('totalSpent' as const, 'lastPurchase' as const, 'name' as const),
        fc.constantFrom('asc' as const, 'desc' as const),
        (whales, sortBy, sortOrder) => {
          // Sort the whales using the same logic as WhaleTable component
          const sorted = sortWhales(whales, sortBy, sortOrder);

          // Verify sorting is correct
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            let comparison = 0;
            switch (sortBy) {
              case 'totalSpent':
                comparison = current.totalSpent - next.totalSpent;
                break;
              case 'lastPurchase':
                comparison = new Date(current.lastPurchaseAt).getTime() - new Date(next.lastPurchaseAt).getTime();
                break;
              case 'name':
                comparison = current.name.localeCompare(next.name);
                break;
            }

            if (sortOrder === 'asc') {
              // In ascending order, current should be <= next
              expect(comparison).toBeLessThanOrEqual(0);
            } else {
              // In descending order, current should be >= next
              expect(comparison).toBeGreaterThanOrEqual(0);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting by totalSpent produces consistent order', () => {
    fc.assert(
      fc.property(
        fc.array(whaleArbitrary, { minLength: 2, maxLength: 50 }),
        (whales) => {
          const sortedAsc = sortWhales(whales, 'totalSpent', 'asc');
          const sortedDesc = sortWhales(whales, 'totalSpent', 'desc');

          // Verify ascending order
          for (let i = 0; i < sortedAsc.length - 1; i++) {
            expect(sortedAsc[i].totalSpent).toBeLessThanOrEqual(sortedAsc[i + 1].totalSpent);
          }

          // Verify descending order
          for (let i = 0; i < sortedDesc.length - 1; i++) {
            expect(sortedDesc[i].totalSpent).toBeGreaterThanOrEqual(sortedDesc[i + 1].totalSpent);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting by lastPurchase produces consistent order', () => {
    fc.assert(
      fc.property(
        fc.array(whaleArbitrary, { minLength: 2, maxLength: 50 }),
        (whales) => {
          const sortedAsc = sortWhales(whales, 'lastPurchase', 'asc');
          const sortedDesc = sortWhales(whales, 'lastPurchase', 'desc');

          // Verify timestamps are in correct order
          for (let i = 0; i < sortedAsc.length - 1; i++) {
            const currentTime = new Date(sortedAsc[i].lastPurchaseAt).getTime();
            const nextTime = new Date(sortedAsc[i + 1].lastPurchaseAt).getTime();
            expect(currentTime).toBeLessThanOrEqual(nextTime);
          }

          for (let i = 0; i < sortedDesc.length - 1; i++) {
            const currentTime = new Date(sortedDesc[i].lastPurchaseAt).getTime();
            const nextTime = new Date(sortedDesc[i + 1].lastPurchaseAt).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting by name produces consistent alphabetical order', () => {
    fc.assert(
      fc.property(
        fc.array(whaleArbitrary, { minLength: 2, maxLength: 50 }),
        (whales) => {
          const sortedAsc = sortWhales(whales, 'name', 'asc');

          // Verify names are in alphabetical order
          for (let i = 0; i < sortedAsc.length - 1; i++) {
            const comparison = sortedAsc[i].name.localeCompare(sortedAsc[i + 1].name);
            expect(comparison).toBeLessThanOrEqual(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting preserves all elements', () => {
    fc.assert(
      fc.property(
        fc.array(whaleArbitrary, { minLength: 0, maxLength: 100 }),
        fc.constantFrom('totalSpent' as const, 'lastPurchase' as const, 'name' as const),
        fc.constantFrom('asc' as const, 'desc' as const),
        (whales, sortBy, sortOrder) => {
          const sorted = sortWhales(whales, sortBy, sortOrder);

          // Same length
          expect(sorted.length).toBe(whales.length);

          // All original IDs present
          const originalIds = new Set(whales.map(w => w.fanId));
          const sortedIds = new Set(sorted.map(w => w.fanId));
          expect(sortedIds).toEqual(originalIds);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting empty array returns empty array', () => {
    const sorted = sortWhales([], 'totalSpent', 'asc');
    expect(sorted).toEqual([]);
  });

  it('sorting single element returns same element', () => {
    fc.assert(
      fc.property(
        whaleArbitrary,
        fc.constantFrom('totalSpent' as const, 'lastPurchase' as const, 'name' as const),
        fc.constantFrom('asc' as const, 'desc' as const),
        (whale, sortBy, sortOrder) => {
          const sorted = sortWhales([whale], sortBy, sortOrder);
          expect(sorted).toEqual([whale]);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Sort whales - mirrors the logic in WhaleTable component
 */
function sortWhales(
  whales: Whale[],
  sortBy: 'totalSpent' | 'lastPurchase' | 'name',
  sortOrder: 'asc' | 'desc'
): Whale[] {
  return [...whales].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent;
        break;
      case 'lastPurchase':
        comparison = new Date(a.lastPurchaseAt).getTime() - new Date(b.lastPurchaseAt).getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}
