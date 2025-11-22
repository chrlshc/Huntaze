/**
 * Cache Service
 * 
 * In-memory cache implementation with TTL expiration and LRU eviction.
 * Provides caching for API responses to improve performance and reduce server load.
 * 
 * Features:
 * - TTL-based expiration with automatic cleanup
 * - LRU (Least Recently Used) eviction when at max capacity
 * - Pattern-based cache invalidation with regex support
 * - Cache statistics tracking (hit rate, miss rate, eviction count)
 * - Structured error handling with correlation IDs
 * - Comprehensive logging for debugging
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * @example
 * ```typescript
 * import { cacheService } from '@/lib/services/cache.service';
 * 
 * // Store data with 60 second TTL
 * cacheService.set('user:123', userData, 60);
 * 
 * // Retrieve data
 * const data = cacheService.get<UserData>('user:123');
 * 
 * // Invalidate specific key
 * cacheService.invalidate('user:123');
 * 
 * // Invalidate pattern
 * cacheService.invalidatePattern('^user:');
 * ```
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('cache-service');

/**
 * Cache entry structure with TTL and LRU tracking
 */
interface CacheEntry<T> {
  data: T;
  expires: number;
  lastAccessed: number;
  createdAt: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  missRate: number;
}

/**
 * Cache service error types
 */
export enum CacheErrorType {
  INVALID_KEY = 'INVALID_KEY',
  INVALID_TTL = 'INVALID_TTL',
  INVALID_PATTERN = 'INVALID_PATTERN',
  EVICTION_FAILED = 'EVICTION_FAILED',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
}

/**
 * Structured cache error
 */
export class CacheError extends Error {
  constructor(
    public type: CacheErrorType,
    message: string,
    public correlationId: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };

    // Start automatic cleanup every 5 minutes
    this.startAutoCleanup(5 * 60 * 1000);

    logger.info('Cache service initialized', {
      maxSize,
      autoCleanupInterval: '5 minutes',
    });
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startAutoCleanup(intervalMs: number): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const correlationId = `cleanup-${Date.now()}`;
      try {
        const beforeSize = this.cache.size;
        this.cleanup();
        const afterSize = this.cache.size;
        const cleaned = beforeSize - afterSize;

        if (cleaned > 0) {
          logger.info('Auto cleanup completed', {
            correlationId,
            entriesCleaned: cleaned,
            remainingEntries: afterSize,
          });
        }
      } catch (error) {
        logger.error('Auto cleanup failed', error as Error, { correlationId });
      }
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  public stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Auto cleanup stopped');
    }
  }

  /**
   * Store data in cache with TTL
   * 
   * @param key - Cache key (must be non-empty string)
   * @param data - Data to cache (any serializable type)
   * @param ttlSeconds - Time to live in seconds (must be positive)
   * 
   * @throws {CacheError} If key is invalid or TTL is invalid
   * 
   * Requirements: 11.1, 11.5
   * 
   * @example
   * ```typescript
   * cacheService.set('user:123', { name: 'John' }, 60);
   * ```
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const correlationId = `set-${Date.now()}`;

    try {
      // Validation
      if (!key || typeof key !== 'string' || key.trim().length === 0) {
        throw new CacheError(
          CacheErrorType.INVALID_KEY,
          'Cache key must be a non-empty string',
          correlationId,
          { key }
        );
      }

      if (typeof ttlSeconds !== 'number' || ttlSeconds <= 0 || !isFinite(ttlSeconds)) {
        throw new CacheError(
          CacheErrorType.INVALID_TTL,
          'TTL must be a positive number',
          correlationId,
          { ttlSeconds }
        );
      }

      // Evict LRU entry if at capacity
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }

      const now = Date.now();
      this.cache.set(key, {
        data,
        expires: now + (ttlSeconds * 1000),
        lastAccessed: now,
        createdAt: now,
      });

      logger.info('Cache entry set', {
        correlationId,
        key,
        ttlSeconds,
        cacheSize: this.cache.size,
      });
    } catch (error) {
      if (error instanceof CacheError) {
        logger.warn('Cache set validation failed', {
          correlationId,
          error: error.message,
          type: error.type,
        });
        throw error;
      }

      logger.error('Unexpected error setting cache', error as Error, {
        correlationId,
        key,
      });
      throw new CacheError(
        CacheErrorType.SERIALIZATION_ERROR,
        'Failed to set cache entry',
        correlationId,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Retrieve data from cache
   * Returns null if key doesn't exist or has expired
   * 
   * @param key - Cache key
   * @returns Cached data or null
   * 
   * Requirements: 11.2, 11.3
   * 
   * @example
   * ```typescript
   * const user = cacheService.get<User>('user:123');
   * if (user) {
   *   console.log('Cache hit:', user);
   * } else {
   *   console.log('Cache miss');
   * }
   * ```
   */
  get<T>(key: string): T | null {
    const correlationId = `get-${Date.now()}`;

    try {
      // Validation
      if (!key || typeof key !== 'string') {
        logger.warn('Invalid cache key for get', {
          correlationId,
          key,
        });
        this.stats.misses++;
        return null;
      }

      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        logger.info('Cache miss - key not found', {
          correlationId,
          key,
        });
        return null;
      }

      const now = Date.now();

      // Check expiration
      if (now > entry.expires) {
        this.cache.delete(key);
        this.stats.misses++;
        logger.info('Cache miss - entry expired', {
          correlationId,
          key,
          expiredAt: new Date(entry.expires).toISOString(),
          age: now - entry.createdAt,
        });
        return null;
      }

      // Update last accessed time for LRU
      entry.lastAccessed = now;
      this.stats.hits++;

      logger.info('Cache hit', {
        correlationId,
        key,
        age: now - entry.createdAt,
        ttlRemaining: entry.expires - now,
      });

      return entry.data as T;
    } catch (error) {
      logger.error('Error retrieving from cache', error as Error, {
        correlationId,
        key,
      });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Check if a key exists and is not expired
   * 
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check expiration
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate a specific cache entry
   * 
   * @param key - Cache key to invalidate
   * 
   * Requirements: 11.4
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries matching a pattern
   * 
   * @param pattern - Regex pattern to match keys
   * @throws {CacheError} If pattern is invalid regex
   * 
   * Requirements: 11.4
   * 
   * @example
   * ```typescript
   * // Invalidate all user cache entries
   * cacheService.invalidatePattern('^user:');
   * 
   * // Invalidate all stats
   * cacheService.invalidatePattern('stats$');
   * ```
   */
  invalidatePattern(pattern: string): number {
    const correlationId = `invalidate-pattern-${Date.now()}`;

    try {
      // Validation
      if (!pattern || typeof pattern !== 'string') {
        throw new CacheError(
          CacheErrorType.INVALID_PATTERN,
          'Pattern must be a non-empty string',
          correlationId,
          { pattern }
        );
      }

      let regex: RegExp;
      try {
        regex = new RegExp(pattern);
      } catch (error) {
        throw new CacheError(
          CacheErrorType.INVALID_PATTERN,
          'Invalid regex pattern',
          correlationId,
          { pattern, error: (error as Error).message }
        );
      }

      let invalidatedCount = 0;
      const keysToDelete: string[] = [];

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.cache.delete(key);
        invalidatedCount++;
      }

      logger.info('Cache pattern invalidation completed', {
        correlationId,
        pattern,
        invalidatedCount,
        remainingSize: this.cache.size,
      });

      return invalidatedCount;
    } catch (error) {
      if (error instanceof CacheError) {
        logger.warn('Cache pattern invalidation failed', {
          correlationId,
          error: error.message,
          type: error.type,
        });
        throw error;
      }

      logger.error('Unexpected error invalidating pattern', error as Error, {
        correlationId,
        pattern,
      });
      throw new CacheError(
        CacheErrorType.INVALID_PATTERN,
        'Failed to invalidate pattern',
        correlationId,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Clear all cache entries
   * 
   * Requirements: 11.4
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Evict the least recently used entry
   * 
   * Requirements: 11.5
   */
  private evictLRU(): void {
    const correlationId = `evict-${Date.now()}`;

    try {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        this.cache.delete(oldestKey);
        this.stats.evictions++;

        logger.info('LRU eviction performed', {
          correlationId,
          evictedKey: oldestKey,
          age: entry ? Date.now() - entry.createdAt : 0,
          lastAccessed: entry ? new Date(entry.lastAccessed).toISOString() : null,
          remainingSize: this.cache.size,
        });
      } else {
        logger.warn('LRU eviction attempted but no entries found', {
          correlationId,
          cacheSize: this.cache.size,
        });
      }
    } catch (error) {
      logger.error('LRU eviction failed', error as Error, {
        correlationId,
        cacheSize: this.cache.size,
      });
      throw new CacheError(
        CacheErrorType.EVICTION_FAILED,
        'Failed to evict LRU entry',
        correlationId,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics including hit rate, miss rate, and eviction count
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get current cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Clean up expired entries
   * This can be called periodically to free up memory
   * 
   * @returns Number of entries cleaned up
   * 
   * @example
   * ```typescript
   * const cleaned = cacheService.cleanup();
   * console.log(`Cleaned ${cleaned} expired entries`);
   * ```
   */
  cleanup(): number {
    const correlationId = `cleanup-${Date.now()}`;
    const startTime = Date.now();

    try {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.cache.delete(key);
      }

      const duration = Date.now() - startTime;

      if (keysToDelete.length > 0) {
        logger.info('Cache cleanup completed', {
          correlationId,
          cleanedCount: keysToDelete.length,
          remainingSize: this.cache.size,
          duration,
        });
      }

      return keysToDelete.length;
    } catch (error) {
      logger.error('Cache cleanup failed', error as Error, {
        correlationId,
        duration: Date.now() - startTime,
      });
      return 0;
    }
  }

  /**
   * Get or set cache entry with a factory function
   * Useful for lazy loading data
   * 
   * @param key - Cache key
   * @param factory - Function to generate data if not cached
   * @param ttlSeconds - Time to live in seconds
   * @returns Cached or newly generated data
   * 
   * @example
   * ```typescript
   * const user = await cacheService.getOrSet(
   *   'user:123',
   *   async () => await fetchUser(123),
   *   60
   * );
   * ```
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const correlationId = `get-or-set-${Date.now()}`;

    try {
      // Try to get from cache first
      const cached = this.get<T>(key);
      if (cached !== null) {
        logger.info('Cache hit in getOrSet', { correlationId, key });
        return cached;
      }

      // Generate new data
      logger.info('Cache miss in getOrSet, calling factory', {
        correlationId,
        key,
      });

      const data = await factory();

      // Store in cache
      this.set(key, data, ttlSeconds);

      logger.info('Factory data cached', {
        correlationId,
        key,
        ttlSeconds,
      });

      return data;
    } catch (error) {
      logger.error('getOrSet failed', error as Error, {
        correlationId,
        key,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
