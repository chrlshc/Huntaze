/**
 * Token Bucket Rate Limiter
 * 
 * Implements a token bucket algorithm that allows burst traffic
 * while maintaining an average rate limit.
 */

import { RateLimitResult, TokenBucketState } from './types';
import redis from '../../cache/redis';

/**
 * Token Bucket Rate Limiter
 * 
 * Tokens are added to the bucket at a constant rate (refill rate).
 * Each request consumes one token. Allows bursts up to bucket capacity.
 */
export class TokenBucketLimiter {
  /**
   * Check if a request is allowed and consume a token
   * 
   * @param key Redis key for this rate limit
   * @param capacity Maximum number of tokens (burst allowance)
   * @param refillRate Tokens added per second
   * @returns Rate limit result
   */
  async check(
    key: string,
    capacity: number,
    refillRate: number
  ): Promise<RateLimitResult> {
    if (!redis) {
      // Redis not available, allow request
      return {
        allowed: true,
        limit: capacity,
        remaining: capacity,
        resetAt: new Date(Date.now() + 60000),
      };
    }

    const now = Date.now();

    try {
      // Use Lua script for atomic token bucket operations
      const script = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        -- Get current state
        local state = redis.call('GET', key)
        local tokens, lastRefill
        
        if state then
          local decoded = cjson.decode(state)
          tokens = tonumber(decoded.tokens)
          lastRefill = tonumber(decoded.lastRefill)
        else
          -- Initialize with full capacity
          tokens = capacity
          lastRefill = now
        end
        
        -- Calculate tokens to add based on time elapsed
        local elapsed = (now - lastRefill) / 1000  -- Convert to seconds
        local tokensToAdd = elapsed * refillRate
        tokens = math.min(capacity, tokens + tokensToAdd)
        
        -- Check if we have tokens available
        if tokens < 1 then
          -- Calculate time until next token
          local timeUntilToken = (1 - tokens) / refillRate
          return {0, tokens, capacity, math.ceil(timeUntilToken)}
        end
        
        -- Consume one token
        tokens = tokens - 1
        
        -- Save new state
        local newState = cjson.encode({
          tokens = tokens,
          lastRefill = now,
          capacity = capacity,
          refillRate = refillRate
        })
        redis.call('SET', key, newState, 'EX', 3600)  -- 1 hour TTL
        
        return {1, tokens, capacity, 0}
      `;

      // Execute Lua script
      const result = await redis.eval(
        script,
        [key],
        [capacity.toString(), refillRate.toString(), now.toString()]
      ) as number[];

      const allowed = result[0] === 1;
      const remainingTokens = result[1];
      const maxCapacity = result[2];
      const retryAfter = result[3];

      // Calculate reset time (when bucket will be full again)
      const secondsToFull = (maxCapacity - remainingTokens) / refillRate;
      const resetAt = new Date(now + secondsToFull * 1000);

      return {
        allowed,
        limit: maxCapacity,
        remaining: Math.floor(remainingTokens),
        resetAt,
        retryAfter: allowed ? undefined : retryAfter,
      };
    } catch (error) {
      console.error('Token bucket rate limiter error:', error);
      
      // On error, allow request (fail-open)
      return {
        allowed: true,
        limit: capacity,
        remaining: capacity,
        resetAt: new Date(now + 60000),
      };
    }
  }

  /**
   * Get current token count without consuming
   * 
   * @param key Redis key
   * @param capacity Bucket capacity
   * @param refillRate Refill rate per second
   * @returns Current number of tokens available
   */
  async getTokens(
    key: string,
    capacity: number,
    refillRate: number
  ): Promise<number> {
    if (!redis) {
      return capacity;
    }

    try {
      const stateStr = await redis.get(key);
      if (!stateStr) {
        return capacity;
      }

      const state = JSON.parse(stateStr as string) as TokenBucketState;
      const now = Date.now();
      const elapsed = (now - state.lastRefill) / 1000;
      const tokensToAdd = elapsed * refillRate;
      const currentTokens = Math.min(capacity, state.tokens + tokensToAdd);

      return Math.floor(currentTokens);
    } catch (error) {
      console.error('Error getting tokens:', error);
      return capacity;
    }
  }

  /**
   * Reset token bucket to full capacity
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
      console.error('Error resetting token bucket:', error);
    }
  }

  /**
   * Manually set token count (useful for testing or admin operations)
   * 
   * @param key Redis key
   * @param tokens Number of tokens to set
   * @param capacity Bucket capacity
   * @param refillRate Refill rate per second
   */
  async setTokens(
    key: string,
    tokens: number,
    capacity: number,
    refillRate: number
  ): Promise<void> {
    if (!redis) {
      return;
    }

    try {
      const state: TokenBucketState = {
        tokens: Math.min(tokens, capacity),
        lastRefill: Date.now(),
        capacity,
        refillRate,
      };

      await redis.setex(key, 3600, JSON.stringify(state));
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  }
}
