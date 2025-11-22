// AI Rate Limiting - Per creator rate limiting using AWS ElastiCache Redis
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.ELASTICACHE_REDIS_HOST || 'huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com',
  port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export type CreatorPlan = 'starter' | 'pro' | 'business';

// Requirement 5.2: Plan-based rate limits
const RATE_LIMITS: Record<CreatorPlan, number> = {
  starter: 50,   // 50 requests per hour
  pro: 100,      // 100 requests per hour
  business: 500, // 500 requests per hour
};

export class RateLimitError extends Error {
  public readonly retryAfter: number;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(retryAfter: number, limit: number, remaining: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Sliding window rate limiter implementation using Redis
 * Based on the sliding window log algorithm
 */
async function slidingWindowRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis pipeline for atomic operations
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Count current entries in window
  pipeline.zcard(key);

  // Add current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`);

  // Set expiry on the key
  pipeline.expire(key, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();

  if (!results) {
    throw new Error('Redis pipeline failed');
  }

  // Get count before adding current request
  const count = (results[1][1] as number) || 0;

  const success = count < limit;
  const remaining = Math.max(0, limit - count - 1);
  const reset = now + windowMs;

  return { success, remaining, reset };
}

/**
 * Requirement 5.1: Check rate limit for a creator
 * Requirement 5.2: Use plan-based rate limits
 * Requirement 5.3: Return HTTP 429 with retry-after header
 * Requirement 5.4: Sliding window reset
 * @throws {RateLimitError} When rate limit is exceeded
 */
export async function checkCreatorRateLimit(
  creatorId: number,
  plan: CreatorPlan = 'pro'
): Promise<void> {
  const limit = RATE_LIMITS[plan];
  const windowMs = 60 * 60 * 1000; // 1 hour in milliseconds
  const key = `ai:ratelimit:${plan}:${creatorId}`;

  // Requirement 5.1, 5.4: Check rate limit with sliding window
  const { success, remaining, reset } = await slidingWindowRateLimit(key, limit, windowMs);

  // Requirement 5.5: Anomaly detection for excessive request rates
  await detectAnomalousUsage(creatorId, plan, remaining, limit);

  // Requirement 5.2: Reject if limit exceeded
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new RateLimitError(retryAfter, limit, 0);
  }
}

/**
 * Requirement 5.5: Detect anomalous usage patterns
 * Logs when a creator exceeds 2x their plan limit within 5 minutes
 */
async function detectAnomalousUsage(
  creatorId: number,
  plan: CreatorPlan,
  _remaining: number,
  limit: number
): Promise<void> {
  const anomalyKey = `ai:anomaly:${creatorId}`;
  const anomalyWindow = 5 * 60; // 5 minutes in seconds
  const anomalyThreshold = limit * 2;

  try {
    // Increment anomaly counter
    const count = await redis.incr(anomalyKey);
    
    // Set expiry on first increment
    if (count === 1) {
      await redis.expire(anomalyKey, anomalyWindow);
    }

    // Check if threshold exceeded
    if (count >= anomalyThreshold) {
      console.warn('[AI Rate Limit] Anomaly detected', {
        creatorId,
        plan,
        requestsIn5Min: count,
        threshold: anomalyThreshold,
        timestamp: new Date().toISOString(),
      });

      // Reset counter after logging
      await redis.del(anomalyKey);
    }
  } catch (error) {
    // Don't fail the request if anomaly detection fails
    console.error('[AI Rate Limit] Anomaly detection error:', error);
  }
}

/**
 * Get current rate limit status for a creator
 */
export async function getRateLimitStatus(
  creatorId: number,
  plan: CreatorPlan = 'pro'
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
}> {
  const limit = RATE_LIMITS[plan];
  const windowMs = 60 * 60 * 1000;
  const key = `ai:ratelimit:${plan}:${creatorId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Count current entries in window
  const count = await redis.zcount(key, windowStart, now);

  return {
    limit,
    remaining: Math.max(0, limit - count),
    reset: now + windowMs,
  };
}

// Graceful shutdown
process.on('SIGTERM', () => {
  redis.quit();
});
