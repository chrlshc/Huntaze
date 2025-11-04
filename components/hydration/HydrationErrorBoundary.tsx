'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { hydrationErrorLogger } from '@/lib/services/hydrationErrorLogger';

interface HydrationErrorBoundaryProps {
  fallback?: React.ComponentType<{error: Error}>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

interface HydrationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isHydrationError: boolean;
}

class HydrationErrorBoundary extends Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isHydrationError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<HydrationErrorBoundaryState> {
    // Check if this is a React hydration error #130
    const isHydrationError = this.isReactHydrationError(error);
    
    return {
      hasError: true,
      error,
      isHydrationError,
    };
  }

  static isReactHydrationError(error: Error): boolean {
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    // Check for React error #130 patterns
    const hydrationErrorPatterns = [
      /Minified React error #130/,
      /hydration/i,
      /server.*client.*mismatch/i,
      /expected server HTML to contain/i,
      /did not match.*server/i,
      /suppressHydrationWarning/i,
    ];

    return hydrationErrorPatterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorStack)
    );
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log hydration error with detailed information
    hydrationErrorLogger.logHydrationError({
      error,
      errorInfo,
      isHydrationError: this.state.isHydrationError,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date(),
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, provide detailed error information
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Hydration Error Detected');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isHydrationError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error!} />;
      }

      // Default fallback for hydration errors
      if (this.state.isHydrationError) {
        return (
          <div className="hydration-error-fallback p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Page Loading Issue
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    We're experiencing a temporary loading issue. The page is being rendered on the client side.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="bg-yellow-50 text-yellow-800 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Generic error fallback
      return (
        <div className="error-fallback p-4 border border-red-300 bg-red-50 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>An unexpected error occurred. Please try refreshing the page.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="bg-red-50 text-red-800 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HydrationErrorBoundary;