/**
 * Webhook Security Controller
 * Content & Trends AI Engine - Phase 4
 * 
 * Main controller for secure webhook processing with:
 * - HMAC signature verification (timing-safe)
 * - Timestamp validation (replay attack prevention)
 * - Redis-based idempotency (24-48h TTL)
 * - Rate limiting (DDoS protection)
 * - Payload validation
 * - Security event logging
 */

import {
  WebhookControllerConfig,
  WebhookHeaders,
  WebhookProcessingResult,
  WebhookProcessingError,
  WebhookErrorCode,
  IWebhookController,
  RateLimitResult,
  IdempotencyResult,
  SignatureValidationResult,
} from './types';
import { ApifyWebhookPayload } from '../apify/types';
import { SignatureValidator, createSignatureValidator } from './signature-validator';
import { IdempotencyService, createIdempotencyService, RedisClientInterface } from './idempotency-service';
import { WebhookRateLimiter, createWebhookRateLimiter, RateLimitRedisInterface } from './rate-limiter';
import { PayloadValidator, createPayloadValidator, extractEventId } from './payload-validator';
import { WebhookSecurityLogger, createSecurityLogger } from './security-logger';

// ============================================================================
// Webhook Controller
// ============================================================================

export class WebhookController implements IWebhookController {
  private readonly signatureValidator: SignatureValidator;
  private readonly idempotencyService: IdempotencyService;
  private readonly rateLimiter: WebhookRateLimiter;
  private readonly payloadValidator: PayloadValidator;
  private readonly securityLogger: WebhookSecurityLogger;
  private readonly config: WebhookControllerConfig;

  constructor(
    config: WebhookControllerConfig,
    dependencies?: {
      redisClient?: RedisClientInterface;
      rateLimitRedis?: RateLimitRedisInterface;
    }
  ) {
    this.config = config;

    // Initialize components
    this.signatureValidator = createSignatureValidator(config.security);
    this.idempotencyService = createIdempotencyService(
      config.idempotency,
      dependencies?.redisClient
    );
    this.rateLimiter = createWebhookRateLimiter(
      config.rateLimit,
      dependencies?.rateLimitRedis
    );
    this.payloadValidator = createPayloadValidator(config.payloadValidation);
    this.securityLogger = createSecurityLogger({
      consoleLogging: config.enableLogging ?? true,
    });
  }

  /**
   * Validate webhook signature
   */
  validateSignature(rawBody: Buffer, signature: string): SignatureValidationResult {
    return this.signatureValidator.validateSignature(rawBody, signature);
  }

  /**
   * Process incoming Apify webhook
   * 
   * This is the main entry point that orchestrates all security checks
   * and processing steps.
   */
  async processWebhook(
    rawBody: Buffer,
    headers: WebhookHeaders
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    let eventId = '';
    let payload: ApifyWebhookPayload | undefined;

    try {
      // Step 1: Rate limiting check
      const clientId = headers.clientId ?? headers.userAgent ?? 'unknown';
      const rateLimitResult = await this.rateLimiter.checkAndRecord(clientId);
      
      if (!rateLimitResult.allowed) {
        this.securityLogger.logRateLimitExceeded(
          clientId,
          0, // We don't have the exact count here
          this.config.rateLimit?.maxRequests ?? 100
        );
        
        return this.createErrorResult(
          eventId,
          startTime,
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded. Retry after ${rateLimitResult.retryAfterSeconds} seconds.`,
          true
        );
      }

      // Step 2: Signature validation
      if (headers.signature) {
        const signatureResult = this.signatureValidator.validateSignature(
          rawBody,
          headers.signature
        );

        if (!signatureResult.isValid) {
          this.securityLogger.logSignatureInvalid(
            eventId,
            clientId,
            signatureResult.error
          );

          return this.createErrorResult(
            eventId,
            startTime,
            'SIGNATURE_VERIFICATION_FAILED',
            signatureResult.error ?? 'Invalid signature',
            false
          );
        }

        this.securityLogger.logSignatureValid(eventId, clientId);
      }

      // Step 3: Timestamp validation
      if (headers.timestamp && this.config.security.validateTimestamp !== false) {
        const timestampResult = this.signatureValidator.validateTimestamp(headers.timestamp);

        if (!timestampResult.isValid) {
          this.securityLogger.logTimestampExpired(
            eventId,
            timestampResult.ageSeconds ?? 0,
            this.config.security.maxAgeSeconds ?? 300
          );

          return this.createErrorResult(
            eventId,
            startTime,
            'TIMESTAMP_VALIDATION_FAILED',
            timestampResult.error ?? 'Timestamp validation failed',
            false
          );
        }
      }

      // Step 4: Payload validation
      const validationResult = this.payloadValidator.validate(rawBody);

      if (!validationResult.isValid) {
        this.securityLogger.logPayloadInvalid(
          eventId,
          validationResult.errors.map(e => ({ field: e.field, message: e.message }))
        );

        return this.createErrorResult(
          eventId,
          startTime,
          'PAYLOAD_VALIDATION_FAILED',
          validationResult.errors.map(e => e.message).join('; '),
          false
        );
      }

      payload = validationResult.normalizedPayload!;
      eventId = extractEventId(payload);

      // Step 5: Idempotency check
      const idempotencyResult = await this.idempotencyService.checkIdempotency(eventId);

      if (idempotencyResult.isDuplicate) {
        this.securityLogger.logDuplicateEvent(eventId, payload.eventData.actorRunId);

        return {
          success: true, // Duplicate is not an error, just skip processing
          eventId,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Step 6: Mark as processing (acquire lock)
      const lockAcquired = await this.idempotencyService.markAsProcessing(
        eventId,
        payload.eventType,
        payload.eventData.actorRunId
      );

      if (!lockAcquired) {
        // Another process is handling this event
        return {
          success: true,
          eventId,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Step 7: Process the webhook (queue the job)
      const jobId = await this.queueWebhookJob(payload);

      // Step 8: Mark as processed
      await this.idempotencyService.markAsProcessed(eventId);

      const processingTimeMs = Date.now() - startTime;
      this.securityLogger.logProcessingSuccess(
        eventId,
        payload.eventData.actorRunId,
        jobId,
        processingTimeMs
      );

      return {
        success: true,
        jobId,
        eventId,
        processingTimeMs,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.securityLogger.logProcessingFailure(
        eventId,
        payload?.eventData.actorRunId ?? 'unknown',
        errorMessage,
        true
      );

      // Mark as failed (allows retry)
      if (eventId) {
        await this.idempotencyService.markAsFailed(eventId);
      }

      return this.createErrorResult(
        eventId,
        startTime,
        'INTERNAL_ERROR',
        errorMessage,
        true
      );
    }
  }

  /**
   * Check if event has been processed (idempotency)
   */
  async checkIdempotency(eventId: string): Promise<IdempotencyResult> {
    return this.idempotencyService.checkIdempotency(eventId);
  }

  /**
   * Handle webhook processing failure
   */
  async handleFailure(
    error: Error,
    payload: ApifyWebhookPayload,
    eventId: string
  ): Promise<void> {
    this.securityLogger.logProcessingFailure(
      eventId,
      payload.eventData.actorRunId,
      error.message,
      true
    );

    await this.idempotencyService.markAsFailed(eventId);
  }

  /**
   * Get rate limit status for a client
   */
  async getRateLimitStatus(clientId: string): Promise<RateLimitResult> {
    return this.rateLimiter.checkRateLimit(clientId);
  }

  /**
   * Get security event statistics
   */
  getSecurityStatistics(since?: Date) {
    return this.securityLogger.getStatistics(since);
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(count: number = 100) {
    return this.securityLogger.getRecentEvents(count);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async queueWebhookJob(payload: ApifyWebhookPayload): Promise<string> {
    // In a real implementation, this would add the job to BullMQ
    // For now, we generate a job ID
    const jobId = `webhook-${payload.eventData.actorRunId}-${Date.now()}`;
    
    // TODO: Integrate with ContentTrendsQueueManager
    // await this.queueManager.addJob(QueueName.WEBHOOK_PROCESSING, {
    //   type: 'webhook',
    //   payload,
    //   priority: this.determineJobPriority(payload),
    // });

    return jobId;
  }

  private createErrorResult(
    eventId: string,
    startTime: number,
    code: WebhookErrorCode,
    message: string,
    retryable: boolean
  ): WebhookProcessingResult {
    const error: WebhookProcessingError = {
      code,
      message,
      retryable,
    };

    return {
      success: false,
      eventId,
      processingTimeMs: Date.now() - startTime,
      error,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a webhook controller instance
 */
export function createWebhookController(
  config: WebhookControllerConfig,
  dependencies?: {
    redisClient?: RedisClientInterface;
    rateLimitRedis?: RateLimitRedisInterface;
  }
): WebhookController {
  return new WebhookController(config, dependencies);
}

// ============================================================================
// Express/Next.js Middleware Helper
// ============================================================================

/**
 * Create middleware for webhook processing
 */
export function createWebhookMiddleware(controller: WebhookController) {
  return async (req: {
    body: Buffer;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<WebhookProcessingResult> => {
    const headers: WebhookHeaders = {
      signature: getHeader(req.headers, 'x-apify-signature'),
      timestamp: getHeader(req.headers, 'x-apify-timestamp'),
      contentType: getHeader(req.headers, 'content-type'),
      userAgent: getHeader(req.headers, 'user-agent'),
      clientId: getHeader(req.headers, 'x-forwarded-for') ?? getHeader(req.headers, 'x-real-ip'),
    };

    return controller.processWebhook(req.body, headers);
  };
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}
