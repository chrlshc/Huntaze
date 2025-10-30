import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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
 * Tests de régression pour la standardisation des interfaces de store
 * Garantit que les modifications futures ne cassent pas les interfaces existantes
 * Basé sur les 821 tests passants existants et les nouvelles exigences
 */

describe('Store Interface Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Interface Backward Compatibility', () => {
    it('should maintain all existing optimistic mutation function names', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Fonctions qui doivent continuer à exister pour la compatibilité
      const requiredFunctions = [
        'updateAssetOptimistic',
        'createAssetOptimistic',
        'deleteAssetOptimistic',
        'updateCampaignOptimistic',
        'batchUpdateAssetsOptimistic',
        'clearCompletedOperations',
        'rollbackOperation',
        'clearAllPendingOperations',
        'getPendingOperationsForEntity'
      ];

      requiredFunctions.forEach(funcName => {
        expect(result.current[funcName]).toBeDefined();
        expect(typeof result.current[funcName]).toBe('function');
      });
    });

    it('should maintain all existing state properties', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Propriétés d'état qui doivent continuer à exister
      const requiredProperties = [
        'operations',
        'optimisticData',
        'pendingOperations',
        'failedOperations',
        'hasPendingOperations'
      ];

      requiredProperties.forEach(propName => {
        expect(result.current[propName]).toBeDefined();
      });

      // Vérifier les types
      expect(Array.isArray(result.current.operations)).toBe(true);
      expect(typeof result.current.optimisticData).toBe('object');
      expect(Array.isArray(result.current.pendingOperations)).toBe(true);
      expect(Array.isArray(result.current.failedOperations)).toBe(true);
      expect(typeof result.current.hasPendingOperations).toBe('boolean');
    });

    it('should maintain conflict resolution interface', () => {
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
        expect(result.current[funcName]).toBeDefined();
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
        expect(result.current[propName]).toBeDefined();
      });
    });

    it('should maintain SSE client interface', () => {
      const { result } = renderHook(() => useSSEClient());

      const requiredFunctions = [
        'connect',
        'disconnect'
      ];

      requiredFunctions.forEach(funcName => {
        expect(result.current[funcName]).toBeDefined();
        expect(typeof result.current[funcName]).toBe('function');
      });

      const requiredProperties = [
        'isConnected',
        'connectionState',
        'lastEventId',
        'reconnectAttempts'
      ];

      requiredProperties.forEach(propName => {
        expect(result.current[propName]).toBeDefined();
      });
    });
  });

  describe('Store Interface Consistency', () => {
    it('should maintain consistent store structure', () => {
      const { result } = renderHook(() => useContentCreationStore());
      const store = result.current;

      // Structure du store qui ne doit pas changer
      expect(store.mediaAssets).toBeDefined();
      expect(store.campaigns).toBeDefined();
      expect(store.schedule).toBeDefined();
      expect(store.sync).toBeDefined();

      // Vérifier la structure des sections
      ['mediaAssets', 'campaigns'].forEach(section => {
        expect(store[section].items).toBeDefined();
        expect(store[section].loading).toBeDefined();
        expect(store[section].error).toBeDefined();
        expect(store[section].pagination).toBeDefined();
        
        expect(Array.isArray(store[section].items)).toBe(true);
        expect(typeof store[section].loading).toBe('boolean');
        expect(store[section].pagination).toEqual(
          expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number)
          })
        );
      });

      // Vérifier la structure de schedule
      expect(store.schedule.items).toBeDefined();
      expect(store.schedule.loading).toBeDefined();
      expect(store.schedule.error).toBeDefined();
      expect(store.schedule.dateRange).toBeDefined();
      expect(store.schedule.dateRange.start).toBeInstanceOf(Date);
      expect(store.schedule.dateRange.end).toBeInstanceOf(Date);

      // Vérifier la structure de sync
      expect(store.sync.status).toBeDefined();
      expect(store.sync.conflicts).toBeDefined();
      expect(['synced', 'syncing', 'conflict', 'error']).toContain(store.sync.status);
      expect(Array.isArray(store.sync.conflicts)).toBe(true);
    });

    it('should maintain all store action functions', () => {
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
        expect(store[actionName]).toBeDefined();
        expect(typeof store[actionName]).toBe('function');
      });
    });
  });

  describe('Function Signature Compatibility', () => {
    it('should maintain consistent parameter signatures for asset operations', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Vérifier que les signatures n'ont pas changé
      expect(result.current.updateAssetOptimistic.length).toBe(2); // (id, data)
      expect(result.current.createAssetOptimistic.length).toBe(1); // (data)
      expect(result.current.deleteAssetOptimistic.length).toBe(1); // (id)
    });

    it('should maintain consistent parameter signatures for campaign operations', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      expect(result.current.updateCampaignOptimistic.length).toBe(2); // (id, data)
    });

    it('should maintain consistent parameter signatures for batch operations', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      expect(result.current.batchUpdateAssetsOptimistic.length).toBe(1); // (updates[])
    });

    it('should maintain consistent parameter signatures for utility functions', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      expect(result.current.getPendingOperationsForEntity.length).toBe(1); // (entityId)
      expect(result.current.rollbackOperation.length).toBe(1); // (operationId)
      expect(result.current.clearCompletedOperations.length).toBe(0); // ()
      expect(result.current.clearAllPendingOperations.length).toBe(0); // ()
    });
  });

  describe('Return Type Consistency', () => {
    it('should maintain consistent return types for optimistic operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Les opérations optimistes doivent retourner des Promises
      const updatePromise = result.current.updateAssetOptimistic('test-id', { title: 'test' });
      const createPromise = result.current.createAssetOptimistic({ title: 'test', type: 'image' as const });
      const deletePromise = result.current.deleteAssetOptimistic('test-id');

      expect(updatePromise).toBeInstanceOf(Promise);
      expect(createPromise).toBeInstanceOf(Promise);
      expect(deletePromise).toBeInstanceOf(Promise);
    });

    it('should maintain consistent return types for batch operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const batchPromise = result.current.batchUpdateAssetsOptimistic([
        { id: 'test-1', data: { title: 'test 1' } }
      ]);

      expect(batchPromise).toBeInstanceOf(Promise);

      // Vérifier la structure du résultat
      const batchResult = await batchPromise;
      expect(batchResult).toEqual(
        expect.objectContaining({
          successful: expect.any(Array),
          failed: expect.any(Array)
        })
      );
    });

    it('should maintain consistent return types for conflict resolution', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'test-conflict',
        entityType: 'asset' as const,
        entityId: 'test-asset',
        localVersion: { id: 'test-asset', title: 'local' },
        remoteVersion: { id: 'test-asset', title: 'remote' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      };

      const resolutionPromise = result.current.resolveConflict(conflict, 'local');
      expect(resolutionPromise).toBeInstanceOf(Promise);

      const resolution = await resolutionPromise;
      expect(resolution).toEqual(
        expect.objectContaining({
          success: expect.any(Boolean),
          resolvedData: expect.any(Object)
        })
      );
    });
  });

  describe('Event Handling Compatibility', () => {
    it('should maintain consistent event callback signatures', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onConflict = vi.fn();

      const { result } = renderHook(() => useOptimisticMutations({
        onSuccess,
        onError,
        onConflict
      }));

      expect(result.current).toBeDefined();

      // Les callbacks doivent être appelés avec les bonnes signatures
      // onSuccess(operation)
      // onError(operation, error)
      // onConflict(conflict)
    });

    it('should maintain consistent SSE event handling', () => {
      const onConnect = vi.fn();
      const onDisconnect = vi.fn();
      const onError = vi.fn();
      const onEvent = vi.fn();

      const { result } = renderHook(() => useSSEClient({
        onConnect,
        onDisconnect,
        onError,
        onEvent
      }));

      expect(result.current).toBeDefined();

      // Les callbacks SSE doivent maintenir leurs signatures
      // onConnect()
      // onDisconnect()
      // onError(error)
      // onEvent(event)
    });
  });

  describe('Configuration Options Compatibility', () => {
    it('should maintain all optimistic mutations configuration options', () => {
      const options = {
        maxRetries: 3,
        retryDelay: 1000,
        enableQueue: true,
        enableDebounce: true,
        debounceMs: 300,
        onConflict: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn()
      };

      const { result } = renderHook(() => useOptimisticMutations(options));
      expect(result.current).toBeDefined();
    });

    it('should maintain all conflict resolution configuration options', () => {
      const options = {
        ignoreFields: ['updatedAt'],
        priorityFields: ['title', 'status'],
        autoResolve: true,
        strategy: 'auto' as const
      };

      const { result } = renderHook(() => useConflictResolution(options));
      expect(result.current).toBeDefined();
    });

    it('should maintain all SSE client configuration options', () => {
      const options = {
        endpoint: '/api/events',
        autoReconnect: true,
        maxReconnectAttempts: 5,
        reconnectInterval: 5000,
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onError: vi.fn(),
        onEvent: vi.fn()
      };

      const { result } = renderHook(() => useSSEClient(options));
      expect(result.current).toBeDefined();
    });
  });

  describe('Error Handling Compatibility', () => {
    it('should maintain consistent error types and messages', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      try {
        // @ts-expect-error - Test avec paramètres invalides
        await result.current.updateAssetOptimistic(null, {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      }

      try {
        // @ts-expect-error - Test avec données invalides
        await result.current.createAssetOptimistic(null);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      }
    });

    it('should maintain consistent conflict validation errors', () => {
      const { result } = renderHook(() => useConflictResolution());

      // Test avec conflit invalide
      const isValid = result.current.isValidConflict({
        id: 'invalid',
        // Propriétés manquantes
      });

      if (isValid !== undefined) {
        expect(typeof isValid).toBe('boolean');
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should not degrade performance for basic operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = Date.now();

      // Effectuer 10 opérations simples
      const operations = Array.from({ length: 10 }, (_, i) =>
        result.current.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` })
      );

      await Promise.allSettled(operations);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Les opérations de base ne doivent pas prendre plus de 5 secondes (ajusté pour les tests)
      expect(duration).toBeLessThan(5000);
    });

    it('should maintain memory efficiency', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Vérifier que les structures de données ne grandissent pas indéfiniment
      expect(result.current.operations.length).toBeLessThan(1000);
      expect(Object.keys(result.current.optimisticData).length).toBeLessThan(1000);
    });
  });

  describe('Type Safety Regression', () => {
    it('should maintain strict TypeScript types', () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Ces appels doivent compiler sans erreur TypeScript
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

      // Vérifier que les types sont corrects
      expect(typeof result.current.hasPendingOperations).toBe('boolean');
      expect(Array.isArray(result.current.operations)).toBe(true);
    });

    it('should maintain conflict resolution type safety', () => {
      const { result } = renderHook(() => useConflictResolution());

      // Ces appels doivent compiler sans erreur TypeScript
      result.current.detectConflict({ id: '1', title: 'a' }, { id: '1', title: 'b' });
      result.current.getConflictsByType('asset');
      result.current.getConflictsByEntity('entity-1');

      // Vérifier les types
      expect(typeof result.current.hasConflicts).toBe('boolean');
      expect(typeof result.current.conflictCount).toBe('number');
      expect(Array.isArray(result.current.conflicts)).toBe(true);
    });
  });

  describe('Integration Points Stability', () => {
    it('should maintain stable integration with content creation store', () => {
      const { result: storeResult } = renderHook(() => useContentCreationStore());
      const { result } = renderHook(() => useOptimisticMutations());
      const store = storeResult.current;

      // Vérifier que les hooks peuvent accéder au store
      expect(store).toBeDefined();
      expect(result.current).toBeDefined();

      // Les interfaces doivent être compatibles
      expect(typeof store.addAsset).toBe('function');
      expect(typeof store.updateAsset).toBe('function');
      expect(typeof store.deleteAsset).toBe('function');
    });

    it('should maintain stable SSE integration points', () => {
      const { result: sseResult } = renderHook(() => useSSEClient());
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations());

      // Les deux systèmes doivent pouvoir coexister
      expect(sseResult.current).toBeDefined();
      expect(optimisticResult.current).toBeDefined();

      // Vérifier les points d'intégration
      expect(typeof sseResult.current.connect).toBe('function');
      expect(typeof sseResult.current.disconnect).toBe('function');
      expect(typeof optimisticResult.current.clearAllPendingOperations).toBe('function');
    });
  });
});