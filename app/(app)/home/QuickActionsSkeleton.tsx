/**
 * Enhanced Quick Actions Skeleton Component
 * 
 * **Feature: beta-launch-ui-system, Phase 7: Loading States & Responsive Design**
 * 
 * Provides enhanced skeleton loading state for the quick actions section with:
 * - Improved animations and visual feedback
 * - Better responsive behavior
 * - Accessibility enhancements
 * - Performance optimizations
 * 
 * Requirements: 10.1, 10.2, 10.3
 * @see .kiro/specs/beta-launch-ui-system/requirements.md
 */

'use client';

import { Skeleton } from '@/src/components/ui/skeleton';

interface QuickActionsSkeletonProps {
  className?: string;
  actionCount?: number;
}

export function QuickActionsSkeleton({ 
  className = '',
  actionCount = 6 
}: QuickActionsSkeletonProps = {}) {
  return (
    <section 
      className={`quick-actions-section skeleton-fade-in skeleton-optimized ${className}`}
      role="status"
      aria-label="Loading quick actions"
    >
      <Skeleton variant="text" className="w-36 h-6 mb-6" />
      
      <div className="quick-actions-grid skeleton-grid-mobile">
        {Array.from({ length: actionCount }, (_, index) => (
          <div 
            key={index} 
            className="quick-action-button skeleton skeleton-card-mobile"
            style={{
              animationDelay: `${index * 150}ms` // Stagger animation
            }}
          >
            <div className="quick-action-icon">
              <Skeleton variant="avatar" className="w-6 h-6" />
            </div>
            <div className="quick-action-content">
              <Skeleton variant="text" className="w-20 h-4 mb-1" />
              <Skeleton variant="text" className="w-32 h-3 skeleton-text-mobile" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Screen reader announcement */}
      <span className="sr-only" aria-live="polite">
        Loading {actionCount} quick action buttons...
      </span>
    </section>
  );
}

// Horizontal variant for different layouts
export function HorizontalQuickActionsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-4 overflow-x-auto pb-2 ${className}`}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex-shrink-0 flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
          <Skeleton variant="avatar" className="w-6 h-6" />
          <Skeleton variant="text" className="w-20 h-4" />
        </div>
      ))}
    </div>
  );
}
