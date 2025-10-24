import { useCallback, useRef } from 'react';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';
import { MediaAsset, PPVCampaign, ScheduleEntry } from '@/src/lib/api/schemas';

interface OptimisticOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'asset' | 'campaign' | 'schedule';
  originalData?: any;
  timestamp: Date;
}

export function useOptimisticMutations() {
  const store = useContentCreationStore();
  const operationsRef = useRef<Map<string, OptimisticOperation>>(new Map());

  // Asset mutations
  const optimisticUpdateAsset = useCallback(async (
    id: string,
    updates: Partial<MediaAsset>,
    serverUpdate: () => Promise<MediaAsset>
  ) => {
    const operationId = `asset-update-${id}-${Date.now()}`;
    const originalAsset = store.mediaAssets.items.find(item => item.id === id);

    // Store operation for potential rollback
    operationsRef.current.set(operationId, {
      id: operationId,
      type: 'update',
      entity: 'asset',
      originalData: originalAsset,
      timestamp: new Date(),
    });

    // Apply optimistic update
    store.optimisticUpdateAsset(id, updates);

    try {
      // Perform server update
      const updatedAsset = await serverUpdate();
      
      // Server update successful, remove operation
      operationsRef.current.delete(operationId);
      
      return updatedAsset;
    } catch (error) {
      // Rollback optimistic update
      if (originalAsset) {
        store.optimisticUpdateAsset(id, originalAsset);
      }
      operationsRef.current.delete(operationId);
      throw error;
    }
  }, [store]);

  const optimisticCreateAsset = useCallback(async (
    assetData: Partial<MediaAsset>,
    serverCreate: () => Promise<MediaAsset>
  ) => {
    const tempId = `temp-${Date.now()}`;
    const operationId = `asset-create-${tempId}`;

    // Create optimistic asset
    const optimisticAsset: MediaAsset = {
      id: tempId,
      creatorId: 'current-user',
      title: assetData.title || 'New Asset',
      type: assetData.type || 'photo',
      status: 'draft',
      thumbnailUrl: '/placeholder-thumb.jpg',
      originalUrl: '/placeholder.jpg',
      fileSize: 0,
      dimensions: { width: 0, height: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
      tags: [],
      compliance: {
        status: 'pending',
        checkedAt: new Date(),
        violations: [],
        score: 0,
      },
      ...assetData,
    } as MediaAsset;

    // Store operation
    operationsRef.current.set(operationId, {
      id: operationId,
      type: 'create',
      entity: 'asset',
      originalData: null,
      timestamp: new Date(),
    });

    // Add to store optimistically
    store.mediaAssets.items.unshift(optimisticAsset);

    try {
      // Perform server create
      const createdAsset = await serverCreate();
      
      // Replace optimistic asset with real one
      const index = store.mediaAssets.items.findIndex(item => item.id === tempId);
      if (index !== -1) {
        store.mediaAssets.items[index] = createdAsset;
      }
      
      operationsRef.current.delete(operationId);
      return createdAsset;
    } catch (error) {
      // Remove optimistic asset
      store.mediaAssets.items = store.mediaAssets.items.filter(item => item.id !== tempId);
      operationsRef.current.delete(operationId);
      throw error;
    }
  }, [store]);

  const optimisticDeleteAsset = useCallback(async (
    id: string,
    serverDelete: () => Promise<void>
  ) => {
    const operationId = `asset-delete-${id}-${Date.now()}`;
    const originalAsset = store.mediaAssets.items.find(item => item.id === id);

    if (!originalAsset) {
      throw new Error('Asset not found');
    }

    // Store operation
    operationsRef.current.set(operationId, {
      id: operationId,
      type: 'delete',
      entity: 'asset',
      originalData: originalAsset,
      timestamp: new Date(),
    });

    // Remove optimistically
    store.mediaAssets.items = store.mediaAssets.items.filter(item => item.id !== id);

    try {
      // Perform server delete
      await serverDelete();
      
      operationsRef.current.delete(operationId);
    } catch (error) {
      // Restore asset
      store.mediaAssets.items.push(originalAsset);
      operationsRef.current.delete(operationId);
      throw error;
    }
  }, [store]);

  // Campaign mutations
  const optimisticUpdateCampaign = useCallback(async (
    id: string,
    updates: Partial<PPVCampaign>,
    serverUpdate: () => Promise<PPVCampaign>
  ) => {
    const operationId = `campaign-update-${id}-${Date.now()}`;
    const originalCampaign = store.campaigns.items.find(item => item.id === id);

    operationsRef.current.set(operationId, {
      id: operationId,
      type: 'update',
      entity: 'campaign',
      originalData: originalCampaign,
      timestamp: new Date(),
    });

    // Apply optimistic update
    const index = store.campaigns.items.findIndex(item => item.id === id);
    if (index !== -1) {
      store.campaigns.items[index] = {
        ...store.campaigns.items[index],
        ...updates,
        updatedAt: new Date(),
      };
    }

    try {
      const updatedCampaign = await serverUpdate();
      
      // Replace with server data
      const newIndex = store.campaigns.items.findIndex(item => item.id === id);
      if (newIndex !== -1) {
        store.campaigns.items[newIndex] = updatedCampaign;
      }
      
      operationsRef.current.delete(operationId);
      return updatedCampaign;
    } catch (error) {
      // Rollback
      if (originalCampaign) {
        const rollbackIndex = store.campaigns.items.findIndex(item => item.id === id);
        if (rollbackIndex !== -1) {
          store.campaigns.items[rollbackIndex] = originalCampaign;
        }
      }
      operationsRef.current.delete(operationId);
      throw error;
    }
  }, [store]);

  // Schedule mutations
  const optimisticScheduleContent = useCallback(async (
    scheduleData: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>,
    serverSchedule: () => Promise<ScheduleEntry>
  ) => {
    const tempId = `temp-schedule-${Date.now()}`;
    const operationId = `schedule-create-${tempId}`;

    const optimisticEntry: ScheduleEntry = {
      id: tempId,
      ...scheduleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    operationsRef.current.set(operationId, {
      id: operationId,
      type: 'create',
      entity: 'schedule',
      originalData: null,
      timestamp: new Date(),
    });

    // Add optimistically
    store.schedule.entries.push(optimisticEntry);

    try {
      const createdEntry = await serverSchedule();
      
      // Replace with server data
      const index = store.schedule.entries.findIndex(item => item.id === tempId);
      if (index !== -1) {
        store.schedule.entries[index] = createdEntry;
      }
      
      operationsRef.current.delete(operationId);
      return createdEntry;
    } catch (error) {
      // Remove optimistic entry
      store.schedule.entries = store.schedule.entries.filter(item => item.id !== tempId);
      operationsRef.current.delete(operationId);
      throw error;
    }
  }, [store]);

  // Utility functions
  const getPendingOperations = useCallback(() => {
    return Array.from(operationsRef.current.values());
  }, []);

  const rollbackOperation = useCallback((operationId: string) => {
    const operation = operationsRef.current.get(operationId);
    if (!operation) return;

    // Implement rollback logic based on operation type
    switch (operation.entity) {
      case 'asset':
        if (operation.type === 'update' && operation.originalData) {
          store.optimisticUpdateAsset(operation.originalData.id, operation.originalData);
        } else if (operation.type === 'create') {
          store.mediaAssets.items = store.mediaAssets.items.filter(
            item => !item.id.startsWith('temp-')
          );
        } else if (operation.type === 'delete' && operation.originalData) {
          store.mediaAssets.items.push(operation.originalData);
        }
        break;
      // Add cases for campaign and schedule rollbacks
    }

    operationsRef.current.delete(operationId);
  }, [store]);

  const clearAllOperations = useCallback(() => {
    operationsRef.current.clear();
  }, []);

  return {
    // Asset mutations
    optimisticUpdateAsset,
    optimisticCreateAsset,
    optimisticDeleteAsset,
    
    // Campaign mutations
    optimisticUpdateCampaign,
    
    // Schedule mutations
    optimisticScheduleContent,
    
    // Utilities
    getPendingOperations,
    rollbackOperation,
    clearAllOperations,
    pendingCount: operationsRef.current.size,
  };
}