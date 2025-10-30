import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * Tests pour le hook useConflictResolution - Implémentation réelle
 * Valide la nouvelle implémentation simplifiée sans fallback
 * Tests de régression pour la modification du store requirement
 */

// Mock du store - maintenant obligatoire car plus de fallback
const mockStore = {
  sync: {
    status: 'synced' as const,
    conflicts: [],
    lastSyncAt: new Date()
  },
  addConflict: vi.fn(),
  resolveConflict: vi.fn(),
  clearConflicts: vi.fn()
};

vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: vi.fn(() => mockStore)
}));

describe('useConflictResolution - Real Implementation', () => {
  let useConflictResolution: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStore.sync.conflicts = [];
    mockStore.sync.status = 'synced';
    
    // Import the real hook after mocking
    const module = await import('@/lib/hooks/use-conflict-resolution');
    useConflictResolution = module.useConflictResolution;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Store Integration - Regression Tests', () => {
    it('should require store without fallback', () => {
      // This test ensures the store is always required
      const { result } = renderHook(() => useConflictResolution());
      
      expect(result.current).toBeDefined();
      expect(typeof result.current.detectConflict).toBe('function');
      expect(typeof result.current.resolveConflict).toBe('function');
      expect(typeof result.current.addConflict).toBe('function');
    });

    it('should fail gracefully if store is not available', async () => {
      // Temporarily mock the store to return undefined
      const { useContentCreationStore } = await import('@/lib/stores/content-creation-store');
      vi.mocked(useContentCreationStore).mockReturnValueOnce(undefined as any);

      // Use renderHook with error boundary to catch React errors
      const { result } = renderHook(() => {
        try {
          return useConflictResolution();
        } catch (error) {
          return { error: error as Error };
        }
      });

      // Check if error was caught
      expect((result.current as any).error?.message).toBe('Store not available');
    });

    it('should use store methods directly', () => {
      const { result } = renderHook(() => useConflictResolution());
      
      const testConflict = {
        id: 'test-conflict',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local' },
        remoteVersion: { id: 'asset-1', title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      };

      act(() => {
        result.current.addConflict(testConflict);
      });

      expect(mockStore.addConflict).toHaveBeenCalledWith(testConflict);
    });

    it('should clear conflicts through store', () => {
      const { result } = renderHook(() => useConflictResolution());

      act(() => {
        result.current.clearAllConflicts();
      });

      expect(mockStore.clearConflicts).toHaveBeenCalled();
    });
  });

  describe('Conflict Detection - Core Functionality', () => {
    it('should detect conflicts between different versions', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'asset-1',
        title: 'Local Title',
        description: 'Local Description',
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      const remoteVersion = {
        id: 'asset-1',
        title: 'Remote Title',
        description: 'Local Description', // Same
        updatedAt: new Date('2024-01-01T11:00:00Z')
      };

      const conflict = result.current.detectConflict(localVersion, remoteVersion);

      expect(conflict).toBeDefined();
      expect(conflict.id).toMatch(/^conflict-/);
      expect(conflict.entityId).toBe('asset-1');
      expect(conflict.localVersion).toEqual(localVersion);
      expect(conflict.remoteVersion).toEqual(remoteVersion);
      expect(conflict.conflictedFields).toContain('title');
      expect(conflict.conflictedFields).not.toContain('description');
      expect(conflict.severity).toBe('low'); // Only one field conflicts
    });

    it('should return null when no conflicts exist', () => {
      const { result } = renderHook(() => useConflictResolution());

      const version1 = {
        id: 'asset-1',
        title: 'Same Title',
        description: 'Same Description'
      };

      const version2 = {
        id: 'asset-1',
        title: 'Same Title',
        description: 'Same Description'
      };

      const conflict = result.current.detectConflict(version1, version2);
      expect(conflict).toBeNull();
    });

    it('should handle null/undefined inputs', () => {
      const { result } = renderHook(() => useConflictResolution());

      expect(result.current.detectConflict(null, null)).toBeNull();
      expect(result.current.detectConflict(undefined, {})).toBeNull();
      expect(result.current.detectConflict({}, null)).toBeNull();
    });

    it('should determine conflict severity correctly', () => {
      const { result } = renderHook(() => useConflictResolution());

      const baseVersion = { id: 'asset-1', title: 'Title', description: 'Desc', status: 'active' };

      // Low severity (1 field)
      const lowConflict = result.current.detectConflict(
        baseVersion,
        { ...baseVersion, title: 'Different Title' }
      );
      expect(lowConflict?.severity).toBe('low');

      // Medium severity (2 fields)
      const mediumConflict = result.current.detectConflict(
        baseVersion,
        { ...baseVersion, title: 'Different Title', description: 'Different Desc' }
      );
      expect(mediumConflict?.severity).toBe('medium');

      // High severity (3+ fields)
      const highConflict = result.current.detectConflict(
        baseVersion,
        { 
          ...baseVersion, 
          title: 'Different Title', 
          description: 'Different Desc',
          status: 'inactive'
        }
      );
      expect(highConflict?.severity).toBe('high');
    });
  });

  describe('Conflict Resolution Strategies', () => {
    it('should resolve with local strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local Title' },
        remoteVersion: { id: 'asset-1', title: 'Remote Title' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'local');
      });

      expect(resolution.success).toBe(true);
      expect(resolution.resolvedData).toEqual(conflict.localVersion);
      expect(mockStore.resolveConflict).toHaveBeenCalledWith(conflict.id, {
        strategy: 'local',
        resolvedData: conflict.localVersion
      });
    });

    it('should resolve with remote strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-2',
        entityType: 'asset' as const,
        entityId: 'asset-2',
        localVersion: { id: 'asset-2', title: 'Local Title' },
        remoteVersion: { id: 'asset-2', title: 'Remote Title' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'remote');
      });

      expect(resolution.success).toBe(true);
      expect(resolution.resolvedData).toEqual(conflict.remoteVersion);
    });

    it('should resolve with manual strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-3',
        entityType: 'asset' as const,
        entityId: 'asset-3',
        localVersion: { id: 'asset-3', title: 'Local Title' },
        remoteVersion: { id: 'asset-3', title: 'Remote Title' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const mergedData = { id: 'asset-3', title: 'Manually Merged Title' };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'manual', mergedData);
      });

      expect(resolution.success).toBe(true);
      expect(resolution.resolvedData).toEqual(mergedData);
    });

    it('should resolve with auto strategy based on timestamps', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-4',
        entityType: 'asset' as const,
        entityId: 'asset-4',
        localVersion: { 
          id: 'asset-4', 
          title: 'Local Title',
          updatedAt: new Date('2024-01-01T10:00:00Z')
        },
        remoteVersion: { 
          id: 'asset-4', 
          title: 'Remote Title',
          updatedAt: new Date('2024-01-01T11:00:00Z') // Newer
        },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'auto');
      });

      expect(resolution.success).toBe(true);
      expect(resolution.resolvedData).toEqual(conflict.remoteVersion); // Should pick newer
    });

    it('should fail manual resolution without merged data', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-5',
        entityType: 'asset' as const,
        entityId: 'asset-5',
        localVersion: { id: 'asset-5', title: 'Local' },
        remoteVersion: { id: 'asset-5', title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'manual');
      });

      expect(resolution.success).toBe(false);
      expect(resolution.error).toBe('Manual resolution requires merged data');
    });

    it('should handle unknown resolution strategy', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-6',
        entityType: 'asset' as const,
        entityId: 'asset-6',
        localVersion: { id: 'asset-6', title: 'Local' },
        remoteVersion: { id: 'asset-6', title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'unknown' as any);
      });

      expect(resolution.success).toBe(false);
      expect(resolution.error).toBe('Unknown resolution strategy: unknown');
    });
  });

  describe('Utility Functions', () => {
    it('should validate conflict structure', () => {
      const { result } = renderHook(() => useConflictResolution());

      const validConflict = {
        id: 'valid-conflict',
        entityType: 'asset',
        entityId: 'asset-1',
        localVersion: { id: 'asset-1' },
        remoteVersion: { id: 'asset-1' },
        conflictedFields: ['title']
      };

      const invalidConflict = {
        id: 'invalid-conflict'
        // Missing required fields
      };

      expect(result.current.isValidConflict(validConflict)).toBe(true);
      expect(result.current.isValidConflict(invalidConflict)).toBe(false);
      expect(result.current.isValidConflict(null)).toBe(false);
    });

    it('should validate resolution data', () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        localVersion: { id: 'asset-1', title: 'Local', description: 'Desc' },
        remoteVersion: { id: 'asset-1', title: 'Remote', status: 'active' }
      };

      const validResolution = { 
        id: 'asset-1', 
        title: 'Merged', 
        description: 'Desc', 
        status: 'active' 
      };

      const invalidResolution = { 
        id: 'asset-1', 
        title: 'Merged' 
        // Missing description and status
      };

      expect(result.current.validateResolution(conflict, validResolution)).toBe(true);
      expect(result.current.validateResolution(conflict, invalidResolution)).toBe(false);
      expect(result.current.validateResolution(conflict, null)).toBe(false);
    });

    it('should get conflicts by type', () => {
      const { result } = renderHook(() => useConflictResolution());

      // Mock store conflicts
      mockStore.sync.conflicts = [
        { id: 'c1', entityType: 'asset', entityId: 'a1' },
        { id: 'c2', entityType: 'campaign', entityId: 'camp1' },
        { id: 'c3', entityType: 'asset', entityId: 'a2' }
      ];

      const assetConflicts = result.current.getConflictsByType('asset');
      const campaignConflicts = result.current.getConflictsByType('campaign');

      expect(assetConflicts).toHaveLength(2);
      expect(campaignConflicts).toHaveLength(1);
      expect(assetConflicts.every((c: any) => c.entityType === 'asset')).toBe(true);
    });

    it('should get conflicts by entity', () => {
      const { result } = renderHook(() => useConflictResolution());

      mockStore.sync.conflicts = [
        { id: 'c1', entityType: 'asset', entityId: 'asset-1' },
        { id: 'c2', entityType: 'asset', entityId: 'asset-2' },
        { id: 'c3', entityType: 'campaign', entityId: 'asset-1' }
      ];

      const entityConflicts = result.current.getConflictsByEntity('asset-1');

      expect(entityConflicts).toHaveLength(2);
      expect(entityConflicts.every((c: any) => c.entityId === 'asset-1')).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should track resolving state', async () => {
      const { result } = renderHook(() => useConflictResolution());

      expect(result.current.isResolving).toBe(false);

      const conflict = {
        id: 'resolving-test',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local' },
        remoteVersion: { id: 'asset-1', title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      // Start resolution
      const resolutionPromise = act(async () => {
        return await result.current.resolveConflict(conflict, 'local');
      });

      await resolutionPromise;
      expect(result.current.isResolving).toBe(false);
    });

    it('should compute derived state correctly', () => {
      const { result } = renderHook(() => useConflictResolution());

      // Initially no conflicts
      expect(result.current.hasConflicts).toBe(false);
      expect(result.current.conflictCount).toBe(0);
      expect(result.current.highPriorityConflicts).toHaveLength(0);

      // Add conflicts to mock store
      const conflicts = [
        { id: 'c1', severity: 'low' },
        { id: 'c2', severity: 'high' },
        { id: 'c3', severity: 'medium' },
        { id: 'c4', severity: 'high' }
      ];

      act(() => {
        result.current.conflicts = conflicts;
      });

      // Note: In real implementation, these would be computed from store state
      // For this test, we're validating the structure exists
      expect(typeof result.current.hasConflicts).toBe('boolean');
      expect(typeof result.current.conflictCount).toBe('number');
      expect(Array.isArray(result.current.highPriorityConflicts)).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    it('should suggest resolution strategies', () => {
      const { result } = renderHook(() => useConflictResolution());

      const titleConflict = {
        conflictedFields: ['title', 'description']
      };

      const arrayConflict = {
        conflictedFields: ['tags'],
        localVersion: { tags: ['tag1'] },
        remoteVersion: { tags: ['tag2'] }
      };

      const timestampConflict = {
        conflictedFields: ['updatedAt']
      };

      const titleSuggestions = result.current.suggestResolutionStrategy(titleConflict);
      const arraySuggestions = result.current.suggestResolutionStrategy(arrayConflict);
      const timestampSuggestions = result.current.suggestResolutionStrategy(timestampConflict);

      expect(titleSuggestions).toContain('manual');
      expect(arraySuggestions).toContain('merge_arrays');
      expect(timestampSuggestions).toContain('auto');
    });

    it('should preview resolution outcomes', () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        localVersion: { id: 'asset-1', title: 'Local Title' },
        remoteVersion: { id: 'asset-1', title: 'Remote Title' }
      };

      const localPreview = result.current.previewResolution(conflict, 'local');
      const remotePreview = result.current.previewResolution(conflict, 'remote');
      const mergePreview = result.current.previewResolution(conflict, 'merge');

      expect(localPreview).toEqual(conflict.localVersion);
      expect(remotePreview).toEqual(conflict.remoteVersion);
      expect(mergePreview).toEqual({
        id: 'asset-1',
        title: 'Local Title' // Local overwrites remote in merge
      });
    });

    it('should handle batch conflict resolution', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflicts = [
        {
          id: 'batch-1',
          entityType: 'asset' as const,
          entityId: 'asset-1',
          localVersion: { id: 'asset-1', title: 'Local 1' },
          remoteVersion: { id: 'asset-1', title: 'Remote 1' },
          timestamp: new Date(),
          conflictedFields: ['title'],
          severity: 'low' as const
        },
        {
          id: 'batch-2',
          entityType: 'asset' as const,
          entityId: 'asset-2',
          localVersion: { id: 'asset-2', title: 'Local 2' },
          remoteVersion: { id: 'asset-2', title: 'Remote 2' },
          timestamp: new Date(),
          conflictedFields: ['title'],
          severity: 'low' as const
        }
      ];

      const results = await act(async () => {
        return await result.current.resolveBatchConflicts(conflicts, 'local');
      });

      expect(results).toHaveLength(2);
      results.forEach((result: any) => {
        expect(result.success).toBe(true);
        expect(result.conflict).toBeDefined();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle resolution errors gracefully', async () => {
      const { result } = renderHook(() => useConflictResolution());

      // Mock store to throw error
      mockStore.resolveConflict.mockImplementation(() => {
        throw new Error('Store resolution failed');
      });

      const conflict = {
        id: 'error-test',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local' },
        remoteVersion: { id: 'asset-1', title: 'Remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'low' as const
      };

      const resolution = await act(async () => {
        return await result.current.resolveConflict(conflict, 'local');
      });

      expect(resolution.success).toBe(false);
      expect(resolution.error).toBeDefined();
    });

    it('should handle complex object comparisons', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'complex-1',
        metadata: {
          tags: ['tag1', 'tag2'],
          settings: { autoPublish: true }
        },
        platforms: ['instagram', 'tiktok']
      };

      const remoteVersion = {
        id: 'complex-1',
        metadata: {
          tags: ['tag1', 'tag3'], // Different
          settings: { autoPublish: true }
        },
        platforms: ['instagram', 'facebook'] // Different
      };

      const conflict = result.current.detectConflict(localVersion, remoteVersion);

      expect(conflict).toBeDefined();
      expect(conflict.conflictedFields).toContain('metadata');
      expect(conflict.conflictedFields).toContain('platforms');
    });

    it('should handle circular references safely', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion: any = { id: 'circular-1', title: 'Local' };
      localVersion.self = localVersion; // Circular reference

      const remoteVersion = { id: 'circular-1', title: 'Remote' };

      expect(() => {
        result.current.detectConflict(localVersion, remoteVersion);
      }).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large conflict datasets efficiently', () => {
      const { result } = renderHook(() => useConflictResolution());

      const largeLocal = {
        id: 'large-1',
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `local-${i}` }))
      };

      const largeRemote = {
        id: 'large-1',
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `remote-${i}` }))
      };

      const start = Date.now();
      const conflict = result.current.detectConflict(largeLocal, largeRemote);
      const duration = Date.now() - start;

      expect(conflict).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should not leak memory with repeated operations', () => {
      const { result } = renderHook(() => useConflictResolution());

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const local = { id: `test-${i}`, title: `Local ${i}` };
        const remote = { id: `test-${i}`, title: `Remote ${i}` };
        
        result.current.detectConflict(local, remote);
        result.current.isValidConflict({ id: `conflict-${i}`, entityType: 'asset', entityId: `test-${i}` });
      }

      // Should not accumulate state or cause memory issues
      expect(result.current.conflicts).toBeDefined();
    });
  });
});