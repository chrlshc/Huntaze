/**
 * Circuit Breaker for AI Router/Foundry calls
 * 
 * Implements the circuit breaker pattern to prevent cascading failures
 * when the AI Router or Azure AI Foundry services are unavailable.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service has recovered
 * 
 * Requirements: 6.4, 6.5
 */

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeoutMs: number;
  /** Number of successful calls in half-open to close circuit (default: 2) */
  successThreshold: number;
  /** Time window in ms for counting failures (default: 60000) */
  failureWindowMs: number;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, reason: string) => void;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 2,
  failureWindowMs: 60000,
};

/**
 * Circuit breaker statistics
 */
export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  openedAt: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly openedAt: number,
    public readonly resetTimeoutMs: number
  ) {
    const remainingMs = Math.max(0, resetTimeoutMs - (Date.now() - openedAt));
    super(`Circuit '${circuitName}' is OPEN. Retry in ${Math.ceil(remainingMs / 1000)}s`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * CircuitBreaker implementation
 * Requirements: 6.4, 6.5
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private failureTimestamps: number[] = [];
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private openedAt: number | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private config: CircuitBreakerConfig;

  constructor(
    private readonly name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && this.shouldAttemptReset()) {
      this.transitionTo('HALF_OPEN', 'Reset timeout elapsed');
    }
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitStats {
    return {
      state: this.getState(),
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openedAt: this.openedAt,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Check if circuit allows requests
   */
  isAllowed(): boolean {
    const state = this.getState();
    return state === 'CLOSED' || state === 'HALF_OPEN';
  }

  /**
   * Execute a function through the circuit breaker
   * Requirement 6.4: Circuit breaker pattern
   * 
   * @param fn - Async function to execute
   * @returns Result of the function
   * @throws CircuitOpenError if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    const state = this.getState();

    // Reject if circuit is open
    if (state === 'OPEN') {
      throw new CircuitOpenError(this.name, this.openedAt!, this.config.resetTimeoutMs);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful call
   * Requirement 6.5: State transitions
   */
  recordSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.successes++;

    const state = this.getState();

    if (state === 'HALF_OPEN') {
      // Check if we've had enough successes to close
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('CLOSED', 'Success threshold reached');
      }
    } else if (state === 'CLOSED') {
      // Reset failure count on success in closed state
      this.failures = 0;
      this.cleanupOldFailures();
    }
  }

  /**
   * Record a failed call
   * Requirement 6.4: Open circuit on failure threshold
   */
  recordFailure(): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failures++;
    this.failureTimestamps.push(Date.now());

    const state = this.getState();

    if (state === 'HALF_OPEN') {
      // Any failure in half-open reopens the circuit
      this.transitionTo('OPEN', 'Failure in HALF_OPEN state');
    } else if (state === 'CLOSED') {
      // Clean up old failures outside the window
      this.cleanupOldFailures();
      
      // Check if we've exceeded the failure threshold
      if (this.getRecentFailureCount() >= this.config.failureThreshold) {
        this.transitionTo('OPEN', 'Failure threshold exceeded');
      }
    }
  }

  /**
   * Manually reset the circuit to closed state
   */
  reset(): void {
    this.transitionTo('CLOSED', 'Manual reset');
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
  }

  /**
   * Manually open the circuit
   */
  trip(reason: string = 'Manual trip'): void {
    this.transitionTo('OPEN', reason);
  }

  /**
   * Check if reset timeout has elapsed
   */
  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false;
    return Date.now() - this.openedAt >= this.config.resetTimeoutMs;
  }

  /**
   * Get count of failures within the failure window
   */
  private getRecentFailureCount(): number {
    const cutoff = Date.now() - this.config.failureWindowMs;
    return this.failureTimestamps.filter(ts => ts > cutoff).length;
  }

  /**
   * Remove failures outside the failure window
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState, reason: string): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;

    if (newState === 'OPEN') {
      this.openedAt = Date.now();
      this.successes = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successes = 0;
      this.failures = 0;
    } else if (newState === 'CLOSED') {
      this.openedAt = null;
      this.failures = 0;
      this.successes = 0;
      this.failureTimestamps = [];
    }

    // Notify state change
    if (this.config.onStateChange) {
      this.config.onStateChange(oldState, newState, reason);
    }

    console.log(`[CircuitBreaker:${this.name}] ${oldState} → ${newState}: ${reason}`);
  }
}

/**
 * Circuit breaker registry for managing multiple circuits
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry | null = null;
  private circuits: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  static resetInstance(): void {
    CircuitBreakerRegistry.instance = null;
  }

  /**
   * Get or create a circuit breaker
   */
  getCircuit(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker(name, config));
    }
    return this.circuits.get(name)!;
  }

  /**
   * Get all circuit stats
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    for (const [name, circuit] of this.circuits) {
      stats[name] = circuit.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }
  }
}

/**
 * Convenience function to get circuit breaker registry
 */
export function getCircuitBreakerRegistry(): CircuitBreakerRegistry {
  return CircuitBreakerRegistry.getInstance();
}

/**
 * Convenience function to get a circuit breaker
 */
export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  return getCircuitBreakerRegistry().getCircuit(name, config);
}
