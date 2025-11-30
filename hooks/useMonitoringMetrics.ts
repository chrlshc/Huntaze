'use client';

/**
 * useMonitoringMetrics Hook
 * 
 * React hook for fetching and managing monitoring metrics with automatic refresh.
 * 
 * @example
 * ```typescript
 * import { useMonitoringMetrics } from '@/hooks/useMonitoringMetrics';
 * 
 * function MetricsDashboard() {
 *   const { metrics, alarms, isLoading, error, refresh } = useMonitoringMetrics({
 *     refreshInterval: 30000, // Refresh every 30 seconds
 *   });
 * 
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 * 
 *   return (
 *     <div>
 *       <h2>System Metrics</h2>
 *       <p>Total Requests: {metrics.requests.total}</p>
 *       <p>Average Latency: {metrics.requests.averageLatency}ms</p>
 *       <Button variant="primary" onClick={refresh}>Refresh</Button>
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { metricsClient, MetricsClientError } from '@/app/api/monitoring/metrics/client';
import type { MetricsSummary, AlarmInfo } from '@/app/api/monitoring/metrics/types';
import { Button } from "@/components/ui/button";

/**
 * Hook configuration options
 */
export interface UseMonitoringMetricsOptions {
  /**
   * Auto-refresh interval in milliseconds
   * Set to 0 to disable auto-refresh
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;

  /**
   * Enable/disable the hook
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when metrics are successfully fetched
   */
  onSuccess?: (data: { metrics: MetricsSummary; alarms: AlarmInfo[] }) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: MetricsClientError) => void;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Request timeout in milliseconds
   * @default 10000 (10 seconds)
   */
  timeout?: number;
}

/**
 * Hook return value
 */
export interface UseMonitoringMetricsReturn {
  /**
   * Current metrics data
   */
  metrics: MetricsSummary | null;

  /**
   * Current alarms data
   */
  alarms: AlarmInfo[];

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: MetricsClientError | null;

  /**
   * Manually refresh metrics
   */
  refresh: () => Promise<void>;

  /**
   * Last successful fetch timestamp
   */
  lastFetched: Date | null;

  /**
   * Whether data is being refreshed in background
   */
  isRefreshing: boolean;
}

/**
 * React hook for monitoring metrics
 */
export function useMonitoringMetrics(
  options: UseMonitoringMetricsOptions = {}
): UseMonitoringMetricsReturn {
  const {
    refreshInterval = 30000,
    enabled = true,
    onSuccess,
    onError,
    maxRetries = 3,
    timeout = 10000,
  } = options;

  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [alarms, setAlarms] = useState<AlarmInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<MetricsClientError | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch metrics
   */
  const fetchMetrics = useCallback(
    async (isBackgroundRefresh = false) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        if (!isBackgroundRefresh) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        const data = await metricsClient.getMetrics({
          maxRetries,
          timeout,
          signal: abortControllerRef.current.signal,
        });

        setMetrics(data.metrics);
        setAlarms(data.alarms);
        setLastFetched(new Date());

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (err) {
        const clientError =
          err instanceof MetricsClientError
            ? err
            : new MetricsClientError(
                err instanceof Error ? err.message : 'Unknown error',
                undefined,
                undefined,
                false,
                err instanceof Error ? err : undefined
              );

        // Don't set error if request was aborted (component unmounted or new request started)
        if (clientError.originalError?.name !== 'AbortError') {
          setError(clientError);

          if (onError) {
            onError(clientError);
          }
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        abortControllerRef.current = null;
      }
    },
    [maxRetries, timeout, onSuccess, onError]
  );

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchMetrics(false);
  }, [fetchMetrics]);

  /**
   * Initial fetch and auto-refresh setup
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchMetrics(false);

    // Setup auto-refresh
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchMetrics(true);
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refreshInterval, fetchMetrics]);

  return {
    metrics,
    alarms,
    isLoading,
    error,
    refresh,
    lastFetched,
    isRefreshing,
  };
}

/**
 * Hook for checking metrics health
 */
export function useMetricsHealth(): {
  isHealthy: boolean | null;
  isChecking: boolean;
  check: () => Promise<void>;
} {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthy = await metricsClient.healthCheck();
      setIsHealthy(healthy);
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { isHealthy, isChecking, check };
}
