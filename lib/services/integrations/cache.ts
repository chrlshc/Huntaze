/**
 * Integration Status Cache
 * 
 * Implements in-memory caching for integration status with TTL support.
 * Requirements: 10.1, 10.2
 * 
 * Features:
 * - 5-minute TTL for integration status
 * - Per-user cache isolation
 * - Automatic cache invalidation on TTL expiry
 * - Manual cache invalidation support
 * - Memory-efficient with automatic cleanup
 * - Error handling with try-catch boundaries
 * - Retry strategies for fetch failures with exponential backoff
 * - Structured logging for debugging
 * - TypeScript types for all responses
 * 
 * @module lib/services/integrations/cache
 */

import type { Integration } from './types';
import { createLogger } from '@/lib/utils/logger';

// Initialize logger for cache operations
const logger = createLogger('integration-cache');

// ============================================================================
// Constants
// ============================================================================

/**
 * Cache TTL: 5 minutes (as specified in design document)
 */
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// ============================================================================
// Types
// ============================================================================

/**
 * Cache entry with data and expiration timestamp
 */
interface CacheEntry {
  data: Integration[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache error types for structured error handling
 */
export enum CacheErrorType {
  FETCH_FAILED = 'FETCH_FAILED',
  CACHE_SET_FAILED = 'CACHE_SET_FAILED',
  CACHE_GET_FAILED = 'CACHE_GET_FAILED',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED',
}

/**
 * Cache error with retry information
 */
export class CacheError extends Error {
  constructor(
    public type: CacheErrorType,
    message: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Retry configuration for fetch operations
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};

// ============================================================================
// Cache Implementation
// ============================================================================

/**
 * In-memory cache for integration status
 * 
 * Uses Map for O(1) lookups and stores per-user integration data.
 * Each entry includes timestamp for TTL validation.
 */
class IntegrationCache {
  private cache: Map<number, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    
    // Start automatic cleanup of expired entries every minute
    this.startCleanup();
  }

  /**
   * Get cached integrations for a user
   * 
   * @param userId - User ID
   * @returns Cached integrations or null if cache miss/expired
   * @throws CacheError if cache operation fails
   */
  get(userId: number): Integration[] | null {
    try {
      const entry = this.cache.get(userId);
      
      if (!entry) {
        logger.info('Cache miss', { userId });
        return null; // Cache miss
      }
      
      // Check if entry has expired
      const now = Date.now();
      if (now >= entry.expiresAt) {
        logger.info('Cache expired', { 
          userId, 
          age: now - entry.timestamp,
          ttl: entry.expiresAt - entry.timestamp,
        });
        this.cache.delete(userId); // Remove expired entry
        return null; // Cache expired
      }
      
      logger.info('Cache hit', { 
        userId, 
        age: now - entry.timestamp,
        remaining: entry.expiresAt - now,
      });
      
      return entry.data;
    } catch (error) {
      logger.error('Cache get failed', error as Error, { userId });
      throw new CacheError(
        CacheErrorType.CACHE_GET_FAILED,
        `Failed to get cache for user ${userId}`,
        false,
        error as Error
      );
    }
  }

  /**
   * Set cached integrations for a user
   * 
   * @param userId - User ID
   * @param data - Integration data to cache
   * @param ttl - Time to live in milliseconds (defaults to CACHE_TTL)
   * @throws CacheError if cache operation fails
   */
  set(userId: number, data: Integration[], ttl: number = CACHE_TTL): void {
    try {
      const now = Date.now();
      
      this.cache.set(userId, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      });
      
      logger.info('Cache set', { 
        userId, 
        itemCount: data.length,
        ttl,
        expiresAt: new Date(now + ttl).toISOString(),
      });
    } catch (error) {
      logger.error('Cache set failed', error as Error, { userId, itemCount: data.length });
      throw new CacheError(
        CacheErrorType.CACHE_SET_FAILED,
        `Failed to set cache for user ${userId}`,
        false,
        error as Error
      );
    }
  }

  /**
   * Check if cache has valid entry for user
   * 
   * @param userId - User ID
   * @returns True if cache has valid (non-expired) entry
   */
  has(userId: number): boolean {
    const entry = this.cache.get(userId);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(userId);
      return false;
    }
    
    return true;
  }

  /**
   * Invalidate cache for a specific user
   * 
   * @param userId - User ID
   */
  invalidate(userId: number): void {
    this.cache.delete(userId);
    logger.info('Cache invalidated', { userId });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache size (number of entries)
   * 
   * @returns Number of cached entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics including size and expired entries
   */
  getStats(): {
    size: number;
    expired: number;
    active: number;
  } {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const entry of this.cache.values()) {
      if (now >= entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      size: this.cache.size,
      expired,
      active,
    };
  }

  /**
   * Start automatic cleanup of expired entries
   * 
   * Runs every minute to remove expired entries and free memory
   */
  private startCleanup(): void {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000);
    
    // Ensure cleanup doesn't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up expired cache entries
   * 
   * @returns Number of entries removed
   * @throws CacheError if cleanup fails
   */
  cleanupExpired(): number {
    try {
      const now = Date.now();
      let removed = 0;
      
      for (const [userId, entry] of this.cache.entries()) {
        if (now >= entry.expiresAt) {
          this.cache.delete(userId);
          removed++;
        }
      }
      
      if (removed > 0) {
        logger.info('Cache cleanup completed', { 
          removed, 
          remaining: this.cache.size,
        });
      }
      
      return removed;
    } catch (error) {
      logger.error('Cache cleanup failed', error as Error);
      throw new CacheError(
        CacheErrorType.CLEANUP_FAILED,
        'Failed to cleanup expired cache entries',
        true,
        error as Error
      );
    }
  }

  /**
   * Stop automatic cleanup
   * 
   * Should be called when shutting down the service
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Cache cleanup stopped');
    }
  }

  /**
   * Get time until cache entry expires
   * 
   * @param userId - User ID
   * @returns Milliseconds until expiry, or null if no entry
   */
  getTimeToExpiry(userId: number): number | null {
    const entry = this.cache.get(userId);
    
    if (!entry) {
      return null;
    }
    
    const ttl = entry.expiresAt - Date.now();
    return ttl > 0 ? ttl : 0;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton cache instance
 * 
 * Use this instance throughout the application for consistent caching
 */
export const integrationCache = new IntegrationCache();

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @param context - Context for logging
 * @returns Result of the function
 * @throws CacheError if all retries are exhausted
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: Record<string, any> = {}
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      logger.info('Retry attempt', { attempt, maxRetries: config.maxRetries, ...context });
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable (network errors)
      const isRetryable = 
        error instanceof Error &&
        (error.message.includes('ECONNREFUSED') ||
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('ENOTFOUND') ||
         error.message.includes('ENETUNREACH') ||
         error.message.includes('fetch failed'));
      
      if (!isRetryable || attempt >= config.maxRetries) {
        logger.warn('Retry exhausted or non-retryable error', { 
          attempt, 
          maxRetries: config.maxRetries,
          error: error instanceof Error ? error.message : String(error),
          isRetryable,
          ...context,
        });
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      logger.info('Retrying after delay', { 
        attempt, 
        delay, 
        error: error instanceof Error ? error.message : String(error),
        ...context,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new CacheError(
    CacheErrorType.RETRY_EXHAUSTED,
    `Failed after ${config.maxRetries} retries`,
    false,
    lastError
  );
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Get cached integrations with automatic fetch on miss
 * 
 * This is a convenience function that combines cache lookup with
 * automatic fetching and caching on miss. Includes retry logic
 * with exponential backoff for fetch failures.
 * 
 * @param userId - User ID
 * @param fetchFn - Function to fetch integrations on cache miss
 * @param retryConfig - Optional retry configuration
 * @returns Cached or freshly fetched integrations
 * @throws CacheError if fetch fails after all retries
 * 
 * @example
 * ```typescript
 * const integrations = await getCachedIntegrations(
 *   userId,
 *   async () => {
 *     const response = await fetch('/api/integrations/status');
 *     return response.json();
 *   }
 * );
 * ```
 */
export async function getCachedIntegrations(
  userId: number,
  fetchFn: () => Promise<Integration[]>,
  retryConfig?: RetryConfig
): Promise<Integration[]> {
  const startTime = Date.now();
  
  try {
    // Try to get from cache
    const cached = integrationCache.get(userId);
    
    if (cached) {
      logger.info('Cache hit', { 
        userId, 
        itemCount: cached.length,
        duration: Date.now() - startTime,
      });
      return cached;
    }
    
    logger.info('Cache miss, fetching fresh data', { userId });
    
    // Fetch fresh data with retry logic
    const fresh = await retryWithBackoff(
      fetchFn,
      retryConfig,
      { userId, operation: 'fetchIntegrations' }
    );
    
    // Store in cache
    integrationCache.set(userId, fresh);
    
    logger.info('Fresh data fetched and cached', { 
      userId, 
      itemCount: fresh.length,
      duration: Date.now() - startTime,
    });
    
    return fresh;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to get cached integrations', error as Error, { 
      userId, 
      duration,
    });
    
    // If it's already a CacheError, rethrow it
    if (error instanceof CacheError) {
      throw error;
    }
    
    // Wrap other errors
    throw new CacheError(
      CacheErrorType.FETCH_FAILED,
      `Failed to fetch integrations for user ${userId}`,
      true,
      error as Error
    );
  }
}

/**
 * Get cached integrations with fallback to empty array
 * 
 * Similar to getCachedIntegrations but returns empty array if fetch fails.
 * Useful for graceful degradation when the API is unavailable.
 * 
 * @param userId - User ID
 * @param fetchFn - Function to fetch integrations on cache miss
 * @param retryConfig - Optional retry configuration
 * @returns Cached, fresh, or empty array if all fails
 * 
 * @example
 * ```typescript
 * const integrations = await getCachedIntegrationsWithFallback(
 *   userId,
 *   async () => {
 *     const response = await fetch('/api/integrations/status');
 *     return response.json();
 *   }
 * );
 * // Always returns an array, never throws
 * ```
 */
export async function getCachedIntegrationsWithFallback(
  userId: number,
  fetchFn: () => Promise<Integration[]>,
  retryConfig?: RetryConfig
): Promise<Integration[]> {
  try {
    return await getCachedIntegrations(userId, fetchFn, retryConfig);
  } catch (error) {
    logger.warn('Fetch failed, returning empty array', { 
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Return empty array as fallback
    return [];
  }
}
