import React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardLoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Additional class names */
  className?: string;
  /** Type of view being loaded (for custom loading messages) */
  viewType?: 'smart-messages' | 'fans' | 'ppv' | 'default';
}

/**
 * DashboardLoadingState Component
 * 
 * Displays a loading state with screen reader support via aria-live region.
 * Used across dashboard views when data is being fetched.
 */
export function DashboardLoadingState({
  message,
  className,
  viewType = 'default',
}: DashboardLoadingStateProps) {
  // Generate view-specific loading messages
  const defaultMessage = message || (() => {
    switch (viewType) {
      case 'smart-messages':
        return 'Loading Smart Messages...';
      case 'fans':
        return 'Loading Fans...';
      case 'ppv':
        return 'Loading PPV Content...';
      default:
        return 'Loading...';
    }
  })();
  return (
    <div
      className={cn('dashboard-loading-state', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="dashboard-loading-state"
    >
      <div className="dashboard-loading-state__spinner" aria-hidden="true">
        <svg
          className="animate-spin h-8 w-8 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <span className="sr-only">{defaultMessage}</span>
    </div>
  );
}

export interface DashboardErrorStateProps {
  /** Error message to display */
  message: string;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * DashboardErrorState Component
 * 
 * Displays an error state with screen reader support via aria-live region.
 * Used across dashboard views when data fetching fails.
 */
export function DashboardErrorState({
  message,
  onRetry,
  className,
}: DashboardErrorStateProps) {
  return (
    <div
      className={cn('dashboard-error-state', className)}
      role="alert"
      aria-live="assertive"
      data-testid="dashboard-error-state"
    >
      <div className="dashboard-error-state__icon" aria-hidden="true">
        <svg
          className="h-8 w-8 text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="dashboard-error-state__message">{message}</p>
      {onRetry && (
        <button
          className="dashboard-error-state__retry"
          onClick={onRetry}
          type="button"
          aria-label="Retry"
        >
          Retry
        </button>
      )}
    </div>
  );
}
