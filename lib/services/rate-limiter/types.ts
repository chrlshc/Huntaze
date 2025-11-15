/**
 * Rate Limiter Types
 * 
 * Core TypeScript interfaces and types for the rate limiting system.
 */

/**
 * Identity type for rate limiting
 * Represents who is making the request (IP, user, or API key)
 */
export type IdentityType = 'ip' | 'user' | 'apiKey';

/**
 * User tier for rate limit overrides
 */
export type UserTier = 'free' | 'premium' | 'enterprise';

/**
 * Rate limiting algorithm type
 */
export type RateLimitAlgorithm = 'token-bucket' | 'sliding-window' | 'fixed-window';

/**
 * Identity information for rate limiting
 */
export interface Identity {
  /** Type of identity (IP, user, API key) */
  type: IdentityType;
  
  /** Identity value (IP address, user ID, or API key) */
  value: string;
  
  /** User tier for rate limit overrides */
  tier?: UserTier;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  
  /** Maximum requests allowed in the time window */
  limit: number;
  
  /** Remaining requests in current window */
  remaining: number;
  
  /** When the rate limit resets */
  resetAt: Date;
  
  /** Seconds until retry is allowed (only when rate limited) */
  retryAfter?: number;
}

/**
 * Rate limit policy configuration
 */
export interface RateLimitPolicy {
  /** Requests allowed per minute */
  perMinute: number;
  
  /** Requests allowed per hour (optional) */
  perHour?: number;
  
  /** Requests allowed per day (optional) */
  perDay?: number;
  
  /** Burst allowance for token bucket algorithm */
  burst?: number;
  
  /** Algorithm to use for rate limiting */
  algorithm: RateLimitAlgorithm;
  
  /** Tier-specific overrides */
  tiers?: {
    free?: Partial<RateLimitPolicy>;
    premium?: Partial<RateLimitPolicy>;
    enterprise?: Partial<RateLimitPolicy>;
  };
}

/**
 * Rate limit statistics
 */
export interface RateLimitStats {
  /** Total requests made */
  totalRequests: number;
  
  /** Requests allowed */
  allowedRequests: number;
  
  /** Requests blocked */
  blockedRequests: number;
  
  /** Rate limit hit rate (percentage) */
  hitRate: number;
  
  /** Current rate limit state */
  currentState: RateLimitResult;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Whether rate limiting is enabled */
  enabled: boolean;
  
  /** Redis connection URL */
  redisUrl?: string;
  
  /** Redis authentication token */
  redisToken?: string;
  
  /** Default rate limit policy */
  defaultPolicy: RateLimitPolicy;
  
  /** Endpoint-specific policies */
  policies: Record<string, RateLimitPolicy>;
  
  /** IP-based rate limits */
  ipLimits: RateLimitPolicy;
  
  /** Whitelisted IP addresses */
  ipWhitelist: string[];
  
  /** Circuit breaker configuration */
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenSuccessThreshold: number;
  };
  
  /** Monitoring configuration */
  monitoring: {
    enabled: boolean;
    alertThreshold: number;
  };
}

/**
 * Rate limit error types
 */
export enum RateLimitErrorType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  REDIS_ERROR = 'REDIS_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Rate limit error
 */
export interface RateLimitError {
  /** Error type */
  type: RateLimitErrorType;
  
  /** Technical error message */
  message: string;
  
  /** User-friendly error message */
  userMessage: string;
  
  /** Whether the error is retryable */
  retryable: boolean;
  
  /** Correlation ID for debugging */
  correlationId?: string;
  
  /** Rate limit result (when applicable) */
  rateLimitResult?: RateLimitResult;
}
export interface RateLimitPolicy {
  /** Requests allowed per minute */
  perMinute: number;
  
  /** Requests allowed per hour (optional) */
  perHour?: number;
  
  /** Requests allowed per day (optional) */
  perDay?: number;
  
  /** Burst allowance for token bucket algorithm */
  burst?: number;
  
  /** Algorithm to use for rate limiting */
  algorithm: RateLimitAlgorithm;
  
  /** Tier-specific overrides */
  tiers?: {
    free?: Partial<RateLimitPolicy>;
    premium?: Partial<RateLimitPolicy>;
    enterprise?: Partial<RateLimitPolicy>;
  };
}

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  
  /** Time in ms before attempting to close circuit */
  resetTimeout: number;
  
  /** Number of successes needed in half-open state to close circuit */
  halfOpenSuccessThreshold: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Whether rate limiting is enabled */
  enabled: boolean;
  
  /** Redis URL for distributed rate limiting */
  redisUrl?: string;
  
  /** Redis token (for Upstash) */
  redisToken?: string;
  
  /** Default rate limit policy */
  defaultPolicy: RateLimitPolicy;
  
  /** Endpoint-specific policies */
  policies: Record<string, RateLimitPolicy>;
  
  /** IP-based rate limits for unauthenticated requests */
  ipLimits: RateLimitPolicy;
  
  /** Whitelisted IPs that bypass rate limiting */
  ipWhitelist: string[];
  
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig;
  
  /** Monitoring configuration */
  monitoring: {
    enabled: boolean;
    alertThreshold: number; // % of requests rate limited
  };
}

/**
 * Rate limit statistics
 */
export interface RateLimitStats {
  /** Total requests processed */
  totalRequests: number;
  
  /** Requests allowed */
  allowedRequests: number;
  
  /** Requests blocked */
  blockedRequests: number;
  
  /** Rate limit hit rate (percentage) */
  hitRate: number;
  
  /** Per-endpoint statistics */
  endpointStats: Record<string, {
    requests: number;
    blocked: number;
    hitRate: number;
  }>;
  
  /** Performance metrics */
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  
  /** Redis health */
  redisHealth: {
    available: boolean;
    latency: number;
    errors: number;
  };
  
  /** Circuit breaker state */
  circuitBreakerState: CircuitBreakerState;
}

/**
 * Token bucket state
 */
export interface TokenBucketState {
  /** Current number of tokens */
  tokens: number;
  
  /** Last time tokens were refilled */
  lastRefill: number;
  
  /** Maximum capacity */
  capacity: number;
  
  /** Refill rate (tokens per second) */
  refillRate: number;
}

/**
 * Failed login attempt tracking
 */
export interface FailedLoginAttempt {
  /** Number of failed attempts */
  count: number;
  
  /** When the attempts started */
  firstAttemptAt: Date;
  
  /** When the last attempt occurred */
  lastAttemptAt: Date;
  
  /** When the block expires */
  blockedUntil?: Date;
}

/**
 * IP block information
 */
export interface IPBlock {
  /** IP address */
  ip: string;
  
  /** When the block was created */
  blockedAt: Date;
  
  /** Reason for the block */
  reason: string;
  
  /** When the block expires */
  expiresAt: Date;
  
  /** Block level (for progressive penalties) */
  level: number;
}

/**
 * Rate limit metrics for monitoring
 */
export interface RateLimitMetrics {
  /** Timestamp of the metric */
  timestamp: Date;
  
  /** Identity that was rate limited */
  identity: Identity;
  
  /** Endpoint that was accessed */
  endpoint: string;
  
  /** Whether the request was allowed */
  allowed: boolean;
  
  /** Rate limit that was applied */
  limit: number;
  
  /** Remaining requests */
  remaining: number;
  
  /** Latency of the rate limit check (ms) */
  latency: number;
}

/**
 * Credential stuffing detection event
 */
export interface CredentialStuffingEvent {
  /** Username being targeted */
  username: string;
  
  /** List of IPs attempting access */
  ips: string[];
  
  /** Number of attempts */
  attemptCount: number;
  
  /** When the pattern was detected */
  detectedAt: Date;
}
