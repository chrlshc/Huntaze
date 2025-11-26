/**
 * SkeletonCard Component
 * 
 * Displays a loading placeholder with shimmer animation for card-based content.
 * Used during data fetching to prevent layout shift and improve perceived performance.
 * 
 * Part of Phase 15: Content Pages Migration & Performance Optimization
 * Design Reference: dashboard-shopify-migration/design.md
 * Validates: Requirements 15.1, 15.5
 */

import React from 'react';

export interface SkeletonCardProps {
  /**
   * Number of skeleton cards to render
   * @default 1
   */
  count?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SkeletonCard component that renders loading placeholders with shimmer effect
 * 
 * @example
 * ```tsx
 * // Single skeleton card
 * {isLoading ? <SkeletonCard /> : <ContentCard data={data} />}
 * ```
 * 
 * @example
 * ```tsx
 * // Multiple skeleton cards
 * {isLoading ? <SkeletonCard count={3} /> : content.map(item => <Card key={item.id} {...item} />)}
 * ```
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  count = 1,
  className = '',
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)] ${className}`}
          data-testid={`skeleton-card-${index}`}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
          
          {/* Body */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
          </div>
          
          {/* Footer */}
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full" />
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;
