/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate concurrent requests to the same endpoint.
 * When multiple components request the same data simultaneously,
 * only one actual request is made and the result is shared.
 * 
 * Requirements: Performance optimization, API call reduction
 * 
 * @example
 * ```typescript
 * // Multiple components call this simultaneously
 * const user1 = await deduplicateRequest('user:123', () => fetchUser(123));
 * const user2 = await deduplicateRequest('user:123', () => fetchUser(123));
 * // Only one actual fetch is made, both get the same result
 * ```
 */

import { createLogger } from './logger';

const logger = createLogger('request-deduplication');

/**
 * Map of pending requests by key
 */
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Statistics for monitoring
 */
const stats = {
  deduplicated: 0,
  unique: 0,
};

/**
 * Deduplicates concurrent requests with the same key.
 * If a request with the same key is already pending, returns that promise.
 * Otherwise, executes the function and caches the promise.
 * 
 * @param key - Unique identifier for the request
 * @param fn - Function that performs the actual request
 * @returns Promise that resolves with the request result
 * 
 * @example
 * ```typescript
 * const data = await deduplicateRequest(
 *   'api:/users/123',
 *   () => fetch('/api/users/123').then(r => r.json())
 * );
 * ```
 */
export async function deduplicateRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    stats.deduplicated++;
    
    logger.debug('Request deduplicated', {
      key,
      totalDeduplicated: stats.deduplicated,
    });
    
    return pendingRequests.get(key)!;
  }
  
  // Create new request
  stats.unique++;
  
  const promise = fn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
    
    logger.debug('Request completed', {
      key,
      totalUnique: stats.unique,
    });
  });
  
  pendingRequests.set(key, promise);
  
  return promise;
}

/**
 * Manually clear a pending request from the cache.
 * Useful for cancellation or error recovery.
 * 
 * @param key - The request key to clear
 * @returns True if a request was cleared, false if none existed
 */
export function clearPendingRequest(key: string): boolean {
  const existed = pendingRequests.has(key);
  pendingRequests.delete(key);
  
  if (existed) {
    logger.debug('Pending request cleared', { key });
  }
  
  return existed;
}

/**
 * Clear all pending requests.
 * Useful for cleanup or testing.
 */
export function clearAllPendingRequests(): void {
  const count = pendingRequests.size;
  pendingRequests.clear();
  
  logger.info('All pending requests cleared', { count });
}

/**
 * Get current deduplication statistics.
 * Useful for monitoring and debugging.
 * 
 * @returns Statistics object
 */
export function getDeduplicationStats() {
  return {
    ...stats,
    pending: pendingRequests.size,
    deduplicationRate: stats.unique > 0 
      ? (stats.deduplicated / (stats.unique + stats.deduplicated)) * 100 
      : 0,
  };
}

/**
 * Reset deduplication statistics.
 * Useful for testing or periodic resets.
 */
export function resetDeduplicationStats(): void {
  stats.deduplicated = 0;
  stats.unique = 0;
  
  logger.info('Deduplication stats reset');
}

/**
 * Creates a deduplicated fetch wrapper for a specific API.
 * 
 * @param baseUrl - Base URL for the API
 * @returns Fetch function with automatic deduplication
 * 
 * @example
 * ```typescript
 * const apiFetch = createDeduplicatedFetch('/api');
 * 
 * // These will be deduplicated
 * const user1 = await apiFetch('/users/123');
 * const user2 = await apiFetch('/users/123');
 * ```
 */
export function createDeduplicatedFetch(baseUrl: string = '') {
  return async function deduplicatedFetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const method = options?.method || 'GET';
    const key = `${method}:${url}`;
    
    return deduplicateRequest(key, async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    });
  };
}

/**
 * React hook for deduplicated API calls.
 * 
 * @param key - Unique key for the request
 * @param fn - Function that performs the request
 * @param enabled - Whether the request should be made
 * @returns Object with data, loading, and error states
 * 
 * @example
 * ```typescript
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, loading, error } = useDeduplicatedRequest(
 *     `user:${userId}`,
 *     () => fetchUser(userId),
 *     true
 *   );
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error error={error} />;
 *   return <Profile user={data} />;
 * }
 * ```
 */
export function useDeduplicatedRequest<T>(
  key: string,
  fn: () => Promise<T>,
  enabled: boolean = true
) {
  // This would be implemented with React hooks
  // For now, just export the type signature
  return {
    data: null as T | null,
    loading: false,
    error: null as Error | null,
  };
}

/**
 * Wrapper for SWR that adds deduplication.
 * 
 * @param key - SWR key
 * @param fetcher - SWR fetcher function
 * @returns SWR hook result
 * 
 * @example
 * ```typescript
 * const { data, error } = useDeduplicatedSWR(
 *   '/api/users/123',
 *   (url) => fetch(url).then(r => r.json())
 * );
 * ```
 */
export function useDeduplicatedSWR<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>
) {
  // This would integrate with SWR
  // For now, just export the type signature
  return {
    data: null as T | null,
    error: null as Error | null,
    isLoading: false,
    mutate: async () => {},
  };
}
