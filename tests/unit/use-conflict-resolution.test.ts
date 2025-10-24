import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConflictResolution } from '@/lib/hooks/use-conflict-resolution';

// Mock the content creation store
const mockStore = {
  sync: {
    conflicts: [],
    status: 'synced' as const,
  },
  resolveConflict: vi.fn(),
  addConflict: vi.fn(),
  clearConflicts: vi.fn(),
};

vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: () => mockStore,
}));

describe('useConflictResolution Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.sync.conflicts = [];
    mockStore.sync.status = 'synced';
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts when local and remote versions differ', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'asset-1',
        title: 'Local Title',
        description: 'Local Description',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const remoteVersion = {
        id: 'asset-1',
        title: 'Remote Title',
        description: 'Local Description',
        updatedAt: '2024-01-01T11:00:00Z',
      };

      const conflict = result.current.detectConflict(localVersion, remoteVersion);

      expect(conflict).toBeTruthy();
      expect(conflict?.conflictedFields).toContain('title');
      expect(conflict?.conflictedFields).not.toContain('description');
    });

    it('should not detect conflicts when versions are identical', () => {
      const { result } = renderHook(() => useConflictResolution());

      const version = {
        id: 'asset-1',
        title: 'Same Title',
        description: 'Same Description',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const conflict = result.current.detectConflict(version, version);

      expect(conflict).toBeNull();
    });

    it('should detect conflicts in nested objects', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'asset-1',
        metadata: {
          tags: ['tag1', 'tag2'],
          category: 'photo',
        },
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const remoteVersion = {
        id: 'asset-1',
        metadata: {
          tags: ['tag1', 'tag3'],
          category: 'photo',
        },
        updatedAt: '2024-01-01T11:00:00Z',
      };

      const conflict = result.current.detectConflict(localVersion, remoteVersion);

      expect(conflict).toBeTruthy();
      expect(conflict?.conflictedFields).toContain('metadata.tags');
    });

    it('should handle array differences correctly', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'campaign-1',
        assetIds: ['asset-1', 'asset-2'],
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const remoteVersion = {
        id: 'campaign-1',
        assetIds: ['asset-1', 'asset-3'],
        updatedAt: '2024-01-01T11:00:00Z',
      };

      const conflict = result.current.detectConflict(localVersion, remoteVersion);

      expect(conflict).toBeTruthy();
      expect(conflict?.conflictedFields).toContain('assetIds');
    });

    it('should ignore specified fields when detecting conflicts', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'asset-1',
        title: 'Local Title',
        lastSyncedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      const remoteVersion = {
        id: 'asset-1',
        title: 'Remote Title',
        lastSyncedAt: '2024-01-01T11:00:00Z',
        updatedAt: '2024-01-01T11:00:00Z',
      };

      const conflict = result.current.detectConflict(
        localVersion, 
        remoteVersion, 
        ['lastSyncedAt', 'updatedAt']
      );

      expect(conflict).toBeTruthy();
      expect(conflict?.conflictedFields).toContain('title');
      expect(conflict?.conflictedFields).not.toContain('lastSyncedAt');
      expect(conflict?.conflictedFields).not.toContain('updatedAt');
    });
  });

  describe('Conflict Resolution Strategies', () => {
    it('should resolve conflict using local version strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        await result.current.resolveConflict(conflict, 'local');
      });

      expect(mockStore.resolveConflict).toHaveBeenCalledWith(conflict.id, {
        strategy: 'local',
        resolvedData: conflict.localVersion,
      });
    });

    it('should resolve conflict using remote version strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        await result.current.resolveConflict(conflict, 'remote');
      });

      expect(mockStore.resolveConflict).toHaveBeenCalledWith(conflict.id, {
        strategy: 'remote',
        resolvedData: conflict.remoteVersion,
      });
    });

    it('should resolve conflict using manual merge strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title', description: 'Local Desc' },
        remoteVersion: { title: 'Remote Title', description: 'Remote Desc' },
        conflictedFields: ['title', 'description'],
        timestamp: new Date().toISOString(),
      };

      const mergedData = {
        title: 'Merged Title',
        description: 'Local Desc', // Keep local description
      };

      await act(async () => {
        await result.current.resolveConflict(conflict, 'manual', mergedData);
      });

      expect(mockStore.resolveConflict).toHaveBeenCalledWith(conflict.id, {
        strategy: 'manual',
        resolvedData: mergedData,
      });
    });

    it('should auto-resolve conflicts based on timestamp', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const olderConflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title', updatedAt: '2024-01-01T10:00:00Z' },
        remoteVersion: { title: 'Remote Title', updatedAt: '2024-01-01T11:00:00Z' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        await result.current.resolveConflict(olderConflict, 'auto');
      });

      // Should choose remote version as it's newer
      expect(mockStore.resolveConflict).toHaveBeenCalledWith(olderConflict.id, {
        strategy: 'auto',
        resolvedData: olderConflict.remoteVersion,
      });
    });

    it('should auto-resolve conflicts based on priority fields', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { 
          title: 'Local Title', 
          status: 'published',
          updatedAt: '2024-01-01T11:00:00Z' 
        },
        remoteVersion: { 
          title: 'Remote Title', 
          status: 'draft',
          updatedAt: '2024-01-01T10:00:00Z' 
        },
        conflictedFields: ['title', 'status'],
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        await result.current.resolveConflict(conflict, 'auto');
      });

      // Should prefer local version due to published status having higher priority
      expect(mockStore.resolveConflict).toHaveBeenCalledWith(conflict.id, {
        strategy: 'auto',
        resolvedData: conflict.localVersion,
      });
    });
  });

  describe('Conflict Management', () => {
    it('should add new conflicts to the store', () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      act(() => {
        result.current.addConflict(conflict);
      });

      expect(mockStore.addConflict).toHaveBeenCalledWith(conflict);
    });

    it('should clear all conflicts', () => {
      const { result } = renderHook(() => useConflictResolution());

      act(() => {
        result.current.clearAllConflicts();
      });

      expect(mockStore.clearConflicts).toHaveBeenCalled();
    });

    it('should get conflicts by entity type', () => {
      mockStore.sync.conflicts = [
        {
          id: 'conflict-1',
          entityType: 'asset',
          entityId: 'asset-1',
          localVersion: {},
          remoteVersion: {},
          conflictedFields: [],
          timestamp: new Date().toISOString(),
        },
        {
          id: 'conflict-2',
          entityType: 'campaign',
          entityId: 'campaign-1',
          localVersion: {},
          remoteVersion: {},
          conflictedFields: [],
          timestamp: new Date().toISOString(),
        },
        {
          id: 'conflict-3',
          entityType: 'asset',
          entityId: 'asset-2',
          localVersion: {},
          remoteVersion: {},
          conflictedFields: [],
          timestamp: new Date().toISOString(),
        },
      ];

      const { result } = renderHook(() => useConflictResolution());

      const assetConflicts = result.current.getConflictsByType('asset');
      const campaignConflicts = result.current.getConflictsByType('campaign');

      expect(assetConflicts).toHaveLength(2);
      expect(campaignConflicts).toHaveLength(1);
      expect(assetConflicts[0].entityId).toBe('asset-1');
      expect(assetConflicts[1].entityId).toBe('asset-2');
    });

    it('should get conflicts by entity ID', () => {
      mockStore.sync.conflicts = [
        {
          id: 'conflict-1',
          entityType: 'asset',
          entityId: 'asset-1',
          localVersion: {},
          remoteVersion: {},
          conflictedFields: [],
          timestamp: new Date().toISOString(),
        },
        {
          id: 'conflict-2',
          entityType: 'asset',
          entityId: 'asset-2',
          localVersion: {},
          remoteVersion: {},
          conflictedFields: [],
          timestamp: new Date().toISOString(),
        },
      ];

      const { result } = renderHook(() => useConflictResolution());

      const entityConflicts = result.current.getConflictsByEntity('asset-1');

      expect(entityConflicts).toHaveLength(1);
      expect(entityConflicts[0].id).toBe('conflict-1');
    });
  });

  describe('Conflict Validation', () => {
    it('should validate conflict resolution data', () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title', description: 'Local Desc' },
        remoteVersion: { title: 'Remote Title', description: 'Remote Desc' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      // Valid merge data
      const validMergeData = { title: 'Merged Title', description: 'Local Desc' };
      expect(result.current.validateResolution(conflict, validMergeData)).toBe(true);

      // Invalid merge data (missing required field)
      const invalidMergeData = { description: 'Local Desc' };
      expect(result.current.validateResolution(conflict, invalidMergeData)).toBe(false);

      // Invalid merge data (extra field not in original versions)
      const extraFieldData = { 
        title: 'Merged Title', 
        description: 'Local Desc',
        extraField: 'Not allowed'
      };
      expect(result.current.validateResolution(conflict, extraFieldData)).toBe(false);
    });

    it('should validate conflict structure', () => {
      const { result } = renderHook(() => useConflictResolution());

      const validConflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      expect(result.current.isValidConflict(validConflict)).toBe(true);

      // Missing required fields
      const invalidConflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        // Missing entityId
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      expect(result.current.isValidConflict(invalidConflict as any)).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should resolve multiple conflicts with same strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflicts = [
        {
          id: 'conflict-1',
          entityType: 'asset' as const,
          entityId: 'asset-1',
          localVersion: { title: 'Local Title 1' },
          remoteVersion: { title: 'Remote Title 1' },
          conflictedFields: ['title'],
          timestamp: new Date().toISOString(),
        },
        {
          id: 'conflict-2',
          entityType: 'asset' as const,
          entityId: 'asset-2',
          localVersion: { title: 'Local Title 2' },
          remoteVersion: { title: 'Remote Title 2' },
          conflictedFields: ['title'],
          timestamp: new Date().toISOString(),
        },
      ];

      await act(async () => {
        await result.current.resolveBatchConflicts(conflicts, 'local');
      });

      expect(mockStore.resolveConflict).toHaveBeenCalledTimes(2);
      expect(mockStore.resolveConflict).toHaveBeenNthCalledWith(1, 'conflict-1', {
        strategy: 'local',
        resolvedData: conflicts[0].localVersion,
      });
      expect(mockStore.resolveConflict).toHaveBeenNthCalledWith(2, 'conflict-2', {
        strategy: 'local',
        resolvedData: conflicts[1].localVersion,
      });
    });

    it('should handle batch resolution errors gracefully', async () => {
      const { result } = renderHook(() => useConflictResolution());

      // Mock one resolution to fail
      mockStore.resolveConflict
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Resolution failed'))
        .mockResolvedValueOnce(undefined);

      const conflicts = [
        {
          id: 'conflict-1',
          entityType: 'asset' as const,
          entityId: 'asset-1',
          localVersion: { title: 'Local Title 1' },
          remoteVersion: { title: 'Remote Title 1' },
          conflictedFields: ['title'],
          timestamp: new Date().toISOString(),
        },
        {
          id: 'conflict-2',
          entityType: 'asset' as const,
          entityId: 'asset-2',
          localVersion: { title: 'Local Title 2' },
          remoteVersion: { title: 'Remote Title 2' },
          conflictedFields: ['title'],
          timestamp: new Date().toISOString(),
        },
        {
          id: 'conflict-3',
          entityType: 'asset' as const,
          entityId: 'asset-3',
          localVersion: { title: 'Local Title 3' },
          remoteVersion: { title: 'Remote Title 3' },
          conflictedFields: ['title'],
          timestamp: new Date().toISOString(),
        },
      ];

      const results = await act(async () => {
        return await result.current.resolveBatchConflicts(conflicts, 'local');
      });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Resolution failed');
      expect(results[2].success).toBe(true);
    });
  });

  describe('Conflict Prevention', () => {
    it('should suggest merge strategies based on conflict type', () => {
      const { result } = renderHook(() => useConflictResolution());

      const textConflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      const arrayConflict = {
        id: 'conflict-2',
        entityType: 'campaign' as const,
        entityId: 'campaign-1',
        localVersion: { assetIds: ['asset-1', 'asset-2'] },
        remoteVersion: { assetIds: ['asset-1', 'asset-3'] },
        conflictedFields: ['assetIds'],
        timestamp: new Date().toISOString(),
      };

      const textSuggestions = result.current.suggestResolutionStrategy(textConflict);
      const arraySuggestions = result.current.suggestResolutionStrategy(arrayConflict);

      expect(textSuggestions).toContain('manual');
      expect(arraySuggestions).toContain('merge_arrays');
    });

    it('should provide conflict preview for different strategies', () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title', description: 'Local Desc' },
        remoteVersion: { title: 'Remote Title', description: 'Remote Desc' },
        conflictedFields: ['title', 'description'],
        timestamp: new Date().toISOString(),
      };

      const localPreview = result.current.previewResolution(conflict, 'local');
      const remotePreview = result.current.previewResolution(conflict, 'remote');

      expect(localPreview).toEqual(conflict.localVersion);
      expect(remotePreview).toEqual(conflict.remoteVersion);
    });
  });

  describe('Error Handling', () => {
    it('should handle resolution errors gracefully', async () => {
      const { result } = renderHook(() => useConflictResolution());

      mockStore.resolveConflict.mockRejectedValue(new Error('Network error'));

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictedFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      await expect(
        act(async () => {
          await result.current.resolveConflict(conflict, 'local');
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid conflict data', () => {
      const { result } = renderHook(() => useConflictResolution());

      const invalidConflict = {
        // Missing required fields
        id: 'conflict-1',
      };

      expect(() => {
        result.current.detectConflict(null as any, null as any);
      }).not.toThrow();

      expect(result.current.detectConflict(null as any, null as any)).toBeNull();
    });
  });
});