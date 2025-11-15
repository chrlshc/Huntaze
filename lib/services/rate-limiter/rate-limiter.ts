/**
 * Rate Limiter Service
 * 
 * Main service that coordinates rate limiting using different algorithms.
 * Integrates circuit breaker for graceful degradation.
 */

import { Identity, RateLimitResult, RateLimitPolicy } from './types';
import { SlidingWindowLimiter } from './sliding-window';
import { TokenBucketLimiter } from './token-bucket';
import { CircuitBreaker } from './circuit-breaker';
import { rateLimitConfig } from '../../config/rate-limits';

/**
 * Rate Limiter Service
 * 
 * Provides rate limiting functionality with multiple algorithms
 * and graceful degradation when Redis is unavailable.
 */
export class RateLimiter {
  private slidingWindow: SlidingWindowLimiter;
  private tokenBucket: TokenBucketLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.slidingWindow = new SlidingWindowLimiter();
    this.tokenBucket = new TokenBucketLimiter();
    this.circuitBreaker = new CircuitBreaker(rateLimitConfig.circuitBreaker);
  }

  /**
   * Check if a request is allowed under the rate limit
   * 
   * @param identity User/IP/API key identity
   * @param endpoint API endpoint being accessed
   * @param policy Rate limit policy to apply
   * @returns Rate limit result
   */
  async check(
    identity: Identity,
    endpoint: string,
    policy: RateLimitPolicy
  ): Promise<RateLimitResult> {
    // Build Redis key
    const key = this.buildKey(identity, endpoint);

    // Use circuit breaker for Redis operations
    return this.circuitBreaker.execute(
      async () => {
        // Check rate limits based on algorithm
        if (policy.algorithm === 'token-bucket') {
          return await this.checkTokenBucket(key, policy);
        } else {
          // Default to sliding window
          return await this.checkSlidingWindow(key, policy);
        }
      },
      () => {
        // Fallback when circuit is open (Redis unavailable)
        return {
          allowed: true,
          limit: 0,
          remaining: 0,
          resetAt: new Date(Date.now() + 60000),
        };
      }
    );
  }

  /**
   * Check rate limit using sliding window algorithm
   */
  private async checkSlidingWindow(
    key: string,
    policy: RateLimitPolicy
  ): Promise<RateLimitResult> {
    // Check multiple windows if configured
    const windows: Array<{ limit: number; windowMs: number }> = [];

    if (policy.perMinute) {
      windows.push({ limit: policy.perMinute, windowMs: 60 * 1000 });
    }

    if (policy.perHour) {
      windows.push({ limit: policy.perHour, windowMs: 60 * 60 * 1000 });
    }

    if (policy.perDay) {
      windows.push({ limit: policy.perDay, windowMs: 24 * 60 * 60 * 1000 });
    }

    // If no windows configured, use default per-minute
    if (windows.length === 0) {
      windows.push({ limit: 100, windowMs: 60 * 1000 });
    }

    // Check all windows
    const results = await this.slidingWindow.checkMultipleWindows(key, windows);

    // Return the most restrictive result (first one that's not allowed)
    const blocked = results.find(r => !r.allowed);
    return blocked || results[0];
  }

  /**
   * Check rate limit using token bucket algorithm
   */
  private async checkTokenBucket(
    key: string,
    policy: RateLimitPolicy
  ): Promise<RateLimitResult> {
    // Calculate capacity and refill rate
    const capacity = policy.burst || policy.perMinute;
    const refillRate = policy.perMinute / 60; // tokens per second

    return await this.tokenBucket.check(key, capacity, refillRate);
  }

  /**
   * Build Redis key for rate limiting
   */
  private buildKey(identity: Identity, endpoint: string): string {
    // Format: rate:{type}:{value}:{endpoint}
    const sanitizedEndpoint = endpoint.replace(/\//g, ':');
    return `rate:${identity.type}:${identity.value}:${sanitizedEndpoint}`;
  }

  /**
   * Reset rate limit for an identity and endpoint
   */
  async reset(identity: Identity, endpoint: string): Promise<void> {
    const key = this.buildKey(identity, endpoint);

    await this.circuitBreaker.execute(
      async () => {
        await this.slidingWindow.reset(key);
        await this.tokenBucket.reset(key);
      },
      () => {
        // Fallback: do nothing
      }
    );
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter();
