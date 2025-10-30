import { vi } from 'vitest';

// Mock state that can be manipulated by tests
let mockConflicts: any[] = [];
let mockIsResolving = false;

// Reset function for tests
export const resetMockState = () => {
  mockConflicts = [];
  mockIsResolving = false;
};

export const useConflictResolution = vi.fn(() => ({
  // State properties
  conflicts: mockConflicts,
  isResolving: mockIsResolving,
  hasConflicts: mockConflicts.length > 0,
  conflictCount: mockConflicts.length,
  highPriorityConflicts: mockConflicts.filter(c => c.severity === 'high'),

  // Functions
  detectConflict: vi.fn((localVersion: any, remoteVersion: any) => {
    if (!localVersion || !remoteVersion) return null;
    
    const conflictedFields: string[] = [];
    
    // Compare common fields
    ['title', 'name', 'description', 'status'].forEach(field => {
      if (localVersion[field] !== remoteVersion[field]) {
        conflictedFields.push(field);
      }
    });
    
    if (conflictedFields.length === 0) return null;
    
    const conflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType: localVersion.type || 'asset',
      entityId: localVersion.id || remoteVersion.id,
      localVersion,
      remoteVersion,
      timestamp: new Date(),
      conflictedFields,
      severity: conflictedFields.length > 2 ? 'high' : conflictedFields.length > 1 ? 'medium' : 'low'
    };
    
    return conflict;
  }),
  
  resolveConflict: vi.fn(async (conflict: any, strategy: string, mergedData?: any) => {
    mockIsResolving = true;
    
    try {
      let resolvedData;
      
      switch (strategy) {
        case 'local':
          resolvedData = conflict.localVersion;
          break;
        case 'remote':
          resolvedData = conflict.remoteVersion;
          break;
        case 'manual':
          if (!mergedData) {
            throw new Error('Manual resolution requires merged data');
          }
          resolvedData = mergedData;
          break;
        case 'auto':
          // Auto-resolve based on timestamp
          const localTime = new Date(conflict.localVersion.updatedAt || 0).getTime();
          const remoteTime = new Date(conflict.remoteVersion.updatedAt || 0).getTime();
          resolvedData = localTime > remoteTime ? conflict.localVersion : conflict.remoteVersion;
          break;
        default:
          throw new Error(`Unknown resolution strategy: ${strategy}`);
      }
      
      // Remove conflict from mock state
      mockConflicts = mockConflicts.filter(c => c.id !== conflict.id);
      
      return {
        success: true,
        resolvedData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resolution failed'
      };
    } finally {
      mockIsResolving = false;
    }
  }),
  
  addConflict: vi.fn((conflict: any) => {
    if (!mockConflicts.some(c => c.id === conflict.id)) {
      mockConflicts.push(conflict);
    }
  }),
  
  clearAllConflicts: vi.fn(() => {
    mockConflicts = [];
  }),
  
  getConflictsByType: vi.fn((entityType: string) => {
    return mockConflicts.filter(c => c.entityType === entityType);
  }),
  
  getConflictsByEntity: vi.fn((entityId: string) => {
    return mockConflicts.filter(c => c.entityId === entityId);
  }),
  
  validateResolution: vi.fn((conflict: any, mergedData: any) => {
    if (!mergedData) return false;
    
    // Check that all required fields are present
    const requiredFields = new Set([
      ...Object.keys(conflict.localVersion),
      ...Object.keys(conflict.remoteVersion)
    ]);
    
    for (const field of requiredFields) {
      if (mergedData[field] === undefined) {
        return false;
      }
    }
    
    return true;
  }),
  
  isValidConflict: vi.fn((conflict: any) => {
    return (
      conflict &&
      typeof conflict.id === 'string' &&
      typeof conflict.entityId === 'string' &&
      conflict.localVersion &&
      conflict.remoteVersion &&
      Array.isArray(conflict.conflictedFields)
    );
  }),
  
  resolveBatchConflicts: vi.fn(async (conflicts: any[], strategy: string) => {
    const results = [];
    
    for (const conflict of conflicts) {
      try {
        const result = await useConflictResolution().resolveConflict(conflict, strategy);
        results.push({
          success: result.success,
          conflict: result.success ? conflict : undefined,
          error: result.error
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Resolution failed'
        });
      }
    }
    
    return results;
  }),
  
  suggestResolutionStrategy: vi.fn((conflict: any) => {
    const suggestions = [];
    
    if (conflict.conflictedFields.includes('title') || conflict.conflictedFields.includes('name')) {
      suggestions.push('manual');
    }
    
    if (conflict.conflictedFields.some((field: string) => 
      field.includes('Array') || 
      Array.isArray(conflict.localVersion[field]) ||
      Array.isArray(conflict.remoteVersion[field])
    )) {
      suggestions.push('merge_arrays');
    }
    
    if (conflict.conflictedFields.includes('updatedAt') || conflict.conflictedFields.includes('timestamp')) {
      suggestions.push('auto');
    }
    
    suggestions.push('merge', 'local', 'remote');
    
    return [...new Set(suggestions)];
  }),
  
  previewResolution: vi.fn((conflict: any, strategy: string) => {
    if (!conflict) return null;
    
    switch (strategy) {
      case 'local':
        return conflict.localVersion;
      case 'remote':
        return conflict.remoteVersion;
      case 'merge':
        return {
          ...conflict.remoteVersion,
          ...conflict.localVersion
        };
      default:
        return null;
    }
  })
}));