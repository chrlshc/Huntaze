/**
 * Optimized SWR Hook
 * 
 * Provides a wrapper around useSWR with automatic configuration
 * based on endpoint volatility and environment.
 * 
 * Requirements: 3.1, 3.3, 3.4, 3.5
 */

'use client';

import { useEffect, useMemo } from 'react';
import { type SWRConfiguration, type SWRResponse } from 'swr';
import { getConfigForEndpoint, getEnvironmentConfig } from './config';
import { createCancellableFetcher, standardFetcher } from './optimized-fetcher';
import { useInternalSWR } from './use-internal-swr';

export interface UseOptimizedSWROptions extends SWRConfiguration {
  /**
   * Enable request cancellation on unmount
   * Default: true
   */
  enableCancellation?: boolean;
  
  /**
   * Use environment-specific config (dev vs prod)
   * Default: true
   */
  useEnvironmentConfig?: boolean;
  
  /**
   * Custom fetcher function
   * If not provided, uses standard fetcher
   */
  fetcher?: (url: string) => Promise<any>;
}

/**
 * Optimized SWR hook with automatic configuration and request cancellation
 * 
 * Features:
 * - Automatic deduplication based on endpoint volatility
 * - Request cancellation on component unmount
 * - Environment-aware configuration
 * - Conditional monitoring in development only
 */
export function useOptimizedSWR<Data = any, Error = any>(
  key: string | null,
  options: UseOptimizedSWROptions = {}
): SWRResponse<Data, Error> {
  const {
    enableCancellation = true,
    useEnvironmentConfig: useEnvConfig = true,
    fetcher: customFetcher,
    ...swrOptions
  } = options;
  
  // Create cancellable fetcher if needed
  const cancellableFetcher = useMemo(() => {
    if (!enableCancellation || !key) return null;
    return createCancellableFetcher();
  }, [enableCancellation, key]);

  useEffect(() => {
    return () => {
      // Cancel pending requests on unmount or key change
      cancellableFetcher?.abort();
    };
  }, [cancellableFetcher]);
  
  // Get automatic configuration based on endpoint
  const autoConfig = key && useEnvConfig 
    ? getEnvironmentConfig(key)
    : key 
    ? getConfigForEndpoint(key)
    : {};
  
  // Merge configurations: auto config < user options
  const finalConfig: SWRConfiguration = {
    ...autoConfig,
    ...swrOptions,
  };
  
  // Choose fetcher
  const fetcher = customFetcher 
    || (cancellableFetcher?.fetcher)
    || standardFetcher;
  
  // Use SWR with optimized configuration
  const result = useInternalSWR<Data, Error>(key, fetcher, finalConfig);
  
  // Log in development for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && key) {
      console.log(`[SWR] Hook initialized for: ${key}`, {
        dedupingInterval: finalConfig.dedupingInterval,
        revalidateOnFocus: finalConfig.revalidateOnFocus,
        refreshInterval: finalConfig.refreshInterval,
      });
    }
  }, [key, finalConfig.dedupingInterval, finalConfig.revalidateOnFocus, finalConfig.refreshInterval]);
  
  return result;
}

/**
 * Hook for data that changes frequently (real-time)
 * Examples: messages, notifications, live metrics
 */
export function useRealtimeSWR<Data = any, Error = any>(
  key: string | null,
  options: UseOptimizedSWROptions = {}
): SWRResponse<Data, Error> {
  return useOptimizedSWR<Data, Error>(key, {
    ...options,
    dedupingInterval: 2000,
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });
}

/**
 * Hook for user-specific data that changes occasionally
 * Examples: dashboard stats, content lists
 */
export function useUserDataSWR<Data = any, Error = any>(
  key: string | null,
  options: UseOptimizedSWROptions = {}
): SWRResponse<Data, Error> {
  return useOptimizedSWR<Data, Error>(key, {
    ...options,
    dedupingInterval: 30000,
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });
}

/**
 * Hook for reference data that rarely changes
 * Examples: settings, templates, categories
 */
export function useStaticSWR<Data = any, Error = any>(
  key: string | null,
  options: UseOptimizedSWROptions = {}
): SWRResponse<Data, Error> {
  return useOptimizedSWR<Data, Error>(key, {
    ...options,
    dedupingInterval: 300000,
    revalidateOnFocus: false,
    refreshInterval: 0,
  });
}
