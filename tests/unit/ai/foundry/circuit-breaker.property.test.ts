/**
 * Property-based tests for Circuit Breaker
 * 
 * **Feature: azure-foundry-production-rollout, Property 8: Circuit breaker state machine**
 * **Validates: Requirements 6.4, 6.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitOpenError,
  CircuitState,
  getCircuitBreaker,
  getCircuitBreakerRegistry,
} from '@/lib/ai/foundry/circuit-breaker';

describe('CircuitBreaker Property Tests', () => {
  beforeEach(() => {
    CircuitBreakerRegistry.resetInstance();
    vi.useFakeTimers();
  });

  afterEach(() => {
    CircuitBreakerRegistry.resetInstance();
    vi.useRealTimers();
  });

  /**
   * Property 8.1: Circuit starts in CLOSED state
   * **Validates: Requirements 6.4**
   */
  it('Property 8.1: Circuit starts in CLOSED state', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (name) => {
          const circuit = new CircuitBreaker(name);
          return circuit.getState() === 'CLOSED';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.2: Circuit opens after failure threshold
   * **Validates: Requirements 6.4**
   */
  it('Property 8.2: Circuit opens after failure threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (failureThreshold) => {
          const circuit = new CircuitBreaker('test', { failureThreshold });
          
          // Record failures up to threshold
          for (let i = 0; i < failureThreshold; i++) {
            circuit.recordFailure();
          }
          
          return circuit.getState() === 'OPEN';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.3: Circuit stays closed below failure threshold
   * **Validates: Requirements 6.4**
   */
  it('Property 8.3: Circuit stays closed below threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (failureThreshold) => {
          const circuit = new CircuitBreaker('test', { failureThreshold });
          
          // Record failures below threshold
          for (let i = 0; i < failureThreshold - 1; i++) {
            circuit.recordFailure();
          }
          
          return circuit.getState() === 'CLOSED';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.4: Open circuit rejects requests
   * **Validates: Requirements 6.4**
   */
  it('Property 8.4: Open circuit rejects requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (failureThreshold) => {
          const circuit = new CircuitBreaker('test', { failureThreshold });
          
          // Open the circuit
          for (let i = 0; i < failureThreshold; i++) {
            circuit.recordFailure();
          }
          
          // Try to execute - should throw
          try {
            await circuit.execute(() => Promise.resolve('success'));
            return false; // Should have thrown
          } catch (error) {
            return error instanceof CircuitOpenError;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8.5: Circuit transitions to HALF_OPEN after timeout
   * **Validates: Requirements 6.5**
   */
  it('Property 8.5: Circuit transitions to HALF_OPEN after timeout', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10000 }),
        (resetTimeoutMs) => {
          const circuit = new CircuitBreaker('test', {
            failureThreshold: 1,
            resetTimeoutMs,
          });
          
          // Open the circuit
          circuit.recordFailure();
          expect(circuit.getState()).toBe('OPEN');
          
          // Advance time past reset timeout
          vi.advanceTimersByTime(resetTimeoutMs + 1);
          
          return circuit.getState() === 'HALF_OPEN';
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8.6: Success in HALF_OPEN closes circuit after threshold
   * **Validates: Requirements 6.5**
   */
  it('Property 8.6: Success in HALF_OPEN closes circuit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (successThreshold) => {
          const circuit = new CircuitBreaker('test', {
            failureThreshold: 1,
            resetTimeoutMs: 1000,
            successThreshold,
          });
          
          // Open the circuit
          circuit.recordFailure();
          
          // Advance to HALF_OPEN
          vi.advanceTimersByTime(1001);
          expect(circuit.getState()).toBe('HALF_OPEN');
          
          // Record successes
          for (let i = 0; i < successThreshold; i++) {
            circuit.recordSuccess();
          }
          
          return circuit.getState() === 'CLOSED';
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8.7: Failure in HALF_OPEN reopens circuit
   * **Validates: Requirements 6.5**
   */
  it('Property 8.7: Failure in HALF_OPEN reopens circuit', () => {
    const circuit = new CircuitBreaker('test', {
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      successThreshold: 3,
    });
    
    // Open the circuit
    circuit.recordFailure();
    
    // Advance to HALF_OPEN
    vi.advanceTimersByTime(1001);
    expect(circuit.getState()).toBe('HALF_OPEN');
    
    // Record a failure
    circuit.recordFailure();
    
    expect(circuit.getState()).toBe('OPEN');
  });

  /**
   * Property 8.8: Success in CLOSED state cleans up old failures
   * **Validates: Requirements 6.4**
   */
  it('Property 8.8: Success cleans up old failures', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (failureThreshold) => {
          const circuit = new CircuitBreaker('test', { 
            failureThreshold,
            failureWindowMs: 1000, // Short window
          });
          
          // Record some failures (below threshold)
          for (let i = 0; i < failureThreshold - 1; i++) {
            circuit.recordFailure();
          }
          
          // Advance time past failure window
          vi.advanceTimersByTime(1001);
          
          // Record a success (triggers cleanup)
          circuit.recordSuccess();
          
          // Now failures should be cleaned up, so we can record
          // failureThreshold - 1 more without opening
          for (let i = 0; i < failureThreshold - 1; i++) {
            circuit.recordFailure();
          }
          
          return circuit.getState() === 'CLOSED';
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8.9: Manual reset closes circuit
   * **Validates: Requirements 6.5**
   */
  it('Property 8.9: Manual reset closes circuit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<CircuitState>('OPEN', 'HALF_OPEN'),
        (targetState) => {
          const circuit = new CircuitBreaker('test', {
            failureThreshold: 1,
            resetTimeoutMs: 1000,
          });
          
          // Open the circuit
          circuit.recordFailure();
          
          if (targetState === 'HALF_OPEN') {
            vi.advanceTimersByTime(1001);
          }
          
          // Reset
          circuit.reset();
          
          return circuit.getState() === 'CLOSED';
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8.10: Manual trip opens circuit
   * **Validates: Requirements 6.5**
   */
  it('Property 8.10: Manual trip opens circuit', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (reason) => {
          const circuit = new CircuitBreaker('test');
          
          circuit.trip(reason);
          
          return circuit.getState() === 'OPEN';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.11: Stats track total requests correctly
   * **Validates: Requirements 6.4**
   */
  it('Property 8.11: Stats track total requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (successCount, failureCount) => {
          const circuit = new CircuitBreaker('test', {
            failureThreshold: 100, // High threshold to not open
          });
          
          // Execute successes
          for (let i = 0; i < successCount; i++) {
            await circuit.execute(() => Promise.resolve('ok'));
          }
          
          // Execute failures
          for (let i = 0; i < failureCount; i++) {
            try {
              await circuit.execute(() => Promise.reject(new Error('fail')));
            } catch {
              // Expected
            }
          }
          
          const stats = circuit.getStats();
          return (
            stats.totalRequests === successCount + failureCount &&
            stats.totalSuccesses === successCount &&
            stats.totalFailures === failureCount
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8.12: State change callback is called
   * **Validates: Requirements 6.5**
   */
  it('Property 8.12: State change callback is called', () => {
    const stateChanges: { from: CircuitState; to: CircuitState }[] = [];
    
    const circuit = new CircuitBreaker('test', {
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      onStateChange: (from, to) => {
        stateChanges.push({ from, to });
      },
    });
    
    // Open the circuit
    circuit.recordFailure();
    
    // Advance to HALF_OPEN
    vi.advanceTimersByTime(1001);
    circuit.getState(); // Trigger state check
    
    // Close the circuit
    circuit.recordSuccess();
    circuit.recordSuccess();
    
    expect(stateChanges).toContainEqual({ from: 'CLOSED', to: 'OPEN' });
    expect(stateChanges).toContainEqual({ from: 'OPEN', to: 'HALF_OPEN' });
  });
});

describe('CircuitBreakerRegistry Property Tests', () => {
  beforeEach(() => {
    CircuitBreakerRegistry.resetInstance();
  });

  afterEach(() => {
    CircuitBreakerRegistry.resetInstance();
  });

  /**
   * Property 8.13: Registry returns same circuit for same name
   * **Validates: Requirements 6.4**
   */
  it('Property 8.13: Registry returns same circuit for same name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (name) => {
          const registry = getCircuitBreakerRegistry();
          
          const circuit1 = registry.getCircuit(name);
          const circuit2 = registry.getCircuit(name);
          
          return circuit1 === circuit2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.14: Registry returns different circuits for different names
   * **Validates: Requirements 6.4**
   */
  it('Property 8.14: Registry returns different circuits for different names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 25 }),
        fc.string({ minLength: 1, maxLength: 25 }),
        (name1, name2) => {
          if (name1 === name2) return true; // Skip if same name
          
          const registry = getCircuitBreakerRegistry();
          
          const circuit1 = registry.getCircuit(name1);
          const circuit2 = registry.getCircuit(name2);
          
          return circuit1 !== circuit2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.15: Convenience function returns circuit from registry
   * **Validates: Requirements 6.4**
   */
  it('Property 8.15: Convenience function uses registry', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (name) => {
          const circuit1 = getCircuitBreaker(name);
          const circuit2 = getCircuitBreakerRegistry().getCircuit(name);
          
          return circuit1 === circuit2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.16: Reset all resets all circuits
   * **Validates: Requirements 6.5**
   */
  it('Property 8.16: Reset all resets all circuits', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (names) => {
          const registry = getCircuitBreakerRegistry();
          const uniqueNames = [...new Set(names)];
          
          // Open all circuits
          for (const name of uniqueNames) {
            const circuit = registry.getCircuit(name, { failureThreshold: 1 });
            circuit.recordFailure();
          }
          
          // Reset all
          registry.resetAll();
          
          // All should be closed
          for (const name of uniqueNames) {
            if (registry.getCircuit(name).getState() !== 'CLOSED') {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
