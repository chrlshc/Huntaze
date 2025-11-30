/**
 * Enhanced Stats Grid Skeleton Component
 * 
 * **Feature: beta-launch-ui-system, Phase 7: Loading States & Responsive Design**
 * 
 * Provides enhanced skeleton loading state for the stats grid with:
 * - Improved animations and visual feedback
 * - Better responsive behavior
 * - Accessibility enhancements
 * - Performance optimizations
 */

'use client';

import { Skeleton } from '@/src/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface StatsGridSkeletonProps {
  className?: string;
  itemCount?: number;
}

export function StatsGridSkeleton({ 
  className = '',
  itemCount = 4 
}: StatsGridSkeletonProps = {}) {
  return (
    <div 
      className={`stats-grid skeleton-fade-in ${className}`}
      role="status"
      aria-label="Loading statistics"
    >
      {Array.from({ length: itemCount }, (_, index) => (
        <div 
          key={index} 
          className="stat-card skeleton skeleton-optimized"
          style={{
            animationDelay: `${index * 100}ms` // Stagger animation
          }}
        >
          <div className="-header">
            <Skeleton variant="text" className="w-3/5 h-4" />
            <Skeleton variant="avatar" className="w-4 h-4" />
          </div>
          <Skeleton variant="text" className="w-1/2 h-8 mt-3" />
          <Skeleton variant="text" className="w-2/3 h-4 mt-2" />
          <div className="flex items-center mt-2 space-x-2">
            <Skeleton variant="avatar" className="w-4 h-4" />
            <Skeleton variant="text" className="w-16 h-3" />
          </div>
        </div>
      ))}
      
      {/* Screen reader announcement */}
      <span className="sr-only" aria-live="polite">
        Loading {itemCount} statistics cards...
      </span>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactStatsGridSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="p-4">
          <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}
