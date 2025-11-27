/**
 * React hook for request optimization
 * Provides deduplication, batching, debouncing, and retry capabilities
 */

import { useCallback, useRef } from 'react';
import { requestOptimizer } from '@/lib/optimization/request-optimizer';
import type { BatchRequest, BatchResponse, RetryOptions } from '@/lib/optimization/request-optimizer';

export function useRequestOptimizer() {
  const mountedRef = useRef(true);

  // Deduplicate requests
  const deduplicate = useCallback(
    async <T,>(key: string, fetcher: () => Promise<T>): Promise<T> => {
      return requestOptimizer.deduplicate(key, fetcher);
    },
    []
  );

  // Batch requests
  const batch = useCallback(
    async <T,>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> => {
      return requestOptimizer.batch<T>(requests);
    },
    []
  );

  // Debounce requests
  const debounce = useCallback(
    async <T,>(
      key: string,
      fn: () => Promise<T>,
      delay: number = 300
    ): Promise<T> => {
      return requestOptimizer.debounce(key, fn, delay);
    },
    []
  );

  // Retry with backoff
  const retryWithBackoff = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: RetryOptions
    ): Promise<T> => {
      return requestOptimizer.retryWithBackoff(fn, options);
    },
    []
  );

  // Get stats
  const getStats = useCallback(() => {
    return requestOptimizer.getStats();
  }, []);

  return {
    deduplicate,
    batch,
    debounce,
    retryWithBackoff,
    getStats,
  };
}

export type { BatchRequest, BatchResponse, RetryOptions };
