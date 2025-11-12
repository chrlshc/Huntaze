/**
 * Rate Limiting Middleware for Onboarding APIs
 * 
 * Uses Redis-based sliding window algorithm for accurate rate limiting
 */

import { createRedisClient } from '@/lib/smart-onboarding/config/redis';
import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests in window
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds until reset
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'PATCH /api/onboarding/steps/:id': {
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    keyPrefix: 'rl:onboarding:patch',
  },
  'POST /api/onboarding/snooze': {
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    max: 3,
    keyPrefix: 'rl:onboarding:snooze',
  },
  'GET /api/onboarding': {
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    keyPrefix: 'rl:onboarding:get',
  },
};

/**
 * Check rate limit for a key
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = createRedisClient();
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const redisKey = `${config.keyPrefix || 'rl'}:${key}`;
  
  try {
    // Use sorted set to track requests in time window
    // Remove old requests outside the window
    await redis.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count requests in current window
    const count = await redis.zcard(redisKey);
    
    if (count >= config.max) {
      // Rate limit exceeded
      const oldestRequest = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest.length > 0
        ? new Date(parseInt(oldestRequest[1]) + config.windowMs)
        : new Date(now + config.windowMs);
      
      const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);
      
      return {
        allowed: false,
        limit: config.max,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }
    
    // Add current request
    await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
    
    // Set expiry on key
    await redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
    
    return {
      allowed: true,
      limit: config.max,
      remaining: config.max - count - 1,
      resetTime: new Date(now + config.windowMs),
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      limit: config.max,
      remaining: config.max,
      resetTime: new Date(now + config.windowMs),
    };
  }
}

/**
 * Get rate limit key from request
 * Uses user ID if authenticated, otherwise IP address
 */
export function getRateLimitKey(
  userId?: string,
  ip?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }
  if (ip) {
    return `ip:${ip}`;
  }
  return 'anonymous';
}

/**
 * Rate limit middleware for Next.js API routes
 */
export async function rateLimitMiddleware(
  req: Request,
  userId?: string,
  endpoint?: string
): Promise<NextResponse | null> {
  if (!endpoint) {
    return null; // No rate limiting if endpoint not specified
  }
  
  const config = RATE_LIMITS[endpoint];
  if (!config) {
    return null; // No rate limiting configured for this endpoint
  }
  
  // Get IP from headers
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  const key = getRateLimitKey(userId, ip);
  const result = await checkRateLimit(key, config);
  
  if (!result.allowed) {
    console.warn('[Rate Limit] Limit exceeded', {
      key,
      endpoint,
      limit: result.limit,
      retryAfter: result.retryAfter,
    });
    
    return NextResponse.json(
      {
        error: 'TOO_MANY_REQUESTS',
        message: 'Trop de requêtes. Réessayez plus tard.',
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime.toISOString(),
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toISOString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    );
  }
  
  // Add rate limit headers to response (will be added by caller)
  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString());
  return response;
}

/**
 * Reset rate limit for a key (useful for testing)
 */
export async function resetRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<void> {
  const redis = createRedisClient();
  const redisKey = `${config.keyPrefix || 'rl'}:${key}`;
  await redis.del(redisKey);
}
