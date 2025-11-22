/**
 * Enhanced Integrations Grid Skeleton Component
 * 
 * **Feature: beta-launch-ui-system, Phase 7: Loading States & Responsive Design**
 * 
 * Provides enhanced skeleton loading state for the integrations grid with:
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

interface IntegrationsGridSkeletonProps {
  className?: string;
  itemCount?: number;
  variant?: 'grid' | 'list';
}

export function IntegrationsGridSkeleton({ 
  className = '',
  itemCount = 4,
  variant = 'grid'
}: IntegrationsGridSkeletonProps = {}) {
  return (
    <div 
      className={`integrations-container skeleton-fade-in ${className}`}
      role="status"
      aria-label="Loading integrations"
    >
      <div className="integrations-header">
        <Skeleton variant="text" className="w-48 h-9" />
        <Skeleton variant="text" className="w-96 h-5 mt-2" />
      </div>

      <div className={variant === 'grid' ? 'integrations-grid' : 'space-y-4'}>
        {Array.from({ length: itemCount }, (_, index) => (
          <div 
            key={index} 
            className={`integration-card skeleton skeleton-optimized ${variant === 'list' ? 'flex items-center space-x-4' : ''}`}
            style={{
              animationDelay: `${index * 120}ms` // Stagger animation
            }}
          >
            {variant === 'grid' ? (
              <>
                <div className="integration-card-header">
                  <div className="integration-icon-wrapper">
                    <Skeleton variant="avatar" className="w-12 h-12 rounded-xl" />
                  </div>
                  <Skeleton variant="text" className="w-20 h-6 rounded-xl" />
                </div>
                
                <div className="integration-card-body">
                  <Skeleton variant="text" className="w-28 h-6 mb-2" />
                  <Skeleton variant="text" lines={2} className="h-4" />
                </div>

                <div className="integration-card-footer">
                  <Skeleton variant="button" className="w-full h-10" />
                </div>
              </>
            ) : (
              <>
                <Skeleton variant="avatar" className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-32 h-5" />
                  <Skeleton variant="text" className="w-48 h-3" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton variant="text" className="w-16 h-6 rounded-full" />
                  <Skeleton variant="button" className="w-20 h-8" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Screen reader announcement */}
      <span className="sr-only" aria-live="polite">
        Loading {itemCount} integration cards...
      </span>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactIntegrationsGridSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="integration-card p-3 text-center">
          <Skeleton variant="avatar" className="w-8 h-8 mx-auto mb-2" />
          <Skeleton variant="text" className="w-16 h-3 mx-auto" />
        </div>
      ))}
    </div>
  );
}
