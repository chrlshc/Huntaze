/**
 * CenteredContainer Component
 * 
 * A layout container component that provides max-width constraints,
 * horizontal centering, and consistent padding for content.
 * 
 * Part of the Linear UI Performance Refactor
 * Design Reference: linear-ui-performance-refactor/design.md
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React from 'react';

export interface CenteredContainerProps {
  /**
   * Maximum width variant
   * - 'sm': 75rem (1200px)
   * - 'lg': 80rem (1280px)
   * @default 'lg'
   */
  maxWidth?: 'sm' | 'lg';
  
  /**
   * Internal padding in pixels
   * Should be a multiple of 4 (4px grid system)
   * @default 24
   */
  padding?: number;
  
  /**
   * Content to be rendered inside the container
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Additional HTML attributes
   */
  [key: string]: any;
}

/**
 * CenteredContainer provides a max-width constrained, horizontally centered
 * container for content. It eliminates "dead zones" on large screens by
 * applying appropriate max-width constraints and automatic centering.
 * 
 * @example
 * ```tsx
 * <CenteredContainer maxWidth="lg" padding={24}>
 *   <h1>Dashboard</h1>
 *   <div>Content goes here</div>
 * </CenteredContainer>
 * ```
 * 
 * @example
 * ```tsx
 * <CenteredContainer maxWidth="sm" className="bg-surface">
 *   <form>Form content</form>
 * </CenteredContainer>
 * ```
 */
export const CenteredContainer: React.FC<CenteredContainerProps> = ({
  maxWidth = 'lg',
  padding,
  children,
  className = '',
  ...props
}) => {
  // Determine max-width class based on variant
  // sm: 75rem (1200px), lg: 80rem (1280px)
  const maxWidthClass = maxWidth === 'sm' ? 'max-w-[75rem]' : 'max-w-[80rem]';
  
  // Determine padding class
  // Default to 24px if not specified
  const paddingClass = padding ? `p-[${padding}px]` : 'p-[24px]';
  
  return (
    <div 
      className={`${maxWidthClass} mx-auto ${paddingClass} ${className}`}
      data-testid="centered-container"
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Default export for convenience
 */
export default CenteredContainer;
