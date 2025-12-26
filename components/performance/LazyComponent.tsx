'use client';

import React, { ComponentType, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

/**
 * Configuration for LazyComponent wrapper
 */
export interface LazyComponentConfig {
  /** Function that returns a dynamic import promise */
  loader: () => Promise<{ default: ComponentType<any> }>;
  /** Fallback UI to display while loading */
  fallback?: React.ReactNode;
  /** Size threshold in KB for automatic lazy loading detection */
  threshold?: number;
  /** Maximum number of retry attempts on load failure */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
}

/**
 * Props for LazyComponent wrapper
 */
export interface LazyComponentProps extends LazyComponentConfig {
  /** Props to pass to the loaded component */
  componentProps?: Record<string, any>;
  /** Callback when component loads successfully */
  onLoad?: () => void;
  /** Callback when component fails to load */
  onError?: (error: Error) => void;
}

/**
 * Default fallback component for loading states
 */
const DefaultFallback: React.FC = () => (
  <div 
    className="flex items-center justify-center p-8"
    data-testid="lazy-loading-fallback"
    role="status"
    aria-live="polite"
    aria-label="Loading component"
  >
    <div className="animate-pulse text-gray-400">Loading...</div>
  </div>
);

/**
 * Error fallback component with retry functionality
 */
interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  onRetry, 
  retryCount, 
  maxRetries 
}) => (
  <div 
    className="flex flex-col items-center justify-center p-8 text-center"
    data-testid="lazy-loading-error"
    role="alert"
    aria-live="assertive"
  >
    <p className="text-red-500 mb-4">Failed to load component</p>
    <p className="text-sm text-gray-500 mb-4">{error.message}</p>
    {retryCount < maxRetries && (
      <Button variant="primary" onClick={onRetry} data-testid="retry-button">
  Retry ({retryCount}/{maxRetries})
</Button>
    )}
    {retryCount >= maxRetries && (
      <p className="text-sm text-gray-500">Maximum retry attempts reached</p>
    )}
  </div>
);

/**
 * Creates a lazy-loaded component with retry logic and error handling
 */
function createLazyComponentWithRetry(
  loader: () => Promise<{ default: ComponentType<any> }>,
  maxRetries: number = 2,
  retryDelay: number = 1000,
  onError?: (error: Error) => void
): ComponentType<any> {
  let retryCount = 0;

  const loadWithRetry = async (): Promise<{ default: ComponentType<any> }> => {
    try {
      const loadedModule = await loader();
      retryCount = 0; // Reset on success
      return loadedModule;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
        return loadWithRetry();
      }
      // Call error handler before throwing
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error;
    }
  };

  return lazy(loadWithRetry);
}

/**
 * LazyComponent wrapper for dynamic component loading
 * 
 * Provides:
 * - Dynamic imports with code splitting
 * - Configurable fallback UI
 * - Automatic retry logic with exponential backoff
 * - Error boundaries and graceful failure handling
 * - Loading state management
 * 
 * @example
 * ```tsx
 * <LazyComponent
 *   loader={() => import('./HeavyChart')}
 *   fallback={<ChartSkeleton />}
 *   maxRetries={3}
 *   onLoad={() => console.log('Chart loaded')}
 * />
 * ```
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <DefaultFallback />,
  threshold = 50, // 50KB default threshold
  maxRetries = 2,
  retryDelay = 1000,
  componentProps = {},
  onLoad,
  onError,
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [key, setKey] = useState(0);

  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
  }, [onError]);

  // Create lazy component once with retry logic
  const LazyLoadedComponent = React.useMemo(() => {
    const component = createLazyComponentWithRetry(loader, maxRetries, retryDelay, handleError);
    component.displayName = `LazyLoadedComponent(${key})`;
    return component;
  }, [loader, maxRetries, retryDelay, handleError, key]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    // Force re-creation of lazy component by changing key
    setKey(prev => prev + 1);
  };

  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={handleRetry}
        retryCount={retryCount}
        maxRetries={maxRetries}
      />
    );
  }

  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary onError={handleError}>
        <LoadedComponentWrapper 
          Component={LazyLoadedComponent} 
          componentProps={componentProps}
          onLoad={onLoad}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Wrapper to handle onLoad callback after component mounts
 */
const LoadedComponentWrapper: React.FC<{
  Component: ComponentType<any>;
  componentProps: Record<string, any>;
  onLoad?: () => void;
}> = ({ Component, componentProps, onLoad }) => {
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return <Component {...componentProps} />;
};

/**
 * Error Boundary component for catching component load errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Error is handled by parent
    }
    return this.props.children;
  }
}

/**
 * Utility function to check if a component should be lazy loaded
 * based on its estimated size
 */
export function shouldLazyLoad(estimatedSizeKB: number, threshold: number = 50): boolean {
  return estimatedSizeKB > threshold;
}

/**
 * Higher-order component for creating lazy-loaded components
 * 
 * @example
 * ```tsx
 * const LazyChart = withLazyLoading(
 *   () => import('./HeavyChart'),
 *   { fallback: <ChartSkeleton />, maxRetries: 3 }
 * );
 * ```
 */
export function withLazyLoading<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  config: Omit<LazyComponentConfig, 'loader'> = {}
): React.FC<P> {
  const WrappedComponent = (props: P) => (
    <LazyComponent
      loader={loader}
      componentProps={props}
      {...config}
    />
  );

  WrappedComponent.displayName = `withLazyLoading(${loader.name || 'Component'})`;
  return WrappedComponent;
}

export default LazyComponent;
