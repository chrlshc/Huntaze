import React, { Suspense, lazy } from 'react';
import { DashboardLoadingState } from '@/components/ui/DashboardLoadingState';

/**
 * Lazy-loaded Dashboard Views
 * 
 * Uses React.lazy() to code-split dashboard views for improved initial load performance.
 * Each view is loaded on-demand when the user navigates to it.
 * 
 * Performance Benefits:
 * - Reduces initial bundle size
 * - Faster time-to-interactive
 * - Better resource utilization
 * 
 * Requirements: All requirements (performance is cross-cutting)
 */

// Lazy load dashboard views
export const LazySmartMessagesView = lazy(() => 
  import('@/app/(app)/onlyfans/smart-messages/page').then(module => ({
    default: module.default
  }))
);

export const LazyFansView = lazy(() => 
  import('@/app/(app)/onlyfans/fans/page').then(module => ({
    default: module.default
  }))
);

export const LazyPPVView = lazy(() => 
  import('@/app/(app)/onlyfans/ppv/page').then(module => ({
    default: module.default
  }))
);

/**
 * Wrapper component for lazy-loaded views with loading fallback
 */
interface LazyViewWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export function LazyViewWrapper({ children, loadingMessage }: LazyViewWrapperProps) {
  return (
    <Suspense fallback={<DashboardLoadingState message={loadingMessage} />}>
      {children}
    </Suspense>
  );
}

/**
 * Pre-configured lazy view components with loading states
 */
export function LazySmartMessagesViewWithFallback() {
  return (
    <LazyViewWrapper loadingMessage="Loading Smart Messages...">
      <LazySmartMessagesView />
    </LazyViewWrapper>
  );
}

export function LazyFansViewWithFallback() {
  return (
    <LazyViewWrapper loadingMessage="Loading Fans...">
      <LazyFansView />
    </LazyViewWrapper>
  );
}

export function LazyPPVViewWithFallback() {
  return (
    <LazyViewWrapper loadingMessage="Loading PPV Content...">
      <LazyPPVView />
    </LazyViewWrapper>
  );
}
