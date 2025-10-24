import { useCallback, useState } from 'react';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';
import { ConflictDetails } from '@/src/lib/api/schemas';

interface ConflictResolutionOptions {
  onResolved?: (conflictId: string, resolution: string) => void;
  onError?: (error: Error) => void;
}

export function useConflictResolution(options: ConflictResolutionOptions = {}) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionHistory, setResolutionHistory] = useState<Array<{
    conflictId: string;
    resolution: string;
    timestamp: Date;
  }>>([]);

  const conflicts = useContentCreationStore((state) => state.sync.conflicts);
  const resolveConflict = useContentCreationStore((state) => state.resolveConflict);

  // Resolve a single conflict
  const resolve = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merge',
    customMergeData?: any
  ) => {
    setIsResolving(true);
    
    try {
      await resolveConflict(conflictId, resolution);
      
      // Track resolution
      setResolutionHistory(prev => [...prev, {
        conflictId,
        resolution,
        timestamp: new Date(),
      }]);

      options.onResolved?.(conflictId, resolution);
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [resolveConflict, options]);

  // Resolve all conflicts with the same strategy
  const resolveAll = useCallback(async (
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    setIsResolving(true);
    
    try {
      const promises = conflicts.map(conflict => 
        resolveConflict(conflict.id, resolution)
      );
      
      await Promise.all(promises);
      
      // Track all resolutions
      const newResolutions = conflicts.map(conflict => ({
        conflictId: conflict.id,
        resolution,
        timestamp: new Date(),
      }));
      
      setResolutionHistory(prev => [...prev, ...newResolutions]);
      
      conflicts.forEach(conflict => {
        options.onResolved?.(conflict.id, resolution);
      });
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [conflicts, resolveConflict, options]);

  // Get conflict details with additional metadata
  const getConflictDetails = useCallback((conflictId: string) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    return {
      ...conflict,
      canAutoResolve: determineAutoResolution(conflict),
      recommendedResolution: getRecommendedResolution(conflict),
      impactLevel: assessConflictImpact(conflict),
    };
  }, [conflicts]);

  // Auto-resolve conflicts that are safe to resolve automatically
  const autoResolve = useCallback(async () => {
    const autoResolvableConflicts = conflicts.filter(conflict => 
      determineAutoResolution(conflict) !== null
    );

    if (autoResolvableConflicts.length === 0) return;

    setIsResolving(true);

    try {
      const promises = autoResolvableConflicts.map(conflict => {
        const resolution = determineAutoResolution(conflict);
        return resolution ? resolveConflict(conflict.id, resolution) : Promise.resolve();
      });

      await Promise.all(promises);

      const newResolutions = autoResolvableConflicts.map(conflict => ({
        conflictId: conflict.id,
        resolution: determineAutoResolution(conflict) || 'auto',
        timestamp: new Date(),
      }));

      setResolutionHistory(prev => [...prev, ...newResolutions]);
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [conflicts, resolveConflict, options]);

  // Preview what would happen with each resolution strategy
  const previewResolution = useCallback((
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    switch (resolution) {
      case 'local':
        return {
          result: conflict.localVersion,
          description: 'Keep your local changes, discard server changes',
          risks: ['Server changes will be lost'],
        };
      case 'remote':
        return {
          result: conflict.remoteVersion,
          description: 'Accept server changes, discard local changes',
          risks: ['Your local changes will be lost'],
        };
      case 'merge':
        return {
          result: attemptAutoMerge(conflict),
          description: 'Attempt to merge both versions',
          risks: ['Merge may not be perfect', 'Manual review recommended'],
        };
      default:
        return null;
    }
  }, [conflicts]);

  return {
    conflicts,
    isResolving,
    resolutionHistory,
    resolve,
    resolveAll,
    autoResolve,
    getConflictDetails,
    previewResolution,
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
  };
}

// Helper functions for conflict analysis
function determineAutoResolution(conflict: ConflictDetails): 'local' | 'remote' | null {
  // Simple heuristics for auto-resolution
  const timeDiff = new Date(conflict.remoteVersion.updatedAt).getTime() - 
                   new Date(conflict.localVersion.updatedAt).getTime();

  // If remote is significantly newer (>5 minutes), prefer remote
  if (timeDiff > 5 * 60 * 1000) {
    return 'remote';
  }

  // If local is newer, prefer local
  if (timeDiff < -60 * 1000) {
    return 'local';
  }

  // For simple field conflicts, we can't auto-resolve
  return null;
}

function getRecommendedResolution(conflict: ConflictDetails): 'local' | 'remote' | 'merge' {
  // Analyze the conflict and recommend the best resolution
  const localChanges = Object.keys(conflict.localVersion).length;
  const remoteChanges = Object.keys(conflict.remoteVersion).length;

  // If one version has significantly more changes, prefer that one
  if (localChanges > remoteChanges * 2) {
    return 'local';
  }
  if (remoteChanges > localChanges * 2) {
    return 'remote';
  }

  // Otherwise, suggest merge
  return 'merge';
}

function assessConflictImpact(conflict: ConflictDetails): 'low' | 'medium' | 'high' {
  // Assess the potential impact of the conflict
  const criticalFields = ['status', 'publishedAt', 'pricing'];
  
  const hasCriticalConflicts = criticalFields.some(field => 
    conflict.localVersion[field] !== conflict.remoteVersion[field]
  );

  if (hasCriticalConflicts) {
    return 'high';
  }

  // Check if it's a metadata-only conflict
  const metadataFields = ['title', 'description', 'tags'];
  const hasMetadataConflicts = metadataFields.some(field =>
    conflict.localVersion[field] !== conflict.remoteVersion[field]
  );

  if (hasMetadataConflicts) {
    return 'medium';
  }

  return 'low';
}

function attemptAutoMerge(conflict: ConflictDetails): any {
  // Simple merge strategy - combine non-conflicting fields
  const merged = { ...conflict.localVersion };

  // For arrays, merge unique values
  if (Array.isArray(conflict.localVersion.tags) && Array.isArray(conflict.remoteVersion.tags)) {
    merged.tags = [...new Set([...conflict.localVersion.tags, ...conflict.remoteVersion.tags])];
  }

  // For metrics, take the higher values (assuming they're cumulative)
  if (conflict.localVersion.metrics && conflict.remoteVersion.metrics) {
    merged.metrics = {
      views: Math.max(conflict.localVersion.metrics.views, conflict.remoteVersion.metrics.views),
      engagement: Math.max(conflict.localVersion.metrics.engagement, conflict.remoteVersion.metrics.engagement),
      revenue: Math.max(conflict.localVersion.metrics.revenue, conflict.remoteVersion.metrics.revenue),
      roi: Math.max(conflict.localVersion.metrics.roi, conflict.remoteVersion.metrics.roi),
    };
  }

  // Use the most recent updatedAt
  merged.updatedAt = new Date(Math.max(
    new Date(conflict.localVersion.updatedAt).getTime(),
    new Date(conflict.remoteVersion.updatedAt).getTime()
  ));

  return merged;
}