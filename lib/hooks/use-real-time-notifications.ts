import { useEffect, useCallback, useState } from 'react';
import { useSSEContext } from '@/lib/providers/sse-provider';
import { ContentCreationEvent } from '@/app/api/content-creation/events/route';

interface NotificationPreferences {
  assetEvents: boolean;
  campaignEvents: boolean;
  scheduleEvents: boolean;
  aiEvents: boolean;
  complianceEvents: boolean;
  syncEvents: boolean;
}

interface RealTimeNotification {
  id: string;
  type: ContentCreationEvent['type'];
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export function useRealTimeNotifications(preferences: Partial<NotificationPreferences> = {}) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const defaultPreferences: NotificationPreferences = {
    assetEvents: true,
    campaignEvents: true,
    scheduleEvents: true,
    aiEvents: true,
    complianceEvents: true,
    syncEvents: true,
    ...preferences,
  };

  // Convert SSE events to notifications
  const createNotification = useCallback((event: ContentCreationEvent): RealTimeNotification | null => {
    let notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'read'> | null = null;

    switch (event.type) {
      case 'asset_uploaded':
        if (!defaultPreferences.assetEvents) return null;
        notification = {
          type: event.type,
          title: 'Asset Uploaded',
          message: `"${event.data.title}" has been uploaded successfully`,
          priority: 'medium',
          actionable: true,
          action: {
            label: 'View Asset',
            handler: () => {
              // Navigate to asset or open asset modal
              console.log('Navigate to asset:', event.data.id);
            },
          },
        };
        break;

      case 'asset_processed':
        if (!defaultPreferences.assetEvents) return null;
        notification = {
          type: event.type,
          title: event.data.status === 'success' ? 'Asset Processed' : 'Processing Failed',
          message: event.data.status === 'success' 
            ? 'Your asset has been processed and is ready to use'
            : 'Asset processing failed. Please try uploading again.',
          priority: event.data.status === 'success' ? 'low' : 'high',
          actionable: event.data.status === 'failed',
          action: event.data.status === 'failed' ? {
            label: 'Retry',
            handler: () => {
              console.log('Retry processing:', event.data.assetId);
            },
          } : undefined,
        };
        break;

      case 'compliance_checked':
        if (!defaultPreferences.complianceEvents) return null;
        const isApproved = event.data.compliance.status === 'approved';
        notification = {
          type: event.type,
          title: isApproved ? 'Content Approved' : 'Content Review Required',
          message: isApproved 
            ? 'Your content passed compliance review'
            : 'Your content needs review before publishing',
          priority: isApproved ? 'low' : 'high',
          actionable: !isApproved,
          action: !isApproved ? {
            label: 'Review',
            handler: () => {
              console.log('Review compliance:', event.data.assetId);
            },
          } : undefined,
        };
        break;

      case 'campaign_created':
        if (!defaultPreferences.campaignEvents) return null;
        notification = {
          type: event.type,
          title: 'Campaign Created',
          message: `Campaign "${event.data.name}" has been created`,
          priority: 'medium',
          actionable: true,
          action: {
            label: 'View Campaign',
            handler: () => {
              console.log('Navigate to campaign:', event.data.id);
            },
          },
        };
        break;

      case 'campaign_metrics':
        if (!defaultPreferences.campaignEvents) return null;
        // Only notify for significant revenue changes
        if (event.data.metrics.revenue < 50) return null;
        notification = {
          type: event.type,
          title: 'Campaign Performance Update',
          message: `Revenue: $${event.data.metrics.revenue} | Conversions: ${event.data.metrics.conversions || 0}`,
          priority: 'low',
          actionable: true,
          action: {
            label: 'View Details',
            handler: () => {
              console.log('View campaign metrics:', event.data.campaignId);
            },
          },
        };
        break;

      case 'schedule_updated':
        if (!defaultPreferences.scheduleEvents) return null;
        notification = {
          type: event.type,
          title: 'Schedule Updated',
          message: 'Your content schedule has been updated',
          priority: 'low',
          actionable: true,
          action: {
            label: 'View Schedule',
            handler: () => {
              console.log('Navigate to schedule');
            },
          },
        };
        break;

      case 'ai_insight':
        if (!defaultPreferences.aiEvents) return null;
        notification = {
          type: event.type,
          title: 'New AI Insight',
          message: event.data.title || 'AI has generated new insights for your content',
          priority: 'medium',
          actionable: true,
          action: {
            label: 'View Insight',
            handler: () => {
              console.log('View AI insight:', event.data);
            },
          },
        };
        break;

      case 'ai_recommendation':
        if (!defaultPreferences.aiEvents) return null;
        notification = {
          type: event.type,
          title: 'AI Recommendation',
          message: event.data.title || 'AI has new recommendations for you',
          priority: 'medium',
          actionable: true,
          action: {
            label: 'View Recommendation',
            handler: () => {
              console.log('View AI recommendation:', event.data);
            },
          },
        };
        break;

      case 'sync_conflict':
        if (!defaultPreferences.syncEvents) return null;
        notification = {
          type: event.type,
          title: 'Data Conflict Detected',
          message: 'Some of your changes conflict with server data',
          priority: 'high',
          actionable: true,
          action: {
            label: 'Resolve Conflict',
            handler: () => {
              console.log('Open conflict resolution:', event.data);
            },
          },
        };
        break;

      default:
        return null;
    }

    if (!notification) return null;

    return {
      id: event.id,
      timestamp: new Date(event.timestamp),
      read: false,
      ...notification,
    };
  }, [defaultPreferences]);

  // Add notification
  const addNotification = useCallback((event: ContentCreationEvent) => {
    const notification = createNotification(event);
    if (!notification) return;

    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      
      // Add new notification at the beginning
      const updated = [notification, ...prev];
      
      // Keep only last 50 notifications
      return updated.slice(0, 50);
    });

    setUnreadCount(prev => prev + 1);
  }, [createNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const filtered = prev.filter(n => n.id !== notificationId);
      
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      
      return filtered;
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: ContentCreationEvent['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Get high priority notifications
  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(n => n.priority === 'high' && !n.read);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getNotificationsByType,
    getUnreadNotifications,
    getHighPriorityNotifications,
    hasUnread: unreadCount > 0,
    hasHighPriority: getHighPriorityNotifications().length > 0,
  };
}