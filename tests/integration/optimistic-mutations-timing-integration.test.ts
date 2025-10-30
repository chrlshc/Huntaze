import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';
import { useConflictResolution } from '@/lib/hooks/use-conflict-resolution';
import { useSSEClient } from '@/lib/hooks/use-sse-client';

/**
 * Tests d'intégration pour valider que la correction du timing asynchrone
 * dans useOptimisticMutations fonctionne correctement avec les autres hooks
 * et le système de store.
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
  addConflict: vi.fn(),
  resolveConflict: vi.fn(),
  clearConflicts: vi.fn(),
  fetchAssets: vi.fn(),
  fetchCampaigns: vi.fn(),
  mediaAssets: { 
    items: [
      { id: 'asset-1', title: 'Existing Asset', updatedAt: new Date('2024-01-01') }
    ] 
  },
  campaigns: { items: [] },
  sync: {
    status: 'synced' as const,
    conflicts: [],
    lastSyncAt: new Date()
  }
};

// Mock EventSource for SSE tests
class MockEventSource {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;
  url: string;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === 'open') this.onopen = listener as any;
    if (type === 'message') this.onmessage = listener as any;
    if (type === 'error') this.onerror = listener as any;
  }

  removeEventListener() {}

  dispatchEvent(event: Event): boolean {
    if (event.type === 'message' && this.onmessage) {
      this.onmessage(event as MessageEvent);
    }
    return true;
  }
}

global.EventSource = MockEventSource as any;

vi.mock('@/lib/api', () => ({
  apiClient: mockApiClient
}));

vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: () => mockStore
}));

describe('Optimistic Mutations Timing - Integration Tests', () => {
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

  describe('Integration with Conflict Resolution', () => {
    it('should properly integrate async timing with conflict detection', async () => {
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations({
        onConflict: vi.fn()
      }));
      const { result: conflictResult } = renderHook(() => useConflictResolution());

      // Mock conflict detection
      const mockConflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local Version', updatedAt: new Date('2024-01-01') },
        remoteVersion: { id: 'asset-1', title: 'Remote Version', updatedAt: new Date('2024-01-02') },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      };

      vi.mocked(conflictResult.current.detectConflict).mockReturnValue(mockConflict);

      // Use the fixed async timing pattern
      await act(async () => {
        optimisticResult.current.updateAssetOptimistic('asset-1', { title: 'Conflicting Update' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Verify operation is tracked
      expect(optimisticResult.current.operations).toHaveLength(1);

      // Wait for operation to complete and conflict to be detected
      await waitFor(() => {
        const operation = optimisticResult.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      // Verify conflict detection was called
      expect(conflictResult.current.detectConflict).toHaveBeenCalled();
    });

    it('should handle conflict resolution during async operations', async () => {
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations());
      const { result: conflictResult } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local' },
        remoteVersion: { id: 'asset-1', title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      };

      // Add conflict first
      act(() => {
        conflictResult.current.addConflict(conflict);
      });

      // Start async operation with proper timing
      const slowPromise = new Promise(resolve => 
        setTimeout(() => resolve({ id: 'asset-1', title: 'Resolved' }), 50)
      );
      mockApiClient.updateAsset.mockReturnValue(slowPromise);

      await act(async () => {
        optimisticResult.current.updateAssetOptimistic('asset-1', { title: 'During Conflict' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Resolve conflict while operation is pending
      await act(async () => {
        await conflictResult.current.resolveConflict(conflict, 'remote');
      });

      // Wait for async operation to complete
      await act(async () => {
        await slowPromise;
      });

      await waitFor(() => {
        const operation = optimisticResult.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      expect(mockStore.resolveConflict).toHaveBeenCalled();
    });
  });

  describe('Integration with SSE Client', () => {
    it('should handle SSE events during pending optimistic operations', async () => {
      const onEvent = vi.fn();
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations());
      const { result: sseResult } = renderHook(() => useSSEClient({
        onEvent
      }));

      // Start a long-running optimistic operation
      const longPromise = new Promise(resolve => 
        setTimeout(() => resolve({ id: 'asset-1', title: 'Long Update' }), 100)
      );
      mockApiClient.updateAsset.mockReturnValue(longPromise);

      await act(async () => {
        optimisticResult.current.updateAssetOptimistic('asset-1', { title: 'Optimistic' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Verify operation is pending
      expect(optimisticResult.current.hasPendingOperations).toBe(true);

      // Wait for SSE connection
      await waitFor(() => {
        expect(sseResult.current.isConnected).toBe(true);
      });

      // Simulate SSE event during pending operation
      const sseEvent = {
        id: 'event-1',
        type: 'asset_updated',
        timestamp: new Date().toISOString(),
        data: {
          id: 'asset-1',
          title: 'SSE Update',
          updatedAt: new Date().toISOString()
        }
      };

      await act(async () => {
        const mockEvent = new MessageEvent('message', {
          data: JSON.stringify(sseEvent)
        });
        
        // Trigger SSE event
        const eventSource = sseResult.current as any;
        if (eventSource.onmessage) {
          eventSource.onmessage(mockEvent);
        }
      });

      // Wait for optimistic operation to complete
      await act(async () => {
        await longPromise;
      });

      await waitFor(() => {
        const operation = optimisticResult.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      // Verify both systems worked together
      expect(mockStore.fetchAssets).toHaveBeenCalled();
      expect(optimisticResult.current.operations).toHaveLength(1);
    });

    it('should maintain data consistency between SSE and optimistic updates', async () => {
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations());
      const { result: sseResult } = renderHook(() => useSSEClient());

      // Start optimistic update
      await act(async () => {
        optimisticResult.current.updateAssetOptimistic('asset-1', { title: 'Optimistic Title' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      // Verify optimistic data
      expect(optimisticResult.current.optimisticData['asset-1']).toEqual(
        expect.objectContaining({ title: 'Optimistic Title' })
      );

      // Wait for SSE connection
      await waitFor(() => {
        expect(sseResult.current.isConnected).toBe(true);
      });

      // Simulate concurrent SSE update
      const concurrentEvent = {
        id: 'event-2',
        type: 'asset_updated',
        timestamp: new Date().toISOString(),
        data: {
          id: 'asset-2',
          title: 'Concurrent SSE Update',
          updatedAt: new Date().toISOString()
        }
      };

      await act(async () => {
        const mockEvent = new MessageEvent('message', {
          data: JSON.stringify(concurrentEvent)
        });
        
        // Simulate SSE message
        if ((sseResult.current as any).onmessage) {
          (sseResult.current as any).onmessage(mockEvent);
        }
      });

      // Verify both updates coexist
      expect(optimisticResult.current.optimisticData['asset-1']).toBeDefined();
      expect(mockStore.fetchAssets).toHaveBeenCalled();
    });
  });

  describe('Integration with Store Operations', () => {
    it('should maintain store consistency during async timing fixes', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Multiple operations with different timing
      const promises = [
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1' }), 30)),
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-2' }), 10)),
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-3' }), 50))
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

      // Verify all operations are tracked
      expect(result.current.operations).toHaveLength(3);
      expect(mockStore.updateAsset).toHaveBeenCalledTimes(3);

      // Wait for all operations to complete
      await act(async () => {
        await Promise.all(promises);
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });

      // Verify store was updated for each operation
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-1', { title: 'First' });
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-2', { title: 'Second' });
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-3', { title: 'Third' });
    });

    it('should handle store errors during async operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations({
        onError: vi.fn()
      }));

      // Mock store operation to throw
      mockStore.updateAsset.mockImplementation(() => {
        throw new Error('Store error');
      });

      await act(async () => {
        try {
          result.current.updateAssetOptimistic('asset-1', { title: 'Store Error Test' });
          await new Promise(resolve => setTimeout(resolve, 1));
        } catch (error) {
          // Store error should not prevent operation tracking
        }
      });

      // Operation should still be tracked despite store error
      expect(result.current.operations).toHaveLength(1);

      // Wait for API operation to complete
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle full workflow with timing fixes', async () => {
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations({
        onConflict: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn()
      }));
      const { result: conflictResult } = renderHook(() => useConflictResolution());
      const { result: sseResult } = renderHook(() => useSSEClient());

      // Step 1: Start optimistic update with proper timing
      await act(async () => {
        optimisticResult.current.updateAssetOptimistic('asset-1', { title: 'Workflow Test' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(optimisticResult.current.operations).toHaveLength(1);

      // Step 2: Simulate SSE connection and events
      await waitFor(() => {
        expect(sseResult.current.isConnected).toBe(true);
      });

      // Step 3: Add a conflict during operation
      const conflict = {
        id: 'workflow-conflict',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Workflow Test' },
        remoteVersion: { id: 'asset-1', title: 'Remote Change' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'high' as const
      };

      act(() => {
        conflictResult.current.addConflict(conflict);
      });

      // Step 4: Wait for operation completion
      await waitFor(() => {
        const operation = optimisticResult.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });

      // Step 5: Resolve conflict
      await act(async () => {
        await conflictResult.current.resolveConflict(conflict, 'local');
      });

      // Verify complete workflow
      expect(optimisticResult.current.operations).toHaveLength(1);
      expect(optimisticResult.current.operations[0].status).toBe('success');
      expect(mockStore.resolveConflict).toHaveBeenCalled();
    });

    it('should maintain performance with complex async scenarios', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = Date.now();

      // Create many concurrent operations with staggered timing
      const operations = Array.from({ length: 20 }, (_, i) => {
        const delay = Math.random() * 100;
        const promise = new Promise(resolve => 
          setTimeout(() => resolve({ id: `asset-${i}` }), delay)
        );
        mockApiClient.updateAsset.mockReturnValueOnce(promise);
        return promise;
      });

      await act(async () => {
        for (let i = 0; i < 20; i++) {
          result.current.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` });
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations).toHaveLength(20);

      // Wait for all operations to complete
      await act(async () => {
        await Promise.all(operations);
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(result.current.operations).toHaveLength(20);
    });

    it('should handle cleanup correctly in complex scenarios', async () => {
      const { result, unmount } = renderHook(() => useOptimisticMutations({
        debounceMs: 100,
        enableBatching: true,
        batchDelay: 50
      }));

      // Start multiple operations with different patterns
      await act(async () => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Debounced' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Batched' });
        result.current.updateAssetOptimistic('asset-3', { title: 'Normal' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      expect(result.current.operations.length).toBeGreaterThan(0);

      // Unmount should cleanup without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing code patterns', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Old pattern (synchronous act) should still work
      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Backward Compatible' });
      });

      expect(result.current.operations).toHaveLength(1);

      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      });
    });

    it('should work with both async and sync API responses', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Sync response
      mockApiClient.updateAsset.mockResolvedValueOnce({ id: 'asset-1', title: 'Sync' });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Sync Test' });
      });

      // Async response
      const asyncPromise = new Promise(resolve => 
        setTimeout(() => resolve({ id: 'asset-2', title: 'Async' }), 50)
      );
      mockApiClient.updateAsset.mockReturnValueOnce(asyncPromise);

      await act(async () => {
        result.current.updateAssetOptimistic('asset-2', { title: 'Async Test' });
        await new Promise(resolve => setTimeout(resolve, 1));
      });

      await act(async () => {
        await asyncPromise;
      });

      await waitFor(() => {
        return result.current.operations.every(op => op.status === 'success');
      });

      expect(result.current.operations).toHaveLength(2);
    });
  });
});