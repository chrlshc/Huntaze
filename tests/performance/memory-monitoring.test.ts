import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Memory Monitoring Tests
 * 
 * Tests to detect memory leaks and ensure memory usage stays within bounds
 * Requirement 7.5: No memory leaks during extended test runs
 */

describe('Memory Monitoring Tests', () => {
  const MEMORY_GROWTH_THRESHOLD_MB = 50; // Max 50MB growth
  const MEMORY_LEAK_THRESHOLD_PERCENT = 0.10; // 10% growth per iteration

  function getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed / 1024 / 1024, // Convert to MB
        heapTotal: usage.heapTotal / 1024 / 1024,
        external: usage.external / 1024 / 1024,
        rss: usage.rss / 1024 / 1024,
      };
    }
    return null;
  }

  function forceGarbageCollection() {
    if (global.gc) {
      global.gc();
    }
  }

  describe('Memory Leak Detection', () => {
    it('should not leak memory during repeated API calls', async () => {
      forceGarbageCollection();
      const initialMemory = getMemoryUsage();
      
      if (!initialMemory) {
        console.warn('Memory monitoring not available');
        return;
      }

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await fetch('http://localhost:3000/api/dashboard');
      }

      forceGarbageCollection();
      const finalMemory = getMemoryUsage();

      if (finalMemory) {
        const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryGrowth).toBeLessThan(MEMORY_GROWTH_THRESHOLD_MB);
      }
    });

    it('should not leak memory during content operations', async () => {
      forceGarbageCollection();
      const initialMemory = getMemoryUsage();
      
      if (!initialMemory) return;

      // Create and fetch content repeatedly
      for (let i = 0; i < 50; i++) {
        await fetch('http://localhost:3000/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'instagram',
            type: 'post',
            caption: `Test post ${i}`,
          }),
        });
        
        await fetch('http://localhost:3000/api/content');
      }

      forceGarbageCollection();
      const finalMemory = getMemoryUsage();

      if (finalMemory) {
        const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryGrowth).toBeLessThan(MEMORY_GROWTH_THRESHOLD_MB);
      }
    });

    it('should not leak memory during message operations', async () => {
      forceGarbageCollection();
      const initialMemory = getMemoryUsage();
      
      if (!initialMemory) return;

      for (let i = 0; i < 50; i++) {
        await fetch('http://localhost:3000/api/messages/unified');
      }

      forceGarbageCollection();
      const finalMemory = getMemoryUsage();

      if (finalMemory) {
        const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryGrowth).toBeLessThan(MEMORY_GROWTH_THRESHOLD_MB);
      }
    });
  });

  describe('Memory Usage Bounds', () => {
    it('should keep heap usage within reasonable bounds', async () => {
      const memory = getMemoryUsage();
      
      if (!memory) return;

      // Heap should not exceed 500MB in tests
      expect(memory.heapUsed).toBeLessThan(500);
    });

    it('should maintain stable memory during sustained load', async () => {
      const measurements: number[] = [];
      
      // Take 10 measurements during sustained load
      for (let i = 0; i < 10; i++) {
        // Make some requests
        await Promise.all([
          fetch('http://localhost:3000/api/dashboard'),
          fetch('http://localhost:3000/api/content'),
          fetch('http://localhost:3000/api/messages/unified'),
        ]);

        forceGarbageCollection();
        const memory = getMemoryUsage();
        if (memory) {
          measurements.push(memory.heapUsed);
        }
      }

      if (measurements.length > 0) {
        // Calculate growth rate
        const firstMeasurement = measurements[0];
        const lastMeasurement = measurements[measurements.length - 1];
        const growthRate = (lastMeasurement - firstMeasurement) / firstMeasurement;

        // Growth should be minimal
        expect(growthRate).toBeLessThan(MEMORY_LEAK_THRESHOLD_PERCENT);
      }
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up resources after operations', async () => {
      forceGarbageCollection();
      const beforeMemory = getMemoryUsage();
      
      if (!beforeMemory) return;

      // Perform operations
      const operations = Array(20).fill(null).map((_, i) =>
        fetch('http://localhost:3000/api/dashboard')
      );
      
      await Promise.all(operations);

      // Force cleanup
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 100));
      forceGarbageCollection();

      const afterMemory = getMemoryUsage();

      if (afterMemory) {
        const memoryDiff = afterMemory.heapUsed - beforeMemory.heapUsed;
        // Should return close to baseline
        expect(Math.abs(memoryDiff)).toBeLessThan(20); // Within 20MB
      }
    });
  });

  describe('Memory Profiling', () => {
    it('should track memory usage over time', async () => {
      const profile: Array<{ timestamp: number; memory: number }> = [];
      
      for (let i = 0; i < 5; i++) {
        await fetch('http://localhost:3000/api/dashboard');
        
        const memory = getMemoryUsage();
        if (memory) {
          profile.push({
            timestamp: Date.now(),
            memory: memory.heapUsed,
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify we collected data
      expect(profile.length).toBeGreaterThan(0);

      // Memory should not grow linearly
      if (profile.length >= 2) {
        const firstMemory = profile[0].memory;
        const lastMemory = profile[profile.length - 1].memory;
        const growth = lastMemory - firstMemory;
        
        expect(growth).toBeLessThan(MEMORY_GROWTH_THRESHOLD_MB);
      }
    });
  });
});
