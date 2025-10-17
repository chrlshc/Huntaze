'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getFanAvatar, type FanGender } from '@/lib/fan-avatars';
import { 
  DollarSign, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Fan {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  gender?: FanGender;
  totalSpent: number;
  lastMessage?: Date;
  lastPurchase?: Date;
  subscriptionMonths: number;
  messageCount: number;
  status: 'online' | 'offline' | 'away';
  tier: 'vip' | 'regular' | 'new' | 'at-risk';
  aiScore?: number; // AI prediction score (0-100)
  predictedAction?: {
    type: 'purchase' | 'churn' | 'tip';
    probability: number;
    timeframe: string;
  };
}

interface FanCardProps {
  fan: Fan;
  onClick?: () => void;
  selected?: boolean;
  showAIInsights?: boolean;
  className?: string;
}

export function FanCard({ 
  fan, 
  onClick, 
  selected = false,
  showAIInsights = true,
  className 
}: FanCardProps) {
  const tierIcons = {
    vip: <Crown className="h-4 w-4 text-yellow-500" />,
    regular: null,
    new: <Sparkles className="h-4 w-4 text-blue-500" />,
    'at-risk': <AlertCircle className="h-4 w-4 text-red-500" />
  };

  const tierColors = {
    vip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    regular: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'at-risk': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border cursor-pointer transition-all',
        selected 
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              {(() => {
                const fallback = getFanAvatar(
                  fan.id || fan.username || fan.displayName,
                  fan.gender === 'female' ? 'female' : 'male'
                );
                const source = fan.avatar ?? fallback;
                if (source) {
                  return <img src={source} alt={fan.displayName} className="object-cover" style={{ filter: 'saturate(1.35) contrast(1.05)' }} />;
                }
                return (
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-full w-full flex items-center justify-center text-white font-semibold">
                    {fan.displayName[0].toUpperCase()}
                  </div>
                );
              })()}
            </Avatar>
            <div 
              className={cn(
                'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800',
                statusColors[fan.status]
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {fan.displayName}
              </h4>
              {tierIcons[fan.tier]}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              @{fan.username}
            </p>
          </div>
        </div>
        
        <Badge variant="secondary" className={cn('text-xs', tierColors[fan.tier])}>
          {fan.tier}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              ${fan.totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Total spent</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {fan.messageCount}
            </p>
            <p className="text-xs text-gray-500">Messages</p>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            Last active: {fan.lastMessage ? formatTimeAgo(fan.lastMessage) : 'Never'}
          </span>
        </div>
        <span>{fan.subscriptionMonths} months</span>
      </div>

      {/* AI Insights */}
      {showAIInsights && fan.aiScore && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              AI Score
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {fan.aiScore}/100
              </span>
            </div>
          </div>
          
          {fan.predictedAction && (
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Predicted: {fan.predictedAction.type}
                </span>
                <Badge variant="outline" className="text-xs">
                  {fan.predictedAction.probability}% likely
                </Badge>
              </div>
              <p className="text-gray-500">
                Within {fan.predictedAction.timeframe}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
