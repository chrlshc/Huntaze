/**
 * Loading Skeleton Components
 * 
 * Enhanced skeleton components for dashboard loading states.
 * Provides variants for cards, lists, charts, and metrics.
 * 
 * Feature: dashboard-ux-overhaul
 * Validates: Requirements 7.5
 */

import React from 'react';

export type SkeletonVariant = 
  | 'card' 
  | 'list' 
  | 'chart' 
  | 'metric' 
  | 'table' 
  | 'profile'
  | 'message';

export interface LoadingSkeletonProps {
  /** Type of skeleton to display */
  variant: SkeletonVariant;
  /** Number of items to render */
  count?: number;
  /** Whether to animate */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Base skeleton element with pulse animation
 */
const SkeletonPulse: React.FC<{
  className?: string;
  animate?: boolean;
  testId?: string;
}> = ({ className = '', animate = true, testId }) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    data-testid={testId}
    data-skeleton="true"
  />
);

/**
 * Card skeleton - for content cards
 */
export const CardSkeleton: React.FC<{ count?: number; animate?: boolean }> = ({
  count = 1,
  animate = true,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="skeleton-cards">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-[var(--bg-surface)] border border-[var(--color-border-light)] rounded-lg p-4 space-y-3"
        data-testid={`skeleton-card-${i}`}
      >
        <SkeletonPulse className="h-40 w-full rounded-md" animate={animate} />
        <SkeletonPulse className="h-5 w-3/4" animate={animate} />
        <SkeletonPulse className="h-4 w-full" animate={animate} />
        <SkeletonPulse className="h-4 w-2/3" animate={animate} />
      </div>
    ))}
  </div>
);


/**
 * List skeleton - for list items
 */
export const ListSkeleton: React.FC<{ count?: number; animate?: boolean }> = ({
  count = 5,
  animate = true,
}) => (
  <div className="space-y-3" data-testid="skeleton-list">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--color-border-light)] rounded-lg"
        data-testid={`skeleton-list-item-${i}`}
      >
        <SkeletonPulse className="h-12 w-12 rounded-full flex-shrink-0" animate={animate} />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-1/3" animate={animate} />
          <SkeletonPulse className="h-3 w-2/3" animate={animate} />
        </div>
        <SkeletonPulse className="h-8 w-20 rounded" animate={animate} />
      </div>
    ))}
  </div>
);

/**
 * Chart skeleton - for chart/graph areas
 */
export const ChartSkeleton: React.FC<{ animate?: boolean; height?: string }> = ({
  animate = true,
  height = 'h-64',
}) => (
  <div
    className={`bg-[var(--bg-surface)] border border-[var(--color-border-light)] rounded-lg p-4 ${height}`}
    data-testid="skeleton-chart"
  >
    <div className="flex items-end justify-between h-full gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className="flex-1 rounded-t"
          animate={animate}
          testId={`skeleton-chart-bar-${i}`}
        />
      ))}
    </div>
  </div>
);

/**
 * Metric skeleton - for stat cards
 */
export const MetricSkeleton: React.FC<{ count?: number; animate?: boolean }> = ({
  count = 4,
  animate = true,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="skeleton-metrics">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-[var(--bg-surface)] border border-[var(--color-border-light)] rounded-lg p-4"
        data-testid={`skeleton-metric-${i}`}
      >
        <SkeletonPulse className="h-4 w-20 mb-2" animate={animate} />
        <SkeletonPulse className="h-8 w-24 mb-1" animate={animate} />
        <SkeletonPulse className="h-3 w-16" animate={animate} />
      </div>
    ))}
  </div>
);

/**
 * Table skeleton - for data tables
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number; animate?: boolean }> = ({
  rows = 5,
  cols = 4,
  animate = true,
}) => (
  <div className="bg-[var(--bg-surface)] border border-[var(--color-border-light)] rounded-lg overflow-hidden" data-testid="skeleton-table">
    {/* Header */}
    <div className="flex gap-4 p-4 border-b border-[var(--color-border-light)] bg-gray-50 dark:bg-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonPulse key={i} className="h-4 flex-1" animate={animate} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex gap-4 p-4 border-b border-[var(--color-border-light)] last:border-b-0"
        data-testid={`skeleton-table-row-${rowIndex}`}
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <SkeletonPulse key={colIndex} className="h-4 flex-1" animate={animate} />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Profile skeleton - for user profiles
 */
export const ProfileSkeleton: React.FC<{ animate?: boolean }> = ({ animate = true }) => (
  <div className="flex items-center gap-4" data-testid="skeleton-profile">
    <SkeletonPulse className="h-16 w-16 rounded-full" animate={animate} />
    <div className="space-y-2">
      <SkeletonPulse className="h-5 w-32" animate={animate} />
      <SkeletonPulse className="h-4 w-48" animate={animate} />
      <SkeletonPulse className="h-3 w-24" animate={animate} />
    </div>
  </div>
);

/**
 * Message skeleton - for chat messages
 */
export const MessageSkeleton: React.FC<{ count?: number; animate?: boolean }> = ({
  count = 3,
  animate = true,
}) => (
  <div className="space-y-4" data-testid="skeleton-messages">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
        data-testid={`skeleton-message-${i}`}
      >
        <SkeletonPulse className="h-8 w-8 rounded-full flex-shrink-0" animate={animate} />
        <div className={`space-y-1 ${i % 2 === 0 ? '' : 'items-end'}`}>
          <SkeletonPulse className="h-4 w-20" animate={animate} />
          <SkeletonPulse className={`h-16 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-lg`} animate={animate} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Main LoadingSkeleton component that renders different skeleton layouts
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant,
  count = 3,
  animate = true,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton count={count} animate={animate} />;
      case 'list':
        return <ListSkeleton count={count} animate={animate} />;
      case 'chart':
        return <ChartSkeleton animate={animate} />;
      case 'metric':
        return <MetricSkeleton count={count} animate={animate} />;
      case 'table':
        return <TableSkeleton rows={count} animate={animate} />;
      case 'profile':
        return <ProfileSkeleton animate={animate} />;
      case 'message':
        return <MessageSkeleton count={count} animate={animate} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`loading-skeleton ${className}`}
      data-testid="loading-skeleton"
      data-variant={variant}
      data-loading="true"
    >
      {renderSkeleton()}
    </div>
  );
};

export default LoadingSkeleton;
