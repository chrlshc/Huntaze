/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects services from cascading failures by monitoring error rates
 * and temporarily blocking requests when a threshold is exceeded.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are blocked
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 * 
 * @module circuit-breaker
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from HALF_OPEN
  timeout: number; // Milliseconds to wait before trying HALF_OPEN
  halfOpenMaxCalls: number; // Max concurrent calls in HALF_OPEN state
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime?: Date;
  lastStateChange: Date;
}

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime?: Date;
  private lastStateChange: Date = new Date();
  private halfOpenCalls = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 2,
      timeout: config?.timeout ?? 60000, // 1 minute
      halfOpenMaxCalls: config?.halfOpenMaxCalls ?? 3,
    };

    console.log(`[CircuitBreaker:${this.name}] Initialized`, {
      config: this.config,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   * 
   * @param fn - Async function to execute
   * @returns Result of the function
   * @throws Error if circuit is OPEN or function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is OPEN
    if (this.state === 'OPEN') {
      // Check if timeout has elapsed
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new Error(
          `Circuit breaker [${this.name}] is OPEN. Service unavailable.`
        );
      }
    }

    // Check HALF_OPEN call limit
    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new Error(
        `Circuit breaker [${this.name}] is HALF_OPEN and at max capacity.`
      );
    }

    // Track call
    this.totalCalls++;
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }

    try {
      // Execute function
      const result = await fn();
      
      // Success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      
      throw error;
    } finally {
      // Decrement HALF_OPEN calls
      if (this.state === 'HALF_OPEN') {
        this.halfOpenCalls--;
      }
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      // Check if we've reached success threshold
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately opens circuit
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      // Check if we've reached failure threshold
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    // Reset counters based on new state
    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenCalls = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
      this.halfOpenCalls = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] State transition`, {
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
    });
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return true;
    }

    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed >= this.config.timeout;
  }

  /**
   * Get current circuit breaker stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset`);
    this.transitionTo('CLOSED');
  }

  /**
   * Check if circuit is currently allowing requests
   */
  isAllowingRequests(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    }

    // OPEN state
    return this.shouldAttemptReset();
  }
}

/**
 * Circuit Breaker Registry
 * 
 * Manages multiple circuit breakers by name
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Get a circuit breaker by name
 */
export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  return circuitBreakerRegistry.get(name, config);
}
