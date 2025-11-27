/**
 * Dashboard Error Boundary
 * Task 5.2: Implement error handling
 * Requirements: 4.2
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary for dashboard sections
 * Catches errors and provides fallback UI with retry functionality
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });

    // TODO: Send error to monitoring service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKeys change
    if (this.props.resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );

      if (hasResetKeyChanged && this.state.hasError) {
        this.handleReset();
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      this.setState(
        {
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: retryCount + 1,
        },
        () => {
          // Force re-render
          window.location.reload();
        }
      );
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, section } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[var(--bg-surface)] border border-red-200 rounded-[var(--radius-card)] p-8 shadow-[var(--shadow-soft)]">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-[var(--color-text-main)] text-center mb-2">
              {section ? `${section} Error` : 'Something went wrong'}
            </h2>

            {/* Error Message */}
            <p className="text-[var(--color-text-sub)] text-center mb-6">
              {process.env.NODE_ENV === 'development' ? (
                <span className="text-sm font-mono bg-gray-100 p-2 rounded block mt-2">
                  {error.message}
                </span>
              ) : (
                'We encountered an unexpected error. Please try again.'
              )}
            </p>

            {/* Retry Info */}
            {retryCount > 0 && retryCount < this.maxRetries && (
              <p className="text-sm text-[var(--color-text-sub)] text-center mb-4">
                Retry attempt {retryCount} of {this.maxRetries}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {retryCount < this.maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg hover:opacity-90 transition-all font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              ) : (
                <p className="text-sm text-red-600 text-center mb-2">
                  Maximum retry attempts reached
                </p>
              )}

              <button
                onClick={() => (window.location.href = '/home')}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-[var(--color-text-main)] rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </div>

            {/* Support Link */}
            <p className="text-xs text-[var(--color-text-sub)] text-center mt-4">
              If the problem persists,{' '}
              <a
                href="/support"
                className="text-[var(--color-indigo)] hover:underline"
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Functional wrapper for error boundary with hooks support
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <DashboardErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </DashboardErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

/**
 * Lightweight error fallback for smaller sections
 */
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
  message?: string;
}> = ({ error, resetError, message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
      <p className="text-sm text-red-800 text-center mb-3">
        {message || 'Failed to load this section'}
      </p>
      {error && process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-red-600 font-mono mb-3">{error.message}</p>
      )}
      {resetError && (
        <button
          onClick={resetError}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
};
