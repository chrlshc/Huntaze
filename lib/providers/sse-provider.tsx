'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSSEClient } from '@/lib/hooks/use-sse-client';
import { ContentCreationEvent } from '@/app/api/content-creation/events/route';
import { toast } from 'sonner';

interface SSEContextValue {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastEventId: string | null;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

const SSEContext = createContext<SSEContextValue | null>(null);

interface SSEProviderProps {
  children: React.ReactNode;
  showNotifications?: boolean;
  autoConnect?: boolean;
}

export function SSEProvider({ 
  children, 
  showNotifications = true,
  autoConnect = true 
}: SSEProviderProps) {
  const [eventHistory, setEventHistory] = useState<ContentCreationEvent[]>([]);

  const handleEvent = (event: ContentCreationEvent) => {
    // Store event in history
    setEventHistory(prev => [...prev.slice(-99), event]); // Keep last 100 events

    // Show notifications based on event type
    if (showNotifications) {
      switch (event.type) {
        case 'asset_uploaded':
          toast.success('Asset uploaded successfully');
          break;
          
        case 'asset_processed':
          if (event.data.status === 'success') {
            toast.success('Asset processing completed');
          } else {
            toast.error('Asset processing failed');
          }
          break;
          
        case 'compliance_checked':
          if (event.data.compliance.status === 'approved') {
            toast.success('Content approved by compliance check');
          } else if (event.data.compliance.status === 'rejected') {
            toast.error('Content rejected by compliance check');
          }
          break;
          
        case 'campaign_created':
          toast.success(`Campaign "${event.data.name}" created`);
          break;
          
        case 'campaign_metrics':
          // Only show if significant change
          if (event.data.metrics.revenue > 100) {
            toast.info(`Campaign revenue updated: $${event.data.metrics.revenue}`);
          }
          break;
          
        case 'ai_insight':
          toast.info('New AI insight available', {
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to AI assistant or show insight modal
                console.log('Show AI insight:', event.data);
              },
            },
          });
          break;
          
        case 'ai_recommendation':
          toast.info('New AI recommendation', {
            action: {
              label: 'View',
              onClick: () => {
                console.log('Show AI recommendation:', event.data);
              },
            },
          });
          break;
          
        case 'sync_conflict':
          toast.warning('Data conflict detected', {
            action: {
              label: 'Resolve',
              onClick: () => {
                console.log('Open conflict resolution:', event.data);
              },
            },
          });
          break;
          
        case 'schedule_updated':
          toast.info('Schedule updated');
          break;
          
        default:
          // Don't show notifications for other event types
          break;
      }
    }
  };

  const sseClient = useSSEClient({
    autoReconnect: autoConnect,
    onConnect: () => {
      if (showNotifications) {
        toast.success('Real-time updates connected');
      }
    },
    onDisconnect: () => {
      if (showNotifications) {
        toast.warning('Real-time updates disconnected');
      }
    },
    onError: (error) => {
      console.error('SSE connection error:', error);
      if (showNotifications) {
        toast.error('Connection error - retrying...');
      }
    },
    onEvent: handleEvent,
  });

  const contextValue: SSEContextValue = {
    isConnected: sseClient.isConnected,
    connectionState: sseClient.connectionState,
    lastEventId: sseClient.lastEventId,
    reconnectAttempts: sseClient.reconnectAttempts,
    connect: sseClient.connect,
    disconnect: sseClient.disconnect,
  };

  return (
    <SSEContext.Provider value={contextValue}>
      {children}
      {/* Connection Status Indicator */}
      <SSEStatusIndicator />
    </SSEContext.Provider>
  );
}

function SSEStatusIndicator() {
  const context = useContext(SSEContext);
  if (!context) return null;

  const { isConnected, connectionState, reconnectAttempts } = context;

  // Only show indicator when there are connection issues
  if (isConnected && connectionState === 'connected') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2
        ${connectionState === 'connecting' 
          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
          : connectionState === 'error'
          ? 'bg-red-100 text-red-800 border border-red-200'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
        }
      `}>
        {/* Status Icon */}
        <div className={`
          w-2 h-2 rounded-full
          ${connectionState === 'connecting'
            ? 'bg-blue-500 animate-pulse'
            : connectionState === 'error'
            ? 'bg-red-500'
            : 'bg-gray-500'
          }
        `} />
        
        {/* Status Text */}
        <span>
          {connectionState === 'connecting'
            ? 'Connecting to real-time updates...'
            : connectionState === 'error'
            ? `Connection failed ${reconnectAttempts > 0 ? `(attempt ${reconnectAttempts})` : ''}`
            : 'Real-time updates disconnected'
          }
        </span>
      </div>
    </div>
  );
}

export function useSSEContext() {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
}

// Hook for components that need SSE functionality
export function useRealTimeUpdates() {
  const context = useSSEContext();

  return {
    ...context,
    // Convenience methods
    isRealTimeEnabled: context.isConnected,
    hasConnectionIssues: context.connectionState === 'error' || !context.isConnected,
  };
}