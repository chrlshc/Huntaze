/**
 * Webhook Security Types
 * Content & Trends AI Engine - Phase 4
 * 
 * Type definitions for webhook security, validation, and processing
 */

import { ApifyWebhookPayload, WebhookEventType, ActorRunStatus } from '../apify/types';

// ============================================================================
// Security Types
// ============================================================================

export interface WebhookSecurityConfig {
  /** Secret key for HMAC signature verification */
  secretKey: string;
  /** Algorithm for HMAC (default: sha256) */
  algorithm?: 'sha256' | 'sha384' | 'sha512';
  /** Header name containing the signature */
  signatureHeader?: string;
  /** Header name containing the timestamp */
  timestampHeader?: string;
  /** Maximum age of webhook in seconds (default: 300 = 5 minutes) */
  maxAgeSeconds?: number;
  /** Enable timestamp validation */
  validateTimestamp?: boolean;
}

export interface SignatureValidationResult {
  isValid: boolean;
  error?: string;
  computedSignature?: string;
  providedSignature?: string;
}

export interface TimestampValidationResult {
  isValid: boolean;
  error?: string;
  timestamp?: Date;
  ageSeconds?: number;
}

// ============================================================================
// Idempotency Types
// ============================================================================

export interface IdempotencyConfig {
  /** Redis key prefix for idempotency keys */
  keyPrefix?: string;
  /** TTL in seconds (default: 172800 = 48 hours) */
  ttlSeconds?: number;
  /** Enable idempotency checking */
  enabled?: boolean;
}

export interface IdempotencyResult {
  isDuplicate: boolean;
  eventId: string;
  firstSeenAt?: Date;
  processedAt?: Date;
}

export interface IdempotencyRecord {
  eventId: string;
  eventType: WebhookEventType;
  actorRunId: string;
  firstSeenAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processed' | 'failed';
  attempts: number;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Redis key prefix for rate limit keys */
  keyPrefix?: string;
  /** Enable rate limiting */
  enabled?: boolean;
  /** Burst allowance (extra requests allowed in burst) */
  burstAllowance?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds?: number;
}

export interface RateLimitInfo {
  clientId: string;
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
}

// ============================================================================
// Payload Validation Types
// ============================================================================

export interface PayloadValidationConfig {
  /** Required fields in the payload */
  requiredFields?: string[];
  /** Maximum payload size in bytes */
  maxPayloadSize?: number;
  /** Allowed event types */
  allowedEventTypes?: WebhookEventType[];
}

export interface PayloadValidationResult {
  isValid: boolean;
  errors: PayloadValidationError[];
  warnings: PayloadValidationWarning[];
  normalizedPayload?: ApifyWebhookPayload;
}

export interface PayloadValidationError {
  field: string;
  message: string;
  code: PayloadErrorCode;
}

export interface PayloadValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export type PayloadErrorCode =
  | 'MISSING_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNKNOWN_EVENT_TYPE'
  | 'MALFORMED_JSON';

// ============================================================================
// Security Event Types
// ============================================================================

export type SecurityEventType =
  | 'SIGNATURE_VALID'
  | 'SIGNATURE_INVALID'
  | 'TIMESTAMP_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DUPLICATE_EVENT'
  | 'PAYLOAD_INVALID'
  | 'PROCESSING_SUCCESS'
  | 'PROCESSING_FAILURE';

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  clientId?: string;
  eventId?: string;
  actorRunId?: string;
  details: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface SecurityEventLogger {
  log(event: SecurityEvent): void;
  getRecentEvents(count: number): SecurityEvent[];
  getEventsByType(type: SecurityEventType, since: Date): SecurityEvent[];
}

// ============================================================================
// Webhook Processing Types
// ============================================================================

export interface WebhookProcessingResult {
  success: boolean;
  jobId?: string;
  eventId: string;
  processingTimeMs: number;
  error?: WebhookProcessingError;
}

export interface WebhookProcessingError {
  code: WebhookErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export type WebhookErrorCode =
  | 'SIGNATURE_VERIFICATION_FAILED'
  | 'TIMESTAMP_VALIDATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DUPLICATE_EVENT'
  | 'PAYLOAD_VALIDATION_FAILED'
  | 'QUEUE_SUBMISSION_FAILED'
  | 'INTERNAL_ERROR';

// ============================================================================
// Webhook Controller Interface
// ============================================================================

export interface IWebhookController {
  /** Validate webhook signature */
  validateSignature(rawBody: Buffer, signature: string): SignatureValidationResult;
  
  /** Process incoming Apify webhook */
  processWebhook(
    rawBody: Buffer,
    headers: WebhookHeaders
  ): Promise<WebhookProcessingResult>;
  
  /** Check if event has been processed (idempotency) */
  checkIdempotency(eventId: string): Promise<IdempotencyResult>;
  
  /** Handle webhook processing failure */
  handleFailure(
    error: Error,
    payload: ApifyWebhookPayload,
    eventId: string
  ): Promise<void>;
  
  /** Get rate limit status for a client */
  getRateLimitStatus(clientId: string): Promise<RateLimitResult>;
}

export interface WebhookHeaders {
  signature?: string;
  timestamp?: string;
  contentType?: string;
  userAgent?: string;
  clientId?: string;
}

// ============================================================================
// Webhook Controller Configuration
// ============================================================================

export interface WebhookControllerConfig {
  security: WebhookSecurityConfig;
  idempotency?: IdempotencyConfig;
  rateLimit?: RateLimitConfig;
  payloadValidation?: PayloadValidationConfig;
  /** Enable security event logging */
  enableLogging?: boolean;
  /** Queue name for webhook jobs */
  queueName?: string;
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_SECURITY_CONFIG: Required<Omit<WebhookSecurityConfig, 'secretKey'>> = {
  algorithm: 'sha256',
  signatureHeader: 'x-apify-signature',
  timestampHeader: 'x-apify-timestamp',
  maxAgeSeconds: 300, // 5 minutes
  validateTimestamp: true,
};

export const DEFAULT_IDEMPOTENCY_CONFIG: Required<IdempotencyConfig> = {
  keyPrefix: 'webhook:idempotency:',
  ttlSeconds: 172800, // 48 hours
  enabled: true,
};

export const DEFAULT_RATE_LIMIT_CONFIG: Required<RateLimitConfig> = {
  maxRequests: 100,
  windowSeconds: 60, // 1 minute
  keyPrefix: 'webhook:ratelimit:',
  enabled: true,
  burstAllowance: 20,
};

export const DEFAULT_PAYLOAD_VALIDATION_CONFIG: Required<PayloadValidationConfig> = {
  requiredFields: ['eventType', 'eventData', 'createdAt'],
  maxPayloadSize: 1024 * 1024, // 1MB
  allowedEventTypes: [
    'ACTOR.RUN.CREATED',
    'ACTOR.RUN.SUCCEEDED',
    'ACTOR.RUN.FAILED',
    'ACTOR.RUN.TIMED_OUT',
    'ACTOR.RUN.ABORTED',
    'ACTOR.RUN.RESURRECTED',
  ],
};
