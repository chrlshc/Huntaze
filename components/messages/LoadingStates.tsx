/**
 * Loading States for Messages Interface
 * Skeleton loaders matching actual content dimensions
 */

import React from 'react';

export const FanListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-4" data-testid="fan-list-skeleton">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 rounded-lg animate-pulse"
        >
          {/* Avatar skeleton */}
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          
          {/* Timestamp skeleton */}
          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
};

export const MessageAreaSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full" data-testid="message-area-skeleton">
      {/* Header skeleton */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
      
      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {[...Array(5)].map((_, index) => {
          const width = 60 + (index * 13) % 40;

          return (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}
          >
            <div className={`max-w-[70%] space-y-2 ${index % 2 === 0 ? 'items-start' : 'items-end'}`}>
              <div className={`h-16 bg-gray-200 dark:bg-gray-700 rounded-lg ${index % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} style={{ width: `${width}%` }} />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
          );
        })}
      </div>
      
      {/* Input skeleton */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
};

export const ContextPanelSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6" data-testid="context-panel-skeleton">
      {/* Avatar and name skeleton */}
      <div className="flex flex-col items-center space-y-3 animate-pulse">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
      
      {/* Info section skeleton */}
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        ))}
      </div>
      
      {/* Notes section skeleton */}
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        {[...Array(2)].map((_, index) => (
          <div key={index} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        ))}
      </div>
      
      {/* Tags section skeleton */}
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const LoadingStates = {
  FanListSkeleton,
  MessageAreaSkeleton,
  ContextPanelSkeleton,
};

export default LoadingStates;
