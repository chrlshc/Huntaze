/**
 * Property-based tests for retry utility
 * 
 * **Feature: azure-foundry-production-rollout, Property 7: Retry with exponential backoff**
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  withRetry,
  retryWithThrow,
  calculateDelay,
  isRetryableError,
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_ERROR_CODES,
  RETRYABLE_HTTP_STATUS_CODES,
  type RetryConfig,
} from '@/lib/ai/foundry/retry';

describe('Retry Utility Property Tests', () => {
  /**
   * Property 7.1: Successful operations return immediately without retry
   * **Validates: Requirements 6.2**
   */
  it('Property 7.1: Successful operations return immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything(),
        async (returnValue) => {
          const fn = vi.fn().mockResolvedValue(returnValue);
          
          const result = await withRetry(fn);
          
          return (
            result.success === true &&
            result.attempts === 1 &&
            result.totalDelayMs === 0 &&
            fn.mock.calls.length === 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.2: Non-retryable errors fail immediately
   * **Validates: Requirements 6.2**
   */
  it('Property 7.2: Non-retryable errors fail immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          // Create a non-retryable error (no network code, no retryable status)
          const error = new Error(errorMessage);
          const fn = vi.fn().mockRejectedValue(error);
          
          const result = await withRetry(fn, {
            isRetryable: () => false, // Force non-retryable
          });
          
          return (
            result.success === false &&
            result.attempts === 1 &&
            fn.mock.calls.length === 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.3: Retryable errors are retried up to maxRetries times
   * **Validates: Requirements 6.2**
   */
  it('Property 7.3: Retryable errors retry up to maxRetries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (maxRetries) => {
          const error = new Error('Retryable error');
          const fn = vi.fn().mockRejectedValue(error);
          
          const result = await withRetry(fn, {
            maxRetries,
            initialDelayMs: 1, // Minimal delay for testing
            isRetryable: () => true, // Force retryable
          });
          
          // Should attempt maxRetries + 1 times (initial + retries)
          return (
            result.success === false &&
            result.attempts === maxRetries + 1 &&
            fn.mock.calls.length === maxRetries + 1
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.4: Exponential backoff increases delay with each attempt
   * **Validates: Requirements 6.2**
   */
  it('Property 7.4: Delay increases exponentially', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // Limit attempts to avoid overflow
        fc.integer({ min: 100, max: 500 }),
        (attempt, initialDelayMs) => {
          const config: RetryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            initialDelayMs,
            backoffMultiplier: 2,
            maxDelayMs: 1000000, // Very high max to not cap
            jitterFactor: 0, // No jitter for deterministic test
          };
          
          // First attempt should use initial delay
          const delay1 = calculateDelay(1, config);
          if (delay1 !== initialDelayMs) return false;
          
          // Second attempt should be 2x initial
          const delay2 = calculateDelay(2, config);
          if (delay2 !== initialDelayMs * 2) return false;
          
          // Third attempt should be 4x initial
          const delay3 = calculateDelay(3, config);
          if (delay3 !== initialDelayMs * 4) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.5: Delay is capped at maxDelayMs
   * **Validates: Requirements 6.2**
   */
  it('Property 7.5: Delay is capped at maxDelayMs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 500, max: 5000 }),
        (attempt, initialDelayMs, maxDelayMs) => {
          const config: RetryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            initialDelayMs,
            maxDelayMs,
            backoffMultiplier: 2,
            jitterFactor: 0, // No jitter for deterministic test
          };
          
          const delay = calculateDelay(attempt, config);
          
          // Delay should never exceed maxDelayMs
          return delay <= maxDelayMs;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.6: Jitter adds randomness but stays within bounds
   * **Validates: Requirements 6.2**
   */
  it('Property 7.6: Jitter stays within bounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.float({ min: 0, max: 0.5 }),
        (attempt, initialDelayMs, jitterFactor) => {
          const config: RetryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            initialDelayMs,
            jitterFactor,
            maxDelayMs: 100000,
          };
          
          const baseDelay = initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
          const maxJitter = baseDelay * jitterFactor;
          
          // Run multiple times to test randomness
          for (let i = 0; i < 10; i++) {
            const delay = calculateDelay(attempt, config);
            // Delay should be between base and base + maxJitter
            if (delay < baseDelay || delay > baseDelay + maxJitter + 1) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.7: Recovery on retry succeeds
   * **Validates: Requirements 6.2**
   */
  it('Property 7.7: Recovery on retry succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.anything(),
        async (failCount, successValue) => {
          let callCount = 0;
          const fn = vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= failCount) {
              return Promise.reject(new Error('Temporary failure'));
            }
            return Promise.resolve(successValue);
          });
          
          const result = await withRetry(fn, {
            maxRetries: 5,
            initialDelayMs: 1,
            isRetryable: () => true,
          });
          
          return (
            result.success === true &&
            result.attempts === failCount + 1
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.8: onRetry callback is called for each retry
   * **Validates: Requirements 6.2**
   */
  it('Property 7.8: onRetry callback is called correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (maxRetries) => {
          const retryEvents: { attempt: number; delayMs: number }[] = [];
          const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
          
          await withRetry(fn, {
            maxRetries,
            initialDelayMs: 1,
            isRetryable: () => true,
            onRetry: (attempt, _error, delayMs) => {
              retryEvents.push({ attempt, delayMs });
            },
          });
          
          // Should have maxRetries callback calls (not called on final failure)
          return retryEvents.length === maxRetries;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.9: Total delay accumulates correctly
   * **Validates: Requirements 6.2**
   */
  it('Property 7.9: Total delay accumulates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (maxRetries) => {
          const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
          
          const result = await withRetry(fn, {
            maxRetries,
            initialDelayMs: 10,
            backoffMultiplier: 2,
            jitterFactor: 0,
            isRetryable: () => true,
          });
          
          // Calculate expected total delay
          let expectedDelay = 0;
          for (let i = 1; i <= maxRetries; i++) {
            expectedDelay += 10 * Math.pow(2, i - 1);
          }
          
          // Total delay should match expected (with small tolerance for timing)
          return Math.abs(result.totalDelayMs - expectedDelay) <= maxRetries * 5;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('isRetryableError Property Tests', () => {
  /**
   * Property 7.10: Network error codes are retryable
   * **Validates: Requirements 6.2**
   */
  it('Property 7.10: Network error codes are retryable', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RETRYABLE_ERROR_CODES),
        (errorCode) => {
          const error = new Error('Network error') as NodeJS.ErrnoException;
          error.code = errorCode;
          
          return isRetryableError(error) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.11: Retryable HTTP status codes are retryable
   * **Validates: Requirements 6.2**
   */
  it('Property 7.11: Retryable HTTP status codes are retryable', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RETRYABLE_HTTP_STATUS_CODES),
        (statusCode) => {
          const error = new Error('HTTP error') as Error & { status: number };
          error.status = statusCode;
          
          return isRetryableError(error) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.12: Non-retryable status codes are not retryable
   * **Validates: Requirements 6.2**
   */
  it('Property 7.12: Non-retryable status codes are not retryable', () => {
    const nonRetryableStatuses = [400, 401, 403, 404, 405, 422];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nonRetryableStatuses),
        (statusCode) => {
          const error = new Error('HTTP error') as Error & { status: number };
          error.status = statusCode;
          
          return isRetryableError(error) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.13: Null/undefined errors are not retryable
   * **Validates: Requirements 6.2**
   */
  it('Property 7.13: Null/undefined errors are not retryable', () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
  });
});

describe('retryWithThrow Property Tests', () => {
  /**
   * Property 7.14: retryWithThrow returns value on success
   * **Validates: Requirements 6.2**
   */
  it('Property 7.14: retryWithThrow returns value on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything(),
        async (value) => {
          const fn = vi.fn().mockResolvedValue(value);
          
          const result = await retryWithThrow(fn);
          
          return result === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7.15: retryWithThrow throws on failure
   * **Validates: Requirements 6.2**
   */
  it('Property 7.15: retryWithThrow throws on failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          const fn = vi.fn().mockRejectedValue(new Error(errorMessage));
          
          try {
            await retryWithThrow(fn, {
              maxRetries: 1,
              initialDelayMs: 1,
              isRetryable: () => false,
            });
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message === errorMessage;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
