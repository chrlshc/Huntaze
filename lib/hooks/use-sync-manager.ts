import { useEffect, useCallback, useRef } from 'react';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';
import { offlineQueue } from '@/lib/offline-queue';

interface SyncManagerOptions {
  autoSync?: boolean;
  syncInterval?: number; // milliseconds
  retryFailedOperations?: boolean;
  onSyncSuccess?: () => void;
  onSyncError?: (error: Error) => void;
  onConflictDetected?: (conflicts: any[]) => void;
}

export function useSyncManager(options: SyncManagerOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    retryFailedOperations = true,
    onSyncSuccess,
    onSyncError,
    onConflictDetected,
  } = options;

  const syncStatus = useContentCreationStore((state) => state.sync);
  const syncData = useContentCreationStore((state) => state.syncData);
  const retryFailedOps = useContentCreationStore((state) => state.retryFailedOperations);
  
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef(navigator.onLine);

  // Manual sync function
  const manualSync = useCallback(async () => {
    try {
      await syncData();
      
      if (retryFailedOperations && offlineQueue.size() > 0) {
        await retryFailedOps();
      }
      
      onSyncSuccess?.();
    } catch (error) {
      console.error('Sync failed:', error);
      onSyncError?.(error as Error);
    }
  }, [syncData, retryFailedOps, retryFailedOperations, onSyncSuccess, onSyncError]);

  // Auto sync setup
  useEffect(() => {
    if (!autoSync) return;

    const startAutoSync = () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      syncIntervalRef.current = setInterval(async () => {
        if (navigator.onLine && syncStatus.pendingOperations > 0) {
          await manualSync();
        }
      }, syncInterval);
    };

    startAutoSync();

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, syncStatus.pendingOperations, manualSync]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = async () => {
      isOnlineRef.current = true;
      
      // Retry failed operations when coming back online
      if (retryFailedOperations && offlineQueue.size() > 0) {
        try {
          await retryFailedOps();
          onSyncSuccess?.();
        } catch (error) {
          onSyncError?.(error as Error);
        }
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryFailedOperations, retryFailedOps, onSyncSuccess, onSyncError]);

  // Conflict detection
  useEffect(() => {
    if (syncStatus.conflicts.length > 0) {
      onConflictDetected?.(syncStatus.conflicts);
    }
  }, [syncStatus.conflicts, onConflictDetected]);

  // Page visibility sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine && syncStatus.pendingOperations > 0) {
        manualSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [manualSync, syncStatus.pendingOperations]);

  return {
    syncStatus,
    isOnline: isOnlineRef.current,
    manualSync,
    queueSize: offlineQueue.size(),
  };
}