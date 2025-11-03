'use client';

import React from 'react';

// Skeleton component for loading states
export function Skeleton({ 
  className = '', 
  width = '100%', 
  height = '20px',
  rounded = 'rounded-md'
}: {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

// Progress tracker loading state
export function ProgressTrackerSkeleton() {
  return (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex flex-col items-center">
          <Skeleton className="w-10 h-10 rounded-full mb-2" />
          <Skeleton width="60px" height="12px" />
        </div>
      ))}
    </div>
  );
}

// Onboarding wizard loading state
export function OnboardingWizardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressTrackerSkeleton />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <Skeleton width="60%" height="32px" className="mb-4" />
          <Skeleton width="80%" height="16px" className="mb-2" />
          <Skeleton width="70%" height="16px" />
        </div>

        {/* Content area */}
        <div className="space-y-4 mb-8">
          <Skeleton width="100%" height="48px" />
          <Skeleton width="100%" height="48px" />
          <Skeleton width="80%" height="48px" />
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <Skeleton width="100px" height="40px" />
          <Skeleton width="120px" height="40px" />
        </div>
      </div>
    </div>
  );
}

// Feature card loading state
export function FeatureCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start space-x-4">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton width="70%" height="20px" className="mb-2" />
          <Skeleton width="100%" height="16px" className="mb-2" />
          <Skeleton width="80%" height="16px" className="mb-4" />
          <Skeleton width="90px" height="32px" />
        </div>
      </div>
    </div>
  );
}

// Feature grid loading state
export function FeatureGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <FeatureCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Platform connection loading state
export function PlatformConnectionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton width="120px" height="16px" className="mb-1" />
              <Skeleton width="80px" height="12px" />
            </div>
          </div>
          <Skeleton width="100px" height="36px" />
        </div>
      ))}
    </div>
  );
}

// Goal selection loading state
export function GoalSelectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Skeleton className="w-8 h-8 rounded-lg mb-4" />
          <Skeleton width="80%" height="20px" className="mb-2" />
          <Skeleton width="100%" height="16px" className="mb-2" />
          <Skeleton width="90%" height="16px" />
        </div>
      ))}
    </div>
  );
}

// Creator assessment loading state
export function CreatorAssessmentSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton width="60%" height="20px" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center space-x-3">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton width="200px" height="16px" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// AI configuration loading state
export function AIConfigurationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Skeleton width="70%" height="18px" className="mb-3" />
            <Skeleton width="100%" height="40px" />
          </div>
        ))}
      </div>
      
      <div className="space-y-3">
        <Skeleton width="40%" height="18px" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton width="180px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Feature tour loading state
export function FeatureTourSkeleton() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <Skeleton width="60%" height="24px" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        
        <Skeleton width="100%" height="16px" className="mb-2" />
        <Skeleton width="90%" height="16px" className="mb-4" />
        
        <div className="flex justify-between items-center">
          <Skeleton width="80px" height="12px" />
          <div className="flex space-x-2">
            <Skeleton width="60px" height="32px" />
            <Skeleton width="60px" height="32px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Completion celebration loading state
export function CompletionCelebrationSkeleton() {
  return (
    <div className="text-center py-12">
      <Skeleton className="w-24 h-24 rounded-full mx-auto mb-6" />
      <Skeleton width="60%" height="32px" className="mx-auto mb-4" />
      <Skeleton width="80%" height="16px" className="mx-auto mb-2" />
      <Skeleton width="70%" height="16px" className="mx-auto mb-8" />
      <Skeleton width="200px" height="48px" className="mx-auto" />
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({ 
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

// Progress indicator with percentage
export function ProgressIndicator({ 
  progress,
  showPercentage = true,
  className = ''
}: {
  progress: number;
  showPercentage?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Button loading state
export function ButtonLoading({ 
  children,
  loading = false,
  disabled = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      className={`relative ${className} ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
}