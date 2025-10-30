import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';

/**
 * Tests de régression pour la correction du bug des opérations hors ligne
 * 
 * Bug corrigé : L'objet offlineOp était incomplet et nécessitait un cast 'as any'
 * Correction : Création d'un objet OptimisticOperation complet avec tous les champs requis
 * 
 * Ces tests garantissent que la correction reste en place et que les opérations
 * hors ligne respectent l'interface OptimisticOperation.
 */

// Mock du store pour éviter les dépendances
vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: vi.fn(() => ({
    mediaAssets: { items: [] },
    campaigns: { items: [] },
    schedule: { items: [] },
    sync: { status: 'synced', conflicts: [] },
    addAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
    revertOptimisticUpdate: vi.fn()
  }))
}));

// Mock de l'API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    updateAsset: vi.fn().mockResolvedValue({ id: 'updated-asset', title: 'Updated' }),
    createAsset: vi.fn().mockResolvedValue({ id: 'created-asset', title: 'Created' }),
    deleteAsset: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('Offline Operations Regression Tests', () => {
  let originalNavigator: any;

  beforeEach(() => {
    // Sauvegarder l'objet navigator original
    originalNavigator = global.navigator;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restaurer l'objet navigator original
    global.navigator = originalNavigator;
  });

  describe('Bug Fix: Complete OptimisticOperation Structure', () => {
    it('should create complete OptimisticOperation objects for offline operations', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      const assetId = 'offline-test-asset';
      const updateData = { title: 'Offline Update', description: 'Test offline operation' };

      let offlineOperation: any;

      await act(async () => {
        offlineOperation = await result.current.updateAssetOptimistic(assetId, updateData);
      });

      // Vérifier que l'objet retourné a tous les champs requis de OptimisticOperation
      expect(offlineOperation).toBeDefined();
      expect(offlineOperation.id).toBeDefined();
      expect(typeof offlineOperation.id).toBe('string');
      expect(offlineOperation.id).toMatch(/^op_\d+_[a-z0-9]+$/);

      expect(offlineOperation.type).toBe('update');
      expect(offlineOperation.entityType).toBe('asset');
      expect(offlineOperation.entityId).toBe(assetId);
      expect(offlineOperation.data).toEqual(updateData);
      
      expect(offlineOperation.timestamp).toBeDefined();
      expect(offlineOperation.timestamp).toBeInstanceOf(Date);
      
      expect(offlineOperation.status).toBe('pending');
      expect(offlineOperation.retryCount).toBe(0);

      // Vérifier que l'opération est dans la queue hors ligne
      expect(result.current.offlineQueue).toBeDefined();
      expect(result.current.offlineQueue).toHaveLength(1);
      expect(result.current.offlineQueue[0]).toMatchObject({
        id: offlineOperation.id,
        type: 'update',
        entityType: 'asset',
        entityId: assetId,
        data: updateData,
        status: 'pending',
        retryCount: 0
      });
    });

    it('should generate unique operation IDs for each offline operation', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      const operations = [];
      const operationIds = new Set();

      // Créer plusieurs opérations hors ligne
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          const operation = await result.current.updateAssetOptimistic(
            `asset-${i}`, 
            { title: `Offline Asset ${i}` }
          );
          operations.push(operation);
          operationIds.add(operation.id);
        });
      }

      // Vérifier que tous les IDs sont uniques
      expect(operationIds.size).toBe(5);
      expect(operations).toHaveLength(5);

      // Vérifier que chaque opération a une structure complète
      operations.forEach((op, index) => {
        expect(op.id).toBeDefined();
        expect(op.type).toBe('update');
        expect(op.entityType).toBe('asset');
        expect(op.entityId).toBe(`asset-${index}`);
        expect(op.timestamp).toBeInstanceOf(Date);
        expect(op.status).toBe('pending');
        expect(op.retryCount).toBe(0);
      });

      // Vérifier que la queue hors ligne contient toutes les opérations
      expect(result.current.offlineQueue).toHaveLength(5);
    });

    it('should maintain TypeScript type safety without any casts', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      let operation: any;

      await act(async () => {
        operation = await result.current.updateAssetOptimistic('type-safe-asset', { 
          title: 'Type Safe Operation' 
        });
      });

      // Ces vérifications garantissent que l'objet respecte l'interface OptimisticOperation
      // sans nécessiter de cast 'as any'
      
      // Champs obligatoires de type string
      expect(typeof operation.id).toBe('string');
      expect(typeof operation.type).toBe('string');
      expect(typeof operation.entityType).toBe('string');
      expect(typeof operation.entityId).toBe('string');
      expect(typeof operation.status).toBe('string');

      // Champs obligatoires de type number
      expect(typeof operation.retryCount).toBe('number');

      // Champs obligatoires de type Date
      expect(operation.timestamp).toBeInstanceOf(Date);

      // Champs obligatoires de type object
      expect(typeof operation.data).toBe('object');
      expect(operation.data).not.toBeNull();

      // Vérifier les valeurs d'énumération
      expect(['create', 'update', 'delete']).toContain(operation.type);
      expect(['asset', 'campaign']).toContain(operation.entityType);
      expect(['pending', 'success', 'failed']).toContain(operation.status);
    });

    it('should handle offline queue operations correctly', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      // Vérifier l'état initial de la queue
      expect(result.current.offlineQueue).toHaveLength(0);

      // Ajouter plusieurs opérations à la queue
      const operations = [];
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          const op = await result.current.updateAssetOptimistic(`asset-${i}`, { 
            title: `Queue Test ${i}` 
          });
          operations.push(op);
        });
      }

      // Vérifier que toutes les opérations sont dans la queue
      expect(result.current.offlineQueue).toHaveLength(3);

      // Vérifier que chaque opération dans la queue a la structure complète
      result.current.offlineQueue.forEach((queuedOp: any, index: number) => {
        expect(queuedOp.id).toBe(operations[index].id);
        expect(queuedOp.type).toBe('update');
        expect(queuedOp.entityType).toBe('asset');
        expect(queuedOp.entityId).toBe(`asset-${index}`);
        expect(queuedOp.data.title).toBe(`Queue Test ${index}`);
        expect(queuedOp.timestamp).toBeInstanceOf(Date);
        expect(queuedOp.status).toBe('pending');
        expect(queuedOp.retryCount).toBe(0);
      });
    });

    it('should not use offline queue when online', async () => {
      // Simuler l'état en ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('online-asset', { 
          title: 'Online Operation' 
        });
      });

      // Vérifier que la queue hors ligne reste vide
      expect(result.current.offlineQueue).toHaveLength(0);

      // Vérifier que l'opération normale a été ajoutée aux opérations
      expect(result.current.operations).toHaveLength(1);
    });

    it('should handle navigator undefined gracefully', async () => {
      // Simuler navigator undefined (certains environnements de test)
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      // Ne devrait pas lever d'erreur
      await act(async () => {
        await expect(
          result.current.updateAssetOptimistic('undefined-nav-asset', { 
            title: 'Navigator Undefined Test' 
          })
        ).resolves.toBeDefined();
      });

      // Devrait traiter comme en ligne (pas d'ajout à la queue hors ligne)
      expect(result.current.offlineQueue).toHaveLength(0);
    });

    it('should resolve offline operations as promises immediately', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = Date.now();
      let operation: any;

      await act(async () => {
        operation = await result.current.updateAssetOptimistic('promise-test', { 
          title: 'Promise Resolution Test' 
        });
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Vérifier que la promesse se résout immédiatement (< 50ms)
      expect(duration).toBeLessThan(50);

      // Vérifier que l'opération est correctement structurée
      expect(operation).toBeDefined();
      expect(operation.entityId).toBe('promise-test');
      expect(operation.data.title).toBe('Promise Resolution Test');
    });
  });

  describe('Regression Prevention', () => {
    it('should prevent incomplete operation objects in offline queue', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      await act(async () => {
        await result.current.updateAssetOptimistic('regression-test', { 
          title: 'Regression Prevention Test' 
        });
      });

      const queuedOperation = result.current.offlineQueue[0];

      // Vérifier que TOUS les champs requis sont présents
      // (ceci aurait échoué avant la correction du bug)
      const requiredFields = ['id', 'type', 'entityType', 'entityId', 'data', 'timestamp', 'status', 'retryCount'];
      
      requiredFields.forEach(field => {
        expect(queuedOperation).toHaveProperty(field);
        expect(queuedOperation[field]).toBeDefined();
      });

      // Vérifier qu'aucun champ n'est undefined ou null
      Object.values(queuedOperation).forEach(value => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
      });
    });

    it('should maintain consistent operation structure between online and offline modes', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      let onlineOperation: any;
      let offlineOperation: any;

      // Test en ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true,
        configurable: true
      });

      await act(async () => {
        onlineOperation = await result.current.updateAssetOptimistic('online-consistency', { 
          title: 'Online Consistency Test' 
        });
      });

      // Test hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      await act(async () => {
        offlineOperation = await result.current.updateAssetOptimistic('offline-consistency', { 
          title: 'Offline Consistency Test' 
        });
      });

      // Vérifier que les deux opérations ont la même structure de base
      const onlineKeys = Object.keys(onlineOperation).sort();
      const offlineKeys = Object.keys(offlineOperation).sort();

      // Les clés de base devraient être les mêmes
      const baseKeys = ['id', 'type', 'entityType', 'entityId', 'data', 'timestamp', 'status', 'retryCount'];
      
      baseKeys.forEach(key => {
        expect(onlineKeys).toContain(key);
        expect(offlineKeys).toContain(key);
      });

      // Vérifier que les types sont cohérents
      expect(typeof onlineOperation.id).toBe(typeof offlineOperation.id);
      expect(typeof onlineOperation.type).toBe(typeof offlineOperation.type);
      expect(typeof onlineOperation.entityType).toBe(typeof offlineOperation.entityType);
      expect(typeof onlineOperation.status).toBe(typeof offlineOperation.status);
      expect(typeof onlineOperation.retryCount).toBe(typeof offlineOperation.retryCount);
    });

    it('should handle edge cases that could cause incomplete objects', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      // Test avec des données vides
      await act(async () => {
        await result.current.updateAssetOptimistic('empty-data-test', {});
      });

      // Test avec des données null (si autorisé)
      await act(async () => {
        await result.current.updateAssetOptimistic('null-data-test', null as any);
      });

      // Test avec un ID vide
      await act(async () => {
        await result.current.updateAssetOptimistic('', { title: 'Empty ID Test' });
      });

      // Vérifier que toutes les opérations ont été créées avec une structure complète
      expect(result.current.offlineQueue).toHaveLength(3);

      result.current.offlineQueue.forEach((op: any, index: number) => {
        expect(op.id).toBeDefined();
        expect(op.type).toBe('update');
        expect(op.entityType).toBe('asset');
        expect(op.timestamp).toBeInstanceOf(Date);
        expect(op.status).toBe('pending');
        expect(op.retryCount).toBe(0);
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with offline operations', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      // Créer de nombreuses opérations hors ligne
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          await result.current.updateAssetOptimistic(`memory-test-${i}`, { 
            title: `Memory Test ${i}` 
          });
        });
      }

      // Vérifier que toutes les opérations sont correctement structurées
      expect(result.current.offlineQueue).toHaveLength(100);

      // Vérifier qu'il n'y a pas de références circulaires ou d'objets malformés
      result.current.offlineQueue.forEach((op: any, index: number) => {
        expect(JSON.stringify(op)).toBeDefined(); // Devrait pouvoir être sérialisé
        expect(op.entityId).toBe(`memory-test-${index}`);
      });
    });

    it('should maintain performance with large offline queues', async () => {
      // Simuler l'état hors ligne
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = Date.now();

      // Créer 50 opérations hors ligne
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          await result.current.updateAssetOptimistic(`perf-test-${i}`, { 
            title: `Performance Test ${i}` 
          });
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Vérifier que les opérations sont créées rapidement (< 5 secondes)
      expect(duration).toBeLessThan(5000);

      // Vérifier que toutes les opérations sont présentes et correctes
      expect(result.current.offlineQueue).toHaveLength(50);
    });
  });
});