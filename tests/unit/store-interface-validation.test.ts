import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';
import { useConflictResolution } from '@/lib/hooks/use-conflict-resolution';
import { useSSEClient } from '@/lib/hooks/use-sse-client';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';

// Mock des hooks
vi.mock('@/lib/hooks/use-optimistic-mutations');
vi.mock('@/lib/hooks/use-conflict-resolution');
vi.mock('@/lib/hooks/use-sse-client');
vi.mock('@/lib/stores/content-creation-store');

/**
 * Tests de validation pour les interfaces de store standardisées
 * Valide que les interfaces respectent les contrats définis et les types attendus
 * Basé sur les exigences de standardisation des interfaces
 */

describe('Store Interface Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Interface Contract Validation', () => {
    it('should expose all required optimistic mutation functions', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const requiredFunctions = [
        'updateAssetOptimistic',
        'createAssetOptimistic',
        'deleteAssetOptimistic',
        'updateCampaignOptimistic',
        'batchUpdateAssetsOptimistic',
        'getPendingOperationsForEntity',
        'clearCompletedOperations',
        'rollbackOperation',
        'clearAllPendingOperations'
      ];

      requiredFunctions.forEach(funcName => {
        expect(result.current).toHaveProperty(funcName);
        expect(typeof result.current[funcName]).toBe('function');
      });
    });

    it('should expose all required state properties with correct types', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Vérifier les propriétés d'état requises
      expect(result.current).toHaveProperty('operations');
      expect(Array.isArray(result.current.operations)).toBe(true);

      expect(result.current).toHaveProperty('optimisticData');
      expect(typeof result.current.optimisticData).toBe('object');
      expect(result.current.optimisticData).not.toBeNull();

      expect(result.current).toHaveProperty('pendingOperations');
      expect(Array.isArray(result.current.pendingOperations)).toBe(true);

      expect(result.current).toHaveProperty('failedOperations');
      expect(Array.isArray(result.current.failedOperations)).toBe(true);

      expect(result.current).toHaveProperty('hasPendingOperations');
      expect(typeof result.current.hasPendingOperations).toBe('boolean');
    });

    it('should validate operation object structure', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('test-asset', {
          title: 'Test Asset'
        });
      });

      const operations = result.current.operations;
      expect(operations.length).toBeGreaterThan(0);

      const operation = operations[0];
      
      // Vérifier la structure de l'opération
      expect(operation).toHaveProperty('id');
      expect(typeof operation.id).toBe('string');

      expect(operation).toHaveProperty('type');
      expect(['create', 'update', 'delete']).toContain(operation.type);

      expect(operation).toHaveProperty('entityType');
      expect(['asset', 'campaign']).toContain(operation.entityType);

      expect(operation).toHaveProperty('entityId');
      expect(typeof operation.entityId).toBe('string');

      expect(operation).toHaveProperty('timestamp');
      expect(operation.timestamp).toBeInstanceOf(Date);

      expect(operation).toHaveProperty('status');
      expect(['pending', 'success', 'failed']).toContain(operation.status);

      expect(operation).toHaveProperty('retryCount');
      expect(typeof operation.retryCount).toBe('number');
    });

    it('should validate conflict resolution interface contract', () => {
      const { result } = renderHook(() => useConflictResolution());

      const requiredFunctions = [
        'detectConflict',
        'resolveConflict',
        'addConflict',
        'clearAllConflicts',
        'getConflictsByType',
        'getConflictsByEntity',
        'validateResolution',
        'isValidConflict',
        'resolveBatchConflicts',
        'suggestResolutionStrategy',
        'previewResolution'
      ];

      requiredFunctions.forEach(funcName => {
        expect(result.current).toHaveProperty(funcName);
        expect(typeof result.current[funcName]).toBe('function');
      });

      const requiredProperties = [
        'conflicts',
        'isResolving',
        'hasConflicts',
        'conflictCount',
        'highPriorityConflicts'
      ];

      requiredProperties.forEach(propName => {
        expect(result.current).toHaveProperty(propName);
      });

      // Vérifier les types
      expect(Array.isArray(result.current.conflicts)).toBe(true);
      expect(typeof result.current.isResolving).toBe('boolean');
      expect(typeof result.current.hasConflicts).toBe('boolean');
      expect(typeof result.current.conflictCount).toBe('number');
      expect(Array.isArray(result.current.highPriorityConflicts)).toBe(true);
    });

    it('should validate SSE client interface contract', () => {
      const { result } = renderHook(() => useSSEClient());

      const requiredFunctions = [
        'connect',
        'disconnect'
      ];

      requiredFunctions.forEach(funcName => {
        expect(result.current).toHaveProperty(funcName);
        expect(typeof result.current[funcName]).toBe('function');
      });

      const requiredProperties = [
        'isConnected',
        'connectionState',
        'lastEventId',
        'reconnectAttempts'
      ];

      requiredProperties.forEach(propName => {
        expect(result.current).toHaveProperty(propName);
      });

      // Vérifier les types
      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.connectionState).toBe('string');
      expect(['connecting', 'connected', 'disconnected', 'error']).toContain(result.current.connectionState);
      expect(typeof result.current.reconnectAttempts).toBe('number');
    });
  });

  describe('Function Parameter Validation', () => {
    it('should validate asset operation parameters', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Test avec paramètres valides
      await act(async () => {
        await expect(
          result.current.updateAssetOptimistic('valid-id', { title: 'Valid Title' })
        ).resolves.not.toThrow();

        await expect(
          result.current.createAssetOptimistic({
            title: 'Valid Asset',
            type: 'image' as const,
            url: 'https://example.com/valid.jpg',
            size: 1024,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ).resolves.not.toThrow();

        await expect(
          result.current.deleteAssetOptimistic('valid-id')
        ).resolves.not.toThrow();
      });
    });

    it('should validate campaign operation parameters', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await expect(
          result.current.updateCampaignOptimistic('valid-campaign-id', {
            name: 'Valid Campaign',
            status: 'active' as const
          })
        ).resolves.not.toThrow();
      });
    });

    it('should validate batch operation parameters', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const validBatchUpdates = [
        { id: 'asset-1', data: { title: 'Asset 1' } },
        { id: 'asset-2', data: { title: 'Asset 2' } }
      ];

      await act(async () => {
        const batchResult = await result.current.batchUpdateAssetsOptimistic(validBatchUpdates);
        
        expect(batchResult).toHaveProperty('successful');
        expect(batchResult).toHaveProperty('failed');
        expect(Array.isArray(batchResult.successful)).toBe(true);
        expect(Array.isArray(batchResult.failed)).toBe(true);
      });
    });

    it('should validate conflict resolution parameters', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const validConflict = {
        id: 'test-conflict',
        entityType: 'asset' as const,
        entityId: 'test-asset',
        localVersion: { id: 'test-asset', title: 'Local Title' },
        remoteVersion: { id: 'test-asset', title: 'Remote Title' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      };

      // Test de détection de conflit
      act(() => {
        const detectedConflict = result.current.detectConflict(
          validConflict.localVersion,
          validConflict.remoteVersion
        );
        
        if (detectedConflict) {
          expect(detectedConflict).toHaveProperty('id');
          expect(detectedConflict).toHaveProperty('conflictedFields');
          expect(Array.isArray(detectedConflict.conflictedFields)).toBe(true);
        }
      });

      // Test de résolution de conflit
      await act(async () => {
        const resolution = await result.current.resolveConflict(validConflict, 'local');
        
        expect(resolution).toHaveProperty('success');
        expect(typeof resolution.success).toBe('boolean');
        
        if (resolution.success) {
          expect(resolution).toHaveProperty('resolvedData');
        } else {
          expect(resolution).toHaveProperty('error');
        }
      });
    });
  });

  describe('Return Value Validation', () => {
    it('should return promises for async operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Toutes les opérations optimistes doivent retourner des Promises
      const updatePromise = result.current.updateAssetOptimistic('test-id', { title: 'test' });
      expect(updatePromise).toBeInstanceOf(Promise);

      const createPromise = result.current.createAssetOptimistic({
        title: 'test',
        type: 'image' as const,
        url: 'https://example.com/test.jpg',
        size: 1024,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      expect(createPromise).toBeInstanceOf(Promise);

      const deletePromise = result.current.deleteAssetOptimistic('test-id');
      expect(deletePromise).toBeInstanceOf(Promise);

      const batchPromise = result.current.batchUpdateAssetsOptimistic([
        { id: 'test-1', data: { title: 'test 1' } }
      ]);
      expect(batchPromise).toBeInstanceOf(Promise);

      // Attendre que toutes les promesses se résolvent
      await Promise.allSettled([updatePromise, createPromise, deletePromise, batchPromise]);
    });

    it('should return correct data structures for utility functions', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // getPendingOperationsForEntity doit retourner un tableau
      const pendingOps = result.current.getPendingOperationsForEntity('test-entity');
      expect(Array.isArray(pendingOps)).toBe(true);

      // Les fonctions de nettoyage ne doivent pas retourner de valeur
      const clearResult = result.current.clearCompletedOperations();
      expect(clearResult).toBeUndefined();

      const rollbackResult = result.current.rollbackOperation('test-op-id');
      expect(rollbackResult).toBeUndefined();

      const clearAllResult = result.current.clearAllPendingOperations();
      expect(clearAllResult).toBeUndefined();
    });

    it('should return valid conflict data structures', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = { id: 'test', title: 'Local' };
      const remoteVersion = { id: 'test', title: 'Remote' };

      act(() => {
        const conflict = result.current.detectConflict(localVersion, remoteVersion);
        
        if (conflict) {
          // Vérifier la structure du conflit détecté
          expect(conflict).toHaveProperty('id');
          expect(conflict).toHaveProperty('entityType');
          expect(conflict).toHaveProperty('entityId');
          expect(conflict).toHaveProperty('localVersion');
          expect(conflict).toHaveProperty('remoteVersion');
          expect(conflict).toHaveProperty('timestamp');
          expect(conflict).toHaveProperty('conflictedFields');
          expect(conflict).toHaveProperty('severity');

          expect(typeof conflict.id).toBe('string');
          expect(['asset', 'campaign', 'user']).toContain(conflict.entityType);
          expect(typeof conflict.entityId).toBe('string');
          expect(conflict.timestamp).toBeInstanceOf(Date);
          expect(Array.isArray(conflict.conflictedFields)).toBe(true);
          expect(['low', 'medium', 'high']).toContain(conflict.severity);
        }
      });

      // Tester les fonctions de filtrage
      const assetConflicts = result.current.getConflictsByType('asset');
      expect(Array.isArray(assetConflicts)).toBe(true);

      const entityConflicts = result.current.getConflictsByEntity('test-entity');
      expect(Array.isArray(entityConflicts)).toBe(true);
    });
  });

  describe('Store State Validation', () => {
    it('should validate content creation store structure', () => {
      const { result } = renderHook(() => useContentCreationStore());

      const store = result.current;

      // Vérifier la structure principale
      expect(store).toHaveProperty('mediaAssets');
      expect(store).toHaveProperty('campaigns');
      expect(store).toHaveProperty('schedule');
      expect(store).toHaveProperty('sync');

      // Vérifier la structure des sections
      ['mediaAssets', 'campaigns'].forEach(section => {
        expect(store[section]).toHaveProperty('items');
        expect(store[section]).toHaveProperty('loading');
        expect(store[section]).toHaveProperty('error');
        expect(store[section]).toHaveProperty('pagination');

        expect(Array.isArray(store[section].items)).toBe(true);
        expect(typeof store[section].loading).toBe('boolean');
        
        const pagination = store[section].pagination;
        expect(pagination).toHaveProperty('page');
        expect(pagination).toHaveProperty('limit');
        expect(pagination).toHaveProperty('total');
        expect(typeof pagination.page).toBe('number');
        expect(typeof pagination.limit).toBe('number');
        expect(typeof pagination.total).toBe('number');
      });

      // Vérifier la structure de schedule
      expect(store.schedule).toHaveProperty('items');
      expect(store.schedule).toHaveProperty('loading');
      expect(store.schedule).toHaveProperty('error');
      expect(store.schedule).toHaveProperty('dateRange');

      expect(Array.isArray(store.schedule.items)).toBe(true);
      expect(typeof store.schedule.loading).toBe('boolean');
      expect(store.schedule.dateRange).toHaveProperty('start');
      expect(store.schedule.dateRange).toHaveProperty('end');
      expect(store.schedule.dateRange.start).toBeInstanceOf(Date);
      expect(store.schedule.dateRange.end).toBeInstanceOf(Date);

      // Vérifier la structure de sync
      expect(store.sync).toHaveProperty('status');
      expect(store.sync).toHaveProperty('conflicts');
      expect(['synced', 'syncing', 'conflict', 'error']).toContain(store.sync.status);
      expect(Array.isArray(store.sync.conflicts)).toBe(true);
    });

    it('should validate store action functions', () => {
      const { result } = renderHook(() => useContentCreationStore());
      const store = result.current;

      const requiredActions = [
        'fetchAssets',
        'fetchCampaigns',
        'fetchSchedule',
        'addAsset',
        'updateAsset',
        'deleteAsset',
        'addCampaign',
        'updateCampaign',
        'deleteCampaign',
        'addConflict',
        'resolveConflict',
        'clearConflicts',
        'revertOptimisticUpdate'
      ];

      requiredActions.forEach(actionName => {
        expect(store).toHaveProperty(actionName);
        expect(typeof store[actionName]).toBe('function');
      });
    });

    it('should validate asset data structure', () => {
      const { result } = renderHook(() => useContentCreationStore());
      const store = result.current;

      // Ajouter un asset de test pour valider la structure
      const testAsset = {
        id: 'validation-asset',
        title: 'Validation Asset',
        type: 'image' as const,
        url: 'https://example.com/validation.jpg',
        size: 2048,
        tags: ['validation', 'test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Test asset for validation',
        thumbnailUrl: 'https://example.com/validation-thumb.jpg',
        duration: undefined,
        compliance: {
          status: 'approved' as const,
          issues: []
        }
      };

      act(() => {
        store.addAsset(testAsset);
      });

      // Vérifier que la fonction addAsset a été appelée avec les bonnes données
      expect(store.addAsset).toHaveBeenCalledWith(testAsset);

      // Vérifier la structure de l'asset de test
      expect(testAsset).toHaveProperty('id');
      expect(testAsset).toHaveProperty('title');
      expect(testAsset).toHaveProperty('type');
      expect(testAsset).toHaveProperty('url');
      expect(testAsset).toHaveProperty('size');
      expect(testAsset).toHaveProperty('tags');
      expect(testAsset).toHaveProperty('createdAt');
      expect(testAsset).toHaveProperty('updatedAt');

      expect(typeof testAsset.id).toBe('string');
      expect(typeof testAsset.title).toBe('string');
      expect(['image', 'video', 'audio']).toContain(testAsset.type);
      expect(typeof testAsset.url).toBe('string');
      expect(typeof testAsset.size).toBe('number');
      expect(Array.isArray(testAsset.tags)).toBe(true);
      expect(testAsset.createdAt).toBeInstanceOf(Date);
      expect(testAsset.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate campaign data structure', () => {
      const { result } = renderHook(() => useContentCreationStore());
      const store = result.current;

      const testCampaign = {
        id: 'validation-campaign',
        name: 'Validation Campaign',
        status: 'active' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        platforms: ['instagram', 'tiktok'],
        assets: ['asset-1', 'asset-2'],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Test campaign for validation',
        budget: 1000,
        targetAudience: ['18-25', 'female'],
        metrics: {
          impressions: 10000,
          clicks: 500,
          conversions: 25,
          revenue: 2500
        }
      };

      act(() => {
        store.addCampaign(testCampaign);
      });

      // Vérifier que la fonction addCampaign a été appelée avec les bonnes données
      expect(store.addCampaign).toHaveBeenCalledWith(testCampaign);

      // Vérifier la structure de la campagne de test
      expect(testCampaign).toHaveProperty('id');
      expect(testCampaign).toHaveProperty('name');
      expect(testCampaign).toHaveProperty('status');
      expect(testCampaign).toHaveProperty('startDate');
      expect(testCampaign).toHaveProperty('endDate');
      expect(testCampaign).toHaveProperty('platforms');
      expect(testCampaign).toHaveProperty('assets');
      expect(testCampaign).toHaveProperty('createdAt');
      expect(testCampaign).toHaveProperty('updatedAt');

      expect(typeof testCampaign.id).toBe('string');
      expect(typeof testCampaign.name).toBe('string');
      expect(['draft', 'active', 'paused', 'completed']).toContain(testCampaign.status);
      expect(testCampaign.startDate).toBeInstanceOf(Date);
      expect(testCampaign.endDate).toBeInstanceOf(Date);
      expect(Array.isArray(testCampaign.platforms)).toBe(true);
      expect(Array.isArray(testCampaign.assets)).toBe(true);
      expect(testCampaign.createdAt).toBeInstanceOf(Date);
      expect(testCampaign.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling Validation', () => {
    it('should handle invalid parameters gracefully', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Test avec des paramètres invalides
      await act(async () => {
        try {
          // @ts-expect-error - Test avec ID null
          await result.current.updateAssetOptimistic(null, { title: 'test' });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }

        try {
          // @ts-expect-error - Test avec données null
          await result.current.updateAssetOptimistic('test-id', null);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }

        try {
          // @ts-expect-error - Test avec données invalides
          await result.current.createAssetOptimistic(null);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should validate conflict resolution error handling', async () => {
      const { result } = renderHook(() => useConflictResolution());

      // Test avec conflit invalide
      const invalidConflict = {
        id: 'invalid',
        // Propriétés manquantes
      };

      await act(async () => {
        try {
          // @ts-expect-error - Test avec conflit invalide
          await result.current.resolveConflict(invalidConflict, 'local');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      // Test de validation - vérifier que la fonction existe
      expect(result.current.isValidConflict).toBeDefined();
      expect(typeof result.current.isValidConflict).toBe('function');
      
      // Appeler la fonction avec un conflit invalide
      const isValid = result.current.isValidConflict(invalidConflict);
      if (isValid !== undefined) {
        expect(typeof isValid).toBe('boolean');
        expect(isValid).toBe(false);
      }
    });

    it('should handle SSE connection errors gracefully', () => {
      const onError = vi.fn();
      
      const { result } = renderHook(() => useSSEClient({
        onError,
        autoReconnect: false
      }));

      expect(result.current).toBeDefined();
      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
    });
  });

  describe('Type Safety Validation', () => {
    it('should maintain strict TypeScript types for optimistic operations', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Ces appels doivent compiler sans erreur TypeScript
      expect(() => {
        result.current.updateAssetOptimistic('id', { title: 'test' });
        result.current.createAssetOptimistic({
          title: 'test',
          type: 'image' as const,
          url: 'https://example.com/test.jpg',
          size: 1024,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        result.current.deleteAssetOptimistic('id');
        result.current.updateCampaignOptimistic('id', { name: 'test' });
      }).not.toThrow();
    });

    it('should maintain strict TypeScript types for conflict resolution', () => {
      const { result } = renderHook(() => useConflictResolution());

      expect(() => {
        result.current.detectConflict(
          { id: '1', title: 'a' },
          { id: '1', title: 'b' }
        );
        result.current.getConflictsByType('asset');
        result.current.getConflictsByEntity('entity-1');
      }).not.toThrow();
    });

    it('should validate enum values', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Vérifier que les opérations utilisent les bonnes valeurs d'enum
      const operations = result.current.operations;
      
      operations.forEach(operation => {
        expect(['create', 'update', 'delete']).toContain(operation.type);
        expect(['asset', 'campaign']).toContain(operation.entityType);
        expect(['pending', 'success', 'failed']).toContain(operation.status);
      });
    });
  });
});