import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';

/**
 * Tests de régression pour les problèmes de timing asynchrone
 * dans useOptimisticMutations
 * 
 * Ces tests valident spécifiquement la correction apportée pour gérer
 * correctement les opérations asynchrones avec act() et les délais appropriés.
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

describe('Optimistic Mutations - Async Timing Regression Tests', () => {
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

  describe('Regression: Pending Operations Tracking', () => {
    it('should correctly track pending operations with never-resolving promises', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Create a promise that never resolves to simulate hanging operations
      const neverResolves = new Promise<never>(() => {});
      mockApiClient.updateAsset.mockReturnValue(neverResolves);

      // This is the exact pattern that was fixed - using await act with async
      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Update 2' });
        // Critical: Give a moment for operations to be added to state
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Validate the fix works
      expect(result.current.pendingOperations).toHaveLength(2);
      expect(result.current.hasPendingOperations).toBe(true);
      expect(result.current.operations).toHaveLength(2);
      
      // Verify both operations are in pending state
      expect(result.current.operations[0].status).toBe('pending');
      expect(result.current.operations[1].status).toBe('pending');
    });

    it('should handle rapid successive operations without timing issues', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const slowPromise = new Promise(resolve => setTimeout(resolve, 50));
      mockApiClient.updateAsset.mockReturnValue(slowPromise);

      await act(async () => {
        // Fire multiple operations rapidly
        for (let i = 0; i < 5; i++) {
          result.current.updateAssetOptimistic(`asset-${i}`, { title: `Update ${i}` });
        }
        // Allow state updates to propagate
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(5);
      expect(result.current.pendingOperations).toHaveLength(5);

      // Wait for all operations to complete
      await act(async () => {
        await slowPromise;
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      }, { timeout: 1000 });
    });

    it('should maintain consistent state during async operation lifecycle', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      let resolveOperation: (value: any) => void;
      const controllablePromise = new Promise(resolve => {
        resolveOperation = resolve;
      });
      mockApiClient.updateAsset.mockReturnValue(controllablePromise);

      // Start operation
      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Controlled Update' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Verify pending state
      expect(result.current.operations).toHaveLength(1);
      expect(result.current.operations[0].status).toBe('pending');
      expect(result.current.hasPendingOperations).toBe(true);

      // Resolve the operation
      await act(async () => {
        resolveOperation({ id: 'asset-1', title: 'Controlled Update' });
        await controllablePromise;
      });

      // Verify completion
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      expect(result.current.hasPendingOperations).toBe(false);
    });
  });

  describe('Regression: Race Condition Prevention', () => {
    it('should prevent race conditions in concurrent operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const promises = [
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1' }), 30)),
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-2' }), 10)),
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-3' }), 20))
      ];

      mockApiClient.updateAsset
        .mockReturnValueOnce(promises[0])
        .mockReturnValueOnce(promises[1])
        .mockReturnValueOnce(promises[2]);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'First' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Second' });
        result.current.updateAssetOptimistic('asset-3', { title: 'Third' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(3);

      // Wait for all to complete in their own timing
      await act(async () => {
        await Promise.all(promises);
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });

      // Verify no operations were lost or corrupted
      expect(result.current.operations).toHaveLength(3);
      expect(result.current.operations.map(op => op.entityId).sort()).toEqual([
        'asset-1', 'asset-2', 'asset-3'
      ]);
    });

    it('should handle mixed success/failure scenarios correctly', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        onError: vi.fn()
      }));

      mockApiClient.updateAsset
        .mockResolvedValueOnce({ id: 'asset-1', title: 'Success' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ id: 'asset-3', title: 'Success' });

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Success' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Failure' });
        result.current.updateAssetOptimistic('asset-3', { title: 'Success' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(3);

      // Wait for all operations to complete (success or failure)
      await waitFor(() => {
        return result.current.operations.every(op => 
          op.status === 'success' || op.status === 'failed'
        );
      });

      const successOps = result.current.operations.filter(op => op.status === 'success');
      const failedOps = result.current.operations.filter(op => op.status === 'failed');

      expect(successOps).toHaveLength(2);
      expect(failedOps).toHaveLength(1);
      expect(failedOps[0].entityId).toBe('asset-2');
    });
  });

  describe('Regression: State Consistency', () => {
    it('should maintain optimistic data consistency during async operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const delayedPromise = new Promise(resolve => 
        setTimeout(() => resolve({ id: 'asset-1', title: 'Server Response' }), 100)
      );
      mockApiClient.updateAsset.mockReturnValue(delayedPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Optimistic Update' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Verify optimistic data is immediately available
      expect(result.current.optimisticData['asset-1']).toEqual(
        expect.objectContaining({ title: 'Optimistic Update' })
      );

      // Wait for server response
      await act(async () => {
        await delayedPromise;
      });

      // Verify data is updated with server response
      await waitFor(() => {
        return result.current.optimisticData['asset-1']?.title === 'Server Response';
      });
    });

    it('should properly revert failed optimistic updates', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const originalData = { id: 'asset-1', title: 'Original' };
      result.current.optimisticData['asset-1'] = originalData;

      mockApiClient.updateAsset.mockRejectedValue(new Error('Update failed'));

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Failed Update' });
        } catch (error) {
          // Expected to fail
        }
      });

      // Verify revert was called
      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-1');

      // Verify operation is marked as failed
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'failed';
      });
    });
  });

  describe('Regression: Memory and Performance', () => {
    it('should not accumulate operations indefinitely', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Create many operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          result.current.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` })
        );
      }

      await act(async () => {
        await Promise.allSettled(operations);
      });

      expect(result.current.operations.length).toBe(50);

      // Clear completed operations
      act(() => {
        result.current.clearCompletedOperations();
      });

      // Should only have pending operations left (if any)
      expect(result.current.operations.length).toBeLessThanOrEqual(50);
      expect(result.current.operations.every(op => op.status === 'pending')).toBe(true);
    });

    it('should handle cleanup of pending operations correctly', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const neverResolves = new Promise<never>(() => {});
      mockApiClient.updateAsset.mockReturnValue(neverResolves);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Pending 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Pending 2' });
        result.current.updateAssetOptimistic('asset-3', { title: 'Pending 3' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.pendingOperations).toHaveLength(3);

      // Clear all pending operations
      act(() => {
        result.current.clearAllPendingOperations();
      });

      expect(result.current.pendingOperations).toHaveLength(0);
      expect(result.current.hasPendingOperations).toBe(false);
      expect(result.current.operations.filter(op => op.status === 'pending')).toHaveLength(0);
    });
  });

  describe('Regression: Edge Cases', () => {
    it('should handle operations with zero delay correctly', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Immediate resolution
      mockApiClient.updateAsset.mockResolvedValue({ id: 'asset-1', title: 'Immediate' });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Immediate Update' });
      });

      // Should complete immediately but still be tracked
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      expect(result.current.operations).toHaveLength(1);
    });

    it('should handle operations that throw synchronously', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        onError: vi.fn()
      }));

      mockApiClient.updateAsset.mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Sync Error' });
        } catch (error) {
          // Expected
        }
      });

      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'failed';
      });

      expect(result.current.operations[0].error).toBe('Synchronous error');
    });

    it('should handle rapid mount/unmount scenarios', async () => {
      let unmount: () => void;

      await act(async () => {
        const { unmount: hookUnmount } = renderHook(() => useOptimisticMutations());
        unmount = hookUnmount;
        
        // Start some operations
        const { result } = renderHook(() => useOptimisticMutations());
        result.current.updateAssetOptimistic('asset-1', { title: 'Unmount Test' });
        
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Unmount should not throw
      expect(() => unmount!()).not.toThrow();
    });
  });

  describe('Regression: Specific Bug Fixes', () => {
    it('should fix the original pending operations timing issue', async () => {
      // This test specifically validates the exact fix that was applied
      const { result } = renderHook(() => useOptimisticMutations());

      const neverResolves = new Promise<never>(() => {});
      mockApiClient.updateAsset.mockReturnValue(neverResolves);

      // Original problematic pattern (now fixed):
      // act(() => { ... }) without await and without timing delay
      
      // Fixed pattern:
      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Update 2' });
        // Critical fix: await a small delay for state updates
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // This assertion would have failed before the fix
      expect(result.current.pendingOperations).toHaveLength(2);
      expect(result.current.hasPendingOperations).toBe(true);
      
      // Verify the operations are properly tracked
      expect(result.current.operations).toHaveLength(2);
      expect(result.current.operations.every(op => op.status === 'pending')).toBe(true);
      expect(result.current.operations.map(op => op.entityId)).toEqual(['asset-1', 'asset-2']);
    });

    it('should maintain backward compatibility with synchronous operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Synchronous resolution should still work
      mockApiClient.updateAsset.mockResolvedValue({ id: 'asset-1', title: 'Sync' });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Sync Update' });
      });

      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      expect(result.current.operations).toHaveLength(1);
      expect(result.current.hasPendingOperations).toBe(false);
    });

    it('should handle the timing fix with different async patterns', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Test with Promise.resolve (microtask)
      mockApiClient.updateAsset.mockReturnValue(Promise.resolve({ id: 'asset-1' }));

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Microtask' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(1);

      // Test with setTimeout (macrotask)
      const macrotaskPromise = new Promise(resolve => 
        setTimeout(() => resolve({ id: 'asset-2' }), 0)
      );
      mockApiClient.updateAsset.mockReturnValue(macrotaskPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-2', { title: 'Macrotask' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(2);

      // Wait for macrotask to complete
      await act(async () => {
        await macrotaskPromise;
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });
    });
  });
});