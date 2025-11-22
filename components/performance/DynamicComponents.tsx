/**
 * Dynamic Component Imports
 * 
 * This file provides dynamically imported versions of heavy components
 * to improve initial page load performance through code splitting.
 * 
 * Requirements: 21.2, 21.3
 */

import dynamic from 'next/dynamic';

/**
 * Analytics components - non-critical, can be loaded after initial render
 */
export const DynamicGoogleAnalytics = dynamic(
  () => import('@/components/GoogleAnalytics'),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * Monitoring components - non-critical, load after initial render
 */
export const DynamicPerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * Chart components - heavy, only load when needed
 */
export const DynamicChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line).catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  }
);

/**
 * Three.js components - very heavy, only load when needed
 */
export const DynamicThreeScene = dynamic(
  () => import('@/components/animations/ThreeScene').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-900 h-full rounded-lg" />,
  }
);

/**
 * Modal components - load on demand
 */
export const DynamicContactSalesModal = dynamic(
  () => import('@/components/ContactSalesModal').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * Cookie consent - non-critical, load after initial render
 */
export const DynamicCookieConsent = dynamic(
  () => import('@/components/CookieConsent').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * Interactive demo - heavy component, load on demand
 */
export const DynamicInteractiveDemo = dynamic(
  () => import('@/components/InteractiveDemo').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    ),
  }
);

/**
 * Notification settings - load on demand
 */
export const DynamicNotificationSettings = dynamic(
  () => import('@/components/NotificationSettings').catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    ),
  }
);

/**
 * Helper function to create a dynamic import with consistent options
 */
export function createDynamicImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    ssr?: boolean;
    loading?: React.ComponentType;
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? (() => null),
  });
}
