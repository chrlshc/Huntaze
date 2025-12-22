/**
 * Webhook Security Module
 * Content & Trends AI Engine - Phase 4
 * 
 * Secure webhook processing for Apify integration with:
 * - HMAC signature verification (timing-safe)
 * - Timestamp validation (replay attack prevention)
 * - Redis-based idempotency (24-48h TTL)
 * - Rate limiting (DDoS protection)
 * - Payload validation
 * - Security event logging
 */

// Types
export type {
  // Security types
  WebhookSecurityConfig,
  SignatureValidationResult,
  TimestampValidationResult,
  // Idempotency types
  IdempotencyConfig,
  IdempotencyResult,
  IdempotencyRecord,
  // Rate limiting types
  RateLimitConfig,
  RateLimitResult,
  RateLimitInfo,
  // Payload validation types
  PayloadValidationConfig,
  PayloadValidationResult,
  PayloadValidationError,
  PayloadValidationWarning,
  PayloadErrorCode,
  // Security event types
  SecurityEventType,
  SecurityEvent,
  SecurityEventLogger,
  // Processing types
  WebhookProcessingResult,
  WebhookProcessingError,
  WebhookErrorCode,
  // Controller types
  IWebhookController,
  WebhookHeaders,
  WebhookControllerConfig,
} from './types';

// Default configurations
export {
  DEFAULT_SECURITY_CONFIG,
  DEFAULT_IDEMPOTENCY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_PAYLOAD_VALIDATION_CONFIG,
} from './types';

// Signature Validator
export {
  SignatureValidator,
  createSignatureValidator,
  generateTestSignature,
  extractSignatureFromHeader,
} from './signature-validator';

// Idempotency Service
export {
  IdempotencyService,
  createIdempotencyService,
  createInMemoryIdempotencyService,
  type RedisClientInterface,
} from './idempotency-service';

// Rate Limiter
export {
  WebhookRateLimiter,
  createWebhookRateLimiter,
  createInMemoryRateLimiter,
  RateLimitExceededError,
  type RateLimitRedisInterface,
  type RateLimitRedisMulti,
} from './rate-limiter';

// Payload Validator
export {
  PayloadValidator,
  createPayloadValidator,
  extractEventId,
  isSuccessEvent,
  isFailureEvent,
} from './payload-validator';

// Security Logger
export {
  WebhookSecurityLogger,
  createSecurityLogger,
  getSecurityLogger,
  setSecurityLogger,
  type SecurityLoggerConfig,
  type SecurityEventStatistics,
} from './security-logger';

// Webhook Controller
export {
  WebhookController,
  createWebhookController,
  createWebhookMiddleware,
} from './webhook-controller';
