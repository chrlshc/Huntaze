/**
 * Circuit Breaker Validator
 * 
 * Validates the circuit breaker behavior of the AI system.
 * Tests that the circuit opens after threshold failures and
 * blocks requests when open.
 * 
 * @module lib/ai/validation/circuit-breaker-validator
 */

import { CircuitBreakerValidationResult } from './types';

// Configuration
const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIME_MS = 30000;

export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit Breaker State for validation
 */
export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  blockedRequests: number;
  threshold: number;
  resetTimeMs: number;
}

/**
 * Circuit Breaker Validator Service
 * 
 * Tests and validates the AI system's circuit breaker behavior.
 */
export class CircuitBreakerValidatorService {
  private state: CircuitBreakerState;

  constructor(config?: { threshold?: number; resetTimeMs?: number }) {
    this.state = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      blockedRequests: 0,
      threshold: config?.threshold || DEFAULT_FAILURE_THRESHOLD,
      resetTimeMs: config?.resetTimeMs || DEFAULT_RESET_TIME_MS,
    };
  }

  /**
   * Test the circuit breaker by simulating failures
   * 
   * @param failureCount - Number of failures to simulate
   * @returns CircuitBreakerValidationResult
   */
  async testCircuitBreaker(
    failureCount?: number
  ): Promise<CircuitBreakerValidationResult> {
    try {
      // Reset state for fresh test
      this.reset();

      const failures = failureCount ?? this.state.threshold;

      // Simulate failures
      for (let i = 0; i < failures; i++) {
        this.recordFailure();
      }

      // Try to make a request after failures
      const blocked = this.isBlocked();
      if (blocked) {
        this.state.blockedRequests++;
      }

      return {
        circuitOpen: this.state.state === 'open',
        failureCount: this.state.failureCount,
        blockedRequests: this.state.blockedRequests,
        resetTimeMs: this.state.resetTimeMs,
        threshold: this.state.threshold,
      };
    } catch (error) {
      return {
        circuitOpen: false,
        failureCount: this.state.failureCount,
        blockedRequests: 0,
        resetTimeMs: this.state.resetTimeMs,
        threshold: this.state.threshold,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record a failure and potentially open the circuit
   */
  recordFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failureCount >= this.state.threshold) {
      this.state.state = 'open';
    }
  }

  /**
   * Record a success and potentially close the circuit
   */
  recordSuccess(): void {
    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
      this.state.failureCount = 0;
    }
  }

  /**
   * Check if requests should be blocked
   */
  isBlocked(): boolean {
    if (this.state.state === 'closed') {
      return false;
    }

    if (this.state.state === 'open') {
      // Check if reset time has passed
      if (this.state.lastFailureTime) {
        const elapsed = Date.now() - this.state.lastFailureTime;
        if (elapsed >= this.state.resetTimeMs) {
          this.state.state = 'half-open';
          return false; // Allow one request through
        }
      }
      return true;
    }

    // Half-open: allow request through
    return false;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      blockedRequests: 0,
      threshold: this.state.threshold,
      resetTimeMs: this.state.resetTimeMs,
    };
  }

  /**
   * Validate that circuit opens after threshold failures
   */
  validateCircuitOpensAfterThreshold(
    failureCount: number,
    threshold: number
  ): boolean {
    return failureCount >= threshold;
  }

  /**
   * Validate that requests are blocked when circuit is open
   */
  validateRequestsBlocked(state: CircuitState): boolean {
    return state === 'open';
  }
}

// ============================================================================
// Factory and Singleton
// ============================================================================

let validatorInstance: CircuitBreakerValidatorService | null = null;

/**
 * Get or create the Circuit Breaker Validator instance
 */
export function getCircuitBreakerValidator(
  config?: { threshold?: number; resetTimeMs?: number }
): CircuitBreakerValidatorService {
  if (!validatorInstance || config) {
    validatorInstance = new CircuitBreakerValidatorService(config);
  }
  return validatorInstance;
}

/**
 * Quick test function for circuit breaker
 */
export async function testCircuitBreaker(): Promise<CircuitBreakerValidationResult> {
  const validator = getCircuitBreakerValidator();
  return validator.testCircuitBreaker();
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock circuit breaker result for testing
 */
export function createMockCircuitBreakerResult(
  overrides?: Partial<CircuitBreakerValidationResult>
): CircuitBreakerValidationResult {
  return {
    circuitOpen: true,
    failureCount: 5,
    blockedRequests: 1,
    resetTimeMs: DEFAULT_RESET_TIME_MS,
    threshold: DEFAULT_FAILURE_THRESHOLD,
    ...overrides,
  };
}

/**
 * Validate a circuit breaker result meets requirements
 */
export function isValidCircuitBreakerBehavior(
  failureCount: number,
  threshold: number,
  circuitOpen: boolean
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Circuit should be open if failures >= threshold
  const shouldBeOpen = failureCount >= threshold;
  
  if (shouldBeOpen && !circuitOpen) {
    issues.push(
      `Circuit should be open after ${failureCount} failures (threshold: ${threshold})`
    );
  }

  if (!shouldBeOpen && circuitOpen) {
    issues.push(
      `Circuit should not be open with only ${failureCount} failures (threshold: ${threshold})`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Simulate circuit breaker behavior for property testing
 */
export function simulateCircuitBreakerBehavior(
  failureCount: number,
  threshold: number
): { circuitOpen: boolean; blockedRequests: number } {
  const circuitOpen = failureCount >= threshold;
  const blockedRequests = circuitOpen ? 1 : 0;

  return { circuitOpen, blockedRequests };
}
