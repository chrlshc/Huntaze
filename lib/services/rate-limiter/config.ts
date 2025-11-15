/**
 * Rate Limit Configuration
 * 
 * Centralized configuration for all rate limits
 */

import type { RateLimitPolicy, RateLimitConfig } from './types';

/**
 * Default rate limit policies for all endpoints
 */
export const RATE_LIMIT_POLICIES: Record<string, RateLimitPolicy> = {
  // Default policy for all endpoints
  default: {
    perMinute: 100,
    perHour: 5000,
    algorithm: 'sliding-window',
  },

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

  '/api/auth/*': {
    perMinute: 10,
    perHour: 50,
    algorithm: 'sliding-window',
  },

  // Upload endpoints - token bucket for bursts
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

  '/api/uploads/*': {
    perMinute: 10,
    perHour: 100,
    algorithm: 'token-bucket',
    burst: 3,
  },

  // AI endpoints - moderate limits
  '/api/ai/*': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
    tiers: {
      premium: { perMinute: 50, perHour: 2000 },
      enterprise: { perMinute: 200, perHour: 10000 },
    },
  },

  '/api/chatbot/*': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },

  // Dashboard/Analytics - read-heavy, allow bursts
  '/api/dashboard': {
    perMinute: 60,
    perHour: 2000,
    algorithm: 'token-bucket',
    burst: 10,
  },

  '/api/analytics/*': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },

  // Messaging endpoints
  '/api/messages/*/send': {
    perMinute: 30,
    perHour: 1000,
    perDay: 5000,
    algorithm: 'sliding-window',
  },

  '/api/messages/*': {
    perMinute: 60,
    perHour: 2000,
    algorithm: 'token-bucket',
    burst: 10,
  },

  // Campaign endpoints
  '/api/marketing/campaigns': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'token-bucket',
  },

  '/api/marketing/*': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },

  // Revenue endpoints
  '/api/revenue/*': {
    perMinute: 30,
    perHour: 1000,
    algorithm: 'sliding-window',
  },

  // OnlyFans integration
  '/api/onlyfans/*': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
  },

  // Social media integrations
  '/api/instagram/*': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
  },

  '/api/tiktok/*': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
  },

  '/api/reddit/*': {
    perMinute: 20,
    perHour: 500,
    algorithm: 'sliding-window',
  },

  // CRM endpoints
  '/api/crm/*': {
    perMinute: 40,
    perHour: 1500,
    algorithm: 'sliding-window',
  },

  '/api/fans/*': {
    perMinute: 40,
    perHour: 1500,
    algorithm: 'sliding-window',
  },
};

/**
 * IP-based rate limits for unauthenticated requests
 */
export const IP_RATE_LIMITS: RateLimitPolicy = {
  perMinute: 20,
  perHour: 500,
  perDay: 2000,
  algorithm: 'sliding-window',
};

/**
 * Get IP whitelist from environment
 */
export function getIPWhitelist(): string[] {
  const whitelist = process.env.RATE_LIMIT_WHITELIST_IPS || '';
  return whitelist.split(',').filter(ip => ip.trim().length > 0);
}

/**
 * Get rate limit policy for an endpoint
 */
export function getRateLimitPolicy(
  endpoint: string,
  tier?: 'free' | 'premium' | 'enterprise'
): RateLimitPolicy {
  // Try exact match first
  let policy = RATE_LIMIT_POLICIES[endpoint];

  // Try pattern matching
  if (!policy) {
    for (const [pattern, patternPolicy] of Object.entries(RATE_LIMIT_POLICIES)) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(endpoint)) {
          policy = patternPolicy;
          break;
        }
      }
    }
  }

  // Fall back to default
  if (!policy) {
    policy = RATE_LIMIT_POLICIES.default;
  }

  // Apply tier overrides
  if (tier && policy.tiers?.[tier]) {
    policy = {
      ...policy,
      ...policy.tiers[tier],
    };
  }

  return policy;
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

  const validAlgorithms = ['token-bucket', 'sliding-window', 'fixed-window'];
  if (!validAlgorithms.includes(policy.algorithm)) {
    throw new Error(`algorithm must be one of: ${validAlgorithms.join(', ')}`);
  }
}

/**
 * Load rate limit configuration
 */
export function loadRateLimitConfig(): RateLimitConfig {
  const config: RateLimitConfig = {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    redisUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    defaultPolicy: RATE_LIMIT_POLICIES.default,
    policies: RATE_LIMIT_POLICIES,
    ipLimits: IP_RATE_LIMITS,
    ipWhitelist: getIPWhitelist(),
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

  // Validate configuration
  if (config.enabled && !config.redisUrl) {
    console.warn('[RateLimitConfig] Redis URL not configured, rate limiting will be disabled');
    config.enabled = false;
  }

  // Validate all policies
  try {
    Object.entries(config.policies).forEach(([endpoint, policy]) => {
      validateRateLimitPolicy(policy);
    });
    validateRateLimitPolicy(config.ipLimits);
  } catch (error) {
    console.error('[RateLimitConfig] Invalid policy configuration:', error);
    throw error;
  }

  console.log('[RateLimitConfig] Configuration loaded', {
    enabled: config.enabled,
    policies: Object.keys(config.policies).length,
    defaultLimit: config.defaultPolicy.perMinute,
    ipWhitelist: config.ipWhitelist.length,
  });

  return config;
}
