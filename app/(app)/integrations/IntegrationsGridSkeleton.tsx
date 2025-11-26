/**
 * Enhanced Integrations Grid Skeleton Component
 * 
 * **Feature: dashboard-shopify-migration, Phase 15: Content Pages Migration**
 * 
 * Provides enhanced skeleton loading state for the integrations grid with:
 * - Shopify design system styling
 * - Improved animations and visual feedback
 * - Better responsive behavior
 * - Accessibility enhancements
 * - Performance optimizations
 * 
 * Requirements: 15.1, 15.5
 * @see .kiro/specs/dashboard-shopify-migration/requirements.md
 */

'use client';

import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

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
      className={`integrations-container ${className}`}
      role="status"
      aria-label="Loading integrations"
    >
      <div className="integrations-header">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className={variant === 'grid' ? 'integrations-grid' : 'space-y-4'}>
        <SkeletonCard count={itemCount} />
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
