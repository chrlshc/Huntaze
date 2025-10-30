# Design Document

## Overview

This design standardizes the interface between React hooks and Zustand stores in the Huntaze content creation system. The solution addresses naming inconsistencies, missing store integrations, and test failures by creating a unified interface pattern and proper store connections.

## Architecture

### Interface Standardization Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Standardized Hook Interface                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ optimisticUpdate│ │ optimisticCreate│ │ optimisticDelete││
│  │     Asset       │ │     Asset       │ │     Asset       ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Store Integration Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Content Creation│ │ Conflict Resol. │ │ SSE Integration ││
│  │     Store       │ │     Store       │ │     Store       ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Backend APIs                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Standardized Hook Interface

**Function Naming Convention:**
- Pattern: `optimistic[Action][Entity]`
- Actions: `Update`, `Create`, `Delete`
- Entities: `Asset`, `Campaign`, `Schedule`

**Core Interface:**
```typescript
interface StandardizedOptimisticMutations {
  // Asset Operations
  optimisticUpdateAsset: (id: string, data: Partial<MediaAsset>) => Promise<MediaAsset>
  optimisticCreateAsset: (data: CreateAssetData) => Promise<MediaAsset>
  optimisticDeleteAsset: (id: string) => Promise<void>
  
  // Campaign Operations  
  optimisticUpdateCampaign: (id: string, data: Partial<Campaign>) => Promise<Campaign>
  optimisticCreateCampaign: (data: CreateCampaignData) => Promise<Campaign>
  optimisticDeleteCampaign: (id: string) => Promise<void>
  
  // Batch Operations
  optimisticBatchUpdateAssets: (updates: BatchUpdateRequest[]) => Promise<BatchUpdateResult>
  
  // State Management
  operations: OptimisticOperation[]
  pendingOperations: OptimisticOperation[]
  failedOperations: OptimisticOperation[]
  hasPendingOperations: boolean
  
  // Utilities
  rollbackOperation: (operationId: string) => void
  clearCompletedOperations: () => void
  clearAllPendingOperations: () => void
}
```

### 2. Store Integration Architecture

**Content Creation Store Enhancement:**
```typescript
interface EnhancedContentCreationStore extends ContentCreationState {
  // Direct store operations (called by hooks)
  updateAssetInStore: (id: string, data: Partial<MediaAsset>) => void
  addAssetToStore: (asset: MediaAsset) => void
  removeAssetFromStore: (id: string) => void
  
  // Campaign store operations
  updateCampaignInStore: (id: string, data: Partial<Campaign>) => void
  addCampaignToStore: (campaign: Campaign) => void
  removeCampaignFromStore: (id: string) => void
  
  // Optimistic state management
  setOptimisticData: (entityType: string, entityId: string, data: any) => void
  revertOptimisticData: (entityType: string, entityId: string) => void
  
  // Sync state management
  setSyncStatus: (status: 'synced' | 'syncing' | 'conflict' | 'error') => void
  updateLastSyncTime: () => void
}
```

### 3. Hook-Store Bridge

**Integration Layer:**
```typescript
class HookStoreBridge {
  constructor(
    private contentStore: EnhancedContentCreationStore,
    private conflictStore: ConflictResolutionStore
  ) {}
  
  // Coordinate optimistic updates with store
  async performOptimisticUpdate<T>(
    operation: OptimisticOperation,
    storeUpdater: (data: T) => void,
    apiCall: () => Promise<T>
  ): Promise<T> {
    // 1. Apply optimistic update to store
    storeUpdater(operation.data)
    
    try {
      // 2. Execute API call
      const result = await apiCall()
      
      // 3. Update store with server response
      storeUpdater(result)
      
      // 4. Check for conflicts
      this.checkForConflicts(operation, result)
      
      return result
    } catch (error) {
      // 5. Revert optimistic update
      this.revertOptimisticUpdate(operation)
      throw error
    }
  }
}
```

## Data Models

### Enhanced Operation Tracking

```typescript
interface OptimisticOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'asset' | 'campaign' | 'schedule'
  entityId: string
  data: any
  originalData?: any
  timestamp: Date
  status: 'pending' | 'success' | 'failed'
  retryCount: number
  error?: string
  
  // New fields for better tracking
  storeSnapshot?: any  // Store state before operation
  conflictResolution?: 'auto' | 'manual' | 'pending'
  dependencies?: string[]  // Other operation IDs this depends on
}
```

### Store State Enhancement

```typescript
interface EnhancedStoreState {
  // Existing state...
  
  // New optimistic state tracking
  optimisticOperations: Record<string, OptimisticOperation>
  optimisticData: Record<string, any>  // entityId -> optimistic data
  
  // Enhanced sync state
  sync: {
    status: 'synced' | 'syncing' | 'conflict' | 'error'
    conflicts: ConflictData[]
    lastSyncAt?: Date
    pendingOperations: string[]  // operation IDs
    failedOperations: string[]   // operation IDs
  }
}
```

## Error Handling

### Conflict Resolution Integration

1. **Automatic Conflict Detection:**
   - Compare optimistic data with server response
   - Detect field-level conflicts
   - Generate conflict metadata

2. **Conflict Resolution Strategies:**
   - Auto-resolve based on timestamps
   - Manual resolution with user input
   - Merge strategies for compatible changes

3. **Error Recovery:**
   - Automatic retry with exponential backoff
   - Rollback to last known good state
   - User notification for manual intervention

### Store Consistency

1. **Transaction-like Operations:**
   - Atomic updates across related entities
   - Rollback capabilities for failed operations
   - Dependency tracking between operations

2. **State Validation:**
   - Validate store state after operations
   - Detect and repair inconsistencies
   - Maintain referential integrity

## Testing Strategy

### Interface Compliance Testing

1. **Function Signature Validation:**
   - Verify all expected functions exist
   - Check parameter types and return types
   - Validate async behavior

2. **Store Integration Testing:**
   - Test optimistic updates reflect in store
   - Verify rollback functionality
   - Check conflict resolution integration

3. **Performance Testing:**
   - Batch operation efficiency
   - Memory usage with large datasets
   - Concurrent operation handling

### Mock Strategy

1. **Store Mocking:**
   - Mock Zustand store for unit tests
   - Provide test utilities for store state
   - Simulate store update scenarios

2. **API Mocking:**
   - Mock backend responses
   - Simulate network failures
   - Test retry mechanisms

## Implementation Phases

### Phase 1: Interface Standardization
- Update `useOptimisticMutations` hook with standardized names
- Add backward compatibility aliases
- Update type definitions

### Phase 2: Store Integration
- Enhance content creation store with direct operations
- Implement hook-store bridge
- Add optimistic state tracking

### Phase 3: Conflict Resolution
- Integrate with existing conflict resolution hook
- Implement automatic conflict detection
- Add manual resolution UI hooks

### Phase 4: Testing & Validation
- Update all tests to use standardized interface
- Add comprehensive integration tests
- Performance optimization and validation