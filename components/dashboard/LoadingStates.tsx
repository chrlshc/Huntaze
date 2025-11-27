/**
 * Dashboard Loading States
 * Task 5.1: Add loading states for dashboard components
 * Requirements: 4.1
 */

import React from 'react';

/**
 * Skeleton for stat cards on home page
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="stat-card animate-pulse">
      <div className="stat-card-header">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="stat-card-value">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="stat-card-description">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
};

/**
 * Skeleton for quick actions grid
 */
export const QuickActionsSkeleton: React.FC = () => {
  return (
    <div className="quick-actions-card">
      <div className="quick-actions-header">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="quick-actions-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="quick-action-item animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for platform status
 */
export const PlatformStatusSkeleton: React.FC = () => {
  return (
    <div className="platform-status-card">
      <div className="platform-status-header">
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
      </div>
      <div className="platform-status-list">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="platform-status-item animate-pulse">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for recent activity feed
 */
export const RecentActivitySkeleton: React.FC = () => {
  return (
    <div className="recent-activity-card">
      <div className="recent-activity-header">
        <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
      </div>
      <div className="recent-activity-list">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="recent-activity-item animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for analytics metrics cards
 */
export const AnalyticsMetricSkeleton: React.FC = () => {
  return (
    <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-32 mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
  );
};

/**
 * Skeleton for analytics page
 */
export const AnalyticsPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <AnalyticsMetricSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 shadow-[var(--shadow-soft)] animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Smooth fade-in transition wrapper
 */
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 300, className = '' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Progressive loading indicator for charts
 */
export const ChartLoadingIndicator: React.FC<{
  progress?: number;
  message?: string;
}> = ({ progress = 0, message = 'Loading chart data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-4">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            className="text-[var(--color-indigo)] transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-[var(--color-text-main)]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-[var(--color-text-sub)]">{message}</p>
    </div>
  );
};

/**
 * Spinner for inline loading states
 */
export const Spinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div
      className={`animate-spin rounded-full border-[var(--color-indigo)] border-t-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Button with loading state
 */
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}> = ({ loading, children, onClick, disabled, className = '', type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center ${className} ${
        loading || disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      {loading && (
        <Spinner size="sm" className="absolute left-4" />
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
};
