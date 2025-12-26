import { Redis } from '@upstash/redis';

// Lazy Redis client initialization to avoid build-time errors
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) {
    return redis;
  }
  
  redisInitialized = true;
  
  // Check if Redis is configured
  if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('Redis not configured - caching disabled');
    return null;
  }
  
  try {
    // Try Upstash first (preferred)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    // Fallback to regular Redis URL (but Upstash client requires HTTPS)
    else if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('https')) {
      redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN || '',
      });
    }
    else {
      console.warn('Redis URL not compatible with Upstash client (requires HTTPS) - caching disabled');
      return null;
    }
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
  
  return redis;
}

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  DASHBOARD: 5 * 60, // 5 minutes
  ANALYTICS: 10 * 60, // 10 minutes
  CAMPAIGNS: 2 * 60, // 2 minutes
  MESSAGES: 30, // 30 seconds
  CONTENT: 5 * 60, // 5 minutes
  FANS: 5 * 60, // 5 minutes
  PPV: 2 * 60, // 2 minutes
} as const;

// Cache key prefixes
export const CACHE_PREFIX = {
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  CAMPAIGNS: 'campaigns',
  MESSAGES: 'messages',
  CONTENT: 'content',
  FANS: 'fans',
  PPV: 'ppv',
} as const;

/**
 * Generate a cache key with prefix and identifier
 */
export function getCacheKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) {
    console.warn('Redis not configured, skipping cache get');
    return null;
  }

  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn('Redis not configured, skipping cache set');
    return false;
  }

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete data from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn('Redis not configured, skipping cache delete');
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn('Redis not configured, skipping cache pattern delete');
    return false;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Redis pattern delete error:', error);
    return false;
  }
}

/**
 * Get or set cache with a fallback function
 */
export async function getCacheOrSet<T>(
  key: string,
  ttl: number,
  fallback: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, execute fallback
  const data = await fallback();

  // Store in cache for next time
  await setCache(key, data, ttl);

  return data;
}

/**
 * Invalidate cache for a specific prefix
 */
export async function invalidateCachePrefix(prefix: string): Promise<boolean> {
  return deleteCachePattern(`${prefix}:*`);
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis ping error:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  keyCount: number;
}> {
  const redis = getRedis();
  if (!redis) {
    return { available: false, keyCount: 0 };
  }

  try {
    const keys = await redis.keys('*');
    return {
      available: true,
      keyCount: keys.length,
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return { available: false, keyCount: 0 };
  }
}

// Export a getter function instead of the client directly
const redisCache = {
  get client() {
    return getRedis();
  }
};

export default redisCache;
