/**
 * SkeletonScreen Component
 * 
 * Displays loading placeholders with pulsating animation while content is being fetched.
 * Provides variants for different layout types (dashboard, form, card, list).
 * 
 * Part of the Linear UI Performance Refactor
 * Design Reference: linear-ui-performance-refactor/design.md
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';

export type SkeletonVariant = 'dashboard' | 'form' | 'card' | 'list';

export interface SkeletonScreenProps {
  /**
   * Layout variant to display
   * - 'dashboard': Full dashboard layout with header, sidebar, and content areas
   * - 'form': Form layout with input field placeholders
   * - 'card': Card grid layout
   * - 'list': Vertical list layout
   */
  variant: SkeletonVariant;
  
  /**
   * Number of skeleton items to render (for card and list variants)
   * @default 3
   */
  count?: number;
  
  /**
   * Whether to animate the skeleton with pulsating effect
   * @default true
   */
  animate?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Base skeleton element with pulsating animation
 */
const SkeletonElement: React.FC<{
  className?: string;
  animate?: boolean;
  'data-testid'?: string;
}> = ({ className = '', animate = true, 'data-testid': testId }) => {
  const animationClass = animate ? 'skeleton-pulse' : '';
  
  return (
    <div
      className={`bg-[var(--color-bg-surface)] rounded-md ${animationClass} ${className}`}
      data-testid={testId}
      data-skeleton="true"
      data-animated={animate}
    />
  );
};

/**
 * Dashboard skeleton variant
 */
const DashboardSkeleton: React.FC<{ animate?: boolean }> = ({ animate = true }) => {
  return (
    <div className="space-y-6" data-testid="skeleton-dashboard">
      {/* Header */}
      <div className="space-y-4">
        <SkeletonElement className="h-10 w-64" animate={animate} data-testid="skeleton-header" />
        <SkeletonElement className="h-6 w-96" animate={animate} />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonElement className="h-32" animate={animate} />
        <SkeletonElement className="h-32" animate={animate} />
        <SkeletonElement className="h-32" animate={animate} />
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <SkeletonElement className="h-8 w-48" animate={animate} />
          <SkeletonElement className="h-64" animate={animate} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <SkeletonElement className="h-8 w-32" animate={animate} />
          <SkeletonElement className="h-48" animate={animate} />
        </div>
      </div>
    </div>
  );
};

/**
 * Form skeleton variant
 */
const FormSkeleton: React.FC<{ animate?: boolean }> = ({ animate = true }) => {
  return (
    <div className="space-y-6 max-w-2xl" data-testid="skeleton-form">
      {/* Form Title */}
      <SkeletonElement className="h-8 w-48" animate={animate} data-testid="skeleton-form-title" />
      
      {/* Form Fields */}
      <div className="space-y-4">
        {/* Field 1 */}
        <div className="space-y-2">
          <SkeletonElement className="h-5 w-32" animate={animate} />
          <SkeletonElement className="h-10 w-full" animate={animate} data-testid="skeleton-input" />
        </div>
        
        {/* Field 2 */}
        <div className="space-y-2">
          <SkeletonElement className="h-5 w-40" animate={animate} />
          <SkeletonElement className="h-10 w-full" animate={animate} data-testid="skeleton-input" />
        </div>
        
        {/* Field 3 */}
        <div className="space-y-2">
          <SkeletonElement className="h-5 w-36" animate={animate} />
          <SkeletonElement className="h-24 w-full" animate={animate} />
        </div>
        
        {/* Submit Button */}
        <SkeletonElement className="h-10 w-32" animate={animate} data-testid="skeleton-button" />
      </div>
    </div>
  );
};

/**
 * Card skeleton variant
 */
const CardSkeleton: React.FC<{ count?: number; animate?: boolean }> = ({ 
  count = 3, 
  animate = true 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="skeleton-card">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-4" data-testid={`skeleton-card-item-${index}`}>
          <SkeletonElement className="h-48 w-full" animate={animate} />
          <SkeletonElement className="h-6 w-3/4" animate={animate} />
          <SkeletonElement className="h-4 w-full" animate={animate} />
          <SkeletonElement className="h-4 w-5/6" animate={animate} />
        </div>
      ))}
    </div>
  );
};

/**
 * List skeleton variant
 */
const ListSkeleton: React.FC<{ count?: number; animate?: boolean }> = ({ 
  count = 3, 
  animate = true 
}) => {
  return (
    <div className="space-y-4" data-testid="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="flex items-center space-x-4 p-4 border border-[var(--color-border-subtle)] rounded-md"
          data-testid={`skeleton-list-item-${index}`}
        >
          <SkeletonElement className="h-12 w-12 rounded-full flex-shrink-0" animate={animate} />
          <div className="flex-1 space-y-2">
            <SkeletonElement className="h-5 w-3/4" animate={animate} />
            <SkeletonElement className="h-4 w-1/2" animate={animate} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonScreen component that renders different skeleton layouts
 * based on the variant prop.
 * 
 * @example
 * ```tsx
 * // Dashboard loading state
 * {isLoading ? (
 *   <SkeletonScreen variant="dashboard" />
 * ) : (
 *   <DashboardContent />
 * )}
 * ```
 * 
 * @example
 * ```tsx
 * // Form loading state
 * {isLoading ? (
 *   <SkeletonScreen variant="form" animate={true} />
 * ) : (
 *   <FormContent />
 * )}
 * ```
 * 
 * @example
 * ```tsx
 * // Card grid with custom count
 * {isLoading ? (
 *   <SkeletonScreen variant="card" count={6} />
 * ) : (
 *   <CardGrid items={items} />
 * )}
 * ```
 */
export const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  variant,
  count = 3,
  animate = true,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'dashboard':
        return <DashboardSkeleton animate={animate} />;
      case 'form':
        return <FormSkeleton animate={animate} />;
      case 'card':
        return <CardSkeleton count={count} animate={animate} />;
      case 'list':
        return <ListSkeleton count={count} animate={animate} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`skeleton-screen ${className}`}
      data-testid="skeleton-screen"
      data-variant={variant}
      data-loading="true"
    >
      {renderSkeleton()}
    </div>
  );
};

/**
 * Default export for convenience
 */
export default SkeletonScreen;
