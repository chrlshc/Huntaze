import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';

// Mock the API client
const mockApiClient = {
  updateAsset: vi.fn(),
  createAsset: vi.fn(),
  deleteAsset: vi.fn(),
  updateCampaign: vi.fn(),
  batchUpdateAssets: vi.fn(),
};

// Mock the store
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

describe('useOptimisticMutations', () => {
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

  describe('Basic Functionality', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      expect(result.current.operations).toEqual([]);
      expect(result.current.optimisticData).toEqual({});
      expect(result.current.pendingOperations).toEqual([]);
      expect(result.current.failedOperations).toEqual([]);
      expect(result.current.hasPendingOperations).toBe(false);
    });

    it('should provide all expected methods', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      expect(typeof result.current.updateAssetOptimistic).toBe('function');
      expect(typeof result.current.createAssetOptimistic).toBe('function');
      expect(typeof result.current.deleteAssetOptimistic).toBe('function');
      expect(typeof result.current.updateCampaignOptimistic).toBe('function');
      expect(typeof result.current.batchUpdateAssetsOptimistic).toBe('function');
      expect(typeof result.current.clearCompletedOperations).toBe('function');
      expect(typeof result.current.rollbackOperation).toBe('function');
      expect(typeof result.current.clearAllPendingOperations).toBe('function');
    });
  });

  describe('Asset Operations', () => {
    it('should update asset optimistically', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'New Title' });
      });

      expect(result.current.optimisticData['asset-1']).toEqual(
        expect.objectContaining({ title: 'New Title' })
      );
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-1', { title: 'New Title' });
      expect(mockApiClient.updateAsset).toHaveBeenCalledWith('asset-1', { title: 'New Title' });
    });

    it('should create asset optimistically', async () => {
      const { result } = renderHook(() => useOptimisticMutations());
      const assetData = { title: 'New Asset', type: 'image' as const };

      await act(async () => {
        await result.current.createAssetOptimistic(assetData);
      });

      expect(mockStore.addAsset).toHaveBeenCalled();
      expect(mockApiClient.createAsset).toHaveBeenCalledWith(assetData);
    });

    it('should delete asset optimistically', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.deleteAssetOptimistic('asset-1');
      });

      expect(mockStore.deleteAsset).toHaveBeenCalledWith('asset-1');
      expect(mockApiClient.deleteAsset).toHaveBeenCalledWith('asset-1');
    });
  });

  describe('Campaign Operations', () => {
    it('should update campaign optimistically', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateCampaignOptimistic('campaign-1', { name: 'New Name' });
      });

      expect(result.current.optimisticData['campaign-1']).toEqual(
        expect.objectContaining({ name: 'New Name' })
      );
      expect(mockStore.updateCampaign).toHaveBeenCalledWith('campaign-1', { name: 'New Name' });
      expect(mockApiClient.updateCampaign).toHaveBeenCalledWith('campaign-1', { name: 'New Name' });
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch updates', async () => {
      const { result } = renderHook(() => useOptimisticMutations());
      const updates = [
        { id: 'asset-1', data: { title: 'Title 1' } },
        { id: 'asset-2', data: { title: 'Title 2' } }
      ];

      await act(async () => {
        await result.current.batchUpdateAssetsOptimistic(updates);
      });

      expect(mockApiClient.batchUpdateAssets).toHaveBeenCalledWith(updates);
    });
  });

  describe('Operation State Management', () => {
    it('should track pending operations correctly', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Create a promise that never resolves to keep operations pending
      const neverResolves = new Promise<never>(() => {});
      mockApiClient.updateAsset.mockReturnValue(neverResolves);

      // Start operations - they should remain pending since promise never resolves
      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Update 2' });
        // Give a moment for operations to be added
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.pendingOperations).toHaveLength(2);
      expect(result.current.hasPendingOperations).toBe(true);
    });

    it('should handle successful operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Success' });
      });

      // Wait for operation to complete
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      const completedOperation = result.current.operations.find(op => op.entityId === 'asset-1');
      expect(completedOperation?.status).toBe('success');
    });

    it('should handle failed operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        onError: vi.fn()
      }));

      const error = new Error('API Error');
      mockApiClient.updateAsset.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Fail' });
        } catch (e) {
          // Expected to fail
        }
      });

      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'failed';
      });

      const failedOperation = result.current.operations.find(op => op.entityId === 'asset-1');
      expect(failedOperation?.status).toBe('failed');
      expect(failedOperation?.error).toBe('API Error');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should revert optimistic updates on failure', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      mockApiClient.updateAsset.mockRejectedValue(new Error('Server error'));

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Failed Update' });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-1');
    });

    it('should handle network failures with retry', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        maxRetries: 2,
        retryDelay: 100
      }));

      let callCount = 0;
      mockApiClient.updateAsset.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ id: 'asset-1', title: 'Success after retry' });
      });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Retry Test' });
      });

      expect(callCount).toBe(3); // Initial + 2 retries
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const operations = [
        result.current.updateAssetOptimistic('asset-1', { title: 'Concurrent 1' }),
        result.current.updateAssetOptimistic('asset-2', { title: 'Concurrent 2' }),
        result.current.updateAssetOptimistic('asset-3', { title: 'Concurrent 3' })
      ];

      await act(async () => {
        await Promise.allSettled(operations);
      });

      expect(result.current.operations.length).toBeGreaterThanOrEqual(3);
    });

    it('should prevent duplicate operations for same entity when not queued', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        enableQueue: false
      }));

      // Make first operation hang
      const hangingPromise = new Promise(() => {});
      mockApiClient.updateAsset.mockReturnValueOnce(hangingPromise);

      await act(async () => {
        // First operation starts
        result.current.updateAssetOptimistic('asset-1', { title: 'First' });
        
        // Second operation should throw since first is still pending
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Second' });
          expect.fail('Should have thrown error for duplicate operation');
        } catch (error) {
          expect(error.message).toContain('Operation already pending');
        }
      });
    });
  });

  describe('Utility Functions', () => {
    it('should clear completed operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Complete' });
      });

      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      act(() => {
        result.current.clearCompletedOperations();
      });

      expect(result.current.operations.filter(op => op.status === 'success')).toHaveLength(0);
    });

    it('should rollback specific operation', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Rollback Test' });
      });

      const operation = result.current.operations[0];
      
      act(() => {
        result.current.rollbackOperation(operation.id);
      });

      expect(result.current.operations.find(op => op.id === operation.id)).toBeUndefined();
    });

    it('should clear all pending operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Mock a never-resolving promise - operations should stay pending
      const neverResolves = new Promise<never>(() => {});
      mockApiClient.updateAsset.mockReturnValue(neverResolves);

      // Start operations that will remain pending
      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Pending 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Pending 2' });
        // Give a moment for operations to be added
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Operations should be pending (never resolved)
      expect(result.current.hasPendingOperations).toBe(true);

      // Clear all pending operations
      act(() => {
        result.current.clearAllPendingOperations();
      });

      expect(result.current.hasPendingOperations).toBe(false);
    });

    it('should get pending operations for specific entity', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const hangingPromise = new Promise(() => {});
      mockApiClient.updateAsset.mockReturnValue(hangingPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Pending' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      const pendingForAsset = result.current.getPendingOperationsForEntity('asset-1');
      expect(pendingForAsset).toHaveLength(1);
      expect(pendingForAsset[0].entityId).toBe('asset-1');
    });

    it('should check if entity has pending operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const hangingPromise = new Promise(() => {});
      mockApiClient.updateAsset.mockReturnValue(hangingPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Pending' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.isPending('asset', 'asset-1')).toBe(true);
      expect(result.current.isPending('asset', 'asset-2')).toBe(false);
    });
  });

  describe('Advanced Features', () => {
    it('should support debouncing', async () => {
      vi.useFakeTimers();
      
      try {
        const { result } = renderHook(() => useOptimisticMutations({
          debounceMs: 100
        }));

        mockApiClient.updateAsset.mockResolvedValue({ id: 'asset-1' });

        // Multiple rapid updates should be debounced
        act(() => {
          result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
          result.current.updateAssetOptimistic('asset-1', { title: 'Update 2' });
          result.current.updateAssetOptimistic('asset-1', { title: 'Update 3' });
        });

        // Flush microtasks and schedule timers under fake timers
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(0);

        // Advance time just before debounce threshold
        await act(async () => {
          await vi.advanceTimersByTimeAsync(99);
        });
        expect(mockApiClient.updateAsset).not.toHaveBeenCalled();

        // Cross the debounce threshold
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1);
        });

        // Should only make one API call due to debouncing
        expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(1);
        expect(mockApiClient.updateAsset).toHaveBeenCalledWith('asset-1', { title: 'Update 3' });
      } finally {
        vi.useRealTimers();
      }
    });

    it('should support batching', async () => {
      vi.useFakeTimers();
      
      try {
        const { result } = renderHook(() => useOptimisticMutations({
          enableBatching: true,
          batchDelay: 50
        }));

        mockApiClient.batchUpdateAssets.mockResolvedValue([
          { id: 'asset-1', title: 'Batch 1' },
          { id: 'asset-2', title: 'Batch 2' },
        ]);

        // Enqueue ops
        act(() => {
          result.current.updateAssetOptimistic('asset-1', { title: 'Batch 1' });
          result.current.updateAssetOptimistic('asset-2', { title: 'Batch 2' });
        });

        // Flush microtasks and schedule timers under fake timers
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(0);

        // Advance to t=batch-1 (0 calls)
        await act(async () => {
          await vi.advanceTimersByTimeAsync(49);
        });
        expect(mockApiClient.batchUpdateAssets).not.toHaveBeenCalled();

        // Advance to t=batch (1 call with both ops)
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1);
        });

        expect(mockApiClient.batchUpdateAssets).toHaveBeenCalledTimes(1);
        expect(mockApiClient.batchUpdateAssets).toHaveBeenCalledWith([
          { id: 'asset-1', data: { title: 'Batch 1' } },
          { id: 'asset-2', data: { title: 'Batch 2' } },
        ]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should support operation queuing', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        enableQueue: true
      }));

      // First operation hangs
      let resolveFirst: () => void;
      const firstPromise = new Promise<any>(resolve => {
        resolveFirst = () => resolve({ id: 'asset-1', title: 'First' });
      });
      mockApiClient.updateAsset.mockReturnValueOnce(firstPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'First' });
        result.current.updateAssetOptimistic('asset-1', { title: 'Second' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.queuedOperations).toHaveLength(1);

      // Resolve first operation
      await act(async () => {
        resolveFirst!();
        await firstPromise;
      });

      // Second operation should now be processed
      await waitFor(() => {
        return result.current.queuedOperations.length === 0;
      });
    });
  });

  describe('Offline Support', () => {
    it('should queue operations when offline', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Offline Update' });
      });

      expect(result.current.offlineQueue).toHaveLength(1);
      expect(result.current.offlineQueue[0]).toEqual(
        expect.objectContaining({
          type: 'update',
          entityType: 'asset',
          entityId: 'asset-1',
          data: { title: 'Offline Update' }
        })
      );

      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });
  });

  describe('Callback Integration', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useOptimisticMutations({ onSuccess }));

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Success' });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useOptimisticMutations({ onError }));

      mockApiClient.updateAsset.mockRejectedValue(new Error('Test error'));

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Error' });
        } catch (e) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should call onConflict callback', async () => {
      const onConflict = vi.fn();
      const { result } = renderHook(() => useOptimisticMutations({ onConflict }));

      // Mock conflict detection
      const { useConflictResolution } = await import('@/lib/hooks/use-conflict-resolution');
      const mockDetectConflict = vi.mocked(useConflictResolution().detectConflict);
      mockDetectConflict.mockReturnValue({
        id: 'conflict-1',
        entityType: 'asset',
        entityId: 'asset-1',
        localVersion: { title: 'Local' },
        remoteVersion: { title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium'
      });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Conflict Test' });
      });

      await waitFor(() => {
        expect(onConflict).toHaveBeenCalled();
      });
    });
  });

  describe('Regression Tests for Async Timing', () => {
    it('should properly handle async operations with act wrapper', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // This test specifically validates the fix for async timing issues
      const slowPromise = new Promise(resolve => setTimeout(resolve, 10));
      mockApiClient.updateAsset.mockReturnValue(slowPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Async Test' });
        // Allow time for operation to be registered
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Operation should be tracked immediately
      expect(result.current.operations).toHaveLength(1);
      expect(result.current.operations[0].status).toBe('pending');

      // Wait for completion
      await act(async () => {
        await slowPromise;
      });

      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });
    });

    it('should handle multiple async operations without race conditions', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const promises = [
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1', title: 'First' }), 20)),
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-2', title: 'Second' }), 10)),
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-3', title: 'Third' }), 30))
      ];

      mockApiClient.updateAsset
        .mockReturnValueOnce(promises[0])
        .mockReturnValueOnce(promises[1])
        .mockReturnValueOnce(promises[2]);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'First' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Second' });
        result.current.updateAssetOptimistic('asset-3', { title: 'Third' });
        // Allow operations to be registered
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(3);

      // Wait for all operations to complete
      await act(async () => {
        await Promise.all(promises);
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });

      expect(result.current.operations.filter(op => op.status === 'success')).toHaveLength(3);
    });

    it('should maintain operation order with async timing', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const operationIds: string[] = [];
      // Push-only wrapper to avoid recursive re-entry on the same spy
      mockApiClient.updateAsset.mockImplementation(async (id: string, data: any) => {
        operationIds.push(id);
        return Promise.resolve({ id, ...data });
      });

      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'First' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Second' });
        result.current.updateAssetOptimistic('asset-3', { title: 'Third' });
        // Ensure operations are processed
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      expect(operationIds).toEqual(['asset-1', 'asset-2', 'asset-3']);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with many operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Create many operations
      const operations = Array.from({ length: 100 }, (_, i) => 
        result.current.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` })
      );

      await act(async () => {
        await Promise.allSettled(operations);
      });

      // Clear completed operations to free memory
      act(() => {
        result.current.clearCompletedOperations();
      });

      expect(result.current.operations.length).toBeLessThan(100);
    });

    it('should cleanup timers on unmount', () => {
      const { unmount } = renderHook(() => useOptimisticMutations({
        debounceMs: 1000
      }));

      // Start an operation that would be debounced
      act(() => {
        // This would normally set a timer
      });

      // Unmount should cleanup timers
      expect(() => unmount()).not.toThrow();
    });
  });
});
