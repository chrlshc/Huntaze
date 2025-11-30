/**
 * Application-level cache middleware for API routes
 * Implements cache-first strategy with tag-based invalidation
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
  staleWhileRevalidate?: number; // Additional time to serve stale data
  isRevalidating?: boolean; // Flag to prevent duplicate revalidation
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  tags?: string[]; // Tags for invalidation
  key?: string; // Custom cache key
  staleWhileRevalidate?: number; // Additional time to serve stale data while revalidating
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

class APICache {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };
    this.maxSize = maxSize;
  }

  /**
   * Get data from cache
   * Returns null if not found or expired (unless stale-while-revalidate)
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      // If stale-while-revalidate is enabled, serve stale data
      if (entry.staleWhileRevalidate && age <= entry.ttl + entry.staleWhileRevalidate) {
        // Mark as stale but still serve it
        entry.accessCount++;
        entry.lastAccessed = now;
        this.stats.hits++;
        return entry.data as T;
      }

      // Completely expired, remove from cache
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Check if cache entry is stale (expired but within stale-while-revalidate window)
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;

    return age > entry.ttl && entry.staleWhileRevalidate !== undefined;
  }

  /**
   * Mark entry as revalidating
   */
  markRevalidating(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.isRevalidating = true;
    }
  }

  /**
   * Check if entry is currently revalidating
   */
  isRevalidating(key: string): boolean {
    const entry = this.cache.get(key);
    return entry?.isRevalidating || false;
  }

  /**
   * Set data in cache
   * Implements LRU eviction when cache is full
   */
  set<T = any>(key: string, data: T, options: CacheOptions): void {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: options.ttl,
      tags: options.tags || [],
      accessCount: 0,
      lastAccessed: now,
      staleWhileRevalidate: options.staleWhileRevalidate,
      isRevalidating: false,
    };

    const isNew = !this.cache.has(key);
    this.cache.set(key, entry);

    if (isNew) {
      this.stats.size++;
    }
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
        this.stats.size--;
      }
    }

    return invalidated;
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size--;
    }
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }
}

// Global cache instance
const apiCache = new APICache(1000);

/**
 * Cache middleware for API routes
 * Checks cache before executing handler
 * Supports stale-while-revalidate pattern
 */
export function withCache<T = any>(
  handler: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const key = options.key || generateKey(handler);

  // Check cache first
  const cached = apiCache.get<T>(key);
  
  if (cached !== null) {
    // If data is stale and not already revalidating, revalidate in background
    if (apiCache.isStale(key) && !apiCache.isRevalidating(key)) {
      apiCache.markRevalidating(key);
      
      // Revalidate in background (don't await)
      handler()
        .then((result) => {
          apiCache.set(key, result, options);
        })
        .catch((error) => {
          console.error('Background revalidation failed:', error);
          // Keep serving stale data on error
        });
    }
    
    return Promise.resolve(cached);
  }

  // Execute handler and cache result
  return handler().then((result) => {
    apiCache.set(key, result, options);
    return result;
  });
}

/**
 * Invalidate cache by tag
 */
export function invalidateCacheByTag(tag: string): number {
  return apiCache.invalidateByTag(tag);
}

/**
 * Invalidate specific cache key
 */
export function invalidateCache(key: string): boolean {
  return apiCache.invalidate(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return apiCache.getStats();
}

/**
 * Get cache hit rate
 */
export function getCacheHitRate(): number {
  return apiCache.getHitRate();
}

/**
 * Generate cache key from handler
 */
function generateKey(handler: Function): string {
  return `cache_${handler.toString().slice(0, 50)}`;
}

/**
 * Cache configuration presets based on data volatility
 */
export const CachePresets = {
  // High volatility: 30 seconds, serve stale for 1 minute
  HIGH: { 
    ttl: 30 * 1000,
    staleWhileRevalidate: 60 * 1000,
  },
  
  // Medium volatility: 5 minutes, serve stale for 10 minutes
  MEDIUM: { 
    ttl: 5 * 60 * 1000,
    staleWhileRevalidate: 10 * 60 * 1000,
  },
  
  // Low volatility: 1 hour, serve stale for 2 hours
  LOW: { 
    ttl: 60 * 60 * 1000,
    staleWhileRevalidate: 2 * 60 * 60 * 1000,
  },
  
  // Static: 24 hours, serve stale for 7 days
  STATIC: { 
    ttl: 24 * 60 * 60 * 1000,
    staleWhileRevalidate: 7 * 24 * 60 * 60 * 1000,
  },
} as const;

export { apiCache };
