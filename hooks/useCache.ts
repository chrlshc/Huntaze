'use client';

/**
 * React Hook for Client-Side Caching
 * Provides SWR-like functionality with cache management
 */

import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<() => void>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Notify subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => callback());
    }
  }

  delete(key: string) {
    this.cache.delete(key);
    
    // Notify subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => callback());
    }
  }

  subscribe(key: string, callback: () => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);
        if (keySubscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  clear() {
    this.cache.clear();
    // Notify all subscribers
    this.subscribers.forEach(subscribers => {
      subscribers.forEach(callback => callback());
    });
  }
}

const clientCache = new ClientCache();

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refreshInterval,
  } = options;

  const [data, setData] = useState<T | null>(() => clientCache.get<T>(key));
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!data);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = useCallback(async (showValidating = true) => {
    try {
      if (showValidating) setIsValidating(true);
      setError(null);

      const result = await fetcher();
      
      clientCache.set(key, result, ttl);
      setData(result);
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);
    } finally {
      if (showValidating) setIsValidating(false);
    }
  }, [key, fetcher, ttl]);

  // Initial fetch if no cached data
  useEffect(() => {
    if (!data) {
      fetchData(false);
    }
  }, [data, fetchData]);

  // Subscribe to cache changes
  useEffect(() => {
    const unsubscribe = clientCache.subscribe(key, () => {
      const cachedData = clientCache.get<T>(key);
      setData(cachedData);
    });

    return unsubscribe;
  }, [key]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [revalidateOnFocus, fetchData]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => fetchData();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [revalidateOnReconnect, fetchData]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  const mutate = useCallback(
    (newData?: T | ((current: T | null) => T)) => {
      if (typeof newData === 'function') {
        const updatedData = (newData as (current: T | null) => T)(data);
        clientCache.set(key, updatedData, ttl);
        setData(updatedData);
      } else if (newData !== undefined) {
        clientCache.set(key, newData, ttl);
        setData(newData);
      } else {
        // Revalidate
        fetchData();
      }
    },
    [key, data, ttl, fetchData]
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    revalidate: () => fetchData(),
  };
}

// Specialized hooks for common use cases
export function useLandingPageData() {
  return useCache(
    'landing-page-data',
    async () => {
      const response = await fetch('/api/landing/data');
      if (!response.ok) throw new Error('Failed to fetch landing page data');
      return response.json();
    },
    {
      ttl: 30 * 60 * 1000, // 30 minutes
      revalidateOnFocus: false,
    }
  );
}

export function useAnalyticsOverview(timeRange: string = '30d') {
  return useCache(
    `analytics-overview-${timeRange}`,
    async () => {
      const response = await fetch(`/api/analytics/overview?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      refreshInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    }
  );
}

export function useCacheStatus() {
  return useCache(
    'cache-status',
    async () => {
      const response = await fetch('/api/cache/status');
      if (!response.ok) throw new Error('Failed to fetch cache status');
      return response.json();
    },
    {
      ttl: 30 * 1000, // 30 seconds
      refreshInterval: 30 * 1000, // Auto-refresh every 30 seconds
    }
  );
}

// Cache management utilities
export const cacheUtils = {
  clear: () => clientCache.clear(),
  delete: (key: string) => clientCache.delete(key),
  warmup: async () => {
    await fetch('/api/cache/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'warmup-critical' }),
    });
  },
};