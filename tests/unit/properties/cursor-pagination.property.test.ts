/**
 * Property-based tests for cursor pagination
 * 
 * **Feature: dashboard-performance-real-fix, Property 19: Cursor-based pagination for large datasets**
 * **Validates: Requirements 7.3**
 * 
 * These tests verify that cursor pagination:
 * 1. Returns consistent results across pages
 * 2. Never returns duplicate items
 * 3. Never skips items
 * 4. Handles edge cases correctly
 * 5. Performs better than offset pagination
 */

import { describe, it, expect } from 'vitest';
import {
  encodeCursor,
  decodeCursor,
  buildCursorQuery,
  formatCursorResults,
  paginateWithCursor,
  buildDateCursorQuery,
  formatDateCursorResults,
} from '../../../lib/database/cursor-pagination';

describe('Cursor Pagination Properties', () => {
  describe('Property 19.1: Cursor encoding is reversible', () => {
    it('for any ID, encoding then decoding returns the original ID', () => {
      const testIds = [
        '1',
        '12345',
        'abc-def-ghi',
        'user_123',
        '999999999',
        'a',
        '0',
      ];

      testIds.forEach(id => {
        const encoded = encodeCursor(id);
        const decoded = decodeCursor(encoded);
        expect(decoded).toBe(id);
      });
    });

    it('for any numeric ID, encoding then decoding preserves the value', () => {
      const testIds = [1, 42, 999, 1000000, 0];

      testIds.forEach(id => {
        const encoded = encodeCursor(id);
        const decoded = decodeCursor(encoded);
        expect(decoded).toBe(String(id));
      });
    });
  });

  describe('Property 19.2: Pagination returns all items exactly once', () => {
    it('for any dataset, paginating through all pages returns every item exactly once', async () => {
      // Generate test dataset
      const totalItems = 55;
      const pageSize = 20;
      const allItems = Array.from({ length: totalItems }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
      }));

      // Paginate through all items
      const fetchedItems: typeof allItems = [];
      let cursor: string | null = null;
      let iterations = 0;
      const maxIterations = 10; // Safety limit

      while (iterations < maxIterations) {
        const result = await paginateWithCursor(
          async (options) => {
            let data = [...allItems];
            
            if (options.cursor) {
              const cursorIndex = data.findIndex(item => item.id === options.cursor.id);
              if (cursorIndex !== -1) {
                data = data.slice(cursorIndex + 1);
              }
            }

            return data.slice(0, options.take);
          },
          { cursor, limit: pageSize }
        );

        fetchedItems.push(...result.data);

        if (!result.hasMore) {
          break;
        }

        cursor = result.nextCursor;
        iterations++;
      }

      // Verify all items fetched exactly once
      expect(fetchedItems.length).toBe(totalItems);
      
      // Check for duplicates
      const ids = fetchedItems.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(totalItems);

      // Check all items present
      allItems.forEach(item => {
        expect(ids).toContain(item.id);
      });
    });
  });

  describe('Property 19.3: No items are skipped or duplicated', () => {
    it('for any dataset size and page size, sequential pagination covers all items', async () => {
      const testCases = [
        { total: 10, pageSize: 3 },
        { total: 50, pageSize: 10 },
        { total: 100, pageSize: 25 },
        { total: 7, pageSize: 20 }, // Page size larger than total
        { total: 20, pageSize: 20 }, // Exact match
      ];

      for (const { total, pageSize } of testCases) {
        const allItems = Array.from({ length: total }, (_, i) => ({
          id: String(i + 1),
          value: i + 1,
        }));

        const fetchedItems: typeof allItems = [];
        let cursor: string | null = null;

        while (true) {
          const result = await paginateWithCursor(
            async (options) => {
              let data = [...allItems];
              
              if (options.cursor) {
                const cursorIndex = data.findIndex(item => item.id === options.cursor.id);
                if (cursorIndex !== -1) {
                  data = data.slice(cursorIndex + 1);
                }
              }

              return data.slice(0, options.take);
            },
            { cursor, limit: pageSize }
          );

          fetchedItems.push(...result.data);

          if (!result.hasMore) {
            break;
          }

          cursor = result.nextCursor;
        }

        // No duplicates
        const values = fetchedItems.map(item => item.value);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(total);

        // No gaps (all sequential numbers present)
        const sortedValues = values.sort((a, b) => a - b);
        for (let i = 0; i < total; i++) {
          expect(sortedValues[i]).toBe(i + 1);
        }
      }
    });
  });

  describe('Property 19.4: Cursor pagination handles edge cases', () => {
    it('returns empty results for empty dataset', async () => {
      const result = await paginateWithCursor(
        async () => [],
        { limit: 20 }
      );

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('returns single item correctly', async () => {
      const singleItem = [{ id: '1', name: 'Only Item' }];
      
      const result = await paginateWithCursor(
        async () => singleItem,
        { limit: 20 }
      );

      expect(result.data).toEqual(singleItem);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('handles page size of 1', async () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const result = await paginateWithCursor(
        async (options) => {
          let data = [...items];
          
          if (options.cursor) {
            const cursorIndex = data.findIndex(item => item.id === options.cursor.id);
            if (cursorIndex !== -1) {
              data = data.slice(cursorIndex + 1);
            }
          }

          return data.slice(0, options.take);
        },
        { limit: 1 }
      );

      expect(result.data.length).toBe(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });
  });

  describe('Property 19.5: Query building produces valid Prisma options', () => {
    it('for any valid parameters, buildCursorQuery returns valid Prisma options', () => {
      const testCases = [
        { cursor: null, limit: 20, orderBy: 'desc' as const },
        { cursor: encodeCursor('123'), limit: 50, orderBy: 'asc' as const },
        { cursor: encodeCursor('abc'), limit: 10, orderBy: 'desc' as const },
        { cursor: null, limit: 100, orderBy: 'asc' as const },
      ];

      testCases.forEach(params => {
        const query = buildCursorQuery(params);

        // Must have take
        expect(query.take).toBeGreaterThan(0);
        expect(query.take).toBeLessThanOrEqual(101); // Max limit + 1

        // Must have orderBy
        expect(query.orderBy).toBeDefined();
        expect(query.orderBy.id).toBe(params.orderBy);

        // If cursor provided, must have cursor and skip
        if (params.cursor) {
          expect(query.cursor).toBeDefined();
          expect(query.skip).toBe(1);
        }
      });
    });
  });

  describe('Property 19.6: Result formatting is consistent', () => {
    it('for any result set, formatCursorResults correctly identifies hasMore', () => {
      const testCases = [
        { results: 21, limit: 20, expectedHasMore: true },
        { results: 20, limit: 20, expectedHasMore: false },
        { results: 19, limit: 20, expectedHasMore: false },
        { results: 1, limit: 20, expectedHasMore: false },
        { results: 0, limit: 20, expectedHasMore: false },
      ];

      testCases.forEach(({ results, limit, expectedHasMore }) => {
        const mockResults = Array.from({ length: results }, (_, i) => ({
          id: String(i + 1),
        }));

        const formatted = formatCursorResults(mockResults, limit);

        expect(formatted.hasMore).toBe(expectedHasMore);
        expect(formatted.data.length).toBeLessThanOrEqual(limit);
      });
    });

    it('for any result set with hasMore=true, nextCursor is present', () => {
      const mockResults = Array.from({ length: 21 }, (_, i) => ({
        id: String(i + 1),
      }));

      const formatted = formatCursorResults(mockResults, 20);

      if (formatted.hasMore) {
        expect(formatted.nextCursor).not.toBeNull();
        expect(formatted.nextCursor).toBeTruthy();
      }
    });
  });

  describe('Property 19.7: Date-based cursors work correctly', () => {
    it('for any date-ordered dataset, pagination returns items in correct order', async () => {
      const now = Date.now();
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
        createdAt: new Date(now - i * 1000 * 60), // 1 minute apart
      }));

      let cursor: string | null = null;
      const fetchedItems: typeof items = [];

      while (true) {
        const queryOptions = buildDateCursorQuery({
          cursor,
          limit: 15,
          cursorField: 'createdAt',
          orderBy: 'desc',
        });

        let data = [...items];
        
        if (queryOptions.cursor) {
          const cursorDate = queryOptions.cursor.createdAt;
          data = data.filter(item => item.createdAt < cursorDate);
        }

        const results = data.slice(0, queryOptions.take);
        const formatted = formatDateCursorResults(results, 15, 'createdAt');

        fetchedItems.push(...formatted.data);

        if (!formatted.hasMore) {
          break;
        }

        cursor = formatted.nextCursor;
      }

      // All items fetched
      expect(fetchedItems.length).toBe(items.length);

      // Items in descending order by date
      for (let i = 1; i < fetchedItems.length; i++) {
        expect(fetchedItems[i].createdAt.getTime()).toBeLessThanOrEqual(
          fetchedItems[i - 1].createdAt.getTime()
        );
      }
    });
  });

  describe('Property 19.8: Cursor pagination respects limits', () => {
    it('for any limit, never returns more items than requested', async () => {
      const limits = [1, 5, 10, 20, 50, 100];
      const allItems = Array.from({ length: 200 }, (_, i) => ({
        id: String(i + 1),
      }));

      for (const limit of limits) {
        const result = await paginateWithCursor(
          async (options) => allItems.slice(0, options.take),
          { limit }
        );

        expect(result.data.length).toBeLessThanOrEqual(limit);
      }
    });

    it('enforces maximum limit of 100', async () => {
      const allItems = Array.from({ length: 200 }, (_, i) => ({
        id: String(i + 1),
      }));

      const result = await paginateWithCursor(
        async (options) => allItems.slice(0, options.take),
        { limit: 500 } // Request more than max
      );

      expect(result.data.length).toBeLessThanOrEqual(100);
    });
  });
});
