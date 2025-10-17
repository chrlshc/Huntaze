'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, MessageSquare, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: 'revenue' | 'fans' | 'messages' | 'likes';
  sparkline?: number[];
  loading?: boolean;
  className?: string;
}

const iconMap = {
  revenue: DollarSign,
  fans: Users,
  messages: MessageSquare,
  likes: Heart,
};

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon = 'revenue',
  sparkline,
  loading = false,
  className,
}: KPICardProps) {
  const Icon = iconMap[icon];
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive && 'text-green-600 dark:text-green-400',
              isNegative && 'text-red-600 dark:text-red-400',
              !isPositive && !isNegative && 'text-gray-500'
            )}
          >
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        {loading ? (
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' && icon === 'revenue' && '$'}
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
      </div>

      {changeLabel && change !== undefined && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{changeLabel}</p>
      )}

      {sparkline && sparkline.length > 0 && (
        <div className="mt-4 h-12">
          <Sparkline data={sparkline} />
        </div>
      )}
    </motion.div>
  );
}

// Mini sparkline component
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <svg
      className="w-full h-full"
      viewBox={`0 0 ${data.length * 10} 40`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
        points={data
          .map((value, i) => {
            const x = i * 10;
            const y = 40 - ((value - min) / range) * 40;
            return `${x},${y}`;
          })
          .join(' ')}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" className="text-blue-500" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" className="text-blue-500" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#gradient)"
        points={`0,40 ${data
          .map((value, i) => {
            const x = i * 10;
            const y = 40 - ((value - min) / range) * 40;
            return `${x},${y}`;
          })
          .join(' ')} ${(data.length - 1) * 10},40`}
      />
    </svg>
  );
}