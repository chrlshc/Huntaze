/**
 * Rate Limit Configuration
 * 
 * Centralized configuration for all rate limiting policies across the platform.
 * Supports endpoint-specific limits, tier-based overrides, and environment variable configuration.
 */

import { RateLimitPolicy, RateLimitConfig, UserTier } from '../services/rate-limiter/types';

/**
 * Default rate limit policy
 */
export const DEFAULT_POLICY: RateLimitPolicy = {
  perMinute: 100,
  perHour: 5000,
  algorithm: 'sliding-window',
};

/**
 * IP-based rate limits for unauthenticated requests
 */
export const IP_RATE_LIMITS: RateLimitPolicy = {
  perMinute: 20,
  perHour: 500,
  algorithm: 'sliding-window',
};

/**
 * Endpoint-specific rate limit policies
 */
export const RATE_LIMIT_POLICIES: Record<string, RateLimitPolicy> = {
  // Authentication endpoints - strict limits
  '/api/auth/login': {
    perMinute: 5,
    perHour: 20,
    algorithm: 'sliding-window',
  },
  
  '/api/auth/register': {
    perMinute: 3,
    perHour: 10,
    algorithm: 'sliding-window',
  },
  
  '/api/auth/reset-password': {
    perMinute: 3,
    perHour: 10,
    algorithm: 'sliding-window',
  },
  
  // Upload endpoints - moderate limits with burst
  '/api/content/upload': {
    perMinute: 10,
    perHour: 100,
    perDay: 500,
    algorithm: 'token-bucket',
    burst: 3,
    tiers: {
      premium: { perHour: 500, perDay: 2000 },
      enterprise: { perHour: 2000, perDay: 10000 },
    },
  },
  
  // AI endpoints - moderate limits
  '/api/ai': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
    tiers: {
      premium: { perMinute: 50, perHour: 2000 },
      enterprise: { perMinute: 200, perHour: 10000 },
    },
  },
  
  // Dashboard/Analytics - read-heavy with burst
  '/api/dashboard': {
    perMinute: 60,
    perHour: 2000,
    algorithm: 'token-bucket',
    burst: 10,
  },
  
  '/api/analytics': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },
  
  // Messaging endpoints
  '/api/messages': {
    perMinute: 30,
    perHour: 1000,
    perDay: 5000,
    algorithm: 'sliding-window',
  },
  
  '/api/messages/send': {
    perMinute: 20,
    perHour: 500,
    perDay: 2000,
    algorithm: 'sliding-window',
  },
  
  // Campaign endpoints
  '/api/marketing/campaigns': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'token-bucket',
  },
  
  // Revenue endpoints
  '/api/revenue': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },
  
  // Content endpoints
  '/api/content': {
    perMinute: 40,
    perHour: 1500,
    algorithm: 'token-bucket',
    burst: 5,
  },
  
  // OnlyFans integration endpoints
  '/api/onlyfans': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },
  
  // Debug endpoints (existing)
  '/api/debug/tiktok-events': {
    perMinute: 60,
    perHour: 2000,
    algorithm: 'sliding-window',
  },
  
  '/api/cron/tiktok-status': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
  },
};

/**
 * IP whitelist - IPs that bypass rate limiting
 */
export const IP_WHITELIST: string[] = [
  // Load from environment variable
  ...(process.env.RATE_LIMIT_WHITELIST_IPS?.split(',').map(ip => ip.trim()) || []),
  // Add any hardcoded trusted IPs here if needed
];

/**
 * Resolve rate limit policy for a given endpoint and identity
 */
export function getRateLimitPolicy(
  pathname: string,
  tier?: UserTier
): RateLimitPolicy {
  // Check for exact match first
  let policy = RATE_LIMIT_POLICIES[pathname];
  
  // If no exact match, try prefix match
  if (!policy) {
    for (const [pattern, patternPolicy] of Object.entries(RATE_LIMIT_POLICIES)) {
      if (pathname.startsWith(pattern)) {
        policy = patternPolicy;
        break;
      }
    }
  }
  
  // Fall back to default policy
  if (!policy) {
    policy = DEFAULT_POLICY;
  }
  
  // Apply tier-based overrides
  if (tier && policy.tiers?.[tier]) {
    policy = {
      ...policy,
      ...policy.tiers[tier],
    };
  }
  
  return policy;
}

/**
 * Check if an IP is whitelisted
 */
export function isIPWhitelisted(ip: string): boolean {
  return IP_WHITELIST.includes(ip);
}

/**
 * Validate rate limit policy
 */
export function validateRateLimitPolicy(policy: RateLimitPolicy): void {
  if (policy.perMinute <= 0) {
    throw new Error('perMinute must be positive');
  }
  
  if (policy.perHour && policy.perHour < policy.perMinute) {
    throw new Error('perHour must be >= perMinute');
  }
  
  if (policy.perDay && policy.perHour && policy.perDay < policy.perHour) {
    throw new Error('perDay must be >= perHour');
  }
  
  if (policy.burst && policy.burst < 0) {
    throw new Error('burst must be non-negative');
  }
}

/**
 * Load rate limit configuration from environment
 */
export function loadRateLimitConfig(): RateLimitConfig {
  const config: RateLimitConfig = {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    redisUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || undefined,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN || undefined,
    defaultPolicy: {
      ...DEFAULT_POLICY,
      perMinute: parseInt(process.env.RATE_LIMIT_DEFAULT_PER_MINUTE || '100'),
      perHour: parseInt(process.env.RATE_LIMIT_DEFAULT_PER_HOUR || '5000'),
    },
    policies: RATE_LIMIT_POLICIES,
    ipLimits: IP_RATE_LIMITS,
    ipWhitelist: IP_WHITELIST,
    circuitBreaker: {
      failureThreshold: parseInt(process.env.RATE_LIMIT_CB_FAILURE_THRESHOLD || '3'),
      resetTimeout: parseInt(process.env.RATE_LIMIT_CB_RESET_TIMEOUT || '30000'),
      halfOpenSuccessThreshold: parseInt(process.env.RATE_LIMIT_CB_HALF_OPEN_THRESHOLD || '2'),
    },
    monitoring: {
      enabled: process.env.RATE_LIMIT_MONITORING_ENABLED !== 'false',
      alertThreshold: parseInt(process.env.RATE_LIMIT_ALERT_THRESHOLD || '10'),
    },
  };
  
  // Validate default policy
  validateRateLimitPolicy(config.defaultPolicy);
  
  return config;
}

/**
 * Get rate limit configuration
 */
export const rateLimitConfig = loadRateLimitConfig();
