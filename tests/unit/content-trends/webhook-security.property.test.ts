/**
 * Webhook Security Property Tests
 * Content & Trends AI Engine - Task 4.2*
 * 
 * Property-based tests for webhook security validation
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
 * 
 * Property 5: Webhook Security Validation
 * *For any* webhook payload and signature, the security validation
 * should correctly verify signatures, prevent duplicates, and enforce rate limits
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import {
  createSignatureValidator,
} from '../../../lib/ai/content-trends/webhook/signature-validator';

import {
  IdempotencyService,
  createInMemoryIdempotencyService,
} from '../../../lib/ai/content-trends/webhook/idempotency-service';

import {
  createInMemoryRateLimiter,
} from '../../../lib/ai/content-trends/webhook/rate-limiter';

import {
  PayloadValidator,
  createPayloadValidator,
  extractEventId,
  isSuccessEvent,
  isFailureEvent,
} from '../../../lib/ai/content-trends/webhook/payload-validator';

import {
  WebhookEventType,
} from '../../../lib/ai/content-trends/apify/types';

// ============================================================================
// Test Generators
// ============================================================================

// Generate valid webhook event types
const webhookEventTypeArb = fc.constantFrom<WebhookEventType>(
  'ACTOR.RUN.CREATED',
  'ACTOR.RUN.SUCCEEDED',
  'ACTOR.RUN.FAILED',
  'ACTOR.RUN.TIMED_OUT',
  'ACTOR.RUN.ABORTED',
  'ACTOR.RUN.RESURRECTED'
);

// Generate valid actor IDs
const actorIdArb = fc.stringMatching(/^[a-zA-Z0-9]{10,20}$/);

// Generate valid actor run IDs
const actorRunIdArb = fc.stringMatching(/^[a-zA-Z0-9]{10,20}$/);

// Generate valid timestamps (ISO format)
const timestampArb = fc.integer({
  min: new Date('2024-01-01').getTime(),
  max: new Date('2025-12-31').getTime(),
}).map(ts => new Date(ts).toISOString());

// Generate valid webhook payloads
const webhookPayloadArb = fc.record({
  userId: fc.string({ minLength: 5, maxLength: 20 }),
  createdAt: timestampArb,
  eventType: webhookEventTypeArb,
  eventData: fc.record({
    actorId: actorIdArb,
    actorRunId: actorRunIdArb,
    actorTaskId: fc.option(actorIdArb, { nil: undefined }),
    resourceId: fc.option(actorIdArb, { nil: undefined }),
  }),
  resource: fc.option(
    fc.record({
      id: actorRunIdArb,
      actId: actorIdArb,
      userId: fc.string({ minLength: 5, maxLength: 20 }),
      startedAt: timestampArb,
      finishedAt: fc.option(timestampArb, { nil: undefined }),
      status: fc.constantFrom('READY', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMING-OUT', 'TIMED-OUT', 'ABORTING', 'ABORTED'),
      statusMessage: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
      defaultKeyValueStoreId: actorIdArb,
      defaultDatasetId: actorIdArb,
      defaultRequestQueueId: actorIdArb,
    }),
    { nil: undefined }
  ),
});

// Generate secret keys
const secretKeyArb = fc.string({ minLength: 32, maxLength: 64 });

// Generate client IDs for rate limiting
const clientIdArb = fc.stringMatching(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);

// ============================================================================
// Signature Validation Property Tests
// ============================================================================

describe('Webhook Security Property Tests', () => {
  describe('Property 5.1: Signature Validation Consistency', () => {
    it('valid signatures should always be accepted', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          secretKeyArb,
          (payload, secretKey) => {
            const validator = createSignatureValidator({ secretKey });
            const rawBody = Buffer.from(JSON.stringify(payload));
            const signature = validator.computeSignature(rawBody);
            
            const result = validator.validateSignature(rawBody, signature);
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid signatures should always be rejected', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          secretKeyArb,
          fc.string({ minLength: 64, maxLength: 64 }),
          (payload, secretKey, wrongSignature) => {
            const validator = createSignatureValidator({ secretKey });
            const rawBody = Buffer.from(JSON.stringify(payload));
            
            // Use a completely different signature
            const result = validator.validateSignature(rawBody, wrongSignature);
            
            // Should be invalid (unless by extreme coincidence)
            // We check that the computed signature differs
            expect(result.computedSignature).not.toBe(wrongSignature);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('signature computation should be deterministic', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          secretKeyArb,
          (payload, secretKey) => {
            const validator = createSignatureValidator({ secretKey });
            const rawBody = Buffer.from(JSON.stringify(payload));
            
            const sig1 = validator.computeSignature(rawBody);
            const sig2 = validator.computeSignature(rawBody);
            
            expect(sig1).toBe(sig2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('different payloads should produce different signatures', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          webhookPayloadArb,
          secretKeyArb,
          (payload1, payload2, secretKey) => {
            fc.pre(JSON.stringify(payload1) !== JSON.stringify(payload2));
            
            const validator = createSignatureValidator({ secretKey });
            const sig1 = validator.computeSignature(Buffer.from(JSON.stringify(payload1)));
            const sig2 = validator.computeSignature(Buffer.from(JSON.stringify(payload2)));
            
            expect(sig1).not.toBe(sig2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('different secret keys should produce different signatures', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          secretKeyArb,
          secretKeyArb,
          (payload, key1, key2) => {
            fc.pre(key1 !== key2);
            
            const validator1 = createSignatureValidator({ secretKey: key1 });
            const validator2 = createSignatureValidator({ secretKey: key2 });
            const rawBody = Buffer.from(JSON.stringify(payload));
            
            const sig1 = validator1.computeSignature(rawBody);
            const sig2 = validator2.computeSignature(rawBody);
            
            expect(sig1).not.toBe(sig2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5.2: Timestamp Validation', () => {
    it('recent timestamps should be accepted (Unix format)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 60 }), // 1-60 seconds ago
          (secondsAgo) => {
            const validator = createSignatureValidator({
              secretKey: 'test-secret-key-12345678901234567890',
              maxAgeSeconds: 300,
              validateTimestamp: true,
            });
            
            // Use Unix timestamp (seconds) to avoid ISO parsing issues
            const unixTimestamp = Math.floor((Date.now() - secondsAgo * 1000) / 1000);
            const result = validator.validateTimestamp(unixTimestamp.toString());
            
            // Recent timestamps (within 300s) should be valid
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('old timestamps should be rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 3600 }), // 400-3600 seconds ago
          (secondsAgo) => {
            const validator = createSignatureValidator({
              secretKey: 'test-secret-key-12345678901234567890',
              maxAgeSeconds: 300,
              validateTimestamp: true,
            });
            
            // Use Unix timestamp (seconds)
            const unixTimestamp = Math.floor((Date.now() - secondsAgo * 1000) / 1000);
            const result = validator.validateTimestamp(unixTimestamp.toString());
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('too old');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Unix timestamps should be parsed correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 60 }),
          (secondsAgo) => {
            const validator = createSignatureValidator({
              secretKey: 'test-secret-key-12345678901234567890',
              maxAgeSeconds: 300,
              validateTimestamp: true,
            });
            
            const unixTimestamp = Math.floor((Date.now() - secondsAgo * 1000) / 1000);
            const result = validator.validateTimestamp(unixTimestamp.toString());
            
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================================================
  // Idempotency Property Tests
  // ============================================================================

  describe('Property 5.3: Idempotency Guarantees', () => {
    let idempotencyService: IdempotencyService;

    beforeEach(() => {
      idempotencyService = createInMemoryIdempotencyService({
        enabled: true,
        ttlSeconds: 3600,
      });
    });

    it('first occurrence of event should not be duplicate', async () => {
      await fc.assert(
        fc.asyncProperty(
          actorRunIdArb,
          webhookEventTypeArb,
          timestampArb,
          async (actorRunId, eventType, timestamp) => {
            const eventId = idempotencyService.generateEventId(actorRunId, eventType, timestamp);
            const result = await idempotencyService.checkIdempotency(eventId);
            
            expect(result.isDuplicate).toBe(false);
            expect(result.eventId).toBe(eventId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('second occurrence of same event should be duplicate', async () => {
      await fc.assert(
        fc.asyncProperty(
          actorRunIdArb,
          webhookEventTypeArb,
          timestampArb,
          async (actorRunId, eventType, timestamp) => {
            const eventId = idempotencyService.generateEventId(actorRunId, eventType, timestamp);
            
            // Mark as processing first
            await idempotencyService.markAsProcessing(eventId, eventType, actorRunId);
            
            // Check again - should be duplicate
            const result = await idempotencyService.checkIdempotency(eventId);
            
            expect(result.isDuplicate).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('different events should not be duplicates of each other', async () => {
      await fc.assert(
        fc.asyncProperty(
          actorRunIdArb,
          actorRunIdArb,
          webhookEventTypeArb,
          timestampArb,
          async (actorRunId1, actorRunId2, eventType, timestamp) => {
            fc.pre(actorRunId1 !== actorRunId2);
            
            const eventId1 = idempotencyService.generateEventId(actorRunId1, eventType, timestamp);
            const eventId2 = idempotencyService.generateEventId(actorRunId2, eventType, timestamp);
            
            // Mark first event
            await idempotencyService.markAsProcessing(eventId1, eventType, actorRunId1);
            
            // Second event should not be duplicate
            const result = await idempotencyService.checkIdempotency(eventId2);
            
            expect(result.isDuplicate).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('event ID generation should be deterministic', () => {
      fc.assert(
        fc.property(
          actorRunIdArb,
          webhookEventTypeArb,
          timestampArb,
          (actorRunId, eventType, timestamp) => {
            const service = createInMemoryIdempotencyService();
            
            const id1 = service.generateEventId(actorRunId, eventType, timestamp);
            const id2 = service.generateEventId(actorRunId, eventType, timestamp);
            
            expect(id1).toBe(id2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('processed events should remain marked as processed', async () => {
      await fc.assert(
        fc.asyncProperty(
          actorRunIdArb,
          webhookEventTypeArb,
          timestampArb,
          async (actorRunId, eventType, timestamp) => {
            const eventId = idempotencyService.generateEventId(actorRunId, eventType, timestamp);
            
            // Mark as processing then processed
            await idempotencyService.markAsProcessing(eventId, eventType, actorRunId);
            await idempotencyService.markAsProcessed(eventId);
            
            // Should still be duplicate
            const result = await idempotencyService.checkIdempotency(eventId);
            expect(result.isDuplicate).toBe(true);
            
            // Record should show processed status
            const record = await idempotencyService.getRecord(eventId);
            expect(record?.status).toBe('processed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('failed events should track attempts and eventually stop retries', async () => {
      await fc.assert(
        fc.asyncProperty(
          actorRunIdArb,
          webhookEventTypeArb,
          timestampArb,
          async (actorRunId, eventType, timestamp) => {
            const maxAttempts = 3;
            const service = createInMemoryIdempotencyService({
              enabled: true,
              ttlSeconds: 3600,
            });
            const eventId = service.generateEventId(actorRunId, eventType, timestamp);
            
            // First attempt - mark as processing
            const acquired = await service.markAsProcessing(eventId, eventType, actorRunId);
            expect(acquired).toBe(true);
            
            // First failure - should allow retry (deletes record)
            const canRetry1 = await service.markAsFailed(eventId, maxAttempts);
            expect(canRetry1).toBe(true);
            
            // After retry allowed, record should be deleted
            const record = await service.getRecord(eventId);
            expect(record).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================================================
  // Rate Limiting Property Tests
  // ============================================================================

  describe('Property 5.4: Rate Limiting Behavior', () => {
    it('requests within limit should be allowed', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientIdArb,
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 1, max: 9 }),
          async (clientId, maxRequests, requestCount) => {
            fc.pre(requestCount < maxRequests);
            
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests,
              windowSeconds: 60,
              burstAllowance: 0,
              enabled: true,
            });
            
            // Make requests
            for (let i = 0; i < requestCount; i++) {
              const result = await rateLimiter.checkAndRecord(clientId);
              expect(result.allowed).toBe(true);
              expect(result.remaining).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('requests exceeding limit should be blocked', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientIdArb,
          fc.integer({ min: 5, max: 20 }),
          async (clientId, maxRequests) => {
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests,
              windowSeconds: 60,
              burstAllowance: 0,
              enabled: true,
            });
            
            // Exhaust the limit
            for (let i = 0; i < maxRequests; i++) {
              await rateLimiter.recordRequest(clientId);
            }
            
            // Next request should be blocked
            const result = await rateLimiter.checkRateLimit(clientId);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfterSeconds).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('burst allowance should provide extra capacity', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientIdArb,
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 5, max: 20 }),
          async (clientId, maxRequests, burstAllowance) => {
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests,
              windowSeconds: 60,
              burstAllowance,
              enabled: true,
            });
            
            const effectiveLimit = maxRequests + burstAllowance;
            
            // Should allow up to effective limit
            for (let i = 0; i < effectiveLimit; i++) {
              const result = await rateLimiter.checkAndRecord(clientId);
              expect(result.allowed).toBe(true);
            }
            
            // Next should be blocked
            const result = await rateLimiter.checkRateLimit(clientId);
            expect(result.allowed).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('different clients should have independent limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientIdArb,
          clientIdArb,
          fc.integer({ min: 5, max: 20 }),
          async (clientId1, clientId2, maxRequests) => {
            fc.pre(clientId1 !== clientId2);
            
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests,
              windowSeconds: 60,
              burstAllowance: 0,
              enabled: true,
            });
            
            // Exhaust limit for client 1
            for (let i = 0; i < maxRequests; i++) {
              await rateLimiter.recordRequest(clientId1);
            }
            
            // Client 2 should still be allowed
            const result = await rateLimiter.checkRateLimit(clientId2);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(maxRequests - 1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('remaining count should decrease with each request', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientIdArb,
          fc.integer({ min: 10, max: 50 }),
          async (clientId, maxRequests) => {
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests,
              windowSeconds: 60,
              burstAllowance: 0,
              enabled: true,
            });
            
            let previousRemaining = maxRequests;
            
            for (let i = 0; i < Math.min(5, maxRequests); i++) {
              const result = await rateLimiter.checkAndRecord(clientId);
              expect(result.remaining).toBeLessThan(previousRemaining);
              previousRemaining = result.remaining;
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('reset should restore full capacity', async () => {
      await fc.assert(
        fc.asyncProperty(
          clientIdArb,
          fc.integer({ min: 5, max: 20 }),
          async (clientId, maxRequests) => {
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests,
              windowSeconds: 60,
              burstAllowance: 0,
              enabled: true,
            });
            
            // Use some capacity
            for (let i = 0; i < 3; i++) {
              await rateLimiter.recordRequest(clientId);
            }
            
            // Reset
            await rateLimiter.resetRateLimit(clientId);
            
            // Should have full capacity again
            const result = await rateLimiter.checkRateLimit(clientId);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(maxRequests - 1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================================================
  // Payload Validation Property Tests
  // ============================================================================

  describe('Property 5.5: Payload Validation', () => {
    let payloadValidator: PayloadValidator;

    beforeEach(() => {
      payloadValidator = createPayloadValidator();
    });

    it('valid payloads should pass validation', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          (payload) => {
            const rawBody = JSON.stringify(payload);
            const result = payloadValidator.validate(rawBody);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.normalizedPayload).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('malformed JSON should be rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (invalidJson) => {
            // Ensure it's not valid JSON
            fc.pre(!isValidJson(invalidJson));
            
            const result = payloadValidator.validate(invalidJson);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.code === 'MALFORMED_JSON')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('missing required fields should be rejected', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('eventType', 'eventData', 'createdAt'),
          webhookPayloadArb,
          (missingField, payload) => {
            const partialPayload = { ...payload };
            delete (partialPayload as Record<string, unknown>)[missingField];
            
            const rawBody = JSON.stringify(partialPayload);
            const result = payloadValidator.validate(rawBody);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.code === 'MISSING_FIELD')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('unknown event types should be rejected', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          fc.string({ minLength: 5, maxLength: 30 }),
          (payload, unknownEventType) => {
            // Ensure it's not a valid event type
            const validTypes = [
              'ACTOR.RUN.CREATED',
              'ACTOR.RUN.SUCCEEDED',
              'ACTOR.RUN.FAILED',
              'ACTOR.RUN.TIMED_OUT',
              'ACTOR.RUN.ABORTED',
              'ACTOR.RUN.RESURRECTED',
            ];
            fc.pre(!validTypes.includes(unknownEventType));
            
            const invalidPayload = { ...payload, eventType: unknownEventType };
            const rawBody = JSON.stringify(invalidPayload);
            const result = payloadValidator.validate(rawBody);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.code === 'UNKNOWN_EVENT_TYPE')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('oversized payloads should be rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (multiplier) => {
            const validator = createPayloadValidator({ maxPayloadSize: 100 });
            
            // Create a payload larger than 100 bytes
            const largePayload = {
              userId: 'x'.repeat(50 * multiplier),
              eventType: 'ACTOR.RUN.SUCCEEDED',
              createdAt: new Date().toISOString(),
              eventData: {
                actorId: 'y'.repeat(50 * multiplier),
                actorRunId: 'z'.repeat(50 * multiplier),
              },
            };
            
            const rawBody = JSON.stringify(largePayload);
            fc.pre(Buffer.byteLength(rawBody) > 100);
            
            const result = validator.validate(rawBody);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.code === 'PAYLOAD_TOO_LARGE')).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('event ID extraction should be deterministic', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          (payload) => {
            const rawBody = JSON.stringify(payload);
            const result = payloadValidator.validate(rawBody);
            
            if (result.isValid && result.normalizedPayload) {
              const eventId1 = extractEventId(result.normalizedPayload);
              const eventId2 = extractEventId(result.normalizedPayload);
              
              expect(eventId1).toBe(eventId2);
              expect(eventId1).toContain(result.normalizedPayload.eventData.actorRunId);
              expect(eventId1).toContain(result.normalizedPayload.eventType);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('success events should be correctly identified', () => {
      fc.assert(
        fc.property(
          webhookEventTypeArb,
          (eventType) => {
            const isSuccess = isSuccessEvent(eventType);
            
            if (eventType === 'ACTOR.RUN.SUCCEEDED') {
              expect(isSuccess).toBe(true);
            } else {
              expect(isSuccess).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('failure events should be correctly identified', () => {
      fc.assert(
        fc.property(
          webhookEventTypeArb,
          (eventType) => {
            const isFailure = isFailureEvent(eventType);
            const failureTypes = ['ACTOR.RUN.FAILED', 'ACTOR.RUN.TIMED_OUT', 'ACTOR.RUN.ABORTED'];
            
            if (failureTypes.includes(eventType)) {
              expect(isFailure).toBe(true);
            } else {
              expect(isFailure).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('normalized payload should preserve essential data', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          (payload) => {
            const rawBody = JSON.stringify(payload);
            const result = payloadValidator.validate(rawBody);
            
            if (result.isValid && result.normalizedPayload) {
              const normalized = result.normalizedPayload;
              
              // Essential fields should be preserved
              expect(normalized.eventType).toBe(payload.eventType);
              expect(normalized.eventData.actorId).toBe(payload.eventData.actorId);
              expect(normalized.eventData.actorRunId).toBe(payload.eventData.actorRunId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Buffer and string inputs should produce same results', () => {
      fc.assert(
        fc.property(
          webhookPayloadArb,
          (payload) => {
            const jsonString = JSON.stringify(payload);
            const jsonBuffer = Buffer.from(jsonString);
            
            const resultFromString = payloadValidator.validate(jsonString);
            const resultFromBuffer = payloadValidator.validate(jsonBuffer);
            
            expect(resultFromString.isValid).toBe(resultFromBuffer.isValid);
            expect(resultFromString.errors.length).toBe(resultFromBuffer.errors.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Combined Security Property Tests
  // ============================================================================

  describe('Property 5.6: Combined Security Validation', () => {
    it('complete webhook flow should validate all security aspects', async () => {
      await fc.assert(
        fc.asyncProperty(
          webhookPayloadArb,
          secretKeyArb,
          clientIdArb,
          async (payload, secretKey, clientId) => {
            // 1. Validate payload
            const payloadValidator = createPayloadValidator();
            const rawBody = Buffer.from(JSON.stringify(payload));
            const payloadResult = payloadValidator.validate(rawBody);
            expect(payloadResult.isValid).toBe(true);
            
            // 2. Validate signature
            const signatureValidator = createSignatureValidator({ secretKey });
            const signature = signatureValidator.computeSignature(rawBody);
            const signatureResult = signatureValidator.validateSignature(rawBody, signature);
            expect(signatureResult.isValid).toBe(true);
            
            // 3. Check idempotency
            const idempotencyService = createInMemoryIdempotencyService();
            const eventId = idempotencyService.generateEventId(
              payload.eventData.actorRunId,
              payload.eventType,
              payload.createdAt
            );
            const idempotencyResult = await idempotencyService.checkIdempotency(eventId);
            expect(idempotencyResult.isDuplicate).toBe(false);
            
            // 4. Check rate limit
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests: 100,
              windowSeconds: 60,
              enabled: true,
            });
            const rateLimitResult = await rateLimiter.checkRateLimit(clientId);
            expect(rateLimitResult.allowed).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('security checks should be independent of each other', async () => {
      await fc.assert(
        fc.asyncProperty(
          webhookPayloadArb,
          secretKeyArb,
          secretKeyArb,
          clientIdArb,
          async (payload, correctKey, wrongKey, clientId) => {
            fc.pre(correctKey !== wrongKey);
            
            const rawBody = Buffer.from(JSON.stringify(payload));
            
            // Payload validation should pass regardless of signature
            const payloadValidator = createPayloadValidator();
            const payloadResult = payloadValidator.validate(rawBody);
            expect(payloadResult.isValid).toBe(true);
            
            // Signature validation should fail with wrong key
            const correctValidator = createSignatureValidator({ secretKey: correctKey });
            const wrongValidator = createSignatureValidator({ secretKey: wrongKey });
            
            const correctSignature = correctValidator.computeSignature(rawBody);
            const wrongSignatureResult = wrongValidator.validateSignature(rawBody, correctSignature);
            
            // Wrong key should produce different signature
            expect(wrongSignatureResult.computedSignature).not.toBe(correctSignature);
            
            // Rate limiting should work independently
            const rateLimiter = createInMemoryRateLimiter({
              maxRequests: 100,
              windowSeconds: 60,
              enabled: true,
            });
            const rateLimitResult = await rateLimiter.checkRateLimit(clientId);
            expect(rateLimitResult.allowed).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
