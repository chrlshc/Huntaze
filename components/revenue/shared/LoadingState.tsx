/**
 * LoadingState Component
 * 
 * Skeleton UI for loading states
 */

import React from 'react';

interface LoadingStateProps {
  variant?: 'card' | 'list' | 'chart' | 'table';
  count?: number;
}

export function LoadingState({ variant = 'card', count = 1 }: LoadingStateProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {items.map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        {items.map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
        ))}
      </div>
    );
  }

  return null;
}

/**
 * Spinner Component
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}
      ></div>
    </div>
  );
}
