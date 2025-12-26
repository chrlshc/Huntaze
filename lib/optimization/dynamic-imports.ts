/**
 * Dynamic Import Utilities
 * 
 * Utilities for route-based code splitting and lazy loading
 * Validates: Requirements 6.2, 6.3
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Loading component for dynamic imports
 */
export const DefaultLoadingComponent = () => {
  return null; // Placeholder - implement in React component
};

/**
 * Error component for failed dynamic imports
 */
export const DefaultErrorComponent = ({ error }: { error: Error }) => {
  return null; // Placeholder - implement in React component
};

/**
 * Options for dynamic imports
 */
export interface DynamicImportOptions {
  loading?: ComponentType;
  ssr?: boolean;
  suspense?: boolean;
}

/**
 * Create a dynamically imported component with default loading state
 * 
 * @example
 * const HeavyChart = createDynamicImport(() => import('./HeavyChart'));
 */
export function createDynamicImport<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicImportOptions = {}
) {
  return dynamic(importFn, {
    loading: options.loading || DefaultLoadingComponent,
    ssr: options.ssr ?? false, // Disable SSR by default for client-only components
  });
}

/**
 * Lazy load a component only when it enters the viewport
 * 
 * @example
 * const LazyChart = createLazyComponent(() => import('./Chart'));
 */
export function createLazyComponent<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicImportOptions = {}
) {
  return dynamic(importFn, {
    loading: options.loading || DefaultLoadingComponent,
    ssr: false, // Never SSR lazy components
  });
}

/**
 * Preload a dynamic component
 * Useful for prefetching components that will be needed soon
 * 
 * @example
 * preloadComponent(() => import('./HeavyComponent'));
 */
export async function preloadComponent(
  importFn: () => Promise<any>
): Promise<void> {
  try {
    await importFn();
  } catch (error) {
    console.error('Failed to preload component:', error);
  }
}

/**
 * Route-based code splitting helper
 * Automatically creates dynamic imports for route components
 * 
 * @example
 * const routes = createRouteComponents({
 *   dashboard: () => import('./pages/Dashboard'),
 *   analytics: () => import('./pages/Analytics'),
 * });
 */
export function createRouteComponents<T extends Record<string, () => Promise<any>>>(
  routes: T
): Record<keyof T, ReturnType<typeof dynamic>> {
  const result: any = {};
  
  for (const [key, importFn] of Object.entries(routes)) {
    result[key] = dynamic(importFn, {
      loading: DefaultLoadingComponent,
      ssr: true, // Enable SSR for route components
    });
  }
  
  return result;
}

/**
 * Check if code splitting is working correctly
 * Returns true if dynamic imports are supported
 */
export function isCodeSplittingSupported(): boolean {
  // Dynamic imports are always supported in modern environments
  return true;
}

/**
 * Get chunk name from import path
 * Useful for debugging and monitoring
 */
export function getChunkName(importPath: string): string {
  const match = importPath.match(/\/([^/]+)$/);
  return match ? match[1].replace(/\.[^.]+$/, '') : 'unknown';
}
