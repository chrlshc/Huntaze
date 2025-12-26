/**
 * LazyComponent Examples
 * 
 * Demonstrates various usage patterns for the LazyComponent wrapper
 */

import React from 'react';
import { LazyComponent, withLazyLoading, shouldLazyLoad } from './LazyComponent';
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';

// Example 1: Basic lazy loading with default fallback
export function BasicLazyLoadingExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Basic Lazy Loading</h2>
      <LazyComponent
        loader={() => import('@/features/analytics')}
      />
    </div>
  );
}

// Example 2: Lazy loading with custom skeleton fallback
export function LazyLoadingWithSkeletonExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Lazy Loading with Skeleton</h2>
      <LazyComponent
        loader={() => import('@/features/analytics')}
        fallback={<SkeletonScreen variant="dashboard" />}
      />
    </div>
  );
}

// Example 3: Lazy loading with callbacks
export function LazyLoadingWithCallbacksExample() {
  const handleLoad = () => {
    console.log('Component loaded successfully');
  };

  const handleError = (error: Error) => {
    console.error('Failed to load component:', error);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Lazy Loading with Callbacks</h2>
      <LazyComponent
        loader={() => import('@/features/analytics')}
        fallback={<SkeletonScreen variant="dashboard" />}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Example 4: Lazy loading with custom retry configuration
export function LazyLoadingWithRetryExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Lazy Loading with Custom Retry</h2>
      <LazyComponent
        loader={() => import('@/features/analytics')}
        fallback={<SkeletonScreen variant="dashboard" />}
        maxRetries={3}
        retryDelay={2000}
      />
    </div>
  );
}

// Example 5: Using the HOC pattern
const LazyAnalytics = withLazyLoading(
  () => import('@/features/analytics'),
  {
    fallback: <SkeletonScreen variant="dashboard" />,
    maxRetries: 3,
  }
);

export function HOCPatternExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">HOC Pattern</h2>
      <LazyAnalytics />
    </div>
  );
}

// Example 6: Conditional lazy loading based on size threshold
export function ConditionalLazyLoadingExample() {
  const componentSizeKB = 75; // Estimated size
  const threshold = 50;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Conditional Lazy Loading</h2>
      {shouldLazyLoad(componentSizeKB, threshold) ? (
        <LazyComponent
          loader={() => import('@/features/analytics')}
          fallback={<SkeletonScreen variant="dashboard" />}
        />
      ) : (
        <div>Component is small enough to load directly</div>
      )}
    </div>
  );
}

// Example 7: Lazy loading with component props
export function LazyLoadingWithPropsExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Lazy Loading with Props</h2>
      <LazyComponent
        loader={() => import('@/features/analytics')}
        fallback={<SkeletonScreen variant="dashboard" />}
        componentProps={{
          userId: '123',
          dateRange: '7d',
          showCharts: true,
        }}
      />
    </div>
  );
}

// Example 8: Multiple lazy components on same page
export function MultipleLazyComponentsExample() {
  return (
    <div className="p-4 space-y-8">
      <h2 className="text-xl mb-4">Multiple Lazy Components</h2>
      
      <section>
        <h3 className="text-lg mb-2">Analytics</h3>
        <LazyComponent
          loader={() => import('@/features/analytics')}
          fallback={<SkeletonScreen variant="dashboard" />}
        />
      </section>

      <section>
        <h3 className="text-lg mb-2">Social Media</h3>
        <LazyComponent
          loader={() => import('@/features/social-media')}
          fallback={<SkeletonScreen variant="card" count={3} />}
        />
      </section>

      <section>
        <h3 className="text-lg mb-2">CIN AI</h3>
        <LazyComponent
          loader={() => import('@/features/cin-ai')}
          fallback={<SkeletonScreen variant="form" />}
        />
      </section>
    </div>
  );
}

// Example 9: Lazy loading with error recovery
export function LazyLoadingWithErrorRecoveryExample() {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Lazy Loading with Error Recovery</h2>
      {hasError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Component failed to load. Please check your connection.
        </div>
      )}
      <LazyComponent
        loader={() => import('@/features/analytics')}
        fallback={<SkeletonScreen variant="dashboard" />}
        maxRetries={3}
        onError={(error) => {
          console.error('Load error:', error);
          setHasError(true);
        }}
        onLoad={() => setHasError(false)}
      />
    </div>
  );
}

// Example 10: Lazy loading for below-the-fold content
export function BelowTheFoldLazyLoadingExample() {
  return (
    <div className="p-4">
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <h2 className="text-2xl">Above the fold content</h2>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl mb-4">Below the fold - Lazy loaded</h3>
        <LazyComponent
          loader={() => import('@/features/analytics')}
          fallback={<SkeletonScreen variant="dashboard" />}
        />
      </div>
    </div>
  );
}

// Export all examples
const lazyComponentExamples = {
  BasicLazyLoadingExample,
  LazyLoadingWithSkeletonExample,
  LazyLoadingWithCallbacksExample,
  LazyLoadingWithRetryExample,
  HOCPatternExample,
  ConditionalLazyLoadingExample,
  LazyLoadingWithPropsExample,
  MultipleLazyComponentsExample,
  LazyLoadingWithErrorRecoveryExample,
  BelowTheFoldLazyLoadingExample,
};

export default lazyComponentExamples;
