/**
 * Webhook Rate Limiter
 * Content & Trends AI Engine - Phase 4
 * 
 * Redis-based rate limiting with sliding window algorithm
 * for DDoS protection and abuse prevention
 */

import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitInfo,
  DEFAULT_RATE_LIMIT_CONFIG,
} from './types';

// ============================================================================
// Redis Client Interface (for dependency injection)
// ============================================================================

export interface RateLimitRedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  multi(): RateLimitRedisMulti;
}

export interface RateLimitRedisMulti {
  incr(key: string): this;
  expire(key: string, seconds: number): this;
  exec(): Promise<unknown[]>;
}

// ============================================================================
// In-Memory Rate Limiter (for testing/fallback)
// ============================================================================

class InMemoryRateLimitStore implements RateLimitRedisInterface {
  private store = new Map<string, { count: number; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.count.toString();
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiresAt = options?.EX 
      ? Date.now() + options.EX * 1000 
      : Date.now() + 60000; // Default 1 minute
    this.store.set(key, { count: parseInt(value, 10), expiresAt });
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.set(key, { count: 1, expiresAt: Date.now() + 60000 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  multi(): RateLimitRedisMulti {
    const operations: Array<() => Promise<unknown>> = [];
    const incr = this.incr.bind(this);
    const expire = this.expire.bind(this);

    return {
      incr(key: string) {
        operations.push(() => incr(key));
        return this;
      },
      expire(key: string, seconds: number) {
        operations.push(() => expire(key, seconds));
        return this;
      },
      async exec() {
        const results: unknown[] = [];
        for (const op of operations) {
          results.push(await op());
        }
        return results;
      },
    };
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

export class WebhookRateLimiter {
  private readonly config: Required<RateLimitConfig>;
  private readonly redis: RateLimitRedisInterface;

  constructor(
    config: RateLimitConfig = {},
    redisClient?: RateLimitRedisInterface
  ) {
    this.config = {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config,
    };

    this.redis = redisClient ?? new InMemoryRateLimitStore();
  }

  /**
   * Check if a request is allowed under rate limits
   * 
   * @param clientId - Client identifier (IP, API key, etc.)
   * @returns Rate limit check result
   */
  async checkRateLimit(clientId: string): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: new Date(Date.now() + this.config.windowSeconds * 1000),
      };
    }

    const key = this.buildKey(clientId);
    const now = Date.now();

    // Get current count
    const currentCount = await this.redis.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    // Calculate effective limit (with burst allowance)
    const effectiveLimit = this.config.maxRequests + this.config.burstAllowance;

    // Get TTL for reset time calculation
    const ttl = await this.redis.ttl(key);
    const resetAt = ttl > 0 
      ? new Date(now + ttl * 1000)
      : new Date(now + this.config.windowSeconds * 1000);

    if (count >= effectiveLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: ttl > 0 ? ttl : this.config.windowSeconds,
      };
    }

    return {
      allowed: true,
      remaining: effectiveLimit - count - 1, // -1 for the current request
      resetAt,
    };
  }

  /**
   * Record a request (increment counter)
   * 
   * @param clientId - Client identifier
   * @returns Updated rate limit info
   */
  async recordRequest(clientId: string): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: new Date(Date.now() + this.config.windowSeconds * 1000),
      };
    }

    const key = this.buildKey(clientId);
    const now = Date.now();

    // Atomic increment with expiry
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, this.config.windowSeconds);
    const results = await multi.exec();

    const newCount = results[0] as number;
    const effectiveLimit = this.config.maxRequests + this.config.burstAllowance;

    // Get TTL for reset time
    const ttl = await this.redis.ttl(key);
    const resetAt = ttl > 0 
      ? new Date(now + ttl * 1000)
      : new Date(now + this.config.windowSeconds * 1000);

    const allowed = newCount <= effectiveLimit;
    const remaining = Math.max(0, effectiveLimit - newCount);

    return {
      allowed,
      remaining,
      resetAt,
      retryAfterSeconds: allowed ? undefined : (ttl > 0 ? ttl : this.config.windowSeconds),
    };
  }

  /**
   * Check and record in one operation
   * 
   * @param clientId - Client identifier
   * @returns Rate limit result
   */
  async checkAndRecord(clientId: string): Promise<RateLimitResult> {
    // First check without incrementing
    const checkResult = await this.checkRateLimit(clientId);
    
    if (!checkResult.allowed) {
      return checkResult;
    }

    // If allowed, record the request
    return this.recordRequest(clientId);
  }

  /**
   * Get current rate limit info for a client
   * 
   * @param clientId - Client identifier
   * @returns Rate limit info
   */
  async getRateLimitInfo(clientId: string): Promise<RateLimitInfo> {
    const key = this.buildKey(clientId);
    const now = Date.now();

    const currentCount = await this.redis.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    const ttl = await this.redis.ttl(key);
    const windowEnd = ttl > 0 
      ? new Date(now + ttl * 1000)
      : new Date(now + this.config.windowSeconds * 1000);

    const windowStart = new Date(windowEnd.getTime() - this.config.windowSeconds * 1000);

    return {
      clientId,
      requestCount: count,
      windowStart,
      windowEnd,
    };
  }

  /**
   * Reset rate limit for a client (for admin use)
   * 
   * @param clientId - Client identifier
   */
  async resetRateLimit(clientId: string): Promise<void> {
    const key = this.buildKey(clientId);
    await this.redis.set(key, '0', { EX: this.config.windowSeconds });
  }

  /**
   * Check if a client is currently rate limited
   * 
   * @param clientId - Client identifier
   * @returns True if rate limited
   */
  async isRateLimited(clientId: string): Promise<boolean> {
    const result = await this.checkRateLimit(clientId);
    return !result.allowed;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildKey(clientId: string): string {
    return `${this.config.keyPrefix}${clientId}`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a webhook rate limiter instance
 */
export function createWebhookRateLimiter(
  config?: RateLimitConfig,
  redisClient?: RateLimitRedisInterface
): WebhookRateLimiter {
  return new WebhookRateLimiter(config, redisClient);
}

/**
 * Create an in-memory rate limiter (for testing)
 */
export function createInMemoryRateLimiter(
  config?: RateLimitConfig
): WebhookRateLimiter {
  return new WebhookRateLimiter(config, new InMemoryRateLimitStore());
}

// ============================================================================
// Rate Limit Error
// ============================================================================

export class RateLimitExceededError extends Error {
  public readonly retryAfterSeconds: number;
  public readonly resetAt: Date;

  constructor(result: RateLimitResult) {
    super(`Rate limit exceeded. Retry after ${result.retryAfterSeconds} seconds.`);
    this.name = 'RateLimitExceededError';
    this.retryAfterSeconds = result.retryAfterSeconds ?? 60;
    this.resetAt = result.resetAt;
  }
}
