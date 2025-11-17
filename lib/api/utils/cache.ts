/**
 * Caching utilities with Redis integration
 * Provides fallback to in-memory caching when Redis is unavailable
 */

import { Redis } from '@upstash/redis';
import { logError } from './errors';

/**
 * Redis client instance (null if not configured)
 */
let redis: Redis | null = null;

// Initialize Redis if credentials are available
if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
    console.log('[Cache] Redis client initialized');
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis:', error);
    redis = null;
  }
} else {
  console.log('[Cache] Redis not configured, using in-memory fallback');
}

/**
 * In-memory cache fallback when Redis is unavailable
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Clean up expired entries from memory cache
 */
function cleanupMemoryCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  memoryCache.forEach((entry, key) => {
    if (entry.expiresAt < now) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => memoryCache.delete(key));
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /**
   * Time-to-live in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;
  
  /**
   * Force refresh even if cached value exists
   * @default false
   */
  forceRefresh?: boolean;
  
  /**
   * Namespace prefix for cache keys
   */
  namespace?: string;
}

/**
 * Generates a cache key with optional namespace
 */
function generateCacheKey(key: string, namespace?: string): string {
  return namespace ? `${namespace}:${key}` : key;
}

/**
 * Retrieves data from cache or fetches it using the provided function
 * Automatically handles Redis or in-memory caching based on availability
 * 
 * @param key - Cache key identifier
 * @param fetcher - Function to fetch data if not in cache
 * @param options - Cache configuration options
 * @returns Cached or freshly fetched data
 * 
 * @example
 * ```typescript
 * const userData = await getCached(
 *   `user:${userId}`,
 *   async () => await fetchUserFromDB(userId),
 *   { ttl: 600, namespace: 'users' }
 * );
 * ```
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, forceRefresh = false, namespace } = options;
  const cacheKey = generateCacheKey(key, namespace);

  // Skip cache if force refresh is requested
  if (forceRefresh) {
    const data = await fetcher();
    await setCached(cacheKey, data, ttl);
    return data;
  }

  try {
    // Try Redis first if available
    if (redis) {
      const cached = await redis.get<T>(cacheKey);
      if (cached !== null) {
        console.log(`[Cache] Redis HIT: ${cacheKey}`);
        return cached;
      }
      console.log(`[Cache] Redis MISS: ${cacheKey}`);
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`[Cache] Memory HIT: ${cacheKey}`);
        return cached.data as T;
      }
      console.log(`[Cache] Memory MISS: ${cacheKey}`);
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache
    await setCached(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error(`[Cache] Error getting cached data for key ${cacheKey}:`, error);
    logError(error as Error, { cacheKey, operation: 'getCached' });
    
    // On cache error, fetch fresh data without caching
    return await fetcher();
  }
}

/**
 * Sets a value in the cache
 * 
 * @param key - Cache key identifier
 * @param data - Data to cache
 * @param ttl - Time-to-live in seconds
 */
async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`[Cache] Redis SET: ${key} (TTL: ${ttl}s)`);
    } else {
      memoryCache.set(key, {
        data,
        expiresAt: Date.now() + ttl * 1000,
      });
      console.log(`[Cache] Memory SET: ${key} (TTL: ${ttl}s)`);
    }
  } catch (error) {
    console.error(`[Cache] Error setting cache for key ${key}:`, error);
    logError(error as Error, { key, operation: 'setCached' });
  }
}

/**
 * Invalidates cache entries matching a pattern
 * 
 * @param pattern - Pattern to match cache keys (supports wildcards with Redis)
 * 
 * @example
 * ```typescript
 * // Invalidate all user-related cache
 * await invalidateCache('users:*');
 * 
 * // Invalidate specific user cache
 * await invalidateCache('users:123');
 * ```
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (redis) {
      // Redis supports pattern matching with KEYS command
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Redis INVALIDATE: ${pattern} (${keys.length} keys)`);
      }
    } else {
      // Memory cache: simple pattern matching
      const keysToDelete: string[] = [];
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      
      memoryCache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => memoryCache.delete(key));
      console.log(`[Cache] Memory INVALIDATE: ${pattern} (${keysToDelete.length} keys)`);
    }
  } catch (error) {
    console.error(`[Cache] Error invalidating cache for pattern ${pattern}:`, error);
    logError(error as Error, { pattern, operation: 'invalidateCache' });
  }
}

/**
 * Invalidates a specific cache key
 * 
 * @param key - Cache key to invalidate
 * @param namespace - Optional namespace prefix
 */
export async function invalidateCacheKey(key: string, namespace?: string): Promise<void> {
  const cacheKey = generateCacheKey(key, namespace);
  
  try {
    if (redis) {
      await redis.del(cacheKey);
      console.log(`[Cache] Redis DELETE: ${cacheKey}`);
    } else {
      memoryCache.delete(cacheKey);
      console.log(`[Cache] Memory DELETE: ${cacheKey}`);
    }
  } catch (error) {
    console.error(`[Cache] Error deleting cache key ${cacheKey}:`, error);
    logError(error as Error, { cacheKey, operation: 'invalidateCacheKey' });
  }
}

/**
 * Checks if Redis is available and connected
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Gets cache statistics (for monitoring)
 */
export function getCacheStats() {
  return {
    redisAvailable: isRedisAvailable(),
    memoryCacheSize: memoryCache.size,
    cacheType: redis ? 'redis' : 'memory',
  };
}

/**
 * Clears all cache entries (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  try {
    if (redis) {
      await redis.flushdb();
      console.log('[Cache] Redis FLUSH: All keys cleared');
    } else {
      memoryCache.clear();
      console.log('[Cache] Memory FLUSH: All keys cleared');
    }
  } catch (error) {
    console.error('[Cache] Error clearing all cache:', error);
    logError(error as Error, { operation: 'clearAllCache' });
  }
}
