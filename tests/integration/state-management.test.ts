import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';
import { useSyncManager } from '@/lib/hooks/use-sync-manager';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';
import { useConflictResolution } from '@/lib/hooks/use-conflict-resolution';

// Mock API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

// Mock offline queue
vi.mock('@/lib/offline-queue', () => ({
  offlineQueue: {
    enqueue: vi.fn(),
    flush: vi.fn(),
    size: vi.fn(() => 0),
  },
}));

describe('State Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useContentCreationStore.getState().mediaAssets.items = [];
    useContentCreationStore.getState().campaigns.items = [];
    useContentCreationStore.getState().schedule.entries = [];
  });

  describe('Content Creation Store', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useContentCreationStore());

      expect(result.current.mediaAssets.items).toEqual([]);
      expect(result.current.mediaAssets.loading).toBe(false);
      expect(result.current.mediaAssets.error).toBe(null);
      expect(result.current.campaigns.items).toEqual([]);
      expect(result.current.schedule.entries).toEqual([]);
      expect(result.current.ui.activeView).toBe('library');
      expect(result.current.sync.status).toBe('synced');
    });

    it('should handle asset fetching with loading states', async () => {
      const mockAssets = [
        {
          id: '1',
          title: 'Test Asset 1',
          type: 'photo' as const,
          status: 'published' as const,
          creatorId: 'user-123',
          thumbnailUrl: '/thumb1.jpg',
          originalUrl: '/asset1.jpg',
          fileSize: 1024,
          dimensions: { width: 800, height: 600 },
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: { views: 100, engagement: 50, revenue: 25, roi: 5 },
          tags: ['test'],
          compliance: {
            status: 'approved' as const,
            checkedAt: new Date(),
            violations: [],
            score: 95,
          },
        },
      ];

      const mockResponse = {
        data: {
          items: mockAssets,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      vi.mocked(require('@/lib/api').apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContentCreationStore());

      // Initial state
      expect(result.current.mediaAssets.loading).toBe(false);
      expect(result.current.mediaAssets.items).toEqual([]);

      // Trigger fetch
      await act(async () => {
        await result.current.fetchAssets();
      });

      // Should have loaded assets
      expect(result.current.mediaAssets.loading).toBe(false);
      expect(result.current.mediaAssets.items).toEqual(mockAssets);
      expect(result.current.mediaAssets.pagination).toEqual(mockResponse.data.pagination);
    });

    it('should handle asset creation with optimistic updates', async () => {
      const newAssetData = {
        title: 'New Test Asset',
        type: 'photo' as const,
        tags: ['new', 'test'],
      };

      const createdAsset = {
        id: 'new-asset-123',
        ...newAssetData,
        status: 'draft' as const,
        creatorId: 'user-123',
        thumbnailUrl: '/thumb-new.jpg',
        originalUrl: '/asset-new.jpg',
        fileSize: 2048,
        dimensions: { width: 1200, height: 800 },
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0,
        },
      };

      vi.mocked(require('@/lib/api').apiClient.post).mockResolvedValue({ data: createdAsset });

      const { result } = renderHook(() => useContentCreationStore());

      await act(async () => {
        const asset = await result.current.createAsset(newAssetData);
        expect(asset).toEqual(createdAsset);
      });

      // Should have added the asset to the store
      expect(result.current.mediaAssets.items).toHaveLength(1);
      expect(result.current.mediaAssets.items[0]).toEqual(createdAsset);
    });

    it('should handle network errors and offline mode', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'NETWORK_ERROR';

      vi.mocked(require('@/lib/api').apiClient.get).mockRejectedValue(networkError);

      const { result } = renderHook(() => useContentCreationStore());

      await act(async () => {
        await result.current.fetchAssets();
      });

      expect(result.current.mediaAssets.error).toBe('Network error');
      expect(result.current.sync.status).toBe('offline');
    });

    it('should handle UI state changes', () => {
      const { result } = renderHook(() => useContentCreationStore());

      act(() => {
        result.current.setActiveView('calendar');
      });

      expect(result.current.ui.activeView).toBe('calendar');

      act(() => {
        result.current.openModal('uploadModal');
      });

      expect(result.current.ui.modals.uploadModal).toBe(true);

      act(() => {
        result.current.closeModal('uploadModal');
      });

      expect(result.current.ui.modals.uploadModal).toBe(false);
    });
  });

  describe('Optimistic Mutations', () => {
    it('should perform optimistic updates and rollback on error', async () => {
      const { result: storeResult } = renderHook(() => useContentCreationStore());
      const { result: mutationsResult } = renderHook(() => useOptimisticMutations());

      // Add an initial asset
      const initialAsset = {
        id: 'asset-123',
        title: 'Original Title',
        type: 'photo' as const,
        status: 'draft' as const,
        creatorId: 'user-123',
        thumbnailUrl: '/thumb.jpg',
        originalUrl: '/asset.jpg',
        fileSize: 1024,
        dimensions: { width: 800, height: 600 },
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
        tags: ['test'],
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0,
        },
      };

      act(() => {
        storeResult.current.mediaAssets.items = [initialAsset];
      });

      // Mock server update to fail
      const serverError = new Error('Server error');
      vi.mocked(require('@/lib/api').apiClient.patch).mockRejectedValue(serverError);

      const updateData = { title: 'Updated Title' };

      await act(async () => {
        try {
          await mutationsResult.current.optimisticUpdateAsset(
            'asset-123',
            updateData,
            () => Promise.reject(serverError)
          );
        } catch (error) {
          // Expected to fail
        }
      });

      // Should have rolled back to original title
      expect(storeResult.current.mediaAssets.items[0].title).toBe('Original Title');
    });

    it('should handle optimistic creation and replacement', async () => {
      const { result: storeResult } = renderHook(() => useContentCreationStore());
      const { result: mutationsResult } = renderHook(() => useOptimisticMutations());

      const newAssetData = {
        title: 'New Asset',
        type: 'photo' as const,
        tags: ['new'],
      };

      const serverAsset = {
        id: 'server-asset-123',
        ...newAssetData,
        status: 'draft' as const,
        creatorId: 'user-123',
        thumbnailUrl: '/server-thumb.jpg',
        originalUrl: '/server-asset.jpg',
        fileSize: 2048,
        dimensions: { width: 1200, height: 800 },
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0,
        },
      };

      await act(async () => {
        const result = await mutationsResult.current.optimisticCreateAsset(
          newAssetData,
          () => Promise.resolve(serverAsset)
        );
        expect(result).toEqual(serverAsset);
      });

      // Should have the server asset in store
      expect(storeResult.current.mediaAssets.items).toHaveLength(1);
      expect(storeResult.current.mediaAssets.items[0]).toEqual(serverAsset);
    });
  });

  describe('Sync Manager', () => {
    it('should handle sync operations', async () => {
      const { result } = renderHook(() => useSyncManager({
        autoSync: false, // Disable auto sync for testing
      }));

      expect(result.current.syncStatus.status).toBe('synced');
      expect(result.current.isOnline).toBe(true);
    });

    it('should handle offline/online transitions', async () => {
      const onSyncSuccess = vi.fn();
      const onSyncError = vi.fn();

      const { result } = renderHook(() => useSyncManager({
        autoSync: false,
        onSyncSuccess,
        onSyncError,
      }));

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      window.dispatchEvent(new Event('online'));

      // Should attempt to sync when coming back online
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect and handle conflicts', () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          entityType: 'asset',
          entityId: 'asset-123',
          localVersion: { title: 'Local Title', updatedAt: new Date('2024-01-01') },
          remoteVersion: { title: 'Remote Title', updatedAt: new Date('2024-01-02') },
          conflictFields: ['title'],
          timestamp: new Date(),
        },
      ];

      // Mock store to have conflicts
      act(() => {
        useContentCreationStore.getState().sync.conflicts = mockConflicts;
        useContentCreationStore.getState().sync.status = 'conflict';
      });

      const { result } = renderHook(() => useConflictResolution());

      expect(result.current.hasConflicts).toBe(true);
      expect(result.current.conflictCount).toBe(1);
      expect(result.current.conflicts).toEqual(mockConflicts);
    });

    it('should preview conflict resolutions', () => {
      const mockConflict = {
        id: 'conflict-1',
        entityType: 'asset',
        entityId: 'asset-123',
        localVersion: { title: 'Local Title', description: 'Local desc' },
        remoteVersion: { title: 'Remote Title', description: 'Remote desc' },
        conflictFields: ['title', 'description'],
        timestamp: new Date(),
      };

      act(() => {
        useContentCreationStore.getState().sync.conflicts = [mockConflict];
      });

      const { result } = renderHook(() => useConflictResolution());

      const localPreview = result.current.previewResolution('conflict-1', 'local');
      expect(localPreview?.result).toEqual(mockConflict.localVersion);
      expect(localPreview?.description).toContain('Keep your local changes');

      const remotePreview = result.current.previewResolution('conflict-1', 'remote');
      expect(remotePreview?.result).toEqual(mockConflict.remoteVersion);
      expect(remotePreview?.description).toContain('Accept server changes');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete asset lifecycle with sync', async () => {
      const { result: storeResult } = renderHook(() => useContentCreationStore());
      const { result: mutationsResult } = renderHook(() => useOptimisticMutations());

      // 1. Create asset optimistically
      const newAssetData = {
        title: 'Lifecycle Test Asset',
        type: 'photo' as const,
        tags: ['lifecycle', 'test'],
      };

      const createdAsset = {
        id: 'lifecycle-asset-123',
        ...newAssetData,
        status: 'draft' as const,
        creatorId: 'user-123',
        thumbnailUrl: '/lifecycle-thumb.jpg',
        originalUrl: '/lifecycle-asset.jpg',
        fileSize: 1024,
        dimensions: { width: 800, height: 600 },
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0,
        },
      };

      vi.mocked(require('@/lib/api').apiClient.post).mockResolvedValue({ data: createdAsset });

      await act(async () => {
        await mutationsResult.current.optimisticCreateAsset(
          newAssetData,
          () => Promise.resolve(createdAsset)
        );
      });

      expect(storeResult.current.mediaAssets.items).toHaveLength(1);

      // 2. Update asset optimistically
      const updateData = { title: 'Updated Lifecycle Asset', status: 'published' as const };
      const updatedAsset = { ...createdAsset, ...updateData, updatedAt: new Date() };

      vi.mocked(require('@/lib/api').apiClient.patch).mockResolvedValue({ data: updatedAsset });

      await act(async () => {
        await mutationsResult.current.optimisticUpdateAsset(
          'lifecycle-asset-123',
          updateData,
          () => Promise.resolve(updatedAsset)
        );
      });

      expect(storeResult.current.mediaAssets.items[0].title).toBe('Updated Lifecycle Asset');
      expect(storeResult.current.mediaAssets.items[0].status).toBe('published');

      // 3. Delete asset optimistically
      vi.mocked(require('@/lib/api').apiClient.delete).mockResolvedValue({ data: { deleted: true } });

      await act(async () => {
        await mutationsResult.current.optimisticDeleteAsset(
          'lifecycle-asset-123',
          () => Promise.resolve()
        );
      });

      expect(storeResult.current.mediaAssets.items).toHaveLength(0);
    });

    it('should handle concurrent operations and conflicts', async () => {
      const { result: storeResult } = renderHook(() => useContentCreationStore());

      // Simulate concurrent updates causing a conflict
      const conflictData = {
        id: 'concurrent-conflict-1',
        entityType: 'asset',
        entityId: 'asset-123',
        localVersion: { title: 'Local Update', updatedAt: new Date('2024-01-01T10:00:00Z') },
        remoteVersion: { title: 'Remote Update', updatedAt: new Date('2024-01-01T10:01:00Z') },
        conflictFields: ['title'],
        timestamp: new Date(),
      };

      act(() => {
        storeResult.current.sync.conflicts.push(conflictData);
        storeResult.current.sync.status = 'conflict';
      });

      const { result: conflictResult } = renderHook(() => useConflictResolution());

      expect(conflictResult.current.hasConflicts).toBe(true);
      expect(conflictResult.current.conflictCount).toBe(1);

      // Resolve conflict by choosing remote version
      const mockResolve = vi.fn().mockResolvedValue(undefined);
      storeResult.current.resolveConflict = mockResolve;

      await act(async () => {
        await conflictResult.current.resolve('concurrent-conflict-1', 'remote');
      });

      expect(mockResolve).toHaveBeenCalledWith('concurrent-conflict-1', 'remote');
    });
  });
});