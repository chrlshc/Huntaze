/**
 * Property-based tests for slow query logging
 * 
 * **Feature: dashboard-performance-real-fix, Property 21: Slow query logging**
 * **Validates: Requirements 7.5**
 * 
 * These tests verify that slow query logging:
 * 1. Only logs queries exceeding the threshold
 * 2. Captures all relevant query information
 * 3. Provides accurate statistics
 * 4. Has minimal performance overhead
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  logSlowQuery,
  getSlowQueries,
  clearSlowQueries,
  getSlowQueryStats,
  measureQuery,
} from '../../../lib/database/slow-query-logger';

describe('Slow Query Logging Properties', () => {
  beforeEach(() => {
    clearSlowQueries();
  });

  describe('Property 21.1: Only queries exceeding threshold are logged', () => {
    it('for any query duration below threshold, query is not logged', () => {
      const threshold = 1000;
      const belowThreshold = [100, 500, 999];

      belowThreshold.forEach(duration => {
        clearSlowQueries();
        logSlowQuery('SELECT * FROM test', duration, {
          config: { threshold },
        });
        expect(getSlowQueries().length).toBe(0);
      });
    });

    it('for any query duration at or above threshold, query is logged', () => {
      const threshold = 1000;
      const atOrAboveThreshold = [1000, 1001, 2000, 5000];

      atOrAboveThreshold.forEach(duration => {
        clearSlowQueries();
        logSlowQuery('SELECT * FROM test', duration, {
          config: { threshold },
        });
        expect(getSlowQueries().length).toBe(1);
      });
    });

    it('for any custom threshold, only queries exceeding it are logged', () => {
      const testCases = [
        { threshold: 500, durations: [400, 500, 600], expected: [0, 1, 1] },
        { threshold: 2000, durations: [1000, 2000, 3000], expected: [0, 1, 1] },
        { threshold: 100, durations: [50, 100, 150], expected: [0, 1, 1] },
      ];

      testCases.forEach(({ threshold, durations, expected }) => {
        durations.forEach((duration, i) => {
          clearSlowQueries();
          logSlowQuery('SELECT * FROM test', duration, {
            config: { threshold },
          });
          expect(getSlowQueries().length).toBe(expected[i]);
        });
      });
    });
  });

  describe('Property 21.2: Logged queries contain accurate information', () => {
    it('for any logged query, duration is recorded correctly', () => {
      const durations = [1000, 1500, 2000, 3000];

      durations.forEach(duration => {
        clearSlowQueries();
        logSlowQuery('SELECT * FROM test', duration, {
          model: 'Test',
          operation: 'findMany',
        });

        const queries = getSlowQueries();
        expect(queries.length).toBe(1);
        expect(queries[0].duration).toBe(duration);
      });
    });

    it('for any logged query, model and operation are recorded', () => {
      const testCases = [
        { model: 'User', operation: 'findMany' },
        { model: 'Order', operation: 'count' },
        { model: 'Product', operation: 'aggregate' },
      ];

      testCases.forEach(({ model, operation }) => {
        clearSlowQueries();
        logSlowQuery('SELECT * FROM test', 1500, { model, operation });

        const queries = getSlowQueries();
        expect(queries[0].model).toBe(model);
        expect(queries[0].operation).toBe(operation);
      });
    });

    it('for any logged query, timestamp is present and recent', () => {
      const before = new Date();
      logSlowQuery('SELECT * FROM test', 1500);
      const after = new Date();

      const queries = getSlowQueries();
      const timestamp = queries[0].timestamp;

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Property 21.3: Statistics are accurate', () => {
    it('for any set of slow queries, count is correct', () => {
      const counts = [1, 5, 10, 20];

      counts.forEach(count => {
        clearSlowQueries();
        for (let i = 0; i < count; i++) {
          logSlowQuery(`Query ${i}`, 1500);
        }

        const stats = getSlowQueryStats();
        expect(stats.count).toBe(count);
      });
    });

    it('for any set of slow queries, average duration is correct', () => {
      const testCases = [
        [1000, 2000, 3000], // avg = 2000
        [1500, 1500, 1500], // avg = 1500
        [1000, 3000], // avg = 2000
      ];

      testCases.forEach(durations => {
        clearSlowQueries();
        durations.forEach((duration, i) => {
          logSlowQuery(`Query ${i}`, duration);
        });

        const stats = getSlowQueryStats();
        const expectedAvg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        expect(stats.avgDuration).toBeCloseTo(expectedAvg, 2);
      });
    });

    it('for any set of slow queries, min and max are correct', () => {
      const durations = [1000, 1500, 2000, 2500, 3000];

      clearSlowQueries();
      durations.forEach((duration, i) => {
        logSlowQuery(`Query ${i}`, duration);
      });

      const stats = getSlowQueryStats();
      expect(stats.minDuration).toBe(Math.min(...durations));
      expect(stats.maxDuration).toBe(Math.max(...durations));
    });

    it('for any set of slow queries, grouping by model is correct', () => {
      clearSlowQueries();
      
      logSlowQuery('Query 1', 1500, { model: 'User' });
      logSlowQuery('Query 2', 1500, { model: 'User' });
      logSlowQuery('Query 3', 1500, { model: 'Order' });
      logSlowQuery('Query 4', 1500, { model: 'Product' });
      logSlowQuery('Query 5', 1500, { model: 'User' });

      const stats = getSlowQueryStats();
      expect(stats.byModel).toEqual({
        User: 3,
        Order: 1,
        Product: 1,
      });
    });

    it('for any set of slow queries, grouping by operation is correct', () => {
      clearSlowQueries();
      
      logSlowQuery('Query 1', 1500, { operation: 'findMany' });
      logSlowQuery('Query 2', 1500, { operation: 'findMany' });
      logSlowQuery('Query 3', 1500, { operation: 'count' });
      logSlowQuery('Query 4', 1500, { operation: 'aggregate' });

      const stats = getSlowQueryStats();
      expect(stats.byOperation).toEqual({
        findMany: 2,
        count: 1,
        aggregate: 1,
      });
    });
  });

  describe('Property 21.4: Measure query wrapper works correctly', () => {
    it('for any async function, measureQuery returns the correct result', async () => {
      const testValues = [42, 'hello', { data: 'test' }, [1, 2, 3]];

      for (const value of testValues) {
        const result = await measureQuery(
          'test',
          async () => value,
          { threshold: 0 }
        );
        expect(result).toEqual(value);
      }
    });

    it('for any async function that throws, measureQuery propagates the error', async () => {
      const error = new Error('Test error');

      await expect(
        measureQuery(
          'test',
          async () => {
            throw error;
          },
          { threshold: 0 }
        )
      ).rejects.toThrow('Test error');
    });

    it('for any slow async function, measureQuery logs the query', async () => {
      clearSlowQueries();

      await measureQuery(
        'SlowQuery',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'result';
        },
        { threshold: 50 }
      );

      const queries = getSlowQueries();
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0].query).toBe('SlowQuery');
    });
  });

  describe('Property 21.5: Query store has bounded size', () => {
    it('for any number of queries, store never exceeds maximum size', () => {
      clearSlowQueries();
      const maxSize = 100;
      const queryCount = 150;

      for (let i = 0; i < queryCount; i++) {
        logSlowQuery(`Query ${i}`, 1500);
      }

      const queries = getSlowQueries();
      expect(queries.length).toBeLessThanOrEqual(maxSize);
    });

    it('for any queries exceeding max size, oldest queries are removed', () => {
      clearSlowQueries();
      const maxSize = 100;
      const queryCount = 110;

      for (let i = 0; i < queryCount; i++) {
        logSlowQuery(`Query ${i}`, 1500);
      }

      const queries = getSlowQueries();
      
      // Should have the most recent queries
      expect(queries[0].query).toContain('Query 10'); // First kept query
      expect(queries[queries.length - 1].query).toContain('Query 109'); // Last query
    });
  });

  describe('Property 21.6: Clear queries works correctly', () => {
    it('for any number of logged queries, clearSlowQueries removes all', () => {
      const counts = [1, 10, 50, 100];

      counts.forEach(count => {
        clearSlowQueries();
        for (let i = 0; i < count; i++) {
          logSlowQuery(`Query ${i}`, 1500);
        }

        expect(getSlowQueries().length).toBe(count);
        clearSlowQueries();
        expect(getSlowQueries().length).toBe(0);
      });
    });

    it('after clearing, statistics are reset', () => {
      logSlowQuery('Query 1', 1500);
      logSlowQuery('Query 2', 2000);
      
      clearSlowQueries();
      
      const stats = getSlowQueryStats();
      expect(stats.count).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
      expect(stats.minDuration).toBe(0);
    });
  });

  describe('Property 21.7: Logging has minimal performance overhead', () => {
    it('for any number of fast queries, logging overhead is minimal', () => {
      const iterations = 1000;
      
      // Measure without logging
      const startWithout = Date.now();
      for (let i = 0; i < iterations; i++) {
        // Simulate query
        const duration = Math.random() * 100;
      }
      const timeWithout = Date.now() - startWithout;

      // Measure with logging
      clearSlowQueries();
      const startWith = Date.now();
      for (let i = 0; i < iterations; i++) {
        const duration = Math.random() * 100;
        logSlowQuery('SELECT * FROM test', duration);
      }
      const timeWith = Date.now() - startWith;

      // Overhead should be less than 100% of original time
      const overhead = timeWith - timeWithout;
      expect(overhead).toBeLessThan(timeWithout + 100); // Allow up to 100ms overhead
    });
  });

  describe('Property 21.8: Multiple queries can be logged concurrently', () => {
    it('for any concurrent queries, all are logged correctly', async () => {
      clearSlowQueries();

      const promises = Array.from({ length: 10 }, (_, i) =>
        measureQuery(
          `ConcurrentQuery${i}`,
          async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return i;
          },
          { threshold: 0 }
        )
      );

      await Promise.all(promises);

      const queries = getSlowQueries();
      expect(queries.length).toBe(10);
    });
  });
});
