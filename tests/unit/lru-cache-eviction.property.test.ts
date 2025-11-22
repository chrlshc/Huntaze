/**
 * Property Test: LRU Cache Eviction
 * 
 * **Feature: beta-launch-ui-system, Property 19: LRU Cache Eviction**
 * 
 * *For any* cache at maximum capacity, adding a new entry should evict the least recently used entry.
 * 
 * **Validates: Requirements 11.5**
 * 
 * This property test verifies that:
 * 1. Cache respects maximum size limit
 * 2. Least recently used entries are evicted first
 * 3. Recently accessed entries are preserved
 * 4. Eviction count is tracked correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CacheService } from '@/lib/services/cache.service';

// Helper to generate valid cache keys (non-empty, non-whitespace-only)
const validKeyArbitrary = () => fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

describe('Property 19: LRU Cache Eviction', () => {
  it('should never exceed maximum cache size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }), // Max size
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            value: fc.integer(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, entries, ttl) => {
          const cacheService = new CacheService(maxSize);

          // Add more entries than max size
          entries.forEach(({ key, value }) => {
            cacheService.set(key, value, ttl);
          });

          // Size should never exceed max
          expect(cacheService.getSize()).toBeLessThanOrEqual(maxSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should evict least recently used entry when at capacity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }),
        fc.array(
          fc.record({
            key: validKeyArbitrary(),
            value: fc.integer(),
          }),
          { minLength: 5, maxLength: 15 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, entries, ttl) => {
          fc.pre(entries.length > maxSize);
          
          // Ensure all keys are unique
          const keys = entries.map(e => e.key);
          const uniqueKeys = new Set(keys);
          fc.pre(uniqueKeys.size === keys.length);

          const cacheService = new CacheService(maxSize);

          // Fill cache to capacity
          for (let i = 0; i < maxSize; i++) {
            const { key, value } = entries[i];
            cacheService.set(key, value, ttl);
          }

          expect(cacheService.getSize()).toBe(maxSize);

          // The first entry is now the LRU
          const lruKey = entries[0].key;

          // Add one more entry (should evict LRU)
          const newEntry = entries[maxSize];
          cacheService.set(newEntry.key, newEntry.value, ttl);

          // LRU should be evicted
          expect(cacheService.has(lruKey)).toBe(false);

          // New entry should be present
          expect(cacheService.has(newEntry.key)).toBe(true);

          // Size should still be at max
          expect(cacheService.getSize()).toBe(maxSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve recently accessed entries during eviction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 8 }),
        fc.array(
          fc.record({
            key: validKeyArbitrary(),
            value: fc.integer(),
          }),
          { minLength: 5, maxLength: 12 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, entries, ttl) => {
          fc.pre(entries.length > maxSize + 1);
          
          // Ensure all keys are unique
          const keys = entries.map(e => e.key);
          const uniqueKeys = new Set(keys);
          fc.pre(uniqueKeys.size === keys.length);

          const cacheService = new CacheService(maxSize);

          // Fill cache
          for (let i = 0; i < maxSize; i++) {
            const { key, value } = entries[i];
            cacheService.set(key, value, ttl);
          }

          // Access the first entry (making it recently used)
          const firstKey = entries[0].key;
          cacheService.get(firstKey);

          // Now the second entry is the LRU
          const lruKey = entries[1].key;

          // Add new entry (should evict second entry, not first)
          const newEntry = entries[maxSize];
          cacheService.set(newEntry.key, newEntry.value, ttl);

          // First entry should still be present (was recently accessed)
          expect(cacheService.has(firstKey)).toBe(true);

          // Second entry should be evicted (was LRU)
          expect(cacheService.has(lruKey)).toBe(false);

          // New entry should be present
          expect(cacheService.has(newEntry.key)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track eviction count correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 10 }),
        fc.integer({ min: 3, max: 8 }),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, extraEntries, ttl) => {
          const cacheService = new CacheService(maxSize);

          // Fill cache to capacity
          for (let i = 0; i < maxSize; i++) {
            cacheService.set(`key-${i}`, i, ttl);
          }

          const statsBeforeEviction = cacheService.getStats();
          const evictionsBeforeEviction = statsBeforeEviction.evictions;

          // Add extra entries (should trigger evictions)
          for (let i = 0; i < extraEntries; i++) {
            cacheService.set(`extra-${i}`, i, ttl);
          }

          const statsAfterEviction = cacheService.getStats();

          // Eviction count should increase by number of extra entries
          expect(statsAfterEviction.evictions).toBe(evictionsBeforeEviction + extraEntries);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle sequential access patterns correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 10 }),
        fc.array(
          fc.record({
            key: validKeyArbitrary(),
            value: fc.integer(),
          }),
          { minLength: 8, maxLength: 15 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, entries, ttl) => {
          fc.pre(entries.length > maxSize);
          
          // Ensure all keys are unique
          const keys = entries.map(e => e.key);
          const uniqueKeys = new Set(keys);
          fc.pre(uniqueKeys.size === keys.length);

          const cacheService = new CacheService(maxSize);

          // Add entries sequentially
          entries.forEach(({ key, value }) => {
            cacheService.set(key, value, ttl);
          });

          // Only the last maxSize entries should remain
          const expectedPresentKeys = entries.slice(-maxSize).map(e => e.key);
          const expectedEvictedKeys = entries.slice(0, -maxSize).map(e => e.key);

          // Check present keys
          expectedPresentKeys.forEach(key => {
            expect(cacheService.has(key)).toBe(true);
          });

          // Check evicted keys
          expectedEvictedKeys.forEach(key => {
            expect(cacheService.has(key)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed access patterns (FIFO-like behavior without access)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 8 }),
        fc.array(
          fc.record({
            key: validKeyArbitrary(),
            value: fc.integer(),
          }),
          { minLength: 6, maxLength: 12 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, entries, ttl) => {
          fc.pre(entries.length > maxSize);
          
          // Ensure all keys are unique
          const keys = entries.map(e => e.key);
          const uniqueKeys = new Set(keys);
          fc.pre(uniqueKeys.size === keys.length);

          const cacheService = new CacheService(maxSize);

          // Fill cache
          for (let i = 0; i < maxSize; i++) {
            cacheService.set(entries[i].key, entries[i].value, ttl);
          }

          // Don't access any entries (all have same lastAccessed time)
          // Add one more entry
          const newEntry = entries[maxSize];
          cacheService.set(newEntry.key, newEntry.value, ttl);

          // First entry should be evicted (oldest)
          expect(cacheService.has(entries[0].key)).toBe(false);

          // New entry should be present
          expect(cacheService.has(newEntry.key)).toBe(true);

          // Other entries should still be present
          for (let i = 1; i < maxSize; i++) {
            expect(cacheService.has(entries[i].key)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of cache size 1', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: validKeyArbitrary(),
            value: fc.integer(),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 10, max: 60 }),
        (entries, ttl) => {
          // Ensure all keys are unique
          const keys = entries.map(e => e.key);
          const uniqueKeys = new Set(keys);
          fc.pre(uniqueKeys.size === keys.length);

          const cacheService = new CacheService(1);

          // Add multiple entries
          entries.forEach(({ key, value }) => {
            cacheService.set(key, value, ttl);
          });

          // Only the last entry should remain
          const lastEntry = entries[entries.length - 1];
          expect(cacheService.getSize()).toBe(1);
          expect(cacheService.get(lastEntry.key)).toBe(lastEntry.value);

          // All previous entries should be evicted
          for (let i = 0; i < entries.length - 1; i++) {
            expect(cacheService.has(entries[i].key)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain correct size after multiple evictions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 15 }),
        fc.integer({ min: 20, max: 50 }),
        fc.integer({ min: 10, max: 60 }),
        (maxSize, totalEntries, ttl) => {
          const cacheService = new CacheService(maxSize);

          // Add many entries
          for (let i = 0; i < totalEntries; i++) {
            cacheService.set(`key-${i}`, i, ttl);

            // Size should never exceed max
            expect(cacheService.getSize()).toBeLessThanOrEqual(maxSize);
          }

          // Final size should be exactly maxSize
          expect(cacheService.getSize()).toBe(maxSize);

          // Eviction count should be correct
          const stats = cacheService.getStats();
          const expectedEvictions = Math.max(0, totalEntries - maxSize);
          expect(stats.evictions).toBe(expectedEvictions);
        }
      ),
      { numRuns: 100 }
    );
  });
});
