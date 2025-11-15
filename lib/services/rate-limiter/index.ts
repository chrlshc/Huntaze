/**
 * Rate Limiter Service - Main Export
 * 
 * Comprehensive rate limiting system with Redis backend
 */

// Types
export * from './types';

// Configuration
export * from './config';

// Core services
export { rateLimiterAPI, RateLimiterAPIClient } from './api-client';
export { circuitBreaker, CircuitBreaker } from './circuit-breaker';
export { RateLimiterService, rateLimiter } from './rate-limiter';

// Authentication rate limiting
export {
  trackFailedLogin,
  checkLoginRateLimit,
  resetFailedLogins,
  detectCredentialStuffing,
  getFailedLoginStats,
  BACKOFF_DURATIONS,
  FAILED_LOGIN_TTL,
  CREDENTIAL_STUFFING_WINDOW,
  CREDENTIAL_STUFFING_THRESHOLD,
} from './auth-limiter';

export type {
  FailedLoginAttempt,
  LoginRateLimitResult,
  AuthStats,
  AuthRateLimitError,
} from './auth-limiter';

export { AuthRateLimitErrorType } from './auth-limiter';

// IP-based rate limiting
export {
  IPRateLimiter,
  getIPRateLimiter,
  resetIPRateLimiter,
} from './ip-limiter';

export type {
  IPRateLimitResult,
  IPViolationMetadata,
  IPRateLimitError,
} from './ip-limiter';

export { IPRateLimitErrorType } from './ip-limiter';

// Utilities
export { extractIdentity, getClientIp } from './identity';
export { buildRateLimitHeaders, addRateLimitHeaders } from './headers';
