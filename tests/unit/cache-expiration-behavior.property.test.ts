/**
 * Property Test: Cache Expiration Behavior
 * 
 * **Feature: beta-launch-ui-system, Property 17: Cache Expiration Behavior**
 * 
 * *For any* cached API response, after the TTL expires, the next request should fetch 
 * fresh data and update the cache.
 * 
 * **Validates: Requirements 11.3**
 * 
 * This property test verifies that:
 * 1. Expired cache entries return null
 * 2. Cache misses are tracked for expired entries
 * 3. Expired entries are automatically removed
 * 4. TTL expiration is accurate
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CacheService } from '@/lib/services/cache.service';

describe('Property 17: Cache Expiration Behavior', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService(1000);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null for any expired cache entry', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.anything(),
        fc.integer({ min: 1, max: 10 }), // Short TTL for testing
        (key, data, ttlSeconds) => {
          // Store data
          cacheService.set(key, data, ttlSeconds);

          // Verify data is cached
          expect(cacheService.get(key)).toEqual(data);

          // Advance time past TTL
          vi.advanceTimersByTime((ttlSeconds + 1) * 1000);

          // Should return null after expiration
          const expired = cacheService.get(key);
          expect(expired).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track cache misses for expired entries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer(),
        fc.integer({ min: 1, max: 5 }),
        (key, value, ttl) => {
          cacheService.clear();

          // Store and retrieve (hit)
          cacheService.set(key, value, ttl);
          cacheService.get(key);

          const statsBeforeExpiry = cacheService.getStats();
          const hitsBeforeExpiry = statsBeforeExpiry.hits;

          // Expire the entry
          vi.advanceTimersByTime((ttl + 1) * 1000);

          // Try to get expired entry (miss)
          cacheService.get(key);

          const statsAfterExpiry = cacheService.getStats();

          // Hits should not increase
          expect(statsAfterExpiry.hits).toBe(hitsBeforeExpiry);
          
          // Misses should increase
          expect(statsAfterExpiry.misses).toBeGreaterThan(statsBeforeExpiry.misses);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should automatically remove expired entries on access', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }),
            value: fc.integer(),
            ttl: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (entries) => {
          cacheService.clear();

          // Store all entries
          entries.forEach(({ key, value, ttl }) => {
            cacheService.set(key, value, ttl);
          });

          const initialSize = cacheService.getSize();
          expect(initialSize).toBe(entries.length);

          // Find max TTL
          const maxTtl = Math.max(...entries.map(e => e.ttl));

          // Advance time past all TTLs
          vi.advanceTimersByTime((maxTtl + 1) * 1000);

          // Access all entries (should trigger removal)
          entries.forEach(({ key }) => {
            cacheService.get(key);
          });

          // All entries should be removed
          const finalSize = cacheService.getSize();
          expect(finalSize).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect different TTLs for different entries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer(),
        fc.integer(),
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 10, max: 15 }),
        (key1, key2, value1, value2, shortTtl, longTtl) => {
          fc.pre(key1 !== key2); // Ensure different keys

          cacheService.clear();

          // Store with different TTLs
          cacheService.set(key1, value1, shortTtl);
          cacheService.set(key2, value2, longTtl);

          // Advance time past short TTL but before long TTL
          vi.advanceTimersByTime((shortTtl + 1) * 1000);

          // Short TTL entry should be expired
          expect(cacheService.get(key1)).toBeNull();

          // Long TTL entry should still be valid
          expect(cacheService.get(key2)).toEqual(value2);

          // Advance time past long TTL
          vi.advanceTimersByTime((longTtl - shortTtl) * 1000);

          // Now both should be expired
          expect(cacheService.get(key2)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of zero remaining TTL', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.anything(),
        fc.integer({ min: 1, max: 5 }),
        (key, data, ttl) => {
          cacheService.set(key, data, ttl);

          // Advance to exact expiration time
          vi.advanceTimersByTime(ttl * 1000);

          // Should be expired (not <=, but >)
          const result = cacheService.get(key);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow re-caching after expiration', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer(),
        fc.integer(),
        fc.integer({ min: 1, max: 5 }),
        (key, firstValue, secondValue, ttl) => {
          fc.pre(firstValue !== secondValue);

          // First cache
          cacheService.set(key, firstValue, ttl);
          expect(cacheService.get(key)).toBe(firstValue);

          // Expire
          vi.advanceTimersByTime((ttl + 1) * 1000);
          expect(cacheService.get(key)).toBeNull();

          // Re-cache with new value
          cacheService.set(key, secondValue, ttl);
          expect(cacheService.get(key)).toBe(secondValue);
        }
      ),
      { numRuns: 100 }
    );
  });
});
