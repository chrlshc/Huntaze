'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
  trend?: number[];
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  trend,
  loading = false,
}: MetricCardProps) {
  const isPositive = changeType === 'increase';

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {value}
          </p>
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                'flex items-center space-x-1 text-sm font-medium',
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              vs last period
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          
          {trend && trend.length > 0 && (
            <div className="flex items-end space-x-0.5 h-8">
              {trend.map((value, index) => (
                <div
                  key={index}
                  className="w-1 bg-primary-200 dark:bg-primary-800 rounded-t"
                  style={{
                    height: `${(value / Math.max(...trend)) * 100}%`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
