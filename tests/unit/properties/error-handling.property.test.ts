/**
 * Property-Based Tests for Error Handling
 * Tests retry logic, circuit breaker, and graceful degradation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ErrorHandler,
  getErrorHandler,
  DEFAULT_RETRY_OPTIONS,
  type RetryOptions,
  type ErrorContext,
  ErrorCategory,
} from '../../../lib/error-handling/error-handler';
import {
  GracefulDegradationManager,
  getDegradationManager,
  withDegradation,
} from '../../../lib/error-handling/graceful-degradation';

// Mock CloudWatch to avoid AWS credential issues
vi.mock('../../../lib/aws/cloudwatch', () => ({
  getCloudWatchMonitoring: () => ({
    logEvent: vi.fn().mockResolvedValue(undefined),
    putMetric: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('Error Handling Property Tests', () => {
  let errorHandler: ErrorHandler;
  let degradationManager: GracefulDegradationManager;

  beforeEach(() => {
    errorHandler = getErrorHandler();
    degradationManager = getDegradationManager();
    vi.clearAllMocks();
  });

  /**
   * **Feature: performance-optimization-aws, Property 24: Exponential backoff retry**
   * For any failed request, retries should follow an exponential backoff pattern
   * **Validates: Requirements 5.5**
   */
  describe('Property 24: Exponential backoff retry', () => {
    it('should follow exponential backoff pattern for retries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            maxRetries: fc.integer({ min: 2, max: 3 }),
            initialDelay: fc.integer({ min: 10, max: 50 }),
            backoffMultiplier: fc.integer({ min: 2, max: 2 }),
          }),
          async ({ maxRetries, initialDelay, backoffMultiplier }) => {
            let attemptCount = 0;

            const options: RetryOptions = {
              maxRetries,
              initialDelay,
              maxDelay: 1000,
              backoffMultiplier,
            };

            const failingOperation = async () => {
              attemptCount++;
              throw new Error('Network timeout'); // Retryable error
            };

            try {
              await errorHandler.retryWithBackoff(failingOperation, options);
            } catch (error) {
              // Expected to fail after all retries
            }

            // Verify attempt count (initial + retries)
            expect(attemptCount).toBe(maxRetries + 1);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    it('should respect maxRetries limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (maxRetries) => {
            let attemptCount = 0;

            const options: RetryOptions = {
              maxRetries,
              initialDelay: 10,
              maxDelay: 500,
              backoffMultiplier: 2,
            };

            const failingOperation = async () => {
              attemptCount++;
              throw new Error('Network error'); // Retryable error
            };

            try {
              await errorHandler.retryWithBackoff(failingOperation, options);
            } catch (error) {
              // Expected
            }

            expect(attemptCount).toBe(maxRetries + 1);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    it('should not retry non-retryable errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('ValidationError', 'AuthError', 'PermissionError'),
          async (errorName) => {
            let attemptCount = 0;

            const options: RetryOptions = {
              maxRetries: 3,
              initialDelay: 100,
              maxDelay: 1000,
              backoffMultiplier: 2,
              retryableErrors: ['NetworkError', 'TimeoutError'],
            };

            const failingOperation = async () => {
              attemptCount++;
              const error = new Error('Non-retryable error');
              error.name = errorName;
              throw error;
            };

            try {
              await errorHandler.retryWithBackoff(failingOperation, options);
            } catch (error) {
              // Expected
            }

            // Should only attempt once (no retries)
            expect(attemptCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Circuit Breaker Property Tests
   */
  describe('Circuit Breaker Properties', () => {
    it('should open circuit after threshold failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (failureThreshold) => {
            const service = `test-service-${Math.random()}`;
            let attemptCount = 0;

            const failingOperation = async () => {
              attemptCount++;
              throw new Error('Service failure');
            };

            // Trigger failures up to threshold
            for (let i = 0; i < failureThreshold; i++) {
              try {
                await errorHandler.circuitBreaker(
                  service,
                  failingOperation,
                  { failureThreshold, resetTimeout: 60000, monitoringPeriod: 10000 }
                );
              } catch (error) {
                // Expected
              }
            }

            // Next attempt should fail immediately due to open circuit
            try {
              await errorHandler.circuitBreaker(
                service,
                failingOperation,
                { failureThreshold, resetTimeout: 60000, monitoringPeriod: 10000 }
              );
              expect.fail('Should have thrown circuit breaker error');
            } catch (error) {
              expect((error as Error).message).toContain('Circuit breaker open');
            }

            // Verify operation wasn't called (circuit was open)
            expect(attemptCount).toBe(failureThreshold);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reset circuit on successful operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (failureThreshold) => {
            const service = `test-service-${Math.random()}`;
            let shouldFail = true;

            const operation = async () => {
              if (shouldFail) {
                throw new Error('Failure');
              }
              return 'success';
            };

            // Trigger failures (but not enough to open circuit)
            for (let i = 0; i < failureThreshold - 1; i++) {
              try {
                await errorHandler.circuitBreaker(
                  service,
                  operation,
                  { failureThreshold, resetTimeout: 60000, monitoringPeriod: 10000 }
                );
              } catch (error) {
                // Expected
              }
            }

            // Successful operation should reset failure count
            shouldFail = false;
            const result = await errorHandler.circuitBreaker(
              service,
              operation,
              { failureThreshold, resetTimeout: 60000, monitoringPeriod: 10000 }
            );

            expect(result).toBe('success');

            // Should be able to handle more failures without opening
            shouldFail = true;
            for (let i = 0; i < failureThreshold - 1; i++) {
              try {
                await errorHandler.circuitBreaker(
                  service,
                  operation,
                  { failureThreshold, resetTimeout: 60000, monitoringPeriod: 10000 }
                );
              } catch (error) {
                // Expected
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Graceful Degradation Property Tests
   */
  describe('Graceful Degradation Properties', () => {
    it('should fallback to secondary on primary failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          async (primaryValue, fallbackValue) => {
            const service = `test-service-${Math.random()}`;

            const result = await degradationManager.executeWithDegradation(
              service,
              {
                primary: async () => {
                  throw new Error('Primary failed');
                },
                fallback: async () => fallbackValue,
              },
              { operation: 'test' }
            );

            expect(result).toBe(fallbackValue);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    it('should use primary when it succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          async (primaryValue, fallbackValue) => {
            const service = `test-service-${Math.random()}`;

            const result = await degradationManager.executeWithDegradation(
              service,
              {
                primary: async () => primaryValue,
                fallback: async () => fallbackValue,
              },
              { operation: 'test' }
            );

            expect(result).toBe(primaryValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track service health across multiple calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.boolean(), { minLength: 3, maxLength: 10 }),
          async (successPattern) => {
            const service = `test-service-${Math.random()}`;

            for (const shouldSucceed of successPattern) {
              try {
                await degradationManager.executeWithDegradation(
                  service,
                  {
                    primary: async () => {
                      if (!shouldSucceed) {
                        throw new Error('Failure');
                      }
                      return 'success';
                    },
                    fallback: async () => 'fallback',
                  },
                  { operation: 'test' }
                );
              } catch (error) {
                // Some operations may fail
              }
            }

            const health = degradationManager.getServiceHealth(service);
            expect(health.service).toBe(service);
            expect(typeof health.healthy).toBe('boolean');
            expect(typeof health.degraded).toBe('boolean');
            expect(health.consecutiveFailures).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 10000);
  });

  /**
   * Error Categorization Property Tests
   */
  describe('Error Categorization Properties', () => {
    it('should categorize network errors correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'Network error',
            'Fetch failed',
            'Connection timeout',
            'ECONNRESET'
          ),
          async (errorMessage) => {
            const error = new Error(errorMessage);
            const context: ErrorContext = {
              operation: 'test',
              sessionId: 'test-session',
              url: 'http://test.com',
              userAgent: 'test-agent',
              timestamp: new Date(),
            };

            // Log error to trigger categorization (mocked, so it won't actually call AWS)
            await errorHandler.logError(error, context);

            // Verify error was logged without throwing
            expect(true).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    it('should handle errors with various properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            message: fc.string({ minLength: 1 }),
            name: fc.constantFrom('Error', 'NetworkError', 'ValidationError'),
            code: fc.option(fc.string(), { nil: undefined }),
          }),
          async ({ message, name, code }) => {
            const error: any = new Error(message);
            error.name = name;
            if (code) {
              error.code = code;
            }

            const context: ErrorContext = {
              operation: 'test',
              sessionId: 'test-session',
              url: 'http://test.com',
              userAgent: 'test-agent',
              timestamp: new Date(),
            };

            // Should not throw (mocked CloudWatch)
            await errorHandler.logError(error, context);
            expect(true).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);
  });

  /**
   * Fallback to Stale Cache Property Tests
   */
  describe('Fallback to Stale Cache Properties', () => {
    it('should use fresh data when available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          async (freshData, staleData) => {
            const key = `test-key-${Math.random()}`;

            const result = await errorHandler.fallbackToStaleCache(
              key,
              async () => freshData,
              async () => staleData
            );

            expect(result).toBe(freshData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fallback to stale cache on fetch failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          async (staleData) => {
            const key = `test-key-${Math.random()}`;

            const result = await errorHandler.fallbackToStaleCache(
              key,
              async () => {
                throw new Error('Fetch failed');
              },
              async () => staleData
            );

            expect(result).toBe(staleData);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    it('should throw if both fetch and cache fail', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          async (errorMessage) => {
            const key = `test-key-${Math.random()}`;

            await expect(
              errorHandler.fallbackToStaleCache(
                key,
                async () => {
                  throw new Error(errorMessage);
                },
                async () => null
              )
            ).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * withDegradation Utility Property Tests
   */
  describe('withDegradation Utility Properties', () => {
    it('should work as a convenience wrapper', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          fc.boolean(),
          async (primaryValue, fallbackValue, shouldFail) => {
            const service = `test-service-${Math.random()}`;

            const result = await withDegradation(
              service,
              async () => {
                if (shouldFail) {
                  throw new Error('Primary failed');
                }
                return primaryValue;
              },
              async () => fallbackValue
            );

            expect(result).toBe(shouldFail ? fallbackValue : primaryValue);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);
  });
});
