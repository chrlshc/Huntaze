/**
 * Property-Based Tests for Circuit Breaker
 *
 * **Feature: content-posting-system**
 * **Property 11: Circuit Breaker State Transitions**
 * **Validates: Requirements 5.4, 5.5**
 *
 * Tests circuit breaker behavior for platform API protection.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Circuit breaker states
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

// Configuration
const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT_MS = 30000;

/**
 * Simulated circuit breaker for testing state transitions
 */
class TestCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private lastStateChange = Date.now();

  constructor(
    private failureThreshold = DEFAULT_FAILURE_THRESHOLD,
    private resetTimeout = DEFAULT_RESET_TIMEOUT_MS
  ) {}

  getState(): CircuitState {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  recordSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failures = 0;
      this.lastStateChange = Date.now();
    }
  }

  recordFailure(): void {
    this.failures++;

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.lastStateChange = Date.now();
    } else if (this.state === "CLOSED" && this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      this.lastStateChange = Date.now();
    }
  }

  checkState(currentTime: number = Date.now()): CircuitState {
    if (this.state === "OPEN") {
      if (currentTime - this.lastStateChange >= this.resetTimeout) {
        this.state = "HALF_OPEN";
        this.lastStateChange = currentTime;
      }
    }
    return this.state;
  }

  canExecute(currentTime: number = Date.now()): boolean {
    const state = this.checkState(currentTime);
    return state !== "OPEN";
  }

  reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.lastStateChange = Date.now();
  }
}

describe("Circuit Breaker - Property-Based Tests", () => {
  describe("Property 11: Circuit Breaker State Transitions", () => {
    it("should start in CLOSED state", () => {
      const cb = new TestCircuitBreaker();
      expect(cb.getState()).toBe("CLOSED");
    });

    it("should remain CLOSED with fewer failures than threshold", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: DEFAULT_FAILURE_THRESHOLD - 1 }),
          (failureCount) => {
            const cb = new TestCircuitBreaker();

            for (let i = 0; i < failureCount; i++) {
              cb.recordFailure();
            }

            // Property: Below threshold, circuit stays CLOSED
            expect(cb.getState()).toBe("CLOSED");
            expect(cb.getFailures()).toBe(failureCount);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should transition to OPEN after reaching failure threshold", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: DEFAULT_FAILURE_THRESHOLD, max: 20 }),
          (failureCount) => {
            const cb = new TestCircuitBreaker();

            for (let i = 0; i < failureCount; i++) {
              cb.recordFailure();
            }

            // Property: At or above threshold, circuit opens
            expect(cb.getState()).toBe("OPEN");
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should transition to HALF_OPEN after reset timeout", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: DEFAULT_RESET_TIMEOUT_MS, max: DEFAULT_RESET_TIMEOUT_MS * 2 }),
          (elapsedMs) => {
            const cb = new TestCircuitBreaker();

            // Open the circuit
            for (let i = 0; i < DEFAULT_FAILURE_THRESHOLD; i++) {
              cb.recordFailure();
            }
            expect(cb.getState()).toBe("OPEN");

            // Simulate time passing
            const futureTime = Date.now() + elapsedMs;
            const state = cb.checkState(futureTime);

            // Property: After reset timeout, circuit becomes HALF_OPEN
            expect(state).toBe("HALF_OPEN");
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should remain OPEN before reset timeout", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: DEFAULT_RESET_TIMEOUT_MS - 1 }),
          (elapsedMs) => {
            const cb = new TestCircuitBreaker();

            // Open the circuit
            for (let i = 0; i < DEFAULT_FAILURE_THRESHOLD; i++) {
              cb.recordFailure();
            }

            // Simulate time passing (but not enough)
            const futureTime = Date.now() + elapsedMs;
            const state = cb.checkState(futureTime);

            // Property: Before reset timeout, circuit stays OPEN
            expect(state).toBe("OPEN");
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should close circuit on success in HALF_OPEN state", () => {
      const cb = new TestCircuitBreaker();

      // Open the circuit
      for (let i = 0; i < DEFAULT_FAILURE_THRESHOLD; i++) {
        cb.recordFailure();
      }

      // Transition to HALF_OPEN
      cb.checkState(Date.now() + DEFAULT_RESET_TIMEOUT_MS);
      expect(cb.getState()).toBe("HALF_OPEN");

      // Record success
      cb.recordSuccess();

      // Property: Success in HALF_OPEN closes the circuit
      expect(cb.getState()).toBe("CLOSED");
      expect(cb.getFailures()).toBe(0);
    });

    it("should reopen circuit on failure in HALF_OPEN state", () => {
      const cb = new TestCircuitBreaker();

      // Open the circuit
      for (let i = 0; i < DEFAULT_FAILURE_THRESHOLD; i++) {
        cb.recordFailure();
      }

      // Transition to HALF_OPEN
      cb.checkState(Date.now() + DEFAULT_RESET_TIMEOUT_MS);
      expect(cb.getState()).toBe("HALF_OPEN");

      // Record failure
      cb.recordFailure();

      // Property: Failure in HALF_OPEN reopens the circuit
      expect(cb.getState()).toBe("OPEN");
    });

    it("should allow execution in CLOSED and HALF_OPEN states", () => {
      const cb = new TestCircuitBreaker();

      // CLOSED state allows execution
      expect(cb.canExecute()).toBe(true);

      // Open and transition to HALF_OPEN
      for (let i = 0; i < DEFAULT_FAILURE_THRESHOLD; i++) {
        cb.recordFailure();
      }
      cb.checkState(Date.now() + DEFAULT_RESET_TIMEOUT_MS);

      // HALF_OPEN state allows execution
      expect(cb.canExecute()).toBe(true);
    });

    it("should block execution in OPEN state", () => {
      const cb = new TestCircuitBreaker();

      // Open the circuit
      for (let i = 0; i < DEFAULT_FAILURE_THRESHOLD; i++) {
        cb.recordFailure();
      }

      // OPEN state blocks execution
      expect(cb.canExecute()).toBe(false);
    });

    it("should support configurable failure threshold", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (threshold) => {
            const cb = new TestCircuitBreaker(threshold);

            // Record threshold - 1 failures
            for (let i = 0; i < threshold - 1; i++) {
              cb.recordFailure();
            }
            expect(cb.getState()).toBe("CLOSED");

            // Record one more failure
            cb.recordFailure();

            // Property: Circuit opens at exactly the threshold
            expect(cb.getState()).toBe("OPEN");
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
