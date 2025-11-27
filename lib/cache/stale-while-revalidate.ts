/**
 * Stale-while-revalidate implementation
 * Serves stale data immediately while fetching fresh data in background
 */

import { apiCache } from './api-cache';
import type { CacheOptions } from './api-cache';

/**
 * Cache middleware with stale-while-revalidate support
 * 
 * @param handler - Function that fetches fresh data
 * @param options - Cache options including staleWhileRevalidate duration
 * @returns Promise that resolves with cached or fresh data
 * 
 * Behavior:
 * 1. If data is fresh (within TTL): Return cached data immediately
 * 2. If data is stale (expired but within SWR window): 
 *    - Return stale data immediately
 *    - Fetch fresh data in background
 *    - Update cache when fresh data arrives
 * 3. If data is completely expired: Fetch fresh data and wait
 */
export async function withStaleWhileRevalidate<T = any>(
  handler: () => Promise<T>,
  options: CacheOptions & { staleWhileRevalidate: number }
): Promise<T> {
  const key = options.key || `swr_${handler.toString().slice(0, 50)}`;

  // Check cache first
  const cached = apiCache.get<T>(key);
  
  if (cached !== null) {
    // Check if data is stale
    const isStale = apiCache.isStale(key);
    
    if (isStale && !apiCache.isRevalidating(key)) {
      // Data is stale, revalidate in background
      apiCache.markRevalidating(key);
      
      // Don't await - revalidate in background
      handler()
        .then((freshData) => {
          apiCache.set(key, freshData, options);
        })
        .catch((error) => {
          console.error('Background revalidation failed:', error);
          // Keep serving stale data on error
        });
    }
    
    // Return cached data immediately (even if stale)
    return cached;
  }

  // No cached data, fetch fresh data
  const freshData = await handler();
  apiCache.set(key, freshData, options);
  return freshData;
}

/**
 * Cache presets with stale-while-revalidate
 */
export const SWRPresets = {
  // High volatility: 30s fresh, 30s stale
  HIGH: {
    ttl: 30 * 1000,
    staleWhileRevalidate: 30 * 1000,
  },
  
  // Medium volatility: 5min fresh, 5min stale
  MEDIUM: {
    ttl: 5 * 60 * 1000,
    staleWhileRevalidate: 5 * 60 * 1000,
  },
  
  // Low volatility: 1h fresh, 1h stale
  LOW: {
    ttl: 60 * 60 * 1000,
    staleWhileRevalidate: 60 * 60 * 1000,
  },
  
  // Static: 24h fresh, 24h stale
  STATIC: {
    ttl: 24 * 60 * 60 * 1000,
    staleWhileRevalidate: 24 * 60 * 60 * 1000,
  },
} as const;

export default withStaleWhileRevalidate;
