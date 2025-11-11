'use client';

import { motion } from 'framer-motion';
import { UserPlus, FileText, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * ActivityFeed Component
 * 
 * Displays recent activity with stagger animation (60ms delay).
 * Uses variants for hidden/show states.
 * 
 * Requirements: 1.4
 */

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type?: 'fan' | 'post' | 'payment';
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  maxItems?: number;
}

const defaultActivities: ActivityItem[] = [
  {
    id: 1,
    text: 'New fan subscribed',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: 'fan',
  },
  {
    id: 2,
    text: 'Posted new content',
    time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'post',
  },
  {
    id: 3,
    text: 'Received payment of $25',
    time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: 'payment',
  },
  {
    id: 4,
    text: 'New fan subscribed',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'fan',
  },
  {
    id: 5,
    text: 'Posted new content',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: 'post',
  },
];

const containerVariants = {
  hidden: {},
  show: {}
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

function getActivityIcon(type?: string) {
  switch (type) {
    case 'fan':
      return <UserPlus className="w-4 h-4" />;
    case 'post':
      return <FileText className="w-4 h-4" />;
    case 'payment':
      return <DollarSign className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

function getActivityColor(type?: string) {
  switch (type) {
    case 'fan':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'post':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'payment':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  }
}

export default function ActivityFeed({
  activities = defaultActivities,
  maxItems = 10,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-1">
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {displayedActivities.map((activity) => (
          <motion.li
            key={activity.id}
            variants={itemVariants}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-theme-border/30 transition-colors"
          >
            {/* Icon */}
            <div
              className={`p-2 rounded-lg flex-shrink-0 ${getActivityColor(
                activity.type
              )}`}
            >
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-theme-text">{activity.text}</p>
              <p className="text-xs text-theme-muted mt-1">
                {formatDistanceToNow(new Date(activity.time), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-theme-muted text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
}
