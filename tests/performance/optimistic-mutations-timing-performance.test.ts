import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';

/**
 * Tests de performance pour valider que la correction du timing asynchrone
 * dans useOptimisticMutations n'impacte pas négativement les performances.
 */

// Mock setup
const mockApiClient = {
  updateAsset: vi.fn(),
  createAsset: vi.fn(),
  deleteAsset: vi.fn(),
  updateCampaign: vi.fn(),
  batchUpdateAssets: vi.fn(),
};

const mockStore = {
  addAsset: vi.fn(),
  updateAsset: vi.fn(),
  deleteAsset: vi.fn(),
  updateCampaign: vi.fn(),
  revertOptimisticUpdate: vi.fn(),
  mediaAssets: { items: [] },
  campaigns: { items: [] }
};

vi.mock('@/lib/api', () => ({
  apiClient: mockApiClient
}));

vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: () => mockStore
}));

vi.mock('@/lib/hooks/use-conflict-resolution', () => ({
  useConflictResolution: () => ({
    detectConflict: vi.fn(),
    addConflict: vi.fn()
  })
}));

describe('Optimistic Mutations Timing - Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.updateAsset.mockResolvedValue({ id: 'asset-1', title: 'Updated' });
    mockApiClient.createAsset.mockResolvedValue({ id: 'new-asset', title: 'Created' });
    mockApiClient.deleteAsset.mockResolvedValue(undefined);
    mockApiClient.updateCampaign.mockResolvedValue({ id: 'campaign-1', name: 'Updated Campaign' });
    mockApiClient.batchUpdateAssets.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Timing Fix Performance Impact', () => {
    it('should not significantly impact single operation performance', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = performance.now();

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Performance Test' });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 100ms for single operation)
      expect(duration).toBeLessThan(100);
      expect(result.current.operations).toHaveLength(1);
    });

    it('should maintain performance with multiple concurrent operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const operationCount = 50;
      const startTime = performance.now();

      // Create promises with varying delays to simulate real-world conditions
      const promises = Array.from({ length: operationCount }, (_, i) => {
        const delay = Math.random() * 10; // 0-10ms random delay
        return new Promise(resolve => 
          setTimeout(() => resolve({ id: `asset-${i}`, title: `Asset ${i}` }), delay)
        );
      });

      promises.forEach((promise, i) => {
        mockApiClient.updateAsset.mockReturnValueOnce(promise);
      });

      await act(async () => {
        for (let i = 0; i < operationCount; i++) {
          result.current.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` });
        }
        // The timing fix: small delay for state updates
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const registrationTime = performance.now();
      const registrationDuration = registrationTime - startTime;

      // Registration should be fast (< 50ms for 50 operations)
      expect(registrationDuration).toBeLessThan(50);
      expect(result.current.operations).toHaveLength(operationCount);

      // Wait for all operations to complete
      await act(async () => {
        await Promise.all(promises);
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });

      const totalTime = performance.now() - startTime;

      // Total time should be reasonable (< 1 second for 50 operations)
      expect(totalTime).toBeLessThan(1000);
    });

    it('should not cause memory leaks with timing delays', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many operations with timing delays
      for (let batch = 0; batch < 10; batch++) {
        await act(async () => {
          for (let i = 0; i < 20; i++) {
            result.current.updateAssetOptimistic(`asset-${batch}-${i}`, { 
              title: `Batch ${batch} Asset ${i}` 
            });
          }
          await new Promise(resolve => setTimeout(resolve, 1));
        });

        // Clear completed operations to prevent accumulation
        act(() => {
          result.current.clearCompletedOperations();
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 10MB)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    it('should maintain responsiveness during heavy async load', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const heavyOperationCount = 100;
      const responsivenessTimes: number[] = [];

      // Create operations with the timing fix
      await act(async () => {
        for (let i = 0; i < heavyOperationCount; i++) {
          const operationStart = performance.now();
          
          result.current.updateAssetOptimistic(`heavy-asset-${i}`, { 
            title: `Heavy Asset ${i}` 
          });
          
          const operationEnd = performance.now();
          responsivenessTimes.push(operationEnd - operationStart);
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Each individual operation should be fast
      const averageTime = responsivenessTimes.reduce((a, b) => a + b, 0) / responsivenessTimes.length;
      const maxTime = Math.max(...responsivenessTimes);

      expect(averageTime).toBeLessThan(1); // < 1ms average
      expect(maxTime).toBeLessThan(10); // < 10ms max
      expect(result.current.operations).toHaveLength(heavyOperationCount);
    });
  });

  describe('Comparison with Previous Implementation', () => {
    it('should perform similarly to synchronous act pattern', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Measure new async pattern
      const asyncStartTime = performance.now();
      
      await act(async () => {
        result.current.updateAssetOptimistic('async-asset', { title: 'Async Pattern' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });
      
      const asyncEndTime = performance.now();
      const asyncDuration = asyncEndTime - asyncStartTime;

      // Measure synchronous completion
      const syncStartTime = performance.now();
      
      await act(async () => {
        await result.current.updateAssetOptimistic('sync-asset', { title: 'Sync Pattern' });
      });
      
      const syncEndTime = performance.now();
      const syncDuration = syncEndTime - syncStartTime;

      // Async pattern should not be significantly slower (< 10ms difference)
      const difference = asyncDuration - syncDuration;
      expect(difference).toBeLessThan(10);
    });

    it('should scale better with concurrent operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const concurrentCount = 25;

      // Test concurrent operations with timing fix
      const concurrentStartTime = performance.now();
      
      const neverResolves = new Promise<never>(() => {});
      mockApiClient.updateAsset.mockReturnValue(neverResolves);

      await act(async () => {
        for (let i = 0; i < concurrentCount; i++) {
          result.current.updateAssetOptimistic(`concurrent-${i}`, { title: `Concurrent ${i}` });
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });
      
      const concurrentEndTime = performance.now();
      const concurrentDuration = concurrentEndTime - concurrentStartTime;

      expect(result.current.operations).toHaveLength(concurrentCount);
      expect(result.current.hasPendingOperations).toBe(true);

      // Should handle concurrent operations efficiently (< 100ms for 25 operations)
      expect(concurrentDuration).toBeLessThan(100);
    });
  });

  describe('Resource Usage Optimization', () => {
    it('should efficiently handle timer cleanup', async () => {
      const { result, unmount } = renderHook(() => useOptimisticMutations({
        debounceMs: 100,
        enableBatching: true,
        batchDelay: 50
      }));

      const timerStartTime = performance.now();

      await act(async () => {
        // Create operations that would set timers
        for (let i = 0; i < 10; i++) {
          result.current.updateAssetOptimistic(`timer-asset-${i}`, { title: `Timer ${i}` });
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const timerSetupTime = performance.now() - timerStartTime;

      // Timer setup should be fast
      expect(timerSetupTime).toBeLessThan(50);

      // Cleanup should not throw or hang
      const cleanupStartTime = performance.now();
      unmount();
      const cleanupTime = performance.now() - cleanupStartTime;

      expect(cleanupTime).toBeLessThan(10);
    });

    it('should optimize state updates with batching', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const batchSize = 20;
      const stateUpdateTimes: number[] = [];

      for (let batch = 0; batch < 5; batch++) {
        const batchStartTime = performance.now();

        await act(async () => {
          for (let i = 0; i < batchSize; i++) {
            result.current.updateAssetOptimistic(`batch-${batch}-${i}`, { 
              title: `Batch ${batch} Item ${i}` 
            });
          }
          await new Promise(resolve => setTimeout(resolve, 1));
        });

        const batchEndTime = performance.now();
        stateUpdateTimes.push(batchEndTime - batchStartTime);
      }

      // Each batch should be processed efficiently
      const averageBatchTime = stateUpdateTimes.reduce((a, b) => a + b, 0) / stateUpdateTimes.length;
      expect(averageBatchTime).toBeLessThan(20); // < 20ms per batch of 20 operations

      expect(result.current.operations).toHaveLength(batchSize * 5);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle rapid fire operations efficiently', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const rapidFireCount = 100;
      const startTime = performance.now();

      // Fire operations as fast as possible
      await act(async () => {
        const promises = [];
        for (let i = 0; i < rapidFireCount; i++) {
          promises.push(
            result.current.updateAssetOptimistic(`rapid-${i}`, { title: `Rapid ${i}` })
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid fire efficiently (< 200ms for 100 operations)
      expect(duration).toBeLessThan(200);
      expect(result.current.operations).toHaveLength(rapidFireCount);
    });

    it('should maintain performance with mixed operation types', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const mixedOperationCount = 30;
      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < mixedOperationCount; i++) {
          const operationType = i % 3;
          
          switch (operationType) {
            case 0:
              result.current.updateAssetOptimistic(`mixed-asset-${i}`, { title: `Update ${i}` });
              break;
            case 1:
              result.current.createAssetOptimistic({ title: `Create ${i}`, type: 'image' as const });
              break;
            case 2:
              result.current.deleteAssetOptimistic(`delete-asset-${i}`);
              break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Mixed operations should be handled efficiently
      expect(duration).toBeLessThan(100);
      expect(result.current.operations).toHaveLength(mixedOperationCount);
    });

    it('should handle error scenarios without performance degradation', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        onError: vi.fn()
      }));

      const errorOperationCount = 20;
      
      // Mix of successful and failing operations
      for (let i = 0; i < errorOperationCount; i++) {
        if (i % 2 === 0) {
          mockApiClient.updateAsset.mockResolvedValueOnce({ id: `asset-${i}`, title: `Success ${i}` });
        } else {
          mockApiClient.updateAsset.mockRejectedValueOnce(new Error(`Error ${i}`));
        }
      }

      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < errorOperationCount; i++) {
          try {
            result.current.updateAssetOptimistic(`error-asset-${i}`, { title: `Error Test ${i}` });
          } catch (error) {
            // Expected for some operations
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Error handling should not significantly impact performance
      expect(duration).toBeLessThan(150);
      expect(result.current.operations).toHaveLength(errorOperationCount);

      // Wait for operations to complete
      await waitFor(() => {
        return result.current.operations.every(op => 
          op.status === 'success' || op.status === 'failed'
        );
      });

      const successCount = result.current.operations.filter(op => op.status === 'success').length;
      const failureCount = result.current.operations.filter(op => op.status === 'failed').length;

      expect(successCount).toBe(errorOperationCount / 2);
      expect(failureCount).toBe(errorOperationCount / 2);
    });
  });

  describe('Benchmark Comparisons', () => {
    it('should meet performance benchmarks for typical usage', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Typical usage: 5-10 operations per user interaction
      const typicalOperationCount = 8;
      const benchmarkTime = 50; // 50ms benchmark

      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < typicalOperationCount; i++) {
          result.current.updateAssetOptimistic(`typical-${i}`, { title: `Typical ${i}` });
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(benchmarkTime);
      expect(result.current.operations).toHaveLength(typicalOperationCount);
      expect(result.current.hasPendingOperations).toBe(true);
    });

    it('should scale linearly with operation count', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const testSizes = [10, 20, 40];
      const durations: number[] = [];

      for (const size of testSizes) {
        const startTime = performance.now();

        await act(async () => {
          for (let i = 0; i < size; i++) {
            result.current.updateAssetOptimistic(`scale-${size}-${i}`, { title: `Scale ${i}` });
          }
          await new Promise(resolve => setTimeout(resolve, 1));
        });

        const endTime = performance.now();
        durations.push(endTime - startTime);

        // Clear operations for next test
        act(() => {
          result.current.clearAllPendingOperations();
        });
      }

      // Performance should scale roughly linearly
      const ratio1 = durations[1] / durations[0]; // 20/10
      const ratio2 = durations[2] / durations[1]; // 40/20

      // Ratios should be close to the size ratios (within 50% tolerance)
      expect(ratio1).toBeLessThan(3); // Should be ~2, allow up to 3
      expect(ratio2).toBeLessThan(3); // Should be ~2, allow up to 3
    });
  });
});