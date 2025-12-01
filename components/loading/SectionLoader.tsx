/**
 * Section Loader Component
 * 
 * **Feature: performance-optimization-aws, Task 7**
 * Manages independent loading states per section
 */

import React from 'react';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Skeleton } from './SkeletonScreen';
import { ProgressIndicator } from './ProgressIndicator';
import { SmoothTransition } from './SmoothTransition';

type LoadingType = 'skeleton' | 'spinner' | 'progress';

interface SectionLoaderProps {
  sectionId: string;
  isLoading: boolean;
  hasCachedData?: boolean;
  loadingType?: LoadingType;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export const SectionLoader: React.FC<SectionLoaderProps> = ({
  sectionId,
  isLoading,
  hasCachedData = false,
  loadingType = 'skeleton',
  skeleton,
  children,
  className = '',
  showProgress = false,
  progress = 0
}) => {
  const [loadingState] = useLoadingState({
    sectionId,
    loadingType,
    hasCachedData,
    showProgressAfter: 1000
  });

  // If we have cached data, show content immediately (background update)
  if (hasCachedData && isLoading) {
    return (
      <div className={`relative ${className}`}>
        {children}
        {/* Optional subtle indicator for background update */}
        <div className="absolute top-2 right-2 opacity-50">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    if (loadingType === 'skeleton' && skeleton) {
      return <div className={className}>{skeleton}</div>;
    }

    const shouldShowProgress = showProgress || loadingState.progress > 0;

    if (loadingType === 'progress' && shouldShowProgress) {
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <ProgressIndicator 
            progress={progress} 
            showLabel 
            label="Loading..."
          />
        </div>
      );
    }

    if (loadingType === 'spinner') {
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }
  }

  // Show content with smooth transition
  return (
    <SmoothTransition
      isLoading={isLoading}
      skeleton={skeleton || <Skeleton height="200px" />}
      className={className}
    >
      {children}
    </SmoothTransition>
  );
};

export default SectionLoader;
