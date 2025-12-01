/**
 * Property Tests: Circuit Breaker Behavior
 * 
 * **Feature: huntaze-ai-azure-migration, Properties 19-23: Circuit breaker properties**
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CircuitBreaker, CircuitState } from '../../../lib/ai/azure/circuit-breaker';

describe('Circuit Breaker Properties', () => {
  describe('Property 19: Circuit breaker opening', () => {
    it('should open when error rate exceeds 50%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 20 }),
          async (totalRequests) => {
            const breaker = new CircuitBreaker('test', {
              failureThreshold: 5,
              failureRate: 0.5,
              successThreshold: 2,
              timeout: 60000,
              windowSize: 10,
            });

            // Interleave successes and failures to build up failure rate
            // without hitting consecutive failure threshold too early
            const failures = Math.ceil(totalRequests * 0.6); // 60% failure rate
            const successes = totalRequests - failures;
            
            // Alternate between success and failure to avoid consecutive threshold
            let failureCount = 0;
            let successCount = 0;
            
            for (let i = 0; i < totalRequests; i++) {
              const shouldFail = failureCount < failures && (i % 2 === 0 || successCount >= successes);
              
              if (shouldFail) {
                try {
                  await breaker.execute(async () => {
                    throw new Error('Test failure');
                  });
                } catch (e) {
                  // Expected - but circuit might be open now
                  if (breaker.getState() === CircuitState.OPEN) {
                    break; // Stop if circuit opened
                  }
                }
                failureCount++;
              } else {
                try {
                  await breaker.execute(async () => 'success');
                  successCount++;
                } catch (e) {
                  // Circuit is open
                  break;
                }
              }
            }

            const metrics = breaker.getMetrics();
            const actualFailureRate = metrics.failedRequests / metrics.totalRequests;
            
            // Should be open if we had enough requests and high failure rate
            if (actualFailureRate >= 0.5 && metrics.totalRequests >= 10) {
              expect(breaker.getState()).toBe(CircuitState.OPEN);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should open after consecutive failures exceed threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 10 }),
          async (consecutiveFailures) => {
            const breaker = new CircuitBreaker('test', {
              failureThreshold: 5,
              failureRate: 0.5,
              successThreshold: 2,
              timeout: 60000,
              windowSize: 10,
            });

            for (let i = 0; i < consecutiveFailures; i++) {
              try {
                await breaker.execute(async () => {
                  throw new Error('Test failure');
                });
              } catch (e) {
                // Expected
              }
            }

            if (consecutiveFailures >= 5) {
              expect(breaker.getState()).toBe(CircuitState.OPEN);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 20: Fallback response when open', () => {
    it('should reject requests when circuit is open', async () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 3,
        failureRate: 0.5,
        successThreshold: 2,
        timeout: 60000,
        windowSize: 10,
      });

      // Force open the circuit
      breaker.forceOpen();

      await expect(
        breaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker');
    });
  });

  describe('Property 21: Half-open state testing', () => {
    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 3,
        failureRate: 0.5,
        successThreshold: 2,
        timeout: 100, // Short timeout for testing
        windowSize: 10,
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next request should transition to half-open
      try {
        await breaker.execute(async () => 'test');
      } catch (e) {
        // May fail, but should have transitioned
      }

      // State should be half-open or closed (if request succeeded)
      const state = breaker.getState();
      expect([CircuitState.HALF_OPEN, CircuitState.CLOSED]).toContain(state);
    });
  });

  describe('Property 22: Circuit breaker recovery', () => {
    it('should close after consecutive successes in half-open state', async () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 3,
        failureRate: 0.5,
        successThreshold: 2,
        timeout: 100,
        windowSize: 10,
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute successful requests
      await breaker.execute(async () => 'success 1');
      await breaker.execute(async () => 'success 2');

      // Should be closed now
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Property 23: Circuit breaker isolation', () => {
    it('should operate independently for different deployments', async () => {
      const breaker1 = new CircuitBreaker('deployment-1', {
        failureThreshold: 3,
        failureRate: 0.5,
        successThreshold: 2,
        timeout: 60000,
        windowSize: 10,
      });

      const breaker2 = new CircuitBreaker('deployment-2', {
        failureThreshold: 3,
        failureRate: 0.5,
        successThreshold: 2,
        timeout: 60000,
        windowSize: 10,
      });

      // Fail breaker1
      for (let i = 0; i < 3; i++) {
        try {
          await breaker1.execute(async () => {
            throw new Error('Test failure');
          });
        } catch (e) {
          // Expected
        }
      }

      // Succeed with breaker2
      await breaker2.execute(async () => 'success');

      // breaker1 should be open, breaker2 should be closed
      expect(breaker1.getState()).toBe(CircuitState.OPEN);
      expect(breaker2.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Metrics Tracking', () => {
    it('should accurately track success and failure counts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          async (successes, failures) => {
            const breaker = new CircuitBreaker('test', {
              failureThreshold: 100, // High threshold to prevent opening
              failureRate: 0.99,
              successThreshold: 2,
              timeout: 60000,
              windowSize: 50,
            });

            // Execute successes
            for (let i = 0; i < successes; i++) {
              await breaker.execute(async () => 'success');
            }

            // Execute failures
            for (let i = 0; i < failures; i++) {
              try {
                await breaker.execute(async () => {
                  throw new Error('Test failure');
                });
              } catch (e) {
                // Expected
              }
            }

            const metrics = breaker.getMetrics();
            expect(metrics.successes).toBe(successes);
            expect(metrics.failures).toBe(failures);
            expect(metrics.totalRequests).toBe(successes + failures);
            expect(metrics.failedRequests).toBe(failures);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
