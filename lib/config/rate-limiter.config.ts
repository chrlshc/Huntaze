/**
 * Rate Limiter Configuration
 * 
 * Centralized configuration for OnlyFans rate limiter integration.
 * Validates environment variables and provides type-safe access.
 * 
 * @module rate-limiter-config
 */

import { z } from 'zod';

// ============================================================================
// Environment Variable Schema
// ============================================================================

const RateLimiterEnvSchema = z.object({
  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // SQS Queue
  SQS_RATE_LIMITER_QUEUE: z.string().url().default(
    'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue'
  ),
  
  // Feature Flags
  RATE_LIMITER_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  
  // OnlyFans API
  ONLYFANS_API_URL: z.string().url().optional(),
  ONLYFANS_USER_AGENT: z.string().optional(),
});

export type RateLimiterEnv = z.infer<typeof RateLimiterEnvSchema>;

// ============================================================================
// Configuration Constants
// ============================================================================

export const RATE_LIMITER_CONFIG = {
  // Queue Configuration
  QUEUE: {
    URL: process.env.SQS_RATE_LIMITER_QUEUE || 
      'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue',
    BATCH_SIZE: 10, // Max messages per batch send
    VISIBILITY_TIMEOUT: 90, // Seconds (6x Lambda timeout)
    MESSAGE_RETENTION: 345600, // 4 days in seconds
  },
  
  // Retry Configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000, // 1 second
    MAX_DELAY_MS: 30000, // 30 seconds
    BACKOFF_MULTIPLIER: 2,
    JITTER_FACTOR: 0.1, // 10% jitter
  },
  
  // Circuit Breaker Configuration
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 5, // Open after 5 failures
    SUCCESS_THRESHOLD: 2, // Close after 2 successes in HALF_OPEN
    TIMEOUT_MS: 60000, // 1 minute
    HALF_OPEN_MAX_CALLS: 3, // Max calls in HALF_OPEN state
  },
  
  // Rate Limiting (OnlyFans API limits)
  RATE_LIMIT: {
    TOKENS_PER_WINDOW: 10, // 10 messages
    WINDOW_SECONDS: 60, // per minute
    BUCKET_CAPACITY: 10, // Max burst
  },
  
  // Timeouts
  TIMEOUTS: {
    SQS_SEND_MS: 5000, // 5 seconds
    API_CALL_MS: 30000, // 30 seconds
    HEALTH_CHECK_MS: 3000, // 3 seconds
  },
  
  // Monitoring
  MONITORING: {
    CLOUDWATCH_NAMESPACE: 'Huntaze/OnlyFans',
    METRICS_ENABLED: true,
    LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  
  // Feature Flags
  FEATURES: {
    ENABLED: process.env.RATE_LIMITER_ENABLED === 'true',
    FALLBACK_TO_DB: true, // Fallback to database if SQS fails
    CIRCUIT_BREAKER_ENABLED: true,
    METRICS_ENABLED: true,
  },
} as const;

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validates rate limiter environment variables
 * 
 * @throws {Error} If required environment variables are missing or invalid
 * @returns {RateLimiterEnv} Validated environment variables
 */
export function validateRateLimiterConfig(): RateLimiterEnv {
  try {
    const env = RateLimiterEnvSchema.parse({
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      SQS_RATE_LIMITER_QUEUE: process.env.SQS_RATE_LIMITER_QUEUE,
      RATE_LIMITER_ENABLED: process.env.RATE_LIMITER_ENABLED,
      ONLYFANS_API_URL: process.env.ONLYFANS_API_URL,
      ONLYFANS_USER_AGENT: process.env.ONLYFANS_USER_AGENT,
    });
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      
      throw new Error(`Rate limiter configuration validation failed: ${issues}`);
    }
    throw error;
  }
}

/**
 * Checks if rate limiter is properly configured
 * 
 * @returns {boolean} True if configuration is valid
 */
export function isRateLimiterConfigured(): boolean {
  try {
    validateRateLimiterConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets rate limiter configuration status
 * 
 * @returns {object} Configuration status with details
 */
export function getRateLimiterStatus() {
  const isConfigured = isRateLimiterConfigured();
  const isEnabled = RATE_LIMITER_CONFIG.FEATURES.ENABLED;
  
  return {
    configured: isConfigured,
    enabled: isEnabled,
    active: isConfigured && isEnabled,
    queueUrl: RATE_LIMITER_CONFIG.QUEUE.URL,
    region: process.env.AWS_REGION || 'us-east-1',
    features: {
      circuitBreaker: RATE_LIMITER_CONFIG.FEATURES.CIRCUIT_BREAKER_ENABLED,
      fallbackToDb: RATE_LIMITER_CONFIG.FEATURES.FALLBACK_TO_DB,
      metrics: RATE_LIMITER_CONFIG.FEATURES.METRICS_ENABLED,
    },
  };
}

// ============================================================================
// Startup Validation
// ============================================================================

/**
 * Validates configuration on module load (only in production)
 * Logs warnings instead of throwing to prevent build failures
 */
if (process.env.NODE_ENV === 'production') {
  try {
    validateRateLimiterConfig();
    console.log('[Rate Limiter] Configuration validated successfully');
  } catch (error) {
    console.warn('[Rate Limiter] Configuration validation failed:', error);
    console.warn('[Rate Limiter] Rate limiting features will be disabled');
  }
}

// ============================================================================
// Exports
// ============================================================================

export default RATE_LIMITER_CONFIG;
