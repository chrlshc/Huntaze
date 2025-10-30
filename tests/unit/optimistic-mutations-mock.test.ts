import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOptimisticMutations, resetMockState } from '@/lib/hooks/__mocks__/use-optimistic-mutations';

/**
 * Tests pour le mock useOptimisticMutations
 * Valide que le mock fournit toutes les fonctionnalités attendues
 */

describe('useOptimisticMutations Mock', () => {
  let mockHook: ReturnType<typeof useOptimisticMutations>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
    mockHook = useOptimisticMutations();
  });

  describe('Mock Structure Validation', () => {
    it('should provide all required state properties', () => {
      expect(mockHook.operations).toBeDefined();
      expect(mockHook.optimisticData).toBeDefined();
      expect(mockHook.pendingOperations).toBeDefined();
      expect(mockHook.failedOperations).toBeDefined();
      expect(mockHook.hasPendingOperations).toBeDefined();

      // Verify types
      expect(Array.isArray(mockHook.operations)).toBe(true);
      expect(typeof mockHook.optimisticData).toBe('object');
      expect(Array.isArray(mockHook.pendingOperations)).toBe(true);
      expect(Array.isArray(mockHook.failedOperations)).toBe(true);
      expect(typeof mockHook.hasPendingOperations).toBe('boolean');
    });

    it('should provide all required function properties', () => {
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
        expect(mockHook[funcName]).toBeDefined();
        expect(typeof mockHook[funcName]).toBe('function');
        expect(vi.isMockFunction(mockHook[funcName])).toBe(true);
      });
    });

    it('should have initial state properly set', () => {
      expect(mockHook.operations).toHaveLength(0);
      expect(Object.keys(mockHook.optimisticData)).toHaveLength(0);
      expect(mockHook.pendingOperations).toHaveLength(0);
      expect(mockHook.failedOperations).toHaveLength(0);
      expect(mockHook.hasPendingOperations).toBe(false);
    });
  });

  describe('Asset Operations Mock Behavior', () => {
    it('should handle updateAssetOptimistic correctly', async () => {
      const assetId = 'asset-1';
      const updateData = { title: 'Updated Title', description: 'New description' };

      const result = await mockHook.updateAssetOptimistic(assetId, updateData);

      // Verify return value
      expect(result.id).toBe(assetId);
      expect(result.title).toBe(updateData.title);
      expect(result.description).toBe(updateData.description);
      expect(result.updatedAt).toBeDefined();

      // Verify mock was called
      expect(mockHook.updateAssetOptimistic).toHaveBeenCalledWith(assetId, updateData);

      // Verify state updates
      expect(mockHook.operations).toHaveLength(1);
      expect(mockHook.operations[0].type).toBe('update');
      expect(mockHook.operations[0].entityType).toBe('asset');
      expect(mockHook.operations[0].entityId).toBe(assetId);
      expect(mockHook.optimisticData[assetId]).toEqual(updateData);
    });

    it('should handle createAssetOptimistic correctly', async () => {
      const assetData = {
        title: 'New Asset',
        type: 'image' as const,
        url: 'https://example.com/image.jpg',
        size: 1024,
        tags: ['test']
      };

      const result = await mockHook.createAssetOptimistic(assetData);

      // Verify return value structure
      expect(result.id).toMatch(/^asset-\d+$/);
      expect(result.title).toBe(assetData.title);
      expect(result.type).toBe(assetData.type);
      expect(result.createdAt).toBeDefined();

      // Verify mock was called
      expect(mockHook.createAssetOptimistic).toHaveBeenCalledWith(assetData);

      // Verify state updates
      expect(mockHook.operations).toHaveLength(1);
      expect(mockHook.operations[0].type).toBe('create');
      expect(mockHook.operations[0].entityType).toBe('asset');
    });

    it('should handle deleteAssetOptimistic correctly', async () => {
      const assetId = 'asset-to-delete';

      // First create some optimistic data
      mockHook.optimisticData[assetId] = { id: assetId, title: 'To Delete' };

      const result = await mockHook.deleteAssetOptimistic(assetId);

      // Verify return value
      expect(result.success).toBe(true);

      // Verify mock was called
      expect(mockHook.deleteAssetOptimistic).toHaveBeenCalledWith(assetId);

      // Verify state updates
      expect(mockHook.operations).toHaveLength(1);
      expect(mockHook.operations[0].type).toBe('delete');
      expect(mockHook.optimisticData[assetId]).toBeUndefined();
    });
  });

  describe('Campaign Operations Mock Behavior', () => {
    it('should handle updateCampaignOptimistic correctly', async () => {
      const campaignId = 'campaign-1';
      const updateData = { name: 'Updated Campaign', status: 'active' as const };

      const result = await mockHook.updateCampaignOptimistic(campaignId, updateData);

      // Verify return value
      expect(result.id).toBe(campaignId);
      expect(result.name).toBe(updateData.name);
      expect(result.status).toBe(updateData.status);
      expect(result.updatedAt).toBeDefined();

      // Verify mock was called
      expect(mockHook.updateCampaignOptimistic).toHaveBeenCalledWith(campaignId, updateData);

      // Verify state updates
      expect(mockHook.operations).toHaveLength(1);
      expect(mockHook.operations[0].type).toBe('update');
      expect(mockHook.operations[0].entityType).toBe('campaign');
    });
  });

  describe('Batch Operations Mock Behavior', () => {
    it('should handle batchUpdateAssetsOptimistic correctly', async () => {
      const updates = [
        { id: 'asset-1', data: { title: 'Batch Update 1' } },
        { id: 'asset-2', data: { title: 'Batch Update 2' } },
        { id: 'asset-3', data: { title: 'Batch Update 3' } }
      ];

      const result = await mockHook.batchUpdateAssetsOptimistic(updates);

      // Verify return value structure
      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.successful).toEqual(['asset-1', 'asset-2', 'asset-3']);

      // Verify mock was called
      expect(mockHook.batchUpdateAssetsOptimistic).toHaveBeenCalledWith(updates);

      // Verify state updates
      expect(mockHook.operations).toHaveLength(3);
      updates.forEach((update, index) => {
        expect(mockHook.operations[index].entityId).toBe(update.id);
        expect(mockHook.optimisticData[update.id]).toEqual(update.data);
      });
    });

    it('should handle batch operations with failures', async () => {
      const updates = [
        { id: 'asset-1', data: { title: 'Success' } },
        { id: 'asset-2', data: { title: 'Success' } }
      ];

      // Mock a failure scenario by modifying the mock implementation
      const originalMock = mockHook.batchUpdateAssetsOptimistic;
      mockHook.batchUpdateAssetsOptimistic = vi.fn().mockResolvedValue({
        successful: ['asset-1'],
        failed: [{ id: 'asset-2', error: 'Mock error' }]
      });

      const result = await mockHook.batchUpdateAssetsOptimistic(updates);

      expect(result.successful).toEqual(['asset-1']);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe('asset-2');
      expect(result.failed[0].error).toBe('Mock error');

      // Restore original mock
      mockHook.batchUpdateAssetsOptimistic = originalMock;
    });
  });

  describe('Utility Functions Mock Behavior', () => {
    it('should handle getPendingOperationsForEntity correctly', () => {
      const entityId = 'test-entity';

      const result = mockHook.getPendingOperationsForEntity(entityId);

      expect(Array.isArray(result)).toBe(true);
      expect(mockHook.getPendingOperationsForEntity).toHaveBeenCalledWith(entityId);
    });

    it('should handle clearCompletedOperations correctly', () => {
      mockHook.clearCompletedOperations();

      expect(mockHook.clearCompletedOperations).toHaveBeenCalledTimes(1);
    });

    it('should handle rollbackOperation correctly', () => {
      const operationId = 'op-123';

      mockHook.rollbackOperation(operationId);

      expect(mockHook.rollbackOperation).toHaveBeenCalledWith(operationId);
    });

    it('should handle clearAllPendingOperations correctly', () => {
      mockHook.clearAllPendingOperations();

      expect(mockHook.clearAllPendingOperations).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management', () => {
    it('should track operations correctly', async () => {
      expect(mockHook.operations).toHaveLength(0);
      expect(mockHook.hasPendingOperations).toBe(false);

      await mockHook.updateAssetOptimistic('asset-1', { title: 'Test' });

      expect(mockHook.operations).toHaveLength(1);
      expect(mockHook.hasPendingOperations).toBe(true);
    });

    it('should update optimistic data correctly', async () => {
      const assetId = 'asset-test';
      const data = { title: 'Optimistic Title' };

      await mockHook.updateAssetOptimistic(assetId, data);

      expect(mockHook.optimisticData[assetId]).toEqual(data);
    });

    it('should handle multiple operations on same entity', async () => {
      const assetId = 'asset-multi';

      await mockHook.updateAssetOptimistic(assetId, { title: 'First Update' });
      await mockHook.updateAssetOptimistic(assetId, { description: 'Second Update' });

      expect(mockHook.operations).toHaveLength(2);
      expect(mockHook.optimisticData[assetId]).toEqual({
        title: 'First Update',
        description: 'Second Update'
      });
    });
  });

  describe('Async Behavior', () => {
    it('should handle concurrent operations', async () => {
      const promises = [
        mockHook.updateAssetOptimistic('asset-1', { title: 'Concurrent 1' }),
        mockHook.updateAssetOptimistic('asset-2', { title: 'Concurrent 2' }),
        mockHook.createAssetOptimistic({ title: 'Concurrent Create', type: 'image' as const })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockHook.operations).toHaveLength(3);
    });

    it('should maintain operation order', async () => {
      await mockHook.updateAssetOptimistic('asset-1', { title: 'First' });
      await mockHook.updateAssetOptimistic('asset-2', { title: 'Second' });
      await mockHook.createAssetOptimistic({ title: 'Third', type: 'video' as const });

      expect(mockHook.operations).toHaveLength(3);
      expect(mockHook.operations[0].entityId).toBe('asset-1');
      expect(mockHook.operations[1].entityId).toBe('asset-2');
      expect(mockHook.operations[2].type).toBe('create');
    });
  });

  describe('Mock Reset Functionality', () => {
    it('should reset state when resetMockState is called', async () => {
      // Add some operations
      await mockHook.updateAssetOptimistic('asset-1', { title: 'Test' });
      await mockHook.createAssetOptimistic({ title: 'Test Create', type: 'image' as const });

      expect(mockHook.operations).toHaveLength(2);
      expect(Object.keys(mockHook.optimisticData)).toHaveLength(2);

      // Reset state
      resetMockState();
      const newMockHook = useOptimisticMutations();

      expect(newMockHook.operations).toHaveLength(0);
      expect(Object.keys(newMockHook.optimisticData)).toHaveLength(0);
      expect(newMockHook.hasPendingOperations).toBe(false);
    });

    it('should maintain function mocks after state reset', () => {
      resetMockState();
      const newMockHook = useOptimisticMutations();

      expect(vi.isMockFunction(newMockHook.updateAssetOptimistic)).toBe(true);
      expect(vi.isMockFunction(newMockHook.createAssetOptimistic)).toBe(true);
      expect(vi.isMockFunction(newMockHook.deleteAssetOptimistic)).toBe(true);
    });
  });

  describe('Integration with Test Scenarios', () => {
    it('should support typical optimistic update workflow', async () => {
      const assetId = 'workflow-asset';
      const initialData = { title: 'Initial Title' };
      const updateData = { title: 'Updated Title', description: 'Added description' };

      // Create asset
      await mockHook.createAssetOptimistic(initialData);
      expect(mockHook.operations).toHaveLength(1);

      // Update asset
      await mockHook.updateAssetOptimistic(assetId, updateData);
      expect(mockHook.operations).toHaveLength(2);

      // Check pending operations
      const pending = mockHook.getPendingOperationsForEntity(assetId);
      expect(Array.isArray(pending)).toBe(true);

      // Clear operations
      mockHook.clearCompletedOperations();
      expect(mockHook.clearCompletedOperations).toHaveBeenCalled();
    });

    it('should support error recovery workflow', async () => {
      const assetId = 'error-asset';

      // Create operation
      await mockHook.updateAssetOptimistic(assetId, { title: 'Test' });
      const operationId = mockHook.operations[0].id;

      // Rollback operation
      mockHook.rollbackOperation(operationId);
      expect(mockHook.rollbackOperation).toHaveBeenCalledWith(operationId);

      // Clear all pending
      mockHook.clearAllPendingOperations();
      expect(mockHook.clearAllPendingOperations).toHaveBeenCalled();
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large numbers of operations efficiently', async () => {
      const start = Date.now();
      const operations = [];

      for (let i = 0; i < 100; i++) {
        operations.push(mockHook.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` }));
      }

      await Promise.all(operations);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(mockHook.operations).toHaveLength(100);
    });

    it('should maintain memory efficiency', async () => {
      // Create many operations
      for (let i = 0; i < 50; i++) {
        await mockHook.updateAssetOptimistic(`asset-${i}`, { title: `Asset ${i}` });
      }

      // Verify reasonable memory usage (operations array shouldn't grow indefinitely)
      expect(mockHook.operations.length).toBeLessThan(1000);
      expect(Object.keys(mockHook.optimisticData).length).toBeLessThan(1000);
    });
  });

  describe('Offline Operations (Bug Fix Regression Tests)', () => {
    let originalNavigator: any;

    beforeEach(() => {
      // Store original navigator
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      // Restore original navigator
      global.navigator = originalNavigator;
    });

    it('should handle offline operations with complete OptimisticOperation structure', async () => {
      // Mock offline state
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true
      });

      const assetId = 'offline-asset-1';
      const updateData = { title: 'Offline Update', description: 'Updated while offline' };

      const result = await mockHook.updateAssetOptimistic(assetId, updateData);

      // Verify the result has the complete structure
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.type).toBe('update');
      expect(result.entityType).toBe('asset');
      expect(result.entityId).toBe(assetId);
      expect(result.data).toEqual(updateData);
      expect(result.timestamp).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.retryCount).toBe(0);

      // Verify the operation was added to offline queue
      expect(mockHook.offlineQueue).toBeDefined();
      if (mockHook.offlineQueue) {
        expect(mockHook.offlineQueue).toHaveLength(1);
        expect(mockHook.offlineQueue[0]).toMatchObject({
          type: 'update',
          entityType: 'asset',
          entityId: assetId,
          data: updateData,
          status: 'pending',
          retryCount: 0
        });
      }
    });

    it('should generate unique operation IDs for offline operations', async () => {
      // Mock offline state
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true
      });

      const operations = [];
      for (let i = 0; i < 3; i++) {
        const result = await mockHook.updateAssetOptimistic(`asset-${i}`, { title: `Offline ${i}` });
        operations.push(result);
      }

      // Verify all operations have unique IDs
      const ids = operations.map(op => op.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);

      // Verify all operations have proper structure
      operations.forEach((op, index) => {
        expect(op.id).toMatch(/^op_\d+_[a-z0-9]+$/);
        expect(op.entityId).toBe(`asset-${index}`);
        expect(op.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should handle online operations normally when not offline', async () => {
      // Ensure online state
      Object.defineProperty(global, 'navigator', {
        value: { onLine: true },
        writable: true
      });

      const assetId = 'online-asset-1';
      const updateData = { title: 'Online Update' };

      const result = await mockHook.updateAssetOptimistic(assetId, updateData);

      // Verify normal operation (not queued offline)
      expect(result).toBeDefined();
      expect(result.id).toBe(assetId);
      expect(result.title).toBe(updateData.title);

      // Verify no offline queue usage
      if (mockHook.offlineQueue) {
        expect(mockHook.offlineQueue).toHaveLength(0);
      }
    });

    it('should handle navigator undefined gracefully', async () => {
      // Mock undefined navigator (some test environments)
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true
      });

      const assetId = 'undefined-nav-asset';
      const updateData = { title: 'Navigator Undefined Test' };

      // Should not throw and should work as online
      await expect(mockHook.updateAssetOptimistic(assetId, updateData)).resolves.toBeDefined();
    });

    it('should maintain proper TypeScript types for offline operations', async () => {
      // Mock offline state
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true
      });

      const result = await mockHook.updateAssetOptimistic('type-test-asset', { title: 'Type Test' });

      // Verify all required OptimisticOperation properties exist with correct types
      expect(typeof result.id).toBe('string');
      expect(typeof result.type).toBe('string');
      expect(typeof result.entityType).toBe('string');
      expect(typeof result.entityId).toBe('string');
      expect(typeof result.data).toBe('object');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.status).toBe('string');
      expect(typeof result.retryCount).toBe('number');

      // Verify enum values
      expect(['create', 'update', 'delete']).toContain(result.type);
      expect(['asset', 'campaign']).toContain(result.entityType);
      expect(['pending', 'success', 'failed']).toContain(result.status);
    });

    it('should handle multiple offline operations correctly', async () => {
      // Mock offline state
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true
      });

      const operations = [
        { id: 'asset-1', data: { title: 'Offline 1' } },
        { id: 'asset-2', data: { title: 'Offline 2' } },
        { id: 'asset-3', data: { title: 'Offline 3' } }
      ];

      const results = [];
      for (const op of operations) {
        const result = await mockHook.updateAssetOptimistic(op.id, op.data);
        results.push(result);
      }

      // Verify all operations were queued
      expect(results).toHaveLength(3);
      if (mockHook.offlineQueue) {
        expect(mockHook.offlineQueue).toHaveLength(3);
      }

      // Verify each operation has unique ID and proper structure
      results.forEach((result, index) => {
        expect(result.entityId).toBe(operations[index].id);
        expect(result.data).toEqual(operations[index].data);
        expect(result.id).toBeDefined();
        expect(result.id).not.toBe(operations[index].id); // Operation ID should be different from entity ID
      });
    });

    it('should resolve offline operations as promises correctly', async () => {
      // Mock offline state
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true
      });

      const startTime = Date.now();
      const result = await mockHook.updateAssetOptimistic('promise-test', { title: 'Promise Test' });
      const endTime = Date.now();

      // Verify promise resolves quickly (should be immediate for offline operations)
      expect(endTime - startTime).toBeLessThan(100);

      // Verify result is properly structured
      expect(result).toBeDefined();
      expect(result.entityId).toBe('promise-test');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      // Test with invalid asset ID
      await expect(mockHook.updateAssetOptimistic('', {})).resolves.toBeDefined();
      
      // Test with null data
      await expect(mockHook.updateAssetOptimistic('asset-1', null)).resolves.toBeDefined();
      
      // Test with undefined parameters
      expect(() => mockHook.getPendingOperationsForEntity(undefined)).not.toThrow();
    });

    it('should maintain consistent return types', async () => {
      const updateResult = await mockHook.updateAssetOptimistic('asset-1', { title: 'Test' });
      expect(typeof updateResult.id).toBe('string');
      expect(typeof updateResult.updatedAt).toBe('string');

      const createResult = await mockHook.createAssetOptimistic({ title: 'Test', type: 'image' as const });
      expect(typeof createResult.id).toBe('string');
      expect(typeof createResult.createdAt).toBe('string');

      const deleteResult = await mockHook.deleteAssetOptimistic('asset-1');
      expect(typeof deleteResult.success).toBe('boolean');
    });
  });
});