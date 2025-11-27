/**
 * Progress Indicator Components
 * 
 * **Feature: performance-optimization-aws, Task 7**
 * Displays progress for operations > 1 second
 */

import React from 'react';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  variant?: 'linear' | 'circular' | 'determinate' | 'indeterminate';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  variant = 'linear',
  size = 'md',
  showLabel = false,
  label,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  if (variant === 'linear') {
    return (
      <div className={`w-full ${className}`}>
        {showLabel && (
          <div className="flex justify-between mb-1 text-sm">
            <span>{label || 'Loading...'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        )}
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div
            className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }

  return null;
};

// Circular progress indicator
export const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}> = ({ progress, size = 40, strokeWidth = 4, showLabel = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 dark:text-blue-500 transition-all duration-300"
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

export default ProgressIndicator;
