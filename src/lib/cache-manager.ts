// Smart Caching & Prefetching Manager - Based on SaaS Leaders Best Practices
// Implements predictive prefetching and intelligent cache management

interface CacheConfig {
  maxAge: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  size: number;
}

class SmartCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private totalSize: number = 0;
  private accessPatterns: Map<string, number[]> = new Map();
  private prefetchQueue: Set<string> = new Set();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxSize: 50 * 1024 * 1024, // 50MB
      strategy: 'lru',
      ...config
    };

    // Start background tasks
    this.startCacheCleanup();
    this.startPrefetchWorker();
  }

  // Get data from cache with smart prefetching
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss(key);
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update access patterns
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.recordAccess(key);

    // Predictive prefetching based on access patterns
    this.predictAndPrefetch(key);

    return entry.data;
  }

  // Set data in cache with size management
  set(key: string, data: any): void {
    const size = this.calculateSize(data);
    
    // Check if we need to evict entries
    if (this.totalSize + size > this.config.maxSize) {
      this.evictEntries(size);
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      size
    };

    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.totalSize -= existingEntry.size;
    }

    this.cache.set(key, entry);
    this.totalSize += size;
  }

  // Prefetch data based on URL
  async prefetch(url: string, options?: RequestInit): Promise<void> {
    try {
      // Check if already cached
      if (this.cache.has(url)) return;

      // Add to prefetch queue
      this.prefetchQueue.add(url);

      // Fetch with lower priority
      const response = await fetch(url, {
        ...options,
        // @ts-ignore - priority is not in TypeScript yet
        priority: 'low'
      });

      if (response.ok) {
        const data = await response.json();
        this.set(url, data);
      }
    } catch (error) {
      console.error('Prefetch failed:', url, error);
    } finally {
      this.prefetchQueue.delete(url);
    }
  }

  // Batch prefetch multiple URLs
  async batchPrefetch(urls: string[]): Promise<void> {
    const prefetchPromises = urls
      .filter(url => !this.cache.has(url))
      .map(url => this.prefetch(url));

    await Promise.allSettled(prefetchPromises);
  }

  // Predictive prefetching based on access patterns
  private predictAndPrefetch(currentKey: string): void {
    const patterns = this.accessPatterns.get(currentKey) || [];
    if (patterns.length < 3) return;

    // Find frequently accessed URLs after this one
    const nextKeys = this.findNextKeys(currentKey);
    
    // Prefetch top predictions
    nextKeys.slice(0, 3).forEach(key => {
      if (!this.cache.has(key)) {
        this.prefetch(key);
      }
    });
  }

  // Record access patterns for prediction
  private recordAccess(key: string): void {
    const now = Date.now();
    const patterns = this.accessPatterns.get(key) || [];
    patterns.push(now);
    
    // Keep only recent patterns (last hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentPatterns = patterns.filter(time => time > oneHourAgo);
    
    this.accessPatterns.set(key, recentPatterns);
  }

  // Record cache miss for analytics
  private recordMiss(key: string): void {
    // This could be sent to analytics
    console.debug('Cache miss:', key);
  }

  // Find likely next keys based on patterns
  private findNextKeys(currentKey: string): string[] {
    // Simplified prediction - in production, use ML model
    const candidates: Map<string, number> = new Map();
    
    this.cache.forEach((entry, key) => {
      if (key !== currentKey) {
        const score = this.calculateRelevanceScore(currentKey, key, entry);
        candidates.set(key, score);
      }
    });

    // Sort by score and return top candidates
    return Array.from(candidates.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
  }

  // Calculate relevance score for predictive prefetching
  private calculateRelevanceScore(currentKey: string, candidateKey: string, entry: CacheEntry): number {
    let score = 0;

    // URL similarity
    const similarity = this.calculateUrlSimilarity(currentKey, candidateKey);
    score += similarity * 10;

    // Access frequency
    score += entry.accessCount * 5;

    // Recency
    const age = Date.now() - entry.lastAccess;
    score += Math.max(0, 100 - age / 1000);

    return score;
  }

  // Calculate URL similarity for prediction
  private calculateUrlSimilarity(url1: string, url2: string): number {
    const parts1 = url1.split('/');
    const parts2 = url2.split('/');
    
    let matches = 0;
    const minLength = Math.min(parts1.length, parts2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) matches++;
    }
    
    return matches / Math.max(parts1.length, parts2.length);
  }

  // Evict entries based on strategy
  private evictEntries(requiredSpace: number): void {
    let freedSpace = 0;
    const entries = Array.from(this.cache.entries());

    // Sort based on eviction strategy
    switch (this.config.strategy) {
      case 'lru':
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        break;
      case 'lfu':
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'fifo':
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
    }

    // Evict until we have enough space
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      this.cache.delete(key);
      this.totalSize -= entry.size;
      freedSpace += entry.size;
    }
  }

  // Calculate approximate size of data
  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }
    return JSON.stringify(data).length * 2;
  }

  // Background cache cleanup
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > this.config.maxAge) {
          this.cache.delete(key);
          this.totalSize -= entry.size;
        }
      });
    }, 60 * 1000); // Every minute
  }

  // Background prefetch worker
  private startPrefetchWorker(): void {
    setInterval(() => {
      // Analyze patterns and prefetch popular content
      const popularKeys = this.getPopularKeys();
      
      popularKeys.forEach(key => {
        const entry = this.cache.get(key);
        if (entry) {
          // Refresh popular content before expiry
          const age = Date.now() - entry.timestamp;
          if (age > this.config.maxAge * 0.8) {
            this.prefetch(key);
          }
        }
      });
    }, 30 * 1000); // Every 30 seconds
  }

  // Get most popular cached keys
  private getPopularKeys(): string[] {
    return Array.from(this.cache.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 10)
      .map(([key]) => key);
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.accessPatterns.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.totalSize,
      entries: this.cache.size,
      hitRate: this.calculateHitRate(),
      popularKeys: this.getPopularKeys()
    };
  }

  // Calculate cache hit rate
  private calculateHitRate(): number {
    let hits = 0;
    let total = 0;
    
    this.cache.forEach(entry => {
      total += entry.accessCount + 1;
      hits += entry.accessCount;
    });
    
    return total > 0 ? hits / total : 0;
  }
}

// Export singleton instance
export const cacheManager = new SmartCacheManager();

// React hook for cached data fetching
import { useEffect, useState, useCallback } from 'react';

export function useCachedFetch(url: string, options?: RequestInit) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // Check cache first
        const cached = await cacheManager.get(url);
        if (cached) {
          setData(cached);
          setLoading(false);
          
          // Refresh in background if stale
          const age = Date.now() - cached.timestamp;
          if (age > 60 * 1000) { // 1 minute
            fetch(url, options)
              .then(res => res.json())
              .then(fresh => {
                if (!cancelled) {
                  cacheManager.set(url, fresh);
                  setData(fresh);
                }
              });
          }
          return;
        }

        // Fetch fresh data
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const fresh = await response.json();
        
        if (!cancelled) {
          cacheManager.set(url, fresh);
          setData(fresh);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// Prefetch hook for route-based prefetching
export function usePrefetch() {
  const prefetch = useCallback((url: string) => {
    cacheManager.prefetch(url);
  }, []);

  const prefetchRoutes = useCallback((routes: string[]) => {
    // Prefetch route data based on user navigation patterns
    routes.forEach(route => {
      // Prefetch API endpoints for each route
      const apiEndpoints = getApiEndpointsForRoute(route);
      cacheManager.batchPrefetch(apiEndpoints);
    });
  }, []);

  return { prefetch, prefetchRoutes };
}

// Helper to get API endpoints for a route
function getApiEndpointsForRoute(route: string): string[] {
  const routeEndpoints: Record<string, string[]> = {
    '/dashboard': ['/api/user/stats', '/api/messages/recent', '/api/analytics/summary'],
    '/messages': ['/api/messages', '/api/conversations'],
    '/analytics': ['/api/analytics/revenue', '/api/analytics/engagement'],
    '/fans': ['/api/fans', '/api/fans/top-spenders']
  };

  return routeEndpoints[route] || [];
}

// Export types
export type { CacheConfig, CacheEntry };