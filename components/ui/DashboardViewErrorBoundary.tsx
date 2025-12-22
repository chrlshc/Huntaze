import React, { Component, ErrorInfo, ReactNode } from 'react';
import { DashboardEmptyState } from './DashboardEmptyState';

interface DashboardViewErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback component */
  fallback?: ReactNode;
  /** Optional error handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface DashboardViewErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * DashboardViewErrorBoundary Component
 * 
 * Error boundary for dashboard views that catches JavaScript errors anywhere
 * in the child component tree, logs those errors, and displays a fallback UI.
 * 
 * Features:
 * - Catches errors in child components
 * - Displays EmptyState with error message and "Refresh Page" CTA
 * - Logs errors to error tracking service
 * - Prevents cascading failures across dashboard views
 * 
 * Usage:
 * ```tsx
 * <DashboardViewErrorBoundary>
 *   <YourDashboardView />
 * </DashboardViewErrorBoundary>
 * ```
 */
export class DashboardViewErrorBoundary extends Component<
  DashboardViewErrorBoundaryProps,
  DashboardViewErrorBoundaryState
> {
  constructor(props: DashboardViewErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): DashboardViewErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to error tracking service
    console.error('Dashboard view error:', error, errorInfo);
    
    // Log to error tracking service (e.g., Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRefresh = (): void => {
    // Reset error state and reload page
    window.location.reload();
  };

  handleReset = (): void => {
    // Reset error state without reloading
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI using EmptyState
      return (
        <DashboardEmptyState
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          title="Something went wrong"
          description="We're having trouble loading this view. Please refresh the page or try again later."
          benefits={[
            'Your data is safe and has been saved',
            'This is a temporary issue',
            'Refreshing the page usually resolves the problem',
          ]}
          cta={{
            label: 'Refresh Page',
            onClick: this.handleRefresh,
          }}
        />
      );
    }

    return this.props.children;
  }
}
