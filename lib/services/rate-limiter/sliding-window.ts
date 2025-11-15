/**
 * Sliding Window Rate Limiter
 * 
 * Implements a sliding window algorithm using Redis sorted sets.
 * More accurate than fixed window and prevents boundary gaming.
 */

import { RateLimitResult } from './types';
import redis from '../../cache/redis';

/**
 * Sliding Window Rate Limiter
 * 
 * Uses Redis sorted sets to track requests within a sliding time window.
 * Each request is stored with its timestamp as the score.
 */
export class SlidingWindowLimiter {
  /**
   * Check if a request is allowed under the rate limit
   * 
   * @param key Redis key for this rate limit (e.g., "rate:user:123:/api/endpoint")
   * @param limit Maximum number of requests allowed in the window
   * @param windowMs Time window in milliseconds
   * @returns Rate limit result
   */
  async check(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    if (!redis) {
      // Redis not available, allow request
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

    try {
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

      return {
        allowed,
        limit: maxLimit,
        remaining: Math.max(0, maxLimit - count),
        resetAt,
        retryAfter: allowed ? undefined : Math.ceil(windowMs / 1000),
      };
    } catch (error) {
      console.error('Sliding window rate limiter error:', error);
      
      // On error, allow request (fail-open)
      return {
        allowed: true,
        limit: 0,
        remaining: 0,
        resetAt,
      };
    }
  }

  /**
   * Check multiple time windows (e.g., per-minute, per-hour, per-day)
   * 
   * @param baseKey Base Redis key
   * @param windows Array of {limit, windowMs} configurations
   * @returns Array of rate limit results, one per window
   */
  async checkMultipleWindows(
    baseKey: string,
    windows: Array<{ limit: number; windowMs: number }>
  ): Promise<RateLimitResult[]> {
    const results = await Promise.all(
      windows.map((window, index) => {
        const key = `${baseKey}:${window.windowMs}`;
        return this.check(key, window.limit, window.windowMs);
      })
    );

    return results;
  }

  /**
   * Get current count for a key without incrementing
   * 
   * @param key Redis key
   * @param windowMs Time window in milliseconds
   * @returns Current request count in the window
   */
  async getCount(key: string, windowMs: number): Promise<number> {
    if (!redis) {
      return 0;
    }

    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count remaining entries
      const count = await redis.zcard(key);
      return count;
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }

  /**
   * Reset rate limit for a key
   * 
   * @param key Redis key to reset
   */
  async reset(key: string): Promise<void> {
    if (!redis) {
      return;
    }

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }
}
