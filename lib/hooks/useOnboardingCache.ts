import { useState, useEffect, useCallback } from 'react';

interface OnboardingState {
  currentLevel: string;
  completionPercentage: number;
  unlockedFeatures: string[];
  currentStep: number;
  totalSteps: number;
  lastUpdated: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class OnboardingCache {
  private static instance: OnboardingCache;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): OnboardingCache {
    if (!OnboardingCache.instance) {
      OnboardingCache.instance = new OnboardingCache();
    }
    return OnboardingCache.instance;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export function useOnboardingCache() {
  const cache = OnboardingCache.getInstance();
  const [cacheVersion, setCacheVersion] = useState(0);

  // Force re-render when cache is updated
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cache.invalidate(key);
    } else {
      cache.clear();
    }
    setCacheVersion(prev => prev + 1);
  }, [cache]);

  // Get cached onboarding state
  const getCachedOnboardingState = useCallback((userId: string): OnboardingState | null => {
    return cache.get(`onboarding:state:${userId}`);
  }, [cache, cacheVersion]);

  // Cache onboarding state
  const cacheOnboardingState = useCallback((userId: string, state: OnboardingState) => {
    cache.set(`onboarding:state:${userId}`, state);
    setCacheVersion(prev => prev + 1);
  }, [cache]);

  // Get cached feature unlocks
  const getCachedFeatureUnlocks = useCallback((userId: string): string[] | null => {
    return cache.get(`onboarding:features:${userId}`);
  }, [cache, cacheVersion]);

  // Cache feature unlocks
  const cacheFeatureUnlocks = useCallback((userId: string, features: string[]) => {
    cache.set(`onboarding:features:${userId}`, features);
    setCacheVersion(prev => prev + 1);
  }, [cache]);

  // Get cached step progress
  const getCachedStepProgress = useCallback((userId: string, step: string): any | null => {
    return cache.get(`onboarding:step:${userId}:${step}`);
  }, [cache, cacheVersion]);

  // Cache step progress
  const cacheStepProgress = useCallback((userId: string, step: string, progress: any) => {
    cache.set(`onboarding:step:${userId}:${step}`, progress, 2 * 60 * 1000); // 2 minutes TTL
    setCacheVersion(prev => prev + 1);
  }, [cache]);

  // Invalidate user's cache
  const invalidateUserCache = useCallback((userId: string) => {
    cache.invalidatePattern(`onboarding:.*:${userId}`);
    setCacheVersion(prev => prev + 1);
  }, [cache]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cache.cleanup();
    }, 60000); // Cleanup every minute

    return () => clearInterval(interval);
  }, [cache]);

  return {
    getCachedOnboardingState,
    cacheOnboardingState,
    getCachedFeatureUnlocks,
    cacheFeatureUnlocks,
    getCachedStepProgress,
    cacheStepProgress,
    invalidateUserCache,
    invalidateCache
  };
}

// Hook for optimized onboarding data fetching with cache
export function useOptimizedOnboardingData(userId: string) {
  const [data, setData] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    getCachedOnboardingState, 
    cacheOnboardingState,
    invalidateUserCache 
  } = useOnboardingCache();

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = getCachedOnboardingState(userId);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch from API
      const response = await fetch(`/api/onboarding/profile/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding data');
      }

      const freshData = await response.json();
      
      // Cache the fresh data
      cacheOnboardingState(userId, freshData);
      setData(freshData);
      
      return freshData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, getCachedOnboardingState, cacheOnboardingState]);

  // Update data optimistically
  const updateData = useCallback((updates: Partial<OnboardingState>) => {
    setData(prev => prev ? { ...prev, ...updates } : null);
    
    // Update cache
    if (data) {
      const updatedData = { ...data, ...updates };
      cacheOnboardingState(userId, updatedData);
    }
  }, [data, userId, cacheOnboardingState]);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate and refresh
  const invalidateAndRefresh = useCallback(() => {
    invalidateUserCache(userId);
    return fetchData(true);
  }, [userId, invalidateUserCache, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    updateData,
    invalidateAndRefresh
  };
}