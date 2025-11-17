/**
 * Sliding Window Rate Limiter
 * 
 * Implements a sliding window algorithm using Redis sorted sets.
 * More accurate than fixed window and prevents boundary gaming.
 * 
 * Features:
 * - Atomic operations via Lua scripts
 * - Fail-open strategy (allows requests on Redis errors)
 * - Multiple time window support
 * - Automatic cleanup of expired entries
 * - Retry logic for transient Redis errors
 * - Comprehensive logging for debugging
 * 
 * @example
 * ```typescript
 * const limiter = new SlidingWindowLimiter();
 * const result = await limiter.check('rate:user:123:/api/endpoint', 100, 60000);
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Rate limit exceeded' });
 * }
 * ```
 */

import { RateLimitResult } from './types';
import redis from '../../cache/redis';

// Retry configuration for transient Redis errors
const RETRY_CONFIG = {
  maxAttempts: 2, // Retry once on Redis errors
  retryDelay: 50, // 50ms delay between retries
} as const;

/**
 * Sliding Window Rate Limiter
 * 
 * Uses Redis sorted sets to track requests within a sliding time window.
 * Each request is stored with its timestamp as the score.
 */
export class SlidingWindowLimiter {
  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `sw-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if a request is allowed under the rate limit
   * 
   * @param key Redis key for this rate limit (e.g., "rate:user:123:/api/endpoint")
   * @param limit Maximum number of requests allowed in the window
   * @param windowMs Time window in milliseconds
   * @param correlationId Optional correlation ID for tracking
   * @returns Rate limit result
   */
  async check(
    key: string,
    limit: number,
    windowMs: number,
    correlationId?: string
  ): Promise<RateLimitResult> {
    const corrId = correlationId || this.generateCorrelationId();

    if (!redis) {
      console.warn('[SlidingWindow] Redis not available, allowing request', {
        key,
        correlationId: corrId,
      });
      
      return {
        allowed: true,
        limit: 0,
        remaining: 0,
        resetAt: new Date(Date.now() + windowMs),
      };
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const resetAt = new Date(now + windowMs);

    // Retry logic for transient errors
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        console.log('[SlidingWindow] Checking rate limit', {
          key,
          limit,
          windowMs,
          attempt,
          correlationId: corrId,
        });

        // Use Lua script for atomic operations
        const script = `
          local key = KEYS[1]
          local now = tonumber(ARGV[1])
          local windowStart = tonumber(ARGV[2])
          local limit = tonumber(ARGV[3])
          local windowMs = tonumber(ARGV[4])
          
          -- Remove old entries outside the window
          redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
          
          -- Count requests in current window
          local count = redis.call('ZCARD', key)
          
          -- Check if limit exceeded
          if count >= limit then
            return {0, count, limit}
          end
          
          -- Add current request
          local requestId = now .. '-' .. math.random(1000000)
          redis.call('ZADD', key, now, requestId)
          
          -- Set expiry (window + 1 second buffer)
          redis.call('EXPIRE', key, math.ceil(windowMs / 1000) + 1)
          
          return {1, count + 1, limit}
        `;

        // Execute Lua script
        const result = await redis.eval(
          script,
          [key],
          [now.toString(), windowStart.toString(), limit.toString(), windowMs.toString()]
        ) as number[];

        const allowed = result[0] === 1;
        const count = result[1];
        const maxLimit = result[2];

        console.log('[SlidingWindow] Rate limit check result', {
          key,
          allowed,
          count,
          limit: maxLimit,
          remaining: Math.max(0, maxLimit - count),
          correlationId: corrId,
        });

        return {
          allowed,
          limit: maxLimit,
          remaining: Math.max(0, maxLimit - count),
          resetAt,
          retryAfter: allowed ? undefined : Math.ceil(windowMs / 1000),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error('[SlidingWindow] Rate limiter error', {
          key,
          attempt,
          maxAttempts: RETRY_CONFIG.maxAttempts,
          error: lastError.message,
          correlationId: corrId,
        });

        // Last attempt - fail open
        if (attempt === RETRY_CONFIG.maxAttempts) {
          console.error('[SlidingWindow] All retry attempts failed, failing open', {
            key,
            correlationId: corrId,
          });
          
          return {
            allowed: true,
            limit: 0,
            remaining: 0,
            resetAt,
          };
        }

        // Wait before retry
        await this.sleep(RETRY_CONFIG.retryDelay);
      }
    }

    // Fallback (should never reach here)
    console.error('[SlidingWindow] Unexpected fallback, failing open', {
      key,
      correlationId: corrId,
    });
    
    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetAt,
    };
  }

  /**
   * Check multiple time windows (e.g., per-minute, per-hour, per-day)
   * 
   * @param baseKey Base Redis key
   * @param windows Array of {limit, windowMs} configurations
   * @param correlationId Optional correlation ID for tracking
   * @returns Array of rate limit results, one per window
   * 
   * @example
   * ```typescript
   * const results = await limiter.checkMultipleWindows('rate:user:123', [
   *   { limit: 10, windowMs: 60000 },    // 10 per minute
   *   { limit: 100, windowMs: 3600000 }, // 100 per hour
   * ]);
   * 
   * // Check if any window is exceeded
   * const blocked = results.some(r => !r.allowed);
   * ```
   */
  async checkMultipleWindows(
    baseKey: string,
    windows: Array<{ limit: number; windowMs: number }>,
    correlationId?: string
  ): Promise<RateLimitResult[]> {
    const corrId = correlationId || this.generateCorrelationId();

    console.log('[SlidingWindow] Checking multiple windows', {
      baseKey,
      windowCount: windows.length,
      correlationId: corrId,
    });

    const results = await Promise.all(
      windows.map((window) => {
        const key = `${baseKey}:${window.windowMs}`;
        return this.check(key, window.limit, window.windowMs, corrId);
      })
    );

    const anyBlocked = results.some(r => !r.allowed);
    console.log('[SlidingWindow] Multiple windows check complete', {
      baseKey,
      anyBlocked,
      correlationId: corrId,
    });

    return results;
  }

  /**
   * Get current count for a key without incrementing
   * 
   * @param key Redis key
   * @param windowMs Time window in milliseconds
   * @param correlationId Optional correlation ID for tracking
   * @returns Current request count in the window
   */
  async getCount(
    key: string,
    windowMs: number,
    correlationId?: string
  ): Promise<number> {
    const corrId = correlationId || this.generateCorrelationId();

    if (!redis) {
      console.warn('[SlidingWindow] Redis not available for getCount', {
        key,
        correlationId: corrId,
      });
      return 0;
    }

    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      console.log('[SlidingWindow] Getting count', {
        key,
        windowMs,
        correlationId: corrId,
      });

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count remaining entries
      const count = await redis.zcard(key);
      
      console.log('[SlidingWindow] Count retrieved', {
        key,
        count,
        correlationId: corrId,
      });

      return count;
    } catch (error) {
      console.error('[SlidingWindow] Error getting count', {
        key,
        error: error instanceof Error ? error.message : String(error),
        correlationId: corrId,
      });
      return 0;
    }
  }

  /**
   * Reset rate limit for a key
   * 
   * @param key Redis key to reset
   * @param correlationId Optional correlation ID for tracking
   */
  async reset(key: string, correlationId?: string): Promise<void> {
    const corrId = correlationId || this.generateCorrelationId();

    if (!redis) {
      console.warn('[SlidingWindow] Redis not available for reset', {
        key,
        correlationId: corrId,
      });
      return;
    }

    try {
      console.log('[SlidingWindow] Resetting rate limit', {
        key,
        correlationId: corrId,
      });

      await redis.del(key);
      
      console.log('[SlidingWindow] Rate limit reset complete', {
        key,
        correlationId: corrId,
      });
    } catch (error) {
      console.error('[SlidingWindow] Error resetting rate limit', {
        key,
        error: error instanceof Error ? error.message : String(error),
        correlationId: corrId,
      });
    }
  }
}
