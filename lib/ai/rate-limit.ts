// AI Rate Limiting - Per creator rate limiting using AWS ElastiCache Redis
import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisInitialized = false;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  if (redisInitialized) return null;
  redisInitialized = true;

  // Avoid side-effects during `next build` (page data collection runs server code).
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;

  const url = process.env.ELASTICACHE_REDIS_URL || process.env.REDIS_URL;
  const host = process.env.ELASTICACHE_REDIS_HOST || process.env.REDIS_HOST;
  const port = parseInt(process.env.ELASTICACHE_REDIS_PORT || process.env.REDIS_PORT || '6379');

  if (!url && !host) return null;

  const options = {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  } as const;

  redisClient = url ? new Redis(url, options) : new Redis({ host: host!, port, ...options });

  redisClient.on('error', (error) => {
    try {
      console.warn('[AI Rate Limit] Redis error, falling back to memory:', error?.message || error);
    } catch {
      // ignore
    }
    try {
      redisClient?.disconnect();
    } catch {
      // ignore
    }
    redisClient = null;
  });

  if (typeof process !== 'undefined' && typeof process.once === 'function') {
    process.once('SIGTERM', () => {
      try {
        void redisClient?.quit();
      } catch {
        // ignore
      }
    });
  }

  return redisClient;
}

const memoryWindowStore = new Map<string, number[]>();

function memorySlidingWindowRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = memoryWindowStore.get(key) ?? [];
  const filtered = existing.filter((timestamp) => timestamp > windowStart);
  const count = filtered.length;
  const success = count < limit;

  if (success) {
    filtered.push(now);
    memoryWindowStore.set(key, filtered);
  } else {
    // Keep the pruned list so we don't grow unbounded.
    memoryWindowStore.set(key, filtered);
  }

  const remaining = Math.max(0, limit - count - (success ? 1 : 0));
  const reset = now + windowMs;
  return { success, remaining, reset };
}

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
  const redis = getRedisClient();
  if (!redis) {
    return memorySlidingWindowRateLimit(key, limit, windowMs);
  }

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

  let results: [Error | null, unknown][] | null = null;
  try {
    results = await pipeline.exec();
  } catch (error) {
    try {
      console.warn('[AI Rate Limit] Redis pipeline failed, using memory fallback:', (error as any)?.message || error);
    } catch {
      // ignore
    }
    return memorySlidingWindowRateLimit(key, limit, windowMs);
  }

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
  const redis = getRedisClient();
  if (!redis) return;

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
  const redis = getRedisClient();
  const limit = RATE_LIMITS[plan];
  const windowMs = 60 * 60 * 1000;
  const key = `ai:ratelimit:${plan}:${creatorId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!redis) {
    return {
      limit,
      remaining: limit,
      reset: now + windowMs,
    };
  }

  // Count current entries in window
  let count = 0;
  try {
    count = await redis.zcount(key, windowStart, now);
  } catch {
    // ignore and fallback to "no data"
  }

  return {
    limit,
    remaining: Math.max(0, limit - count),
    reset: now + windowMs,
  };
}
