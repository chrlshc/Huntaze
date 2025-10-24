import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { renderHook, act } from '@testing-library/react';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';

// Mock API with controlled delays
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

// Helper to create mock assets
const createMockAsset = (id: string, overrides = {}) => ({
  id,
  title: `Asset ${id}`,
  type: 'photo' as const,
  status: 'published' as const,
  creatorId: 'user-123',
  thumbnailUrl: `/thumb-${id}.jpg`,
  originalUrl: `/asset-${id}.jpg`,
  fileSize: 1024 * (Math.floor(Math.random() * 10) + 1),
  dimensions: { width: 800, height: 600 },
  createdAt: new Date(),
  updatedAt: new Date(),
  metrics: {
    views: Math.floor(Math.random() * 1000),
    engagement: Math.floor(Math.random() * 100),
    revenue: Math.floor(Math.random() * 500),
    roi: Math.floor(Math.random() * 50),
  },
  tags: [`tag-${id}`, 'test'],
  compliance: {
    status: 'approved' as const,
    checkedAt: new Date(),
    violations: [],
    score: 90 + Math.floor(Math.random() * 10),
  },
  ...overrides,
});

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useContentCreationStore.getState().mediaAssets.items = [];
  });

  describe('Large Dataset Handling', () => {
    it('should handle 1000+ assets efficiently', async () => {
      const largeAssetSet = Array.from({ length: 1000 }, (_, i) => 
        createMockAsset(`asset-${i}`)
      );

      const mockResponse = {
        data: {
          items: largeAssetSet,
          pagination: {
            page: 1,
            limit: 1000,
            total: 1000,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      vi.mocked(require('@/lib/api').apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContentCreationStore());

      const startTime = performance.now();

      await act(async () => {
        await result.current.fetchAssets();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
      expect(result.current.mediaAssets.items).toHaveLength(1000);
    });

    it('should handle rapid successive updates efficiently', async () => {
      const { result } = renderHook(() => useContentCreationStore());

      // Add initial assets
      const initialAssets = Array.from({ length: 100 }, (_, i) => 
        createMockAsset(`initial-${i}`)
      );

      act(() => {
        result.current.mediaAssets.items = initialAssets;
      });

      const startTime = performance.now();

      // Perform 50 rapid updates
      await act(async () => {
        const updatePromises = Array.from({ length: 50 }, (_, i) => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              result.current.optimisticUpdateAsset(`initial-${i}`, {
                title: `Updated Asset ${i}`,
                updatedAt: new Date(),
              });
              resolve();
            }, i * 10); // Stagger updates by 10ms
          });
        });

        await Promise.all(updatePromises);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(2000); // 2 seconds
      expect(result.current.mediaAssets.items[0].title).toBe('Updated Asset 0');
    });

    it('should handle memory efficiently with large datasets', async () => {
      const { result } = renderHook(() => useContentCreationStore());

      // Simulate memory usage with large objects
      const largeAssets = Array.from({ length: 500 }, (_, i) => 
        createMockAsset(`large-${i}`, {
          // Add large metadata to simulate real-world scenarios
          metadata: {
            exif: Array.from({ length: 100 }, (_, j) => `metadata-${j}`),
            processing: Array.from({ length: 50 }, (_, k) => `step-${k}`),
          },
        })
      );

      const startMemory = process.memoryUsage().heapUsed;

      act(() => {
        result.current.mediaAssets.items = largeAssets;
      });

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB

      // Cleanup
      act(() => {
        result.current.mediaAssets.items = [];
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });
  });

  describe('API Response Time Simulation', () => {
    it('should handle slow API responses gracefully', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              items: [createMockAsset('slow-asset')],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                hasNext: false,
                hasPrev: false,
              },
            },
          });
        }, 2000); // 2 second delay
      });

      vi.mocked(require('@/lib/api').apiClient.get).mockReturnValue(slowResponse);

      const { result } = renderHook(() => useContentCreationStore());

      const startTime = performance.now();

      await act(async () => {
        await result.current.fetchAssets();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should wait for the slow response
      expect(duration).toBeGreaterThan(1900); // At least 1.9 seconds
      expect(result.current.mediaAssets.items).toHaveLength(1);
    });

    it('should handle concurrent API requests efficiently', async () => {
      const mockResponses = Array.from({ length: 10 }, (_, i) => ({
        data: createMockAsset(`concurrent-${i}`),
      }));

      vi.mocked(require('@/lib/api').apiClient.post)
        .mockImplementation((url, data) => {
          const delay = Math.random() * 500; // Random delay up to 500ms
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockResponses[Math.floor(Math.random() * mockResponses.length)]);
            }, delay);
          });
        });

      const { result } = renderHook(() => useContentCreationStore());

      const startTime = performance.now();

      // Create 10 assets concurrently
      await act(async () => {
        const createPromises = Array.from({ length: 10 }, (_, i) =>
          result.current.createAsset({
            title: `Concurrent Asset ${i}`,
            type: 'photo',
            tags: ['concurrent', 'test'],
          })
        );

        await Promise.all(createPromises);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all requests efficiently (not sequentially)
      expect(duration).toBeLessThan(1000); // Should be much faster than 5 seconds (10 * 500ms)
      expect(result.current.mediaAssets.items.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Filter Performance', () => {
    it('should filter large datasets efficiently', async () => {
      const { result } = renderHook(() => useContentCreationStore());

      // Create diverse dataset
      const diverseAssets = [
        ...Array.from({ length: 300 }, (_, i) => createMockAsset(`photo-${i}`, { type: 'photo', tags: ['photo', 'test'] })),
        ...Array.from({ length: 200 }, (_, i) => createMockAsset(`video-${i}`, { type: 'video', tags: ['video', 'test'] })),
        ...Array.from({ length: 100 }, (_, i) => createMockAsset(`story-${i}`, { type: 'story', tags: ['story', 'test'] })),
      ];

      act(() => {
        result.current.mediaAssets.items = diverseAssets;
      });

      const startTime = performance.now();

      // Apply filters
      act(() => {
        result.current.setAssetFilters({
          type: 'photo',
          status: 'published',
          tags: ['photo'],
          search: 'photo',
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Filtering should be fast
      expect(duration).toBeLessThan(100); // 100ms
      expect(result.current.mediaAssets.filters.type).toBe('photo');
    });

    it('should handle complex search queries efficiently', async () => {
      const mockResponse = {
        data: {
          items: Array.from({ length: 50 }, (_, i) => 
            createMockAsset(`search-${i}`, {
              title: `Searchable Asset ${i}`,
              tags: ['searchable', 'test', `tag-${i % 10}`],
            })
          ),
          pagination: {
            page: 1,
            limit: 50,
            total: 50,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      vi.mocked(require('@/lib/api').apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContentCreationStore());

      const startTime = performance.now();

      await act(async () => {
        await result.current.fetchAssets({
          search: 'searchable asset tag-5',
          type: 'photo',
          status: 'published',
          tags: ['searchable', 'test'],
          sortBy: 'revenue',
          sortOrder: 'desc',
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Complex search should complete reasonably fast
      expect(duration).toBeLessThan(500); // 500ms
      expect(result.current.mediaAssets.items).toHaveLength(50);
    });
  });

  describe('Optimistic Updates Performance', () => {
    it('should handle rapid optimistic updates without blocking UI', async () => {
      const { result } = renderHook(() => useContentCreationStore());

      // Add initial assets
      const initialAssets = Array.from({ length: 200 }, (_, i) => 
        createMockAsset(`rapid-${i}`)
      );

      act(() => {
        result.current.mediaAssets.items = initialAssets;
      });

      const startTime = performance.now();

      // Perform rapid optimistic updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.optimisticUpdateAsset(`rapid-${i}`, {
            title: `Rapidly Updated ${i}`,
            updatedAt: new Date(),
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete very quickly (synchronous updates)
      expect(duration).toBeLessThan(50); // 50ms
      expect(result.current.mediaAssets.items[0].title).toBe('Rapidly Updated 0');
      expect(result.current.mediaAssets.items[99].title).toBe('Rapidly Updated 99');
    });

    it('should handle optimistic rollbacks efficiently', async () => {
      const { result } = renderHook(() => useContentCreationStore());

      // Add assets to rollback
      const assetsToRollback = Array.from({ length: 50 }, (_, i) => 
        createMockAsset(`rollback-${i}`)
      );

      act(() => {
        result.current.mediaAssets.items = assetsToRollback;
      });

      // Perform optimistic updates
      act(() => {
        assetsToRollback.forEach((asset, i) => {
          result.current.optimisticUpdateAsset(asset.id, {
            title: `Optimistic Update ${i}`,
          });
        });
      });

      const startTime = performance.now();

      // Rollback all updates
      act(() => {
        assetsToRollback.forEach((asset) => {
          result.current.revertOptimisticUpdate(asset.id);
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Rollbacks should be fast
      expect(duration).toBeLessThan(100); // 100ms
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak memory with frequent store updates', async () => {
      const { result } = renderHook(() => useContentCreationStore());

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations that could potentially leak memory
      for (let cycle = 0; cycle < 10; cycle++) {
        // Add assets
        const assets = Array.from({ length: 100 }, (_, i) => 
          createMockAsset(`cycle-${cycle}-${i}`)
        );

        act(() => {
          result.current.mediaAssets.items = assets;
        });

        // Update assets
        act(() => {
          assets.forEach((asset, i) => {
            result.current.optimisticUpdateAsset(asset.id, {
              title: `Updated ${cycle}-${i}`,
            });
          });
        });

        // Clear assets
        act(() => {
          result.current.mediaAssets.items = [];
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal after cleanup
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
    });
  });
});