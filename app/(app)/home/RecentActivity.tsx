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
  Clock
} from 'lucide-react';
import './recent-activity.css';
import { Button } from "@/components/ui/button";

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

// Mock data for now - will be replaced with real API call
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'subscriber',
    title: 'New subscriber',
    description: '@sarah_jones subscribed to your content',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    icon: 'user-plus',
    color: 'blue'
  },
  {
    id: '2',
    type: 'message',
    title: 'New message',
    description: 'You received 3 new messages',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    icon: 'message-square',
    color: 'purple'
  },
  {
    id: '3',
    type: 'revenue',
    title: 'Payment received',
    description: '$45.00 from subscription renewal',
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    icon: 'dollar-sign',
    color: 'green'
  },
  {
    id: '4',
    type: 'content',
    title: 'Content published',
    description: 'Your post "Summer vibes" is now live',
    timestamp: new Date(Date.now() - 4 * 3600000), // 4 hours ago
    icon: 'file-text',
    color: 'orange'
  },
  {
    id: '5',
    type: 'ai',
    title: 'AI suggestion',
    description: 'AI generated 5 message responses',
    timestamp: new Date(Date.now() - 6 * 3600000), // 6 hours ago
    icon: 'sparkles',
    color: 'purple'
  }
];

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setActivities(MOCK_ACTIVITIES);
      setIsLoading(false);
    }, 500);
  }, []);

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (isLoading) {
    return (
      <div className="recent-activity-section">
        <h2 className="recent-activity-title">Recent Activity</h2>
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
    );
  }

  if (activities.length === 0) {
    return (
      <div className="recent-activity-section">
        <h2 className="recent-activity-title">Recent Activity</h2>
        <div className="recent-activity-empty">
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity-section">
      <h2 className="recent-activity-title">Recent Activity</h2>
      
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
        <Button 
          variant="primary" 
          onClick={() => setShowAll(!showAll)}
          className="load-more-button"
        >
          {showAll ? 'Show less' : `Show ${activities.length - 5} more`}
        </Button>
      )}
    </div>
  );
}
