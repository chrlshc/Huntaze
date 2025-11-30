'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface ContentPageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  pageName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ContentPageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary specifically designed for content pages
 * Provides user-friendly error messages with retry options
 * Logs errors for debugging
 * 
 * Requirements: 15.1, 15.5, 18.1, 18.2, 18.5
 */
export class ContentPageErrorBoundary extends Component<
  ContentPageErrorBoundaryProps,
  ContentPageErrorBoundaryState
> {
  constructor(props: ContentPageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ContentPageErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { pageName, onError } = this.props;
    const { errorCount } = this.state;

    // Log error to console with page context
    console.error(
      `[ContentPageErrorBoundary] Error on ${pageName || 'unknown page'}:`,
      error,
      errorInfo
    );

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: errorCount + 1,
    });

    // Call optional error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // For now, we'll just log to console
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      pageName: this.props.pageName,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.log('[Error Tracking]', JSON.stringify(errorData, null, 2));

    // Example Sentry integration:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //     tags: {
    //       page: this.props.pageName,
    //     },
    //   });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-red-200 shadow-[var(--shadow-soft)] p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] text-center mb-3">
              Something went wrong
            </h2>

            {/* Error Message */}
            <p className="text-[var(--color-text-sub)] text-center mb-6">
              {this.props.pageName
                ? `We encountered an error while loading the ${this.props.pageName} page.`
                : 'We encountered an unexpected error.'}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-mono text-red-800 mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs font-mono text-red-700">
                    <summary className="cursor-pointer hover:text-red-900">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error Count Warning */}
            {this.state.errorCount > 1 && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  This error has occurred {this.state.errorCount} times. Consider reloading the
                  page or returning to the dashboard.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" onClick={this.handleReset}>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button variant="ghost" onClick={this.handleReload}>
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>

              <Button variant="ghost" onClick={this.handleGoHome}>
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-[var(--color-text-sub)] text-center mt-6">
              If this problem persists, please contact support with the error details above.
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for smaller components
 */
export class ComponentErrorBoundary extends Component<
  { children: ReactNode; componentName?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; componentName?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[ComponentErrorBoundary] Error in ${this.props.componentName || 'component'}:`,
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800 mb-1">
                {this.props.componentName
                  ? `Error loading ${this.props.componentName}`
                  : 'Component error'}
              </h4>
              <p className="text-sm text-red-700">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
