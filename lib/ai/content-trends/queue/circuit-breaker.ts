/**
 * Circuit Breaker Implementation
 * 
 * Implements the circuit breaker pattern to prevent cascading failures
 * when AI services are experiencing issues.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 6.1, 6.2
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, rejecting requests
  HALF_OPEN = 'half-open', // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name for identification */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes in half-open to close circuit */
  successThreshold: number;
  /** Time in ms before attempting recovery */
  resetTimeoutMs: number;
  /** Time window for counting failures */
  failureWindowMs: number;
  /** Percentage of requests to allow in half-open state */
  halfOpenRequestPercentage: number;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  /** Callback when circuit opens */
  onOpen?: (failures: number) => void;
  /** Callback when circuit closes */
  onClose?: () => void;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  name: 'default',
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
  failureWindowMs: 60000, // 1 minute
  halfOpenRequestPercentage: 0.1, // 10% of requests
  onStateChange: undefined,
  onOpen: undefined,
  onClose: undefined,
};

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  rejectedRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  lastStateChangeTime?: number;
}

/**
 * Failure record for tracking
 */
interface FailureRecord {
  timestamp: number;
  error: string;
}

/**
 * Circuit Breaker
 * 
 * Prevents cascading failures by tracking error rates and
 * temporarily blocking requests when a service is failing.
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private successCount = 0;
  private totalRequests = 0;
  private rejectedRequests = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private lastStateChangeTime?: number;
  private resetTimer?: NodeJS.Timeout;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lastStateChangeTime = Date.now();
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if request should be allowed
    if (!this.shouldAllowRequest()) {
      this.rejectedRequests++;
      throw new CircuitOpenError(
        `Circuit breaker ${this.config.name} is open`,
        this.getTimeUntilReset()
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if a request should be allowed
   */
  shouldAllowRequest(): boolean {
    this.cleanOldFailures();

    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if reset timeout has passed
        if (this.shouldAttemptReset()) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow a percentage of requests through
        return Math.random() < this.config.halfOpenRequestPercentage;

      default:
        return true;
    }
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(error: Error): void {
    const now = Date.now();
    this.lastFailureTime = now;

    this.failures.push({
      timestamp: now,
      error: error.message,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've exceeded the failure threshold
      this.cleanOldFailures();
      
      if (this.failures.length >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    
    if (oldState === newState) {
      return;
    }

    this.state = newState;
    this.lastStateChangeTime = Date.now();

    // Reset counters on state change
    if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = [];
      this.successCount = 0;
    }

    // Clear any existing reset timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }

    // Set reset timer when opening
    if (newState === CircuitState.OPEN) {
      this.resetTimer = setTimeout(() => {
        if (this.state === CircuitState.OPEN) {
          this.transitionTo(CircuitState.HALF_OPEN);
        }
      }, this.config.resetTimeoutMs);

      this.config.onOpen?.(this.failures.length);
    }

    // Notify on close
    if (newState === CircuitState.CLOSED) {
      this.config.onClose?.();
    }

    // Notify state change
    this.config.onStateChange?.(oldState, newState);
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastStateChangeTime) {
      return true;
    }

    return Date.now() - this.lastStateChangeTime >= this.config.resetTimeoutMs;
  }

  /**
   * Clean failures outside the failure window
   */
  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindowMs;
    this.failures = this.failures.filter(f => f.timestamp > cutoff);
  }

  /**
   * Get time until circuit reset attempt
   */
  getTimeUntilReset(): number {
    if (this.state !== CircuitState.OPEN || !this.lastStateChangeTime) {
      return 0;
    }

    const elapsed = Date.now() - this.lastStateChangeTime;
    return Math.max(0, this.config.resetTimeoutMs - elapsed);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    this.cleanOldFailures();

    return {
      name: this.config.name,
      state: this.state,
      failures: this.failures.length,
      successes: this.successCount,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChangeTime: this.lastStateChangeTime,
    };
  }

  /**
   * Force the circuit to a specific state (for testing/admin)
   */
  forceState(state: CircuitState): void {
    this.transitionTo(state);
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }

    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.successCount = 0;
    this.totalRequests = 0;
    this.rejectedRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.lastStateChangeTime = Date.now();
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number
  ) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      breaker = new CircuitBreaker({ ...config, name });
      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    return Array.from(this.breakers.values()).map(b => b.getMetrics());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(b => b.reset());
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      this.breakers.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Clear all circuit breakers
   */
  clear(): void {
    this.breakers.forEach(b => b.reset());
    this.breakers.clear();
  }
}

// Singleton registry
let registryInstance: CircuitBreakerRegistry | null = null;

/**
 * Get the circuit breaker registry singleton
 */
export function getCircuitBreakerRegistry(): CircuitBreakerRegistry {
  if (!registryInstance) {
    registryInstance = new CircuitBreakerRegistry();
  }
  return registryInstance;
}

/**
 * Create a new circuit breaker
 */
export function createCircuitBreaker(
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  return new CircuitBreaker(config);
}
