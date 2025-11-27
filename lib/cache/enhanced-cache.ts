/**
 * Enhanced Cache Manager
 * Multi-level caching with stale-while-revalidate, tag-based invalidation, and offline support
 */

export interface CacheOptions {
  level?: 'browser' | 'redis' | 'all';
  ttl?: number;
  tags?: string[];
  staleTime?: number; // Time before considered stale
  revalidateTime?: number; // Time before revalidation
  fallbackToStale?: boolean;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  metadata: {
    createdAt: Date;
    expiresAt: Date;
    lastAccessed: Date;
    accessCount: number;
    tags: string[];
    size: number;
    level: 'browser' | 'redis';
  };
}

export interface RevalidationOptions {
  staleTime: number;
  revalidateTime: number;
  fallbackToStale: boolean;
}

/**
 * Enhanced Cache Manager with multi-level support
 */
export class EnhancedCacheManager {
  private browserCache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys
  private revalidationQueue = new Map<string, Promise<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const level = options?.level || 'browser';

    if (level === 'browser' || level === 'all') {
      const entry = this.browserCache.get(key);
      
      if (entry) {
        // Update access metadata
        entry.metadata.lastAccessed = new Date();
        entry.metadata.accessCount++;

        // Check if expired
        if (new Date() > entry.metadata.expiresAt) {
          this.browserCache.delete(key);
          return null;
        }

        return entry.value as T;
      }
    }

    // TODO: Add Redis support when needed
    if (level === 'redis' || level === 'all') {
      // For now, return null - Redis integration can be added later
      return null;
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000, options?: CacheOptions): Promise<void> {
    const level = options?.level || 'browser';
    const tags = options?.tags || [];

    const now = new Date();
    const entry: CacheEntry<T> = {
      key,
      value,
      metadata: {
        createdAt: now,
        expiresAt: new Date(now.getTime() + ttl),
        lastAccessed: now,
        accessCount: 0,
        tags,
        size: this.estimateSize(value),
        level: level === 'redis' ? 'redis' : 'browser',
      },
    };

    if (level === 'browser' || level === 'all') {
      this.browserCache.set(key, entry);

      // Update tag index
      tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      });

      // Notify subscribers
      this.notifySubscribers(key, value);
    }

    // TODO: Add Redis support when needed
    if (level === 'redis' || level === 'all') {
      // Redis implementation would go here
    }
  }

  /**
   * Invalidate cache by pattern or tags
   */
  async invalidate(pattern: string): Promise<void> {
    // Check if it's a tag (starts with #)
    if (pattern.startsWith('#')) {
      const tag = pattern.substring(1);
      const keys = this.tagIndex.get(tag);
      
      if (keys) {
        keys.forEach((key) => {
          this.browserCache.delete(key);
          this.notifySubscribers(key, null);
        });
        this.tagIndex.delete(tag);
      }
      return;
    }

    // Pattern matching for keys
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const [key] of this.browserCache) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      const entry = this.browserCache.get(key);
      if (entry) {
        // Remove from tag index
        entry.metadata.tags.forEach((tag) => {
          const tagKeys = this.tagIndex.get(tag);
          if (tagKeys) {
            tagKeys.delete(key);
            if (tagKeys.size === 0) {
              this.tagIndex.delete(tag);
            }
          }
        });
      }
      
      this.browserCache.delete(key);
      this.notifySubscribers(key, null);
    });
  }

  /**
   * Stale-while-revalidate strategy
   */
  async getWithRevalidation<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: RevalidationOptions
  ): Promise<T> {
    const {
      staleTime = 60 * 1000, // 1 minute
      revalidateTime = 5 * 60 * 1000, // 5 minutes
      fallbackToStale = true,
    } = options || {};

    const cached = await this.get<T>(key);
    const now = Date.now();

    if (cached) {
      const entry = this.browserCache.get(key);
      if (entry) {
        const age = now - entry.metadata.createdAt.getTime();

        // Fresh data - return immediately
        if (age < staleTime) {
          return cached;
        }

        // Stale but within revalidation window - return stale and revalidate in background
        if (age < revalidateTime) {
          // Start background revalidation if not already running
          if (!this.revalidationQueue.has(key)) {
            const revalidationPromise = this.revalidateInBackground(key, fetcher);
            this.revalidationQueue.set(key, revalidationPromise);
          }
          
          return cached; // Return stale data immediately
        }

        // Too old - fetch fresh data
        if (fallbackToStale) {
          // Try to fetch fresh, but return stale if it fails
          try {
            const fresh = await fetcher();
            await this.set(key, fresh, revalidateTime);
            this.revalidationQueue.delete(key);
            return fresh;
          } catch (error) {
            console.warn(`Failed to revalidate ${key}, returning stale data:`, error);
            return cached;
          }
        }
      }
    }

    // No cached data - fetch fresh
    const fresh = await fetcher();
    await this.set(key, fresh, revalidateTime);
    return fresh;
  }

  /**
   * Revalidate in background
   */
  private async revalidateInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    try {
      const fresh = await fetcher();
      await this.set(key, fresh);
    } catch (error) {
      console.warn(`Background revalidation failed for ${key}:`, error);
    } finally {
      this.revalidationQueue.delete(key);
    }
  }

  /**
   * Preload critical data
   */
  async preload(keys: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>): Promise<void> {
    const promises = keys.map(async ({ key, fetcher, ttl }) => {
      try {
        const data = await fetcher();
        await this.set(key, data, ttl);
      } catch (error) {
        console.error(`Failed to preload ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    tags: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let totalSize = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    for (const [, entry] of this.browserCache) {
      totalSize += entry.metadata.size;

      if (!oldestEntry || entry.metadata.createdAt < oldestEntry) {
        oldestEntry = entry.metadata.createdAt;
      }

      if (!newestEntry || entry.metadata.createdAt > newestEntry) {
        newestEntry = entry.metadata.createdAt;
      }
    }

    return {
      totalEntries: this.browserCache.size,
      totalSize,
      tags: this.tagIndex.size,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Subscribe to cache changes
   */
  subscribe<T>(key: string, callback: (data: T | null) => void): () => void {
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

  /**
   * Notify subscribers of cache changes
   */
  private notifySubscribers(key: string, data: any): void {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach((callback) => callback(data));
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.browserCache.clear();
    this.tagIndex.clear();
    this.revalidationQueue.clear();
    
    // Notify all subscribers
    this.subscribers.forEach((subscribers, key) => {
      subscribers.forEach((callback) => callback(null));
    });
  }

  /**
   * Estimate size of value (rough approximation)
   */
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Get with offline fallback
   */
  async getWithOfflineFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<{ data: T; isStale: boolean }> {
    const cached = await this.get<T>(key, options);

    // If online, try to fetch fresh data
    if (this.isOnline()) {
      try {
        const fresh = await fetcher();
        await this.set(key, fresh, options?.ttl, options);
        return { data: fresh, isStale: false };
      } catch (error) {
        // If fetch fails but we have cached data, return it
        if (cached && options?.fallbackToStale !== false) {
          console.warn(`Failed to fetch ${key}, using cached data:`, error);
          return { data: cached, isStale: true };
        }
        throw error;
      }
    }

    // If offline and we have cached data, return it
    if (cached) {
      return { data: cached, isStale: true };
    }

    throw new Error(`No cached data available for ${key} while offline`);
  }
}

// Singleton instance
let cacheManagerInstance: EnhancedCacheManager | null = null;

/**
 * Get enhanced cache manager instance
 */
export function getEnhancedCacheManager(): EnhancedCacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new EnhancedCacheManager();
  }
  return cacheManagerInstance;
}
