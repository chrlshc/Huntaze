'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSyncManager } from '@/lib/hooks/use-sync-manager';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';
import { toast } from 'sonner'; // Assuming you're using sonner for notifications

interface SyncContextValue {
  isOnline: boolean;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline';
  pendingOperations: number;
  lastSync: Date | null;
  manualSync: () => Promise<void>;
  conflicts: any[];
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  children: React.ReactNode;
  enableAutoSync?: boolean;
  syncInterval?: number;
  showNotifications?: boolean;
}

export function SyncProvider({ 
  children, 
  enableAutoSync = true,
  syncInterval = 30000,
  showNotifications = true 
}: SyncProviderProps) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  const syncState = useContentCreationStore((state) => state.sync);
  
  const { syncStatus, isOnline, manualSync, queueSize } = useSyncManager({
    autoSync: enableAutoSync,
    syncInterval,
    retryFailedOperations: true,
    onSyncSuccess: () => {
      if (showNotifications && queueSize > 0) {
        toast.success('Data synchronized successfully');
      }
    },
    onSyncError: (error) => {
      if (showNotifications) {
        toast.error(`Sync failed: ${error.message}`);
      }
    },
    onConflictDetected: (detectedConflicts) => {
      setConflicts(detectedConflicts);
      if (showNotifications) {
        toast.warning(`${detectedConflicts.length} data conflicts detected`);
      }
    },
  });

  // Network status notifications
  useEffect(() => {
    if (!showNotifications) return;

    const handleOnline = () => {
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      toast.warning('Working offline - changes will sync when connection is restored');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotifications]);

  // Sync status notifications
  useEffect(() => {
    if (!showNotifications) return;

    if (syncState.status === 'conflict' && conflicts.length > 0) {
      toast.error('Data conflicts need resolution', {
        action: {
          label: 'Resolve',
          onClick: () => {
            // Open conflict resolution modal
            console.log('Open conflict resolution');
          },
        },
      });
    }
  }, [syncState.status, conflicts.length, showNotifications]);

  const contextValue: SyncContextValue = {
    isOnline,
    syncStatus: syncState.status,
    pendingOperations: syncState.pendingOperations,
    lastSync: syncState.lastSync,
    manualSync,
    conflicts,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
      {/* Sync Status Indicator */}
      <SyncStatusIndicator />
    </SyncContext.Provider>
  );
}

function SyncStatusIndicator() {
  const context = useContext(SyncContext);
  if (!context) return null;

  const { isOnline, syncStatus, pendingOperations } = context;

  if (syncStatus === 'synced' && isOnline) {
    return null; // Don't show indicator when everything is synced
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2
        ${syncStatus === 'offline' || !isOnline 
          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
          : syncStatus === 'pending' 
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : syncStatus === 'conflict'
          ? 'bg-red-100 text-red-800 border border-red-200'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
        }
      `}>
        {/* Status Icon */}
        <div className={`
          w-2 h-2 rounded-full
          ${syncStatus === 'offline' || !isOnline
            ? 'bg-orange-500'
            : syncStatus === 'pending'
            ? 'bg-blue-500 animate-pulse'
            : syncStatus === 'conflict'
            ? 'bg-red-500'
            : 'bg-green-500'
          }
        `} />
        
        {/* Status Text */}
        <span>
          {!isOnline 
            ? 'Offline'
            : syncStatus === 'pending'
            ? `Syncing ${pendingOperations} changes...`
            : syncStatus === 'conflict'
            ? 'Conflicts detected'
            : 'Synced'
          }
        </span>
      </div>
    </div>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

// Hook for components that need sync functionality
export function useSync() {
  const context = useSyncContext();
  const store = useContentCreationStore();

  return {
    ...context,
    // Convenience methods
    forcSync: context.manualSync,
    resolveConflict: store.resolveConflict,
    retryFailedOperations: store.retryFailedOperations,
  };
}