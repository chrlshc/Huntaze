/**
 * RecentActivity Component
 * Requirements: 1.5
 * 
 * Displays a feed of recent important activities across the platform.
 * Activity types: subscribers, messages, content, revenue, AI
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlus, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Sparkles,
  Clock,
  RefreshCw,
} from 'lucide-react';
import './recent-activity.css';
import { Button } from "@/components/ui/button";
import { EmptyState } from '@/components/ui/EmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { ActivityItem as DashboardActivity, DashboardData } from '@/hooks/useDashboard';

interface Activity {
  id: string;
  type: 'subscriber' | 'message' | 'content' | 'revenue' | 'ai';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

/**
 * Format timestamp in a human-readable format
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get icon component for activity type
 */
function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'subscriber':
      return UserPlus;
    case 'message':
      return MessageSquare;
    case 'content':
      return FileText;
    case 'revenue':
      return DollarSign;
    case 'ai':
      return Sparkles;
    default:
      return Clock;
  }
}

/**
 * Get color class for activity type
 */
function getActivityColor(type: Activity['type']): string {
  switch (type) {
    case 'subscriber':
      return 'blue';
    case 'message':
      return 'purple';
    case 'content':
      return 'orange';
    case 'revenue':
      return 'green';
    case 'ai':
      return 'purple';
    default:
      return 'gray';
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await internalApiFetch<{ success: boolean; data?: DashboardData }>(
          '/api/dashboard?range=30d&include=content,marketing',
        );
        const dashboardActivities = response?.data?.recentActivity ?? [];
        const mapped = dashboardActivities.map((activity) => {
          const typeMap: Record<DashboardActivity['type'], Activity['type']> = {
            content_published: 'content',
            campaign_sent: 'revenue',
            fan_subscribed: 'subscriber',
            message_received: 'message',
          };
          return {
            id: activity.id,
            type: typeMap[activity.type] ?? 'content',
            title: activity.title,
            description: activity.meta?.description || activity.title,
            timestamp: new Date(activity.createdAt),
            icon: activity.source,
            color: activity.source,
          };
        });

        setActivities(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity');
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (isLoading) {
    return (
      <div className="recent-activity-section">
        <div className="recent-activity-card">
          <div className="recent-activity-header">
            <h2 className="recent-activity-title">Recent Activity</h2>
          </div>
          <div className="recent-activity-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="activity-item activity-item-skeleton">
                <div className="activity-icon-skeleton skeleton"></div>
                <div className="activity-content-skeleton">
                  <div className="skeleton-text skeleton-text-base" style={{ width: '60%' }}></div>
                  <div className="skeleton-text skeleton-text-sm" style={{ width: '80%', marginTop: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recent-activity-section">
        <div className="recent-activity-card">
          <div className="recent-activity-header">
            <h2 className="recent-activity-title">Recent Activity</h2>
          </div>
          <EmptyState
            variant="error"
            size="sm"
            title="Failed to load activity"
            description={error}
            secondaryAction={{ label: 'Retry', onClick: () => window.location.reload(), icon: RefreshCw }}
          />
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="recent-activity-section">
        <div className="recent-activity-card">
          <div className="recent-activity-header">
            <h2 className="recent-activity-title">Recent Activity</h2>
          </div>
          <EmptyState
            variant="no-data"
            size="sm"
            title="No recent activity"
            description="Connect your platforms to start seeing messages, subscribers, and revenue events here."
            action={{ label: 'Connect platforms', onClick: () => (window.location.href = '/integrations') }}
            secondaryAction={{ label: 'Retry', onClick: () => window.location.reload(), icon: RefreshCw }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity-section">
      <div className="recent-activity-card">
        <div className="recent-activity-header">
          <h2 className="recent-activity-title">Recent Activity</h2>
        </div>
        
        <div className="recent-activity-list">
          {displayedActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon activity-icon-${color}`}>
                  <Icon className="icon" />
                </div>
                
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-title">{activity.title}</span>
                    <span className="activity-timestamp">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="activity-description">{activity.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {activities.length > 5 && (
          <div className="recent-activity-footer">
            <Button 
              variant="secondary" 
              onClick={() => setShowAll(!showAll)}
              className="load-more-button"
            >
              {showAll ? 'Show less' : `Show ${activities.length - 5} more`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
