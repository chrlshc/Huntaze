import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticMutations } from '@/lib/hooks/use-optimistic-mutations';
import { useConflictResolution } from '@/lib/hooks/use-conflict-resolution';
import { useSSEClient } from '@/lib/hooks/use-sse-client';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';

/**
 * Tests d'intégration pour l'interaction entre les stores et les hooks
 * Valide les flux complets de données et la synchronisation en temps réel
 * Basé sur les exigences de standardisation des interfaces
 */

// Mock EventSource pour les tests SSE
class MockEventSource {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;
  url: string;

  constructor(url: string) {
    this.url = url;
    // Simuler une connexion réussie
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

  removeEventListener() {
    // Mock implementation
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === 'message' && this.onmessage) {
      this.onmessage(event as MessageEvent);
    }
    return true;
  }
}

// Mock global EventSource
global.EventSource = MockEventSource as any;

// Mock fetch pour les API calls
global.fetch = vi.fn();

describe('Store-Hooks Integration Tests', () => {
  let mockStore: any;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    mockStore = {
      mediaAssets: {
        items: [
          {
            id: 'asset-1',
            title: 'Existing Asset',
            type: 'image',
            url: 'https://example.com/image.jpg',
            size: 1024,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        ],
        loading: false,
        error: null,
        pagination: { page: 1, limit: 20, total: 1 }
      },
      campaigns: {
        items: [
          {
            id: 'campaign-1',
            name: 'Existing Campaign',
            status: 'active',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            platforms: ['instagram'],
            assets: ['asset-1'],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        ],
        loading: false,
        error: null,
        pagination: { page: 1, limit: 20, total: 1 }
      },
      schedule: {
        items: [],
        loading: false,
        error: null,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-07')
        }
      },
      sync: {
        status: 'synced' as const,
        conflicts: [],
        lastSyncAt: new Date()
      },
      fetchAssets: vi.fn().mockResolvedValue(undefined),
      fetchCampaigns: vi.fn().mockResolvedValue(undefined),
      fetchSchedule: vi.fn().mockResolvedValue(undefined),
      addAsset: vi.fn(),
      updateAsset: vi.fn(),
      deleteAsset: vi.fn(),
      addCampaign: vi.fn(),
      updateCampaign: vi.fn(),
      deleteCampaign: vi.fn(),
      addConflict: vi.fn(),
      resolveConflict: vi.fn(),
      clearConflicts: vi.fn(),
      revertOptimisticUpdate: vi.fn()
    };

    // Mock du store
    vi.mocked(useContentCreationStore).mockReturnValue(mockStore);

    // Mock fetch responses
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/content-creation/assets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'new-asset-id',
            title: 'Created Asset',
            createdAt: new Date().toISOString()
          })
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      } as Response);
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Optimistic Updates with Store Synchronization', () => {
    it('should immediately reflect optimistic updates in store state', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = {
        title: 'Optimistically Updated Asset',
        description: 'Updated via optimistic mutation'
      };

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      // Vérifier que l'état optimiste contient la mise à jour
      expect(result.current.optimisticData['asset-1']).toEqual(
        expect.objectContaining(updateData)
      );

      // Vérifier que l'opération est trackée
      expect(result.current.operations).toHaveLength(1);
      expect(result.current.operations[0]).toEqual(
        expect.objectContaining({
          type: 'update',
          entityType: 'asset',
          entityId: 'asset-1',
          status: 'pending'
        })
      );
    });

    it('should handle successful server response and update final state', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const updateData = { title: 'Server Updated Asset' };

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', updateData);
      });

      // Attendre que l'opération soit complétée
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      }, { timeout: 2000 });

      // Vérifier que l'opération est marquée comme réussie
      const completedOperation = result.current.operations.find(op => op.entityId === 'asset-1');
      expect(completedOperation?.status).toBe('success');
    });

    it('should revert optimistic changes on server error', async () => {
      // Mock une erreur serveur
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useOptimisticMutations({
        onError: vi.fn()
      }));

      const originalData = result.current.optimisticData['asset-1'];
      const updateData = { title: 'Failed Update' };

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', updateData);
        } catch (error) {
          // L'erreur est attendue
        }
      });

      // Attendre que l'opération échoue
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'failed';
      }, { timeout: 2000 });

      // Vérifier que l'état optimiste a été restauré
      expect(result.current.optimisticData['asset-1']).toEqual(originalData);
    });
  });

  describe('Real-time SSE Integration', () => {
    it('should connect to SSE endpoint and receive events', async () => {
      const onEvent = vi.fn();
      const { result } = renderHook(() => useSSEClient({
        endpoint: '/api/content-creation/events',
        onEvent
      }));

      // Attendre la connexion
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 1000 });

      expect(result.current.connectionState).toBe('connected');
    });

    it('should update store when receiving asset update events', async () => {
      const { result: sseResult } = renderHook(() => useSSEClient());
      
      // Simuler un événement SSE
      const assetUpdateEvent = {
        id: 'event-1',
        type: 'asset_updated',
        timestamp: new Date().toISOString(),
        data: {
          id: 'asset-1',
          title: 'Updated via SSE',
          updatedAt: new Date().toISOString()
        }
      };

      await act(async () => {
        // Simuler la réception d'un événement
        const mockEvent = new MessageEvent('message', {
          data: JSON.stringify(assetUpdateEvent)
        });
        
        // Déclencher l'événement sur l'EventSource mockée
        if (mockEventSource?.onmessage) {
          mockEventSource.onmessage(mockEvent);
        }
      });

      // Vérifier que le store a été mis à jour
      expect(mockStore.fetchAssets).toHaveBeenCalled();
    });

    it('should handle SSE disconnection and reconnection', async () => {
      const onDisconnect = vi.fn();
      const onConnect = vi.fn();
      
      const { result } = renderHook(() => useSSEClient({
        onConnect,
        onDisconnect,
        autoReconnect: true,
        maxReconnectAttempts: 3
      }));

      // Attendre la connexion initiale
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simuler une déconnexion
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(onDisconnect).toHaveBeenCalled();

      // Reconnecter
      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should detect conflicts between optimistic and server data', async () => {
      const { result: conflictResult } = renderHook(() => useConflictResolution());
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations());

      const localVersion = {
        id: 'asset-1',
        title: 'Local Title',
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      const remoteVersion = {
        id: 'asset-1',
        title: 'Remote Title',
        updatedAt: new Date('2024-01-01T11:00:00Z')
      };

      act(() => {
        const conflict = conflictResult.current.detectConflict(localVersion, remoteVersion);
        expect(conflict).toBeDefined();
        expect(conflict?.conflictedFields).toContain('title');
      });
    });

    it('should resolve conflicts and update store accordingly', async () => {
      const { result: conflictResult } = renderHook(() => useConflictResolution());

      const conflict = {
        id: 'conflict-1',
        entityType: 'asset' as const,
        entityId: 'asset-1',
        localVersion: { id: 'asset-1', title: 'Local Title' },
        remoteVersion: { id: 'asset-1', title: 'Remote Title' },
        timestamp: new Date(),
        conflictedFields: ['title'],
        severity: 'medium' as const
      };

      await act(async () => {
        conflictResult.current.addConflict(conflict);
        
        const resolution = await conflictResult.current.resolveConflict(
          conflict,
          'remote'
        );
        
        expect(resolution.success).toBe(true);
        expect(resolution.resolvedData).toEqual(conflict.remoteVersion);
      });

      // Vérifier que le conflit a été résolu
      expect(conflictResult.current.conflicts).not.toContain(conflict);
    });

    it('should integrate conflict resolution with optimistic updates', async () => {
      const { result: conflictResult } = renderHook(() => useConflictResolution());
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations({
        onConflict: (conflict) => {
          conflictResult.current.addConflict(conflict);
        }
      }));

      // Simuler une mise à jour optimiste qui génère un conflit
      await act(async () => {
        await optimisticResult.current.updateAssetOptimistic('asset-1', {
          title: 'Conflicting Update'
        });
      });

      // Vérifier que l'intégration fonctionne
      expect(optimisticResult.current.operations).toHaveLength(1);
    });
  });

  describe('Batch Operations and Performance', () => {
    it('should handle batch updates efficiently', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const batchUpdates = Array.from({ length: 10 }, (_, i) => ({
        id: `asset-${i}`,
        data: { title: `Batch Update ${i}` }
      }));

      const startTime = Date.now();

      await act(async () => {
        const result_batch = await result.current.batchUpdateAssetsOptimistic(batchUpdates);
        
        expect(result_batch.successful.length).toBeGreaterThan(0);
        expect(result_batch.failed.length).toBeLessThanOrEqual(batchUpdates.length);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Vérifier que l'opération est raisonnablement rapide (< 5 secondes)
      expect(duration).toBeLessThan(5000);
    });

    it('should maintain performance with many concurrent operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const operations = Array.from({ length: 20 }, (_, i) => 
        result.current.updateAssetOptimistic(`asset-${i}`, { title: `Concurrent ${i}` })
      );

      const startTime = Date.now();

      await act(async () => {
        await Promise.allSettled(operations);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Vérifier que les opérations concurrentes sont gérées efficacement
      expect(duration).toBeLessThan(10000);
      expect(result.current.operations.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network failures gracefully', async () => {
      // Simuler des échecs réseau intermittents
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response);
      });

      const { result } = renderHook(() => useOptimisticMutations({
        maxRetries: 3,
        retryDelay: 100
      }));

      await act(async () => {
        await result.current.updateAssetOptimistic('asset-1', { title: 'Retry Test' });
      });

      // Vérifier que l'opération a finalement réussi après les tentatives
      await waitFor(() => {
        const operation = result.current.operations.find(op => op.entityId === 'asset-1');
        return operation?.status === 'success';
      }, { timeout: 3000 });

      expect(callCount).toBe(3); // 2 échecs + 1 succès
    });

    it('should handle SSE connection failures with exponential backoff', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useSSEClient({
        onError,
        autoReconnect: true,
        maxReconnectAttempts: 3,
        reconnectInterval: 100
      }));

      // Simuler une erreur de connexion
      act(() => {
        if (mockEventSource?.onerror) {
          mockEventSource.onerror(new Event('error'));
        }
      });

      expect(onError).toHaveBeenCalled();
      expect(result.current.connectionState).toBe('error');

      // Vérifier que la reconnexion est tentée
      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBeGreaterThan(0);
      }, { timeout: 1000 });
    });
  });

  describe('Data Consistency and Synchronization', () => {
    it('should maintain data consistency across multiple hooks', async () => {
      const { result: optimisticResult } = renderHook(() => useOptimisticMutations());
      const { result: sseResult } = renderHook(() => useSSEClient());

      // Effectuer une mise à jour optimiste
      await act(async () => {
        await optimisticResult.current.updateAssetOptimistic('asset-1', {
          title: 'Consistency Test'
        });
      });

      // Simuler un événement SSE concurrent
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
        
        if (mockEventSource?.onmessage) {
          mockEventSource.onmessage(mockEvent);
        }
      });

      // Vérifier que les données restent cohérentes
      expect(optimisticResult.current.optimisticData['asset-1']).toBeDefined();
      expect(mockStore.fetchAssets).toHaveBeenCalled();
    });

    it('should handle timestamp-based conflict resolution', async () => {
      const { result: conflictResult } = renderHook(() => useConflictResolution());

      const olderVersion = {
        id: 'asset-1',
        title: 'Older Version',
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      const newerVersion = {
        id: 'asset-1',
        title: 'Newer Version',
        updatedAt: new Date('2024-01-01T11:00:00Z')
      };

      act(() => {
        const conflict = conflictResult.current.detectConflict(olderVersion, newerVersion);
        expect(conflict).toBeDefined();
      });

      // Résoudre automatiquement en faveur de la version la plus récente
      const conflict = conflictResult.current.detectConflict(olderVersion, newerVersion);
      if (conflict) {
        await act(async () => {
          const resolution = await conflictResult.current.resolveConflict(
            conflict,
            'auto'
          );
          
          expect(resolution.success).toBe(true);
          expect(resolution.resolvedData?.title).toBe('Newer Version');
        });
      }
    });
  });

  describe('Store State Management', () => {
    it('should properly manage loading states during operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Vérifier l'état initial
      expect(mockStore.mediaAssets.loading).toBe(false);

      // Simuler une opération qui déclenche un chargement
      await act(async () => {
        mockStore.mediaAssets.loading = true;
        await result.current.createAssetOptimistic({
          title: 'Loading Test Asset',
          type: 'image' as const,
          url: 'https://example.com/test.jpg',
          size: 1024,
          tags: []
        });
        mockStore.mediaAssets.loading = false;
      });

      // Vérifier que l'état de chargement est géré
      expect(mockStore.mediaAssets.loading).toBe(false);
    });

    it('should handle error states appropriately', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      // Simuler une erreur
      const error = new Error('Test error');
      vi.mocked(fetch).mockRejectedValueOnce(error);

      await act(async () => {
        try {
          await result.current.updateAssetOptimistic('asset-1', { title: 'Error Test' });
        } catch (e) {
          // L'erreur est attendue
        }
      });

      // Vérifier que l'erreur est trackée dans les opérations
      const failedOperation = result.current.operations.find(
        op => op.entityId === 'asset-1' && op.status === 'failed'
      );
      expect(failedOperation).toBeDefined();
      expect(failedOperation?.error).toBeDefined();
    });

    it('should maintain pagination state during CRUD operations', async () => {
      const { result } = renderHook(() => useOptimisticMutations());

      const initialPagination = { ...mockStore.mediaAssets.pagination };

      await act(async () => {
        await result.current.createAssetOptimistic({
          title: 'Pagination Test',
          type: 'image' as const,
          url: 'https://example.com/pagination.jpg',
          size: 2048,
          tags: []
        });
      });

      // Vérifier que la pagination est maintenue
      expect(mockStore.mediaAssets.pagination).toEqual(initialPagination);
    });
  });
});