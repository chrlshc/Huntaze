/**
 * Webhook Signature Validator
 * Content & Trends AI Engine - Phase 4
 * 
 * HMAC signature verification with timing-safe comparison
 * to prevent timing attacks
 */

import { createHmac, timingSafeEqual } from 'crypto';
import {
  WebhookSecurityConfig,
  SignatureValidationResult,
  TimestampValidationResult,
  DEFAULT_SECURITY_CONFIG,
} from './types';

// ============================================================================
// Signature Validator
// ============================================================================

export class SignatureValidator {
  private readonly config: Required<WebhookSecurityConfig>;

  constructor(config: WebhookSecurityConfig) {
    if (!config.secretKey) {
      throw new Error('Secret key is required for signature validation');
    }

    this.config = {
      ...DEFAULT_SECURITY_CONFIG,
      ...config,
      secretKey: config.secretKey,
    };
  }

  /**
   * Validate HMAC signature using timing-safe comparison
   * 
   * @param rawBody - Raw request body as Buffer
   * @param providedSignature - Signature from request header
   * @returns Validation result
   */
  validateSignature(rawBody: Buffer, providedSignature: string): SignatureValidationResult {
    if (!providedSignature) {
      return {
        isValid: false,
        error: 'Missing signature',
      };
    }

    if (!rawBody || rawBody.length === 0) {
      return {
        isValid: false,
        error: 'Empty request body',
      };
    }

    try {
      // Compute expected signature
      const computedSignature = this.computeSignature(rawBody);

      // Parse provided signature (may have prefix like "sha256=")
      const normalizedProvided = this.normalizeSignature(providedSignature);
      const normalizedComputed = this.normalizeSignature(computedSignature);

      // Use timing-safe comparison to prevent timing attacks
      const isValid = this.timingSafeCompare(normalizedProvided, normalizedComputed);

      return {
        isValid,
        computedSignature: normalizedComputed,
        providedSignature: normalizedProvided,
        error: isValid ? undefined : 'Signature mismatch',
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Signature validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate webhook timestamp to prevent replay attacks
   * 
   * @param timestamp - Timestamp from request header (ISO string or Unix timestamp)
   * @returns Validation result
   */
  validateTimestamp(timestamp: string): TimestampValidationResult {
    if (!this.config.validateTimestamp) {
      return { isValid: true };
    }

    if (!timestamp) {
      return {
        isValid: false,
        error: 'Missing timestamp',
      };
    }

    try {
      // Parse timestamp (support both ISO string and Unix timestamp)
      const webhookTime = this.parseTimestamp(timestamp);
      const now = new Date();
      const ageSeconds = Math.abs((now.getTime() - webhookTime.getTime()) / 1000);

      if (ageSeconds > this.config.maxAgeSeconds) {
        return {
          isValid: false,
          error: `Timestamp too old: ${ageSeconds}s (max: ${this.config.maxAgeSeconds}s)`,
          timestamp: webhookTime,
          ageSeconds,
        };
      }

      return {
        isValid: true,
        timestamp: webhookTime,
        ageSeconds,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid timestamp format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Compute HMAC signature for a payload
   */
  computeSignature(payload: Buffer | string): string {
    const hmac = createHmac(this.config.algorithm, this.config.secretKey);
    hmac.update(typeof payload === 'string' ? Buffer.from(payload) : payload);
    return hmac.digest('hex');
  }

  /**
   * Compute signature with timestamp for additional security
   */
  computeSignatureWithTimestamp(payload: Buffer | string, timestamp: string): string {
    const hmac = createHmac(this.config.algorithm, this.config.secretKey);
    hmac.update(timestamp);
    hmac.update('.');
    hmac.update(typeof payload === 'string' ? Buffer.from(payload) : payload);
    return hmac.digest('hex');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeCompare(a: string, b: string): boolean {
    // Ensure both strings are the same length for timing-safe comparison
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');

    if (bufA.length !== bufB.length) {
      // Still do a comparison to maintain constant time
      const dummy = Buffer.alloc(bufA.length);
      timingSafeEqual(bufA, dummy);
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }

  /**
   * Normalize signature by removing algorithm prefix
   */
  private normalizeSignature(signature: string): string {
    // Handle formats like "sha256=abc123" or just "abc123"
    const parts = signature.split('=');
    return parts.length > 1 ? parts[1] : signature;
  }

  /**
   * Parse timestamp from various formats
   */
  private parseTimestamp(timestamp: string): Date {
    // Try Unix timestamp (seconds)
    const unixSeconds = parseInt(timestamp, 10);
    if (!isNaN(unixSeconds) && unixSeconds > 0) {
      // Check if it's milliseconds or seconds
      if (unixSeconds > 1e12) {
        return new Date(unixSeconds); // Already milliseconds
      }
      return new Date(unixSeconds * 1000); // Convert seconds to milliseconds
    }

    // Try ISO string
    const isoDate = new Date(timestamp);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    throw new Error(`Unable to parse timestamp: ${timestamp}`);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a signature validator instance
 */
export function createSignatureValidator(config: WebhookSecurityConfig): SignatureValidator {
  return new SignatureValidator(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a webhook signature for testing purposes
 */
export function generateTestSignature(
  payload: string | Buffer,
  secretKey: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): string {
  const hmac = createHmac(algorithm, secretKey);
  hmac.update(typeof payload === 'string' ? Buffer.from(payload) : payload);
  return `${algorithm}=${hmac.digest('hex')}`;
}

/**
 * Extract signature from header value
 */
export function extractSignatureFromHeader(headerValue: string): {
  algorithm?: string;
  signature: string;
} {
  const parts = headerValue.split('=');
  if (parts.length === 2) {
    return {
      algorithm: parts[0],
      signature: parts[1],
    };
  }
  return { signature: headerValue };
}
