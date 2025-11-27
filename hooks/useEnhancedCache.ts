'use client';

/**
 * Enhanced Cache Hook
 * React hook with stale-while-revalidate, offline support, and tag-based invalidation
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getEnhancedCacheManager, type CacheOptions, type RevalidationOptions } from '@/lib/cache/enhanced-cache';

interface UseEnhancedCacheOptions {
  level?: 'browser' | 'redis' | 'all';
  ttl?: number;
  tags?: string[];
  staleTime?: number;
  revalidateTime?: number;
  fallbackToStale?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

interface UseEnhancedCacheReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  isStale: boolean;
  isOffline: boolean;
  mutate: (newData?: T | ((current: T | null) => T)) => Promise<void>;
  revalidate: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Enhanced cache hook with stale-while-revalidate
 */
export function useEnhancedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseEnhancedCacheOptions = {}
): UseEnhancedCacheReturn<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    tags = [],
    staleTime = 60 * 1000, // 1 minute
    revalidateTime = 5 * 60 * 1000, // 5 minutes
    fallbackToStale = true,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refreshInterval,
    level = 'browser',
  } = options;

  const cacheManager = getEnhancedCacheManager();
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(!cacheManager.isOnline());
  
  const isMountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  
  // Update fetcher ref
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  /**
   * Fetch data with stale-while-revalidate
   */
  const fetchData = useCallback(async (showValidating = true) => {
    if (!isMountedRef.current) return;

    try {
      if (showValidating) setIsValidating(true);
      setError(null);

      const result = await cacheManager.getWithRevalidation<T>(
        key,
        fetcherRef.current,
        {
          staleTime,
          revalidateTime,
          fallbackToStale,
        }
      );

      if (isMountedRef.current) {
        setData(result);
        setIsStale(false);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setIsLoading(false);
      }
    } finally {
      if (isMountedRef.current && showValidating) {
        setIsValidating(false);
      }
    }
  }, [key, staleTime, revalidateTime, fallbackToStale, cacheManager]);

  /**
   * Fetch with offline fallback
   */
  const fetchWithOfflineFallback = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsValidating(true);
      setError(null);

      const result = await cacheManager.getWithOfflineFallback<T>(
        key,
        fetcherRef.current,
        { ttl, tags, level, fallbackToStale }
      );

      if (isMountedRef.current) {
        setData(result.data);
        setIsStale(result.isStale);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setIsLoading(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsValidating(false);
      }
    }
  }, [key, ttl, tags, level, fallbackToStale, cacheManager]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    if (isOffline) {
      fetchWithOfflineFallback();
    } else {
      fetchData(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, fetchWithOfflineFallback, isOffline]);

  /**
   * Subscribe to cache changes
   */
  useEffect(() => {
    const unsubscribe = cacheManager.subscribe<T>(key, (newData) => {
      if (isMountedRef.current && newData !== null) {
        setData(newData);
      }
    });

    return unsubscribe;
  }, [key, cacheManager]);

  /**
   * Monitor online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (revalidateOnReconnect) {
        fetchData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [revalidateOnReconnect, fetchData]);

  /**
   * Revalidate on focus
   */
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (!document.hidden && !isOffline) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [revalidateOnFocus, isOffline, fetchData]);

  /**
   * Refresh interval
   */
  useEffect(() => {
    if (!refreshInterval || isOffline) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isOffline, fetchData]);

  /**
   * Mutate cache
   */
  const mutate = useCallback(
    async (newData?: T | ((current: T | null) => T)) => {
      if (typeof newData === 'function') {
        const updatedData = (newData as (current: T | null) => T)(data);
        await cacheManager.set(key, updatedData, ttl, { tags, level });
        setData(updatedData);
      } else if (newData !== undefined) {
        await cacheManager.set(key, newData, ttl, { tags, level });
        setData(newData);
      } else {
        // Revalidate
        await fetchData();
      }
    },
    [key, data, ttl, tags, level, fetchData, cacheManager]
  );

  /**
   * Revalidate
   */
  const revalidate = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Invalidate this cache entry
   */
  const invalidate = useCallback(async () => {
    await cacheManager.invalidate(key);
    setData(null);
    setIsLoading(true);
    await fetchData(false);
  }, [key, fetchData, cacheManager]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    isStale,
    isOffline,
    mutate,
    revalidate,
    invalidate,
  };
}

/**
 * Hook to invalidate cache by tag
 */
export function useCacheInvalidation() {
  const cacheManager = getEnhancedCacheManager();

  const invalidateByTag = useCallback(
    async (tag: string) => {
      await cacheManager.invalidate(`#${tag}`);
    },
    [cacheManager]
  );

  const invalidateByPattern = useCallback(
    async (pattern: string) => {
      await cacheManager.invalidate(pattern);
    },
    [cacheManager]
  );

  const clearAll = useCallback(() => {
    cacheManager.clear();
  }, [cacheManager]);

  return {
    invalidateByTag,
    invalidateByPattern,
    clearAll,
  };
}

/**
 * Hook to preload critical data
 */
export function useCachePreload() {
  const cacheManager = getEnhancedCacheManager();

  const preload = useCallback(
    async (keys: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>) => {
      await cacheManager.preload(keys);
    },
    [cacheManager]
  );

  return { preload };
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats() {
  const cacheManager = getEnhancedCacheManager();
  const [stats, setStats] = useState(cacheManager.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [cacheManager]);

  return stats;
}
