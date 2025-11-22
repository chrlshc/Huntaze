/**
 * Property Test: Cache Invalidation Completeness
 * 
 * **Feature: beta-launch-ui-system, Property 18: Cache Invalidation Completeness**
 * 
 * *For any* cache invalidation request, all matching cache entries should be removed from the cache.
 * 
 * **Validates: Requirements 11.4**
 * 
 * This property test verifies that:
 * 1. Single key invalidation removes the correct entry
 * 2. Pattern-based invalidation removes all matching entries
 * 3. Non-matching entries are preserved
 * 4. Invalidation count is accurate
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CacheService } from '@/lib/services/cache.service';

describe('Property 18: Cache Invalidation Completeness', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService(1000);
  });

  it('should remove any single cache entry when invalidated', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.anything(),
        fc.integer({ min: 10, max: 60 }),
        (key, data, ttl) => {
          // Store data
          cacheService.set(key, data, ttl);

          // Verify it exists
          expect(cacheService.get(key)).toEqual(data);

          // Invalidate
          cacheService.invalidate(key);

          // Should return null after invalidation
          expect(cacheService.get(key)).toBeNull();
          expect(cacheService.has(key)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove all entries matching a pattern', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }), // Prefix
        fc.array(
          fc.record({
            suffix: fc.string({ minLength: 1, maxLength: 10 }),
            value: fc.integer(),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (prefix, entries, ttl) => {
          cacheService.clear();

          // Store entries with prefix
          entries.forEach(({ suffix, value }) => {
            const key = `${prefix}:${suffix}`;
            cacheService.set(key, value, ttl);
          });

          // Verify all are cached
          entries.forEach(({ suffix }) => {
            const key = `${prefix}:${suffix}`;
            expect(cacheService.has(key)).toBe(true);
          });

          // Invalidate pattern
          const pattern = `^${prefix}:`;
          const invalidatedCount = cacheService.invalidatePattern(pattern);

          // Should invalidate all matching entries
          expect(invalidatedCount).toBe(entries.length);

          // Verify all are removed
          entries.forEach(({ suffix }) => {
            const key = `${prefix}:${suffix}`;
            expect(cacheService.has(key)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve non-matching entries during pattern invalidation', () => {
    fc.assert(
      fc.property(
        fc.record({
          matchingPrefix: fc.string({ minLength: 1, maxLength: 10 }),
          nonMatchingPrefix: fc.string({ minLength: 1, maxLength: 10 }),
          matchingEntries: fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.integer(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          nonMatchingEntries: fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.integer(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        fc.integer({ min: 10, max: 60 }),
        ({ matchingPrefix, nonMatchingPrefix, matchingEntries, nonMatchingEntries }, ttl) => {
          fc.pre(matchingPrefix !== nonMatchingPrefix);

          cacheService.clear();

          // Store matching entries
          matchingEntries.forEach(({ key, value }) => {
            cacheService.set(`${matchingPrefix}:${key}`, value, ttl);
          });

          // Store non-matching entries
          nonMatchingEntries.forEach(({ key, value }) => {
            cacheService.set(`${nonMatchingPrefix}:${key}`, value, ttl);
          });

          const initialSize = cacheService.getSize();
          expect(initialSize).toBe(matchingEntries.length + nonMatchingEntries.length);

          // Invalidate only matching pattern
          const pattern = `^${matchingPrefix}:`;
          const invalidatedCount = cacheService.invalidatePattern(pattern);

          expect(invalidatedCount).toBe(matchingEntries.length);

          // Matching entries should be removed
          matchingEntries.forEach(({ key }) => {
            expect(cacheService.has(`${matchingPrefix}:${key}`)).toBe(false);
          });

          // Non-matching entries should be preserved
          nonMatchingEntries.forEach(({ key, value }) => {
            expect(cacheService.get(`${nonMatchingPrefix}:${key}`)).toBe(value);
          });

          const finalSize = cacheService.getSize();
          expect(finalSize).toBe(nonMatchingEntries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle complex regex patterns correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.oneof(
              fc.constant('user:123'),
              fc.constant('user:456'),
              fc.constant('stats:123'),
              fc.constant('stats:456'),
              fc.constant('cache:123'),
            ),
            value: fc.integer(),
          }),
          { minLength: 5, maxLength: 5 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (entries, ttl) => {
          cacheService.clear();

          // Store all entries
          entries.forEach(({ key, value }) => {
            cacheService.set(key, value, ttl);
          });

          // Invalidate only user entries
          const userPattern = '^user:';
          const userCount = cacheService.invalidatePattern(userPattern);

          // Count expected user entries
          const expectedUserCount = entries.filter(e => e.key.startsWith('user:')).length;
          expect(userCount).toBe(expectedUserCount);

          // User entries should be removed
          expect(cacheService.has('user:123')).toBe(false);
          expect(cacheService.has('user:456')).toBe(false);

          // Other entries should remain
          const statsEntry = entries.find(e => e.key === 'stats:123');
          if (statsEntry) {
            expect(cacheService.get('stats:123')).toBe(statsEntry.value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle invalidation of non-existent keys gracefully', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (key) => {
          cacheService.clear();

          // Invalidate non-existent key (should not throw)
          expect(() => cacheService.invalidate(key)).not.toThrow();

          // Pattern invalidation of non-matching pattern
          const count = cacheService.invalidatePattern(`^${key}:`);
          expect(count).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear all entries when clear() is called', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.anything(),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (entries, ttl) => {
          cacheService.clear();

          // Store all entries
          entries.forEach(({ key, value }) => {
            cacheService.set(key, value, ttl);
          });

          expect(cacheService.getSize()).toBe(entries.length);

          // Clear all
          cacheService.clear();

          // All should be removed
          expect(cacheService.getSize()).toBe(0);

          entries.forEach(({ key }) => {
            expect(cacheService.has(key)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return accurate invalidation count', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 10, max: 60 }),
        (prefix, count, ttl) => {
          cacheService.clear();

          // Store specific number of entries
          for (let i = 0; i < count; i++) {
            cacheService.set(`${prefix}:${i}`, i, ttl);
          }

          // Invalidate pattern
          const invalidatedCount = cacheService.invalidatePattern(`^${prefix}:`);

          // Count should match
          expect(invalidatedCount).toBe(count);
        }
      ),
      { numRuns: 100 }
    );
  });
});
