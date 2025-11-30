/**
 * Validation Health Hook
 * 
 * React hook for checking OAuth validation health status
 * with auto-refresh and error handling
 * 
 * Features:
 * - Auto-refresh every 5 minutes
 * - SWR caching
 * - Error retry (3 attempts)
 * - Loading states
 * - Manual refresh
 * 
 * @example
 * ```tsx
 * const { health, isLoading, error, refresh } = useValidationHealth();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error error={error} />;
 * 
 * return (
 *   <div>
 *     <h1>Status: {health.status}</h1>
 *     <p>Healthy: {health.summary.healthy}/{health.summary.total}</p>
 *     <Button variant="primary" onClick={refresh}>Refresh</Button>
 *   </div>
 * );
 * ```
 */

'use client';

import useSWR from 'swr';
import { Button } from "@/components/ui/button";

// Types
export interface ValidationHealthPlatform {
  platform: string;
  status: 'healthy' | 'unhealthy';
  credentialsSet: boolean;
  formatValid: boolean;
  apiConnectivity: boolean;
  errors: number;
  warnings: number;
}

export interface ValidationHealthSummary {
  total: number;
  healthy: number;
  unhealthy: number;
  healthPercentage: number;
}

export interface ValidationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  timestamp: string;
  platforms: ValidationHealthPlatform[];
  summary: ValidationHealthSummary;
  correlationId: string;
  duration?: number;
  cached?: boolean;
  cacheAge?: number;
}

export interface ValidationHealthError {
  status: 'error';
  error: string;
  message: string;
  timestamp: string;
  correlationId: string;
}

// Fetcher with error handling
const fetcher = async (url: string): Promise<ValidationHealth> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'FETCH_FAILED',
      message: `HTTP ${response.status}`,
    }));
    
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Hook to check OAuth validation health
 * 
 * @param options - SWR configuration options
 * @returns Validation health data, loading state, error, and refresh function
 */
export function useValidationHealth(options?: {
  refreshInterval?: number;
  enabled?: boolean;
}) {
  const {
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
  } = options || {};

  const { data, error, isLoading, mutate } = useSWR<ValidationHealth>(
    enabled ? '/api/validation/health' : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      shouldRetryOnError: (error) => {
        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          return false;
        }
        return true;
      },
      onSuccess: (data) => {
        console.log('[useValidationHealth] Health check successful:', {
          status: data.status,
          healthy: data.summary.healthy,
          total: data.summary.total,
          cached: data.cached,
        });
      },
      onError: (error) => {
        console.error('[useValidationHealth] Health check failed:', error);
      },
    }
  );

  return {
    health: data,
    isLoading,
    error,
    refresh: mutate,
    isHealthy: data?.status === 'healthy',
    isDegraded: data?.status === 'degraded',
    isUnhealthy: data?.status === 'unhealthy',
  };
}

/**
 * Hook to check if a specific platform is healthy
 * 
 * @param platform - Platform name ('tiktok', 'instagram', 'reddit')
 * @returns Platform health status
 */
export function usePlatformHealth(platform: 'tiktok' | 'instagram' | 'reddit') {
  const { health, isLoading, error } = useValidationHealth();

  const platformData = health?.platforms.find(p => p.platform === platform);

  return {
    isHealthy: platformData?.status === 'healthy',
    isConfigured: platformData?.credentialsSet || false,
    hasErrors: (platformData?.errors || 0) > 0,
    hasWarnings: (platformData?.warnings || 0) > 0,
    isLoading,
    error,
    platform: platformData,
  };
}
