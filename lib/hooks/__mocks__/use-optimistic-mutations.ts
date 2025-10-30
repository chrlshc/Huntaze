import { vi } from 'vitest';

interface OptimisticOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'asset' | 'campaign';
  entityId: string;
  data: any;
  originalData?: any;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  retryCount: number;
  error?: string;
}

// Mock state that can be reset between tests
let mockState: {
  operations: OptimisticOperation[];
  optimisticData: Record<string, any>;
  pendingOperations: OptimisticOperation[];
  failedOperations: OptimisticOperation[];
  hasPendingOperations: boolean;
  queuedOperations: OptimisticOperation[];
  offlineQueue: OptimisticOperation[];
} = {
  operations: [],
  optimisticData: {},
  pendingOperations: [],
  failedOperations: [],
  hasPendingOperations: false,
  queuedOperations: [],
  offlineQueue: []
};

export const resetMockState = () => {
  mockState = {
    operations: [],
    optimisticData: {},
    pendingOperations: [],
    failedOperations: [],
    hasPendingOperations: false,
    queuedOperations: [],
    offlineQueue: []
  };
};

export const useOptimisticMutations = vi.fn(() => ({
  // State properties
  operations: mockState.operations,
  optimisticData: mockState.optimisticData,
  pendingOperations: mockState.pendingOperations,
  failedOperations: mockState.failedOperations,
  hasPendingOperations: mockState.hasPendingOperations,
  queuedOperations: mockState.queuedOperations,
  offlineQueue: mockState.offlineQueue,

  // Asset operations
  updateAssetOptimistic: vi.fn(async (id: string, data: any) => {
    // Check if offline (simulate navigator.onLine check)
    const isOffline = typeof navigator !== 'undefined' && (navigator as any).onLine === false;
    
    const operation: OptimisticOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'update',
      entityType: 'asset',
      entityId: id,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };
    
    if (isOffline) {
      // Add to offline queue with complete structure
      mockState.offlineQueue.push(operation);
      mockState.optimisticData[id] = { ...mockState.optimisticData[id], ...data };
      return operation; // Return the complete operation for offline mode
    }
    
    mockState.operations.push(operation);
    mockState.pendingOperations.push(operation);
    mockState.optimisticData[id] = { ...mockState.optimisticData[id], ...data };
    mockState.hasPendingOperations = true;
    
    // Simulate async completion
    setTimeout(() => {
      operation.status = 'success';
      mockState.pendingOperations = mockState.pendingOperations.filter(op => op.id !== operation.id);
      mockState.hasPendingOperations = mockState.pendingOperations.length > 0;
    }, 10);
    
    return { id, ...data, updatedAt: new Date().toISOString() };
  }),

  createAssetOptimistic: vi.fn(async (data: any) => {
    const id = `asset-${Date.now()}`;
    const operation: OptimisticOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'create',
      entityType: 'asset',
      entityId: id,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };
    
    mockState.operations.push(operation);
    mockState.pendingOperations.push(operation);
    mockState.optimisticData[id] = { id, ...data };
    mockState.hasPendingOperations = true;
    
    return { id, ...data, createdAt: new Date().toISOString() };
  }),

  deleteAssetOptimistic: vi.fn(async (id: string) => {
    const operation: OptimisticOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'delete',
      entityType: 'asset',
      entityId: id,
      data: null,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };
    
    mockState.operations.push(operation);
    mockState.pendingOperations.push(operation);
    delete mockState.optimisticData[id];
    mockState.hasPendingOperations = true;
    
    return { success: true };
  }),

  // Campaign operations
  updateCampaignOptimistic: vi.fn(async (id: string, data: any) => {
    const operation = {
      id: `op-${Date.now()}`,
      type: 'update',
      entityType: 'campaign',
      entityId: id,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };
    
    mockState.operations.push(operation);
    mockState.pendingOperations.push(operation);
    mockState.optimisticData[id] = { ...mockState.optimisticData[id], ...data };
    mockState.hasPendingOperations = true;
    
    return { id, ...data, updatedAt: new Date().toISOString() };
  }),

  // Batch operations
  batchUpdateAssetsOptimistic: vi.fn(async (updates: Array<{ id: string; data: any }>) => {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    
    for (const update of updates) {
      try {
        const operation = {
          id: `op-${Date.now()}-${update.id}`,
          type: 'update',
          entityType: 'asset',
          entityId: update.id,
          data: update.data,
          timestamp: new Date(),
          status: 'pending',
          retryCount: 0
        };
        
        mockState.operations.push(operation);
        mockState.optimisticData[update.id] = { ...mockState.optimisticData[update.id], ...update.data };
        successful.push(update.id);
      } catch (error) {
        failed.push({ id: update.id, error: 'Mock error' });
      }
    }
    
    return { successful, failed };
  }),

  // Utilities
  getPendingOperationsForEntity: vi.fn((entityId: string) => {
    return mockState.pendingOperations.filter(op => op.entityId === entityId);
  }),

  clearCompletedOperations: vi.fn(() => {
    mockState.operations = mockState.operations.filter(op => op.status === 'pending');
  }),

  rollbackOperation: vi.fn((operationId: string) => {
    const operation = mockState.operations.find(op => op.id === operationId);
    if (operation) {
      mockState.operations = mockState.operations.filter(op => op.id !== operationId);
      if (operation.type === 'update' || operation.type === 'create') {
        delete mockState.optimisticData[operation.entityId];
      }
    }
  }),

  clearAllPendingOperations: vi.fn(() => {
    mockState.pendingOperations.forEach(op => {
      delete mockState.optimisticData[op.entityId];
    });
    mockState.pendingOperations = [];
    mockState.hasPendingOperations = false;
  })
}));