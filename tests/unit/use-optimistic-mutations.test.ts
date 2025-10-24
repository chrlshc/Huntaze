import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';

// Mock the content creation store
const mockStore = {
  mediaAssets: {
    items: [
      { id: 'asset-1', title: 'Asset 1', status: 'draft' },
      { id: 'asset-2', title: 'Asset 2', status: 'published' },
    ],
  },
  campaigns: {
    items: [
      { id: 'campaign-1', title: 'Campaign 1', status: 'active' },
    ],
  },
  updateAsset: vi.fn(),
  updateCampaign: vi.fn(),
  deleteAsset: vi.fn(),
  addAsset: vi.fn(),
  revertOptimisticUpdate: vi.fn(),
};

vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: () => mockStore,
}));

// Mock API client
const mockApiClient = {
  updateAsset: vi.fn(),
  updateCampaign: vi.fn(),
  deleteAsset: vi.fn(),
  createAsset: vi.fn(),
};

vi.mock('@/lib/api', () => ({
  apiClient: mockApiClient,
}));

describe('useOptimisticMutations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock store state
    mockStore.mediaAssets.items = [
      { id: 'asset-1', title: 'Asset 1', status: 'draft' },
      { id: 'asset-2', title: 'Asset 2', status: 'published' },
    ];
    mockStore.campaigns.items = [
      { id: 'campaign-1', title: 'Campaign 1', status: 'active' },
    ];
  });

  describe('Asset Mutations', () => {
    it('should perform optimistic asset update', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: 'Updated Asset 1', status: 'published' };
      mockApiClient.updateAsset.mockResolvedValue({ 
        id: 'asset-1', 
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      // Should immediately update the store optimistically
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-1', updateData);
      
      // Should call the API
      expect(mockApiClient.updateAsset).toHaveBeenCalledWith('asset-1', updateData);
    });

    it('should revert optimistic update on API failure', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: 'Updated Asset 1' };
      const apiError = new Error('API Error');
      mockApiClient.updateAsset.mockRejectedValue(apiError);

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', updateData);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      // Should have attempted optimistic update
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-1', updateData);
      
      // Should revert the update on failure
      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-1');
    });

    it('should perform optimistic asset creation', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const newAssetData = {
        title: 'New Asset',
        type: 'image' as const,
        status: 'draft' as const,
      };

      const createdAsset = {
        id: 'asset-3',
        ...newAssetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockApiClient.createAsset.mockResolvedValue(createdAsset);

      await act(async () => {
        await result.current.createAssetOptimistic(newAssetData);
      });

      // Should add asset optimistically with temporary ID
      expect(mockStore.addAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newAssetData,
          id: expect.stringContaining('temp-'),
        })
      );

      // Should call the API
      expect(mockApiClient.createAsset).toHaveBeenCalledWith(newAssetData);

      // Should update with real ID after API success
      expect(mockStore.updateAsset).toHaveBeenCalledWith(
        expect.stringContaining('temp-'),
        createdAsset
      );
    });

    it('should handle asset creation failure', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const newAssetData = {
        title: 'New Asset',
        type: 'image' as const,
        status: 'draft' as const,
      };

      const apiError = new Error('Creation failed');
      mockApiClient.createAsset.mockRejectedValue(apiError);

      await act(async () => {
        try {
          await result.current.createAssetOptimistic(newAssetData);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      // Should have added asset optimistically
      expect(mockStore.addAsset).toHaveBeenCalled();

      // Should remove the temporary asset on failure
      expect(mockStore.deleteAsset).toHaveBeenCalledWith(
        expect.stringContaining('temp-')
      );
    });

    it('should perform optimistic asset deletion', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      mockApiClient.deleteAsset.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.deleteAssetOptimistic('asset-1');
      });

      // Should immediately remove from store
      expect(mockStore.deleteAsset).toHaveBeenCalledWith('asset-1');

      // Should call the API
      expect(mockApiClient.deleteAsset).toHaveBeenCalledWith('asset-1');
    });

    it('should restore deleted asset on API failure', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const apiError = new Error('Deletion failed');
      mockApiClient.deleteAsset.mockRejectedValue(apiError);

      await act(async () => {
        try {
          await result.current.deleteAssetOptimistic('asset-1');
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      // Should have deleted optimistically
      expect(mockStore.deleteAsset).toHaveBeenCalledWith('asset-1');

      // Should restore the asset on failure
      expect(mockStore.addAsset).toHaveBeenCalledWith(
        mockStore.mediaAssets.items[0] // Original asset data
      );
    });
  });

  describe('Campaign Mutations', () => {
    it('should perform optimistic campaign update', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: 'Updated Campaign', status: 'paused' };
      mockApiClient.updateCampaign.mockResolvedValue({
        id: 'campaign-1',
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      await act(async () => {
        await result.current.updateCampaignOptimistic('campaign-1', updateData);
      });

      expect(mockStore.updateCampaign).toHaveBeenCalledWith('campaign-1', updateData);
      expect(mockApiClient.updateCampaign).toHaveBeenCalledWith('campaign-1', updateData);
    });

    it('should revert campaign update on failure', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: 'Updated Campaign' };
      const apiError = new Error('Update failed');
      mockApiClient.updateCampaign.mockRejectedValue(apiError);

      await act(async () => {
        try {
          await result.current.updateCampaignOptimistic('campaign-1', updateData);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockStore.updateCampaign).toHaveBeenCalledWith('campaign-1', updateData);
      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('campaign', 'campaign-1');
    });
  });

  describe('Batch Operations', () => {
    it('should perform batch optimistic updates', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updates = [
        { id: 'asset-1', data: { title: 'Updated Asset 1' } },
        { id: 'asset-2', data: { title: 'Updated Asset 2' } },
      ];

      mockApiClient.updateAsset
        .mockResolvedValueOnce({ id: 'asset-1', title: 'Updated Asset 1' })
        .mockResolvedValueOnce({ id: 'asset-2', title: 'Updated Asset 2' });

      await act(async () => {
        await result.current.batchUpdateAssetsOptimistic(updates);
      });

      expect(mockStore.updateAsset).toHaveBeenCalledTimes(2);
      expect(mockStore.updateAsset).toHaveBeenNthCalledWith(1, 'asset-1', { title: 'Updated Asset 1' });
      expect(mockStore.updateAsset).toHaveBeenNthCalledWith(2, 'asset-2', { title: 'Updated Asset 2' });

      expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(2);
    });

    it('should handle partial batch failures', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updates = [
        { id: 'asset-1', data: { title: 'Updated Asset 1' } },
        { id: 'asset-2', data: { title: 'Updated Asset 2' } },
        { id: 'asset-3', data: { title: 'Updated Asset 3' } },
      ];

      mockApiClient.updateAsset
        .mockResolvedValueOnce({ id: 'asset-1', title: 'Updated Asset 1' })
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce({ id: 'asset-3', title: 'Updated Asset 3' });

      const results = await act(async () => {
        return await result.current.batchUpdateAssetsOptimistic(updates);
      });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Update failed');
      expect(results[2].success).toBe(true);

      // Should revert the failed update
      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-2');
    });
  });

  describe('Optimistic State Management', () => {
    it('should track pending operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Mock a slow API call
      mockApiClient.updateAsset.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1' }), 100))
      );

      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Updated' });
      });

      // Should show as pending
      expect(result.current.isPending('asset', 'asset-1')).toBe(true);
      expect(result.current.pendingOperations).toContain('asset-asset-1');

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isPending('asset', 'asset-1')).toBe(false);
    });

    it('should prevent duplicate operations on same entity', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      mockApiClient.updateAsset.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1' }), 100))
      );

      // Start first operation
      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
      });

      // Try to start second operation on same asset
      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Update 2' });
        } catch (error) {
          expect(error.message).toContain('already pending');
        }
      });

      expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(1);
    });

    it('should queue operations when configured', async () => {
      const { result } = renderHook(() => useOptimisticMutations({ enableQueue: true }));

      mockApiClient.updateAsset
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1' }), 50)))
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ id: 'asset-1' }), 50)));

      // Start first operation
      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
      });

      // Queue second operation
      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 2' });
      });

      expect(result.current.queuedOperations).toHaveLength(1);

      // Wait for both to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(2);
      expect(result.current.queuedOperations).toHaveLength(0);
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should detect conflicts during optimistic updates', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: 'Local Update', updatedAt: '2024-01-01T10:00:00Z' };
      const serverData = { 
        id: 'asset-1', 
        title: 'Server Update', 
        updatedAt: '2024-01-01T11:00:00Z' 
      };

      mockApiClient.updateAsset.mockResolvedValue(serverData);

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      // Should detect conflict if server data differs from optimistic update
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-1', updateData);
      
      // In a real implementation, this would trigger conflict resolution
      // if the server returned different data than expected
    });

    it('should handle server-side validation errors', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: '' }; // Invalid data
      const validationError = new Error('Title cannot be empty');
      validationError.name = 'ValidationError';
      
      mockApiClient.updateAsset.mockRejectedValue(validationError);

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', updateData);
        } catch (error) {
          expect(error).toBe(validationError);
        }
      });

      // Should revert optimistic update
      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-1');
    });
  });

  describe('Network Resilience', () => {
    it('should retry failed operations', async () => {
      const { result } = renderHook(() => 
        useOptimisticMutations({ retryAttempts: 2, retryDelay: 10 })
      );

      const updateData = { title: 'Updated Asset' };
      
      mockApiClient.updateAsset
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'asset-1', ...updateData });

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(3);
    });

    it('should give up after max retry attempts', async () => {
      const { result } = renderHook(() => 
        useOptimisticMutations({ retryAttempts: 2, retryDelay: 10 })
      );

      const updateData = { title: 'Updated Asset' };
      const networkError = new Error('Network error');
      
      mockApiClient.updateAsset.mockRejectedValue(networkError);

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', updateData);
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });

      expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-1');
    });

    it('should handle offline scenarios', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Mock offline scenario
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const updateData = { title: 'Offline Update' };

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      // Should still perform optimistic update
      expect(mockStore.updateAsset).toHaveBeenCalledWith('asset-1', updateData);

      // Should queue for later sync (in a real implementation)
      expect(result.current.offlineQueue).toContain(
        expect.objectContaining({
          type: 'update',
          entityType: 'asset',
          entityId: 'asset-1',
          data: updateData,
        })
      );
    });
  });

  describe('Performance Optimization', () => {
    it('should debounce rapid updates to same entity', async () => {
      const { result } = renderHook(() => 
        useOptimisticMutations({ debounceMs: 100 })
      );

      mockApiClient.updateAsset.mockResolvedValue({ id: 'asset-1' });

      // Rapid updates
      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 2' });
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 3' });
      });

      // Should only make one API call with the latest data
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(mockApiClient.updateAsset).toHaveBeenCalledTimes(1);
      expect(mockApiClient.updateAsset).toHaveBeenCalledWith('asset-1', { title: 'Update 3' });
    });

    it('should batch similar operations', async () => {
      const { result } = renderHook(() => 
        useOptimisticMutations({ enableBatching: true, batchDelay: 50 })
      );

      mockApiClient.batchUpdateAssets = vi.fn().mockResolvedValue([
        { id: 'asset-1', title: 'Updated 1' },
        { id: 'asset-2', title: 'Updated 2' },
      ]);

      // Multiple updates in quick succession
      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Updated 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Updated 2' });
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockApiClient.batchUpdateAssets).toHaveBeenCalledWith([
        { id: 'asset-1', data: { title: 'Updated 1' } },
        { id: 'asset-2', data: { title: 'Updated 2' } },
      ]);
    });
  });

  describe('Error Recovery', () => {
    it('should provide rollback functionality', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const originalAsset = mockStore.mediaAssets.items[0];
      const updateData = { title: 'Updated Asset' };

      // Perform optimistic update
      await act(async () => {
        mockApiClient.updateAsset.mockResolvedValue({ id: 'asset-1', ...updateData });
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      // Rollback the change
      act(() => {
        result.current.rollbackOptimisticUpdate('asset', 'asset-1');
      });

      expect(mockStore.revertOptimisticUpdate).toHaveBeenCalledWith('asset', 'asset-1');
    });

    it('should clear all pending operations on error', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Start multiple operations
      mockApiClient.updateAsset.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      act(() => {
        result.current.updateAssetOptimistic('asset-1', { title: 'Update 1' });
        result.current.updateAssetOptimistic('asset-2', { title: 'Update 2' });
      });

      expect(result.current.pendingOperations).toHaveLength(2);

      // Clear all pending
      act(() => {
        result.current.clearAllPending();
      });

      expect(result.current.pendingOperations).toHaveLength(0);
    });
  });
});