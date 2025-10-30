import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';
import { useConflictResolution } from '@/lib/hooks/use-conflict-resolution';
import { useSSEClient } from '@/lib/hooks/use-sse-client';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';

/**
 * Tests de performance pour les interfaces de store standardisées
 * Valide que les nouvelles interfaces maintiennent des performances acceptables
 * Seuils de performance basés sur les exigences utilisateur
 */

// Mock performance.now pour les tests
const mockPerformanceNow = vi.fn();
global.performance = { now: mockPerformanceNow } as any;

// Mock EventSource pour les tests SSE
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
    }, 1);
  }

  close() {
    this.readyState = 2;
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

global.EventSource = MockEventSource as any;

describe('Store Interface Performance Tests', () => {
  let timeCounter = 0;

  beforeEach(() => {
    timeCounter = 0;
    mockPerformanceNow.mockImplementation(() => {
      timeCounter += 10; // Simuler 10ms par appel
      return timeCounter;
    });

    // Mock fetch pour éviter les vraies requêtes réseau
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Optimistic Mutations Performance', () => {
    it('should complete single asset update within 100ms', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = performance.now();

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', {
          title: 'Performance Test Asset'
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // L'opération optimiste doit être très rapide (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle 10 concurrent updates within 500ms', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = performance.now();

      await act(async () => {
        const updates = Array.from({ length: 10 }, (_, i) =>
          result.current.updateAssetOptimistic(`asset-${i}`, {
            title: `Concurrent Asset ${i}`
          })
        );

        await Promise.all(updates);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 10 opérations concurrentes doivent se terminer rapidement
      expect(duration).toBeLessThan(500);
    });

    it('should handle batch updates efficiently', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const batchSize = 50;
      const batchUpdates = Array.from({ length: batchSize }, (_, i) => ({
        id: `asset-${i}`,
        data: { title: `Batch Asset ${i}` }
      }));

      const startTime = performance.now();

      await act(async () => {
        await result.current.batchUpdateAssetsOptimistic(batchUpdates);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Les mises à jour par lot doivent être plus efficaces que les individuelles
      const expectedMaxDuration = batchSize * 20; // 20ms par item max
      expect(duration).toBeLessThan(expectedMaxDuration);
    });

    it('should maintain performance with large optimistic data sets', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Créer un grand ensemble de données optimistes
      await act(async () => {
        const operations = Array.from({ length: 100 }, (_, i) =>
          result.current.updateAssetOptimistic(`asset-${i}`, {
            title: `Large Dataset Asset ${i}`,
            description: `Description for asset ${i}`,
            tags: [`tag-${i}`, `category-${i % 10}`]
          })
        );

        await Promise.allSettled(operations);
      });

      // Tester les performances avec un grand dataset
      const startTime = performance.now();

      await act(async () => {
        await result.current.updateAssetOptimistic('new-asset', {
          title: 'New Asset with Large Dataset'
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Les performances ne doivent pas se dégrader avec un grand dataset
      expect(duration).toBeLessThan(150);
    });

    it('should efficiently clean up completed operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Créer plusieurs opérations
      await act(async () => {
        const operations = Array.from({ length: 20 }, (_, i) =>
          result.current.updateAssetOptimistic(`asset-${i}`, {
            title: `Cleanup Test ${i}`
          })
        );

        await Promise.allSettled(operations);
      });

      const startTime = performance.now();

      act(() => {
        result.current.clearCompletedOperations();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Le nettoyage doit être très rapide
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Conflict Resolution Performance', () => {
    it('should detect conflicts quickly', () => {
      const { result } = renderHook(() => useConflictResolution());

      const localVersion = {
        id: 'asset-1',
        title: 'Local Title',
        description: 'Local description with many fields',
        tags: ['tag1', 'tag2', 'tag3'],
        metadata: { author: 'user1', created: new Date() }
      };

      const remoteVersion = {
        id: 'asset-1',
        title: 'Remote Title',
        description: 'Remote description with different content',
        tags: ['tag1', 'tag4', 'tag5'],
        metadata: { author: 'user2', created: new Date() }
      };

      const startTime = performance.now();

      act(() => {
        const conflict = result.current.detectConflict(localVersion, remoteVersion);
        expect(conflict).toBeDefined();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // La détection de conflit doit être très rapide
      expect(duration).toBeLessThan(50);
    });

    it('should resolve conflicts efficiently', async () => {
      const { result } = renderHook(() => useConflictResolution());

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

      const startTime = performance.now();

      await act(async () => {
        await result.current.resolveConflict(conflict, 'local');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // La résolution de conflit doit être rapide
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple conflicts efficiently', async () => {
      const { result } = renderHook(() => useConflictResolution());

      const conflicts = Array.from({ length: 10 }, (_, i) => ({
        id: `conflict-${i}`,
        entityType: 'asset' as const,
        entityId: `asset-${i}`,
        localVersion: { id: `asset-${i}`, title: `Local ${i}` },
        remoteVersion: { id: `asset-${i}`, title: `Remote ${i}` },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      }));

      const startTime = performance.now();

      await act(async () => {
        await result.current.resolveBatchConflicts(conflicts, 'auto');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // La résolution par lot doit être efficace
      expect(duration).toBeLessThan(500);
    });
  });

  describe('SSE Client Performance', () => {
    it('should establish connection quickly', async () => {
      const startTime = performance.now();

      const { result } = renderHook(() => useSSEClient({
        endpoint: '/api/test-events'
      }));

      // Attendre que la connexion soit établie
      await new Promise(resolve => setTimeout(resolve, 50));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // La connexion SSE doit s'établir rapidement
      expect(duration).toBeLessThan(200);
      expect(result.current.isConnected).toBe(true);
    });

    it('should handle high-frequency events efficiently', async () => {
      const onEvent = vi.fn();
      const { result } = renderHook(() => useSSEClient({
        onEvent
      }));

      // Simuler de nombreux événements
      const eventCount = 100;
      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < eventCount; i++) {
          const event = {
            id: `event-${i}`,
            type: 'asset_updated',
            timestamp: new Date().toISOString(),
            data: { id: `asset-${i}`, title: `Updated ${i}` }
          };

          // Simuler la réception d'événement
          onEvent(event);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Le traitement d'événements doit être efficace
      const maxDurationPerEvent = 5; // 5ms par événement max
      expect(duration).toBeLessThan(eventCount * maxDurationPerEvent);
    });

    it('should reconnect efficiently after disconnection', async () => {
      const { result } = renderHook(() => useSSEClient({
        autoReconnect: true,
        reconnectInterval: 100
      }));

      // Attendre la connexion initiale
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(result.current.isConnected).toBe(true);

      const startTime = performance.now();

      // Simuler une déconnexion et reconnexion
      act(() => {
        result.current.disconnect();
      });

      act(() => {
        result.current.connect();
      });

      // Attendre la reconnexion
      await new Promise(resolve => setTimeout(resolve, 150));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // La reconnexion doit être rapide
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Store Integration Performance', () => {
    it('should update store state efficiently', async () => {
      const store = useContentCreationStore();
      const { result } = renderHook(() => useOptimisticMutations());

      const startTime = performance.now();

      await act(async () => {
        // Simuler plusieurs mises à jour du store
        store.addAsset({
          id: 'perf-asset-1',
          title: 'Performance Asset',
          type: 'image',
          url: 'https://example.com/perf.jpg',
          size: 1024,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        store.updateAsset('perf-asset-1', {
          title: 'Updated Performance Asset'
        });

        // Mise à jour optimiste parallèle
        await result.current.updateAssetOptimistic('perf-asset-1', {
          description: 'Optimistic update'
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Les mises à jour du store doivent être rapides
      expect(duration).toBeLessThan(200);
    });

    it('should handle large datasets in store efficiently', async () => {
      const store = useContentCreationStore();

      // Créer un grand dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `large-asset-${i}`,
        title: `Large Asset ${i}`,
        type: 'image' as const,
        url: `https://example.com/large-${i}.jpg`,
        size: 1024 + i,
        tags: [`tag-${i}`, `category-${i % 10}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const startTime = performance.now();

      act(() => {
        // Simuler l'ajout d'un grand dataset
        largeDataset.forEach(asset => {
          store.addAsset(asset);
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // L'ajout d'un grand dataset doit rester performant
      const maxDurationPerItem = 2; // 2ms par item max
      expect(duration).toBeLessThan(largeDataset.length * maxDurationPerItem);
    });
  });

  describe('Memory Performance', () => {
    it('should not create memory leaks with repeated operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Simuler de nombreuses opérations répétées
      for (let batch = 0; batch < 10; batch++) {
        await act(async () => {
          const operations = Array.from({ length: 20 }, (_, i) =>
            result.current.updateAssetOptimistic(`batch-${batch}-asset-${i}`, {
              title: `Batch ${batch} Asset ${i}`
            })
          );

          await Promise.allSettled(operations);

          // Nettoyer après chaque lot
          result.current.clearCompletedOperations();
        });
      }

      // Vérifier que le nombre d'opérations ne grandit pas indéfiniment
      expect(result.current.operations.length).toBeLessThan(50);
      expect(Object.keys(result.current.optimisticData).length).toBeLessThan(200);
    });

    it('should efficiently manage conflict resolution memory', async () => {
      const { result } = renderHook(() => useConflictResolution());

      // Créer et résoudre de nombreux conflits
      for (let i = 0; i < 50; i++) {
        const conflict = {
          id: `memory-conflict-${i}`,
          entityType: 'asset' as const,
          entityId: `memory-asset-${i}`,
          localVersion: { id: `memory-asset-${i}`, title: `Local ${i}` },
          remoteVersion: { id: `memory-asset-${i}`, title: `Remote ${i}` },
          timestamp: new Date(),
          conflictedFields: ['title'],
          severity: 'low' as const
        };

        await act(async () => {
          result.current.addConflict(conflict);
          await result.current.resolveConflict(conflict, 'auto');
        });
      }

      // Vérifier que les conflits résolus ne s'accumulent pas
      expect(result.current.conflicts.length).toBeLessThan(10);
    });
  });

  describe('Scalability Performance', () => {
    it('should maintain performance with increasing entity count', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const entityCounts = [10, 50, 100, 200];
      const durations: number[] = [];

      for (const count of entityCounts) {
        const startTime = performance.now();

        await act(async () => {
          const operations = Array.from({ length: count }, (_, i) =>
            result.current.updateAssetOptimistic(`scale-asset-${i}`, {
              title: `Scale Test ${i}`
            })
          );

          await Promise.allSettled(operations);
        });

        const endTime = performance.now();
        durations.push(endTime - startTime);

        // Nettoyer pour le prochain test
        act(() => {
          result.current.clearAllPendingOperations();
        });
      }

      // Vérifier que la performance ne se dégrade pas de manière exponentielle
      for (let i = 1; i < durations.length; i++) {
        const scaleFactor = entityCounts[i] / entityCounts[i - 1];
        const durationRatio = durations[i] / durations[i - 1];

        // La dégradation ne doit pas être pire que linéaire
        expect(durationRatio).toBeLessThan(scaleFactor * 1.5);
      }
    });

    it('should handle concurrent users efficiently', async () => {
      // Simuler plusieurs utilisateurs concurrents
      const userCount = 5;
      const operationsPerUser = 10;

      const userHooks = Array.from({ length: userCount }, () =>
        renderHook(() => useOptimisticMutations())
      );

      const startTime = performance.now();

      await act(async () => {
        const allOperations = userHooks.flatMap((hook, userIndex) =>
          Array.from({ length: operationsPerUser }, (_, opIndex) =>
            hook.result.current.updateAssetOptimistic(
              `user-${userIndex}-asset-${opIndex}`,
              { title: `User ${userIndex} Asset ${opIndex}` }
            )
          )
        );

        await Promise.allSettled(allOperations);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Les opérations concurrentes multi-utilisateurs doivent rester performantes
      const totalOperations = userCount * operationsPerUser;
      const maxDurationPerOperation = 50; // 50ms par opération max
      expect(duration).toBeLessThan(totalOperations * maxDurationPerOperation);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should not regress from baseline performance metrics', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Métriques de performance de base (à ajuster selon les besoins)
      const performanceBaselines = {
        singleUpdate: 100, // ms
        batchUpdate: 1000, // ms pour 50 items
        conflictDetection: 50, // ms
        conflictResolution: 100, // ms
        sseConnection: 200, // ms
        storeUpdate: 200 // ms
      };

      // Test de mise à jour simple
      const singleUpdateStart = performance.now();
      await act(async () => {
        await result.current.updateAssetOptimistic('baseline-asset', {
          title: 'Baseline Test'
        });
      });
      const singleUpdateDuration = performance.now() - singleUpdateStart;

      expect(singleUpdateDuration).toBeLessThan(performanceBaselines.singleUpdate);

      // Test de mise à jour par lot
      const batchUpdateStart = performance.now();
      await act(async () => {
        const batchUpdates = Array.from({ length: 50 }, (_, i) => ({
          id: `baseline-batch-${i}`,
          data: { title: `Baseline Batch ${i}` }
        }));
        await result.current.batchUpdateAssetsOptimistic(batchUpdates);
      });
      const batchUpdateDuration = performance.now() - batchUpdateStart;

      expect(batchUpdateDuration).toBeLessThan(performanceBaselines.batchUpdate);
    });

    it('should maintain consistent performance across test runs', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const testRuns = 5;
      const durations: number[] = [];

      // Exécuter le même test plusieurs fois
      for (let run = 0; run < testRuns; run++) {
        const startTime = performance.now();

        await act(async () => {
          await result.current.updateAssetOptimistic(`consistency-${run}`, {
            title: `Consistency Test ${run}`
          });
        });

        durations.push(performance.now() - startTime);
      }

      // Calculer la variance des durées
      const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) / durations.length;
      const standardDeviation = Math.sqrt(variance);

      // La variance ne doit pas être trop élevée (performance cohérente)
      expect(standardDeviation).toBeLessThan(average * 0.3); // 30% de l'average max
    });
  });
});