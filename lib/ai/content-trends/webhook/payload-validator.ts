/**
 * Webhook Payload Validator
 * Content & Trends AI Engine - Phase 4
 * 
 * Validates incoming webhook payloads for structure, types, and content
 */

import {
  PayloadValidationConfig,
  PayloadValidationResult,
  PayloadValidationError,
  PayloadValidationWarning,
  PayloadErrorCode,
  DEFAULT_PAYLOAD_VALIDATION_CONFIG,
} from './types';
import { ApifyWebhookPayload, WebhookEventType } from '../apify/types';

// ============================================================================
// Payload Validator
// ============================================================================

export class PayloadValidator {
  private readonly config: Required<PayloadValidationConfig>;

  constructor(config: PayloadValidationConfig = {}) {
    this.config = {
      ...DEFAULT_PAYLOAD_VALIDATION_CONFIG,
      ...config,
    };
  }

  /**
   * Validate a webhook payload
   * 
   * @param rawBody - Raw request body (string or Buffer)
   * @returns Validation result with normalized payload
   */
  validate(rawBody: string | Buffer): PayloadValidationResult {
    const errors: PayloadValidationError[] = [];
    const warnings: PayloadValidationWarning[] = [];

    // Check payload size
    const bodySize = typeof rawBody === 'string' 
      ? Buffer.byteLength(rawBody) 
      : rawBody.length;

    if (bodySize > this.config.maxPayloadSize) {
      errors.push({
        field: 'body',
        message: `Payload size ${bodySize} exceeds maximum ${this.config.maxPayloadSize} bytes`,
        code: 'PAYLOAD_TOO_LARGE',
      });
      return { isValid: false, errors, warnings };
    }

    // Parse JSON
    let payload: unknown;
    try {
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      payload = JSON.parse(bodyString);
    } catch (error) {
      errors.push({
        field: 'body',
        message: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`,
        code: 'MALFORMED_JSON',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate structure
    if (!payload || typeof payload !== 'object') {
      errors.push({
        field: 'body',
        message: 'Payload must be an object',
        code: 'INVALID_TYPE',
      });
      return { isValid: false, errors, warnings };
    }

    const payloadObj = payload as Record<string, unknown>;

    // Check required fields
    for (const field of this.config.requiredFields) {
      if (!(field in payloadObj)) {
        errors.push({
          field,
          message: `Missing required field: ${field}`,
          code: 'MISSING_FIELD',
        });
      }
    }

    // Validate event type
    if ('eventType' in payloadObj) {
      const eventType = payloadObj.eventType as string;
      if (!this.config.allowedEventTypes.includes(eventType as WebhookEventType)) {
        errors.push({
          field: 'eventType',
          message: `Unknown event type: ${eventType}`,
          code: 'UNKNOWN_EVENT_TYPE',
        });
      }
    }

    // Validate eventData structure
    if ('eventData' in payloadObj) {
      const eventDataErrors = this.validateEventData(payloadObj.eventData);
      errors.push(...eventDataErrors);
    }

    // Validate createdAt format
    if ('createdAt' in payloadObj) {
      const createdAtWarnings = this.validateCreatedAt(payloadObj.createdAt);
      warnings.push(...createdAtWarnings);
    }

    // Validate resource if present
    if ('resource' in payloadObj && payloadObj.resource) {
      const resourceWarnings = this.validateResource(payloadObj.resource);
      warnings.push(...resourceWarnings);
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Normalize and return
    const normalizedPayload = this.normalizePayload(payloadObj);
    return {
      isValid: true,
      errors: [],
      warnings,
      normalizedPayload,
    };
  }

  /**
   * Quick validation check (returns boolean only)
   */
  isValid(rawBody: string | Buffer): boolean {
    return this.validate(rawBody).isValid;
  }

  /**
   * Parse and normalize payload without full validation
   */
  parsePayload(rawBody: string | Buffer): ApifyWebhookPayload | null {
    try {
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      const payload = JSON.parse(bodyString);
      return this.normalizePayload(payload);
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // Private Validation Methods
  // ==========================================================================

  private validateEventData(eventData: unknown): PayloadValidationError[] {
    const errors: PayloadValidationError[] = [];

    if (!eventData || typeof eventData !== 'object') {
      errors.push({
        field: 'eventData',
        message: 'eventData must be an object',
        code: 'INVALID_TYPE',
      });
      return errors;
    }

    const data = eventData as Record<string, unknown>;

    // Required fields in eventData
    const requiredEventDataFields = ['actorId', 'actorRunId'];
    for (const field of requiredEventDataFields) {
      if (!(field in data)) {
        errors.push({
          field: `eventData.${field}`,
          message: `Missing required field: eventData.${field}`,
          code: 'MISSING_FIELD',
        });
      } else if (typeof data[field] !== 'string') {
        errors.push({
          field: `eventData.${field}`,
          message: `eventData.${field} must be a string`,
          code: 'INVALID_TYPE',
        });
      }
    }

    return errors;
  }

  private validateCreatedAt(createdAt: unknown): PayloadValidationWarning[] {
    const warnings: PayloadValidationWarning[] = [];

    if (typeof createdAt !== 'string') {
      warnings.push({
        field: 'createdAt',
        message: 'createdAt should be an ISO 8601 string',
        suggestion: 'Use format: 2024-01-01T00:00:00.000Z',
      });
      return warnings;
    }

    // Try to parse the date
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      warnings.push({
        field: 'createdAt',
        message: 'createdAt is not a valid date string',
        suggestion: 'Use ISO 8601 format',
      });
    }

    return warnings;
  }

  private validateResource(resource: unknown): PayloadValidationWarning[] {
    const warnings: PayloadValidationWarning[] = [];

    if (!resource || typeof resource !== 'object') {
      return warnings;
    }

    const res = resource as Record<string, unknown>;

    // Check for expected resource fields
    const expectedFields = ['id', 'actId', 'status', 'defaultDatasetId'];
    for (const field of expectedFields) {
      if (!(field in res)) {
        warnings.push({
          field: `resource.${field}`,
          message: `Missing expected field: resource.${field}`,
        });
      }
    }

    return warnings;
  }

  // ==========================================================================
  // Normalization
  // ==========================================================================

  private normalizePayload(payload: Record<string, unknown>): ApifyWebhookPayload {
    return {
      userId: String(payload.userId ?? ''),
      createdAt: String(payload.createdAt ?? new Date().toISOString()),
      eventType: payload.eventType as WebhookEventType,
      eventData: this.normalizeEventData(payload.eventData),
      resource: payload.resource ? this.normalizeResource(payload.resource) : undefined,
    };
  }

  private normalizeEventData(eventData: unknown): ApifyWebhookPayload['eventData'] {
    if (!eventData || typeof eventData !== 'object') {
      return {
        actorId: '',
        actorRunId: '',
      };
    }

    const data = eventData as Record<string, unknown>;
    return {
      actorId: String(data.actorId ?? ''),
      actorTaskId: data.actorTaskId ? String(data.actorTaskId) : undefined,
      actorRunId: String(data.actorRunId ?? ''),
      resourceId: data.resourceId ? String(data.resourceId) : undefined,
    };
  }

  private normalizeResource(resource: unknown): ApifyWebhookPayload['resource'] {
    if (!resource || typeof resource !== 'object') {
      return undefined;
    }

    const res = resource as Record<string, unknown>;
    return {
      id: String(res.id ?? ''),
      actId: String(res.actId ?? ''),
      userId: String(res.userId ?? ''),
      startedAt: String(res.startedAt ?? ''),
      finishedAt: res.finishedAt ? String(res.finishedAt) : undefined,
      status: res.status as ApifyWebhookPayload['resource'] extends { status: infer S } ? S : never,
      statusMessage: res.statusMessage ? String(res.statusMessage) : undefined,
      defaultKeyValueStoreId: String(res.defaultKeyValueStoreId ?? ''),
      defaultDatasetId: String(res.defaultDatasetId ?? ''),
      defaultRequestQueueId: String(res.defaultRequestQueueId ?? ''),
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a payload validator instance
 */
export function createPayloadValidator(config?: PayloadValidationConfig): PayloadValidator {
  return new PayloadValidator(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract event ID from payload
 */
export function extractEventId(payload: ApifyWebhookPayload): string {
  return `${payload.eventData.actorRunId}:${payload.eventType}:${payload.createdAt}`;
}

/**
 * Check if event type indicates success
 */
export function isSuccessEvent(eventType: WebhookEventType): boolean {
  return eventType === 'ACTOR.RUN.SUCCEEDED';
}

/**
 * Check if event type indicates failure
 */
export function isFailureEvent(eventType: WebhookEventType): boolean {
  return ['ACTOR.RUN.FAILED', 'ACTOR.RUN.TIMED_OUT', 'ACTOR.RUN.ABORTED'].includes(eventType);
}
