/**
 * Advanced Caching Manager for Huntaze
 * Implements multi-level caching strategy with Redis and in-memory fallback
 */

import { Redis } from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Enable compression for large values
  fallbackToMemory?: boolean; // Use memory cache if Redis fails
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

class CacheManager {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, CacheEntry>();
  private readonly maxMemoryEntries = 1000;
  private readonly defaultTTL = 300; // 5 minutes

  constructor() {
    this.initializeRedis();
    this.startMemoryCleanup();
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('error', (error) => {
          console.warn('Redis connection error, falling back to memory cache:', error.message);
          this.redis = null;
        });

        await this.redis.ping();
        console.log('✅ Redis cache connected successfully');
      }
    } catch (error) {
      console.warn('Redis initialization failed, using memory cache only:', error);
      this.redis = null;
    }
  }

  private startMemoryCleanup() {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
  }

  private cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // If still too many entries, remove oldest ones
    if (this.memoryCache.size > this.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.maxMemoryEntries);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
      cleaned += toRemove.length;
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          return JSON.parse(redisValue);
        }
      }

      // Fallback to memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        const now = Date.now();
        if (now - memoryEntry.timestamp < memoryEntry.ttl * 1000) {
          return memoryEntry.data;
        } else {
          this.memoryCache.delete(key);
        }
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;
    const serializedValue = JSON.stringify(value);

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(key, ttl, serializedValue);
        
        // Store tags for invalidation
        if (options.tags) {
          for (const tag of options.tags) {
            await this.redis.sadd(`tag:${tag}`, key);
            await this.redis.expire(`tag:${tag}`, ttl);
          }
        }
      }

      // Store in memory cache as fallback
      if (options.fallbackToMemory !== false) {
        this.memoryCache.set(key, {
          data: value,
          timestamp: Date.now(),
          ttl,
          tags: options.tags,
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Always try to store in memory if Redis fails
      this.memoryCache.set(key, {
        data: value,
        timestamp: Date.now(),
        ttl,
        tags: options.tags,
      });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`tag:${tag}`);
        }
      }

      // Invalidate memory cache entries with this tag
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags?.includes(tag)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Utility method for cache-aside pattern
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  // Health check method
  async healthCheck(): Promise<{ redis: boolean; memory: boolean; entries: number }> {
    let redisHealthy = false;
    
    try {
      if (this.redis) {
        await this.redis.ping();
        redisHealthy = true;
      }
    } catch (error) {
      redisHealthy = false;
    }

    return {
      redis: redisHealthy,
      memory: true,
      entries: this.memoryCache.size,
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  analytics: (userId: string, period: string) => `analytics:${userId}:${period}`,
  socialAccounts: (userId: string) => `social:accounts:${userId}`,
  landingPageData: () => 'landing:data',
  healthCheck: (component: string) => `health:${component}`,
  apiResponse: (endpoint: string, params?: string) => `api:${endpoint}${params ? `:${params}` : ''}`,
} as const;

// Cache tags for invalidation
export const CacheTags = {
  USER: 'user',
  ANALYTICS: 'analytics',
  SOCIAL: 'social',
  LANDING: 'landing',
  HEALTH: 'health',
} as const;