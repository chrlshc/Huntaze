/**
 * Skeleton Screen Components
 * 
 * **Feature: performance-optimization-aws, Task 7: Enhanced Loading State Management**
 * 
 * Provides skeleton screens for various content types to improve perceived performance
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  style,
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const styleOverrides: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={styleOverrides}
      role="status"
      aria-label="Loading..."
    />
  );
};

// Card skeleton for dashboard cards
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-6 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <Skeleton width="60%" height="1.5rem" className="mb-4" />
      <Skeleton width="100%" height="4rem" className="mb-3" />
      <Skeleton width="80%" height="1rem" className="mb-2" />
      <Skeleton width="90%" height="1rem" />
    </div>
  );
};

// Table skeleton
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} width="100%" height="1.25rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 mb-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} width="100%" height="1rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

// List skeleton
export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="70%" height="1rem" className="mb-2" />
            <Skeleton width="50%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Avatar skeleton
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return <Skeleton variant="circular" width={size} height={size} />;
};

// Text block skeleton
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height="1rem" 
        />
      ))}
    </div>
  );
};

// Image skeleton
export const SkeletonImage: React.FC<{ 
  width?: string | number; 
  height?: string | number;
  aspectRatio?: string;
}> = ({ width = '100%', height = '200px', aspectRatio }) => {
  const style: React.CSSProperties = aspectRatio 
    ? { aspectRatio, width }
    : { width, height };

  return (
    <Skeleton 
      variant="rectangular" 
      width={width} 
      height={aspectRatio ? undefined : height}
      className="!rounded-lg"
      style={style}
    />
  );
};

// Dashboard skeleton - full page
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="200px" height="2rem" />
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard className="h-96" />
        </div>
        <div>
          <SkeletonList items={6} />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
