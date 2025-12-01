/**
 * Circuit Breaker Implementation for Azure OpenAI
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 7: Implement fallback chain with circuit breakers
 * Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4, 6.5
 */

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening (default: 5)
  failureRate: number; // Failure rate threshold (0-1, default: 0.5 = 50%)
  successThreshold: number; // Successes needed to close from half-open (default: 2)
  timeout: number; // Time in ms before attempting half-open (default: 60000)
  windowSize: number; // Rolling window size for failure rate calculation (default: 10)
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  totalRequests: number;
  failedRequests: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;
  private recentResults: boolean[] = []; // true = success, false = failure
  private totalRequests: number = 0;
  private failedRequests: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      failureRate: 0.5,
      successThreshold: 2,
      timeout: 60000,
      windowSize: 10,
    }
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
      
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      console.log(`Circuit breaker '${this.name}' transitioning to HALF_OPEN`);
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record a successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();
    
    // Add to rolling window
    this.recentResults.push(true);
    if (this.recentResults.length > this.config.windowSize) {
      this.recentResults.shift();
    }

    // Handle state transitions
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.close();
      }
    }
  }

  /**
   * Record a failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.failedRequests++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();
    
    // Add to rolling window
    this.recentResults.push(false);
    if (this.recentResults.length > this.config.windowSize) {
      this.recentResults.shift();
    }

    // Check if we should open the circuit
    if (this.shouldOpen()) {
      this.open();
    }
  }

  /**
   * Check if circuit should open based on failure threshold and rate
   */
  private shouldOpen(): boolean {
    // Check consecutive failures threshold
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Check failure rate in rolling window
    if (this.recentResults.length >= this.config.windowSize) {
      const failureCount = this.recentResults.filter(r => !r).length;
      const failureRate = failureCount / this.recentResults.length;
      
      if (failureRate >= this.config.failureRate) {
        return true;
      }
    }

    return false;
  }

  /**
   * Open the circuit
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.timeout;
    console.log(`Circuit breaker '${this.name}' OPENED. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`);
  }

  /**
   * Close the circuit
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttemptTime = undefined;
    console.log(`Circuit breaker '${this.name}' CLOSED`);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      failedRequests: this.failedRequests,
    };
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    this.recentResults = [];
    this.totalRequests = 0;
    this.failedRequests = 0;
  }

  /**
   * Force open the circuit (for testing/maintenance)
   */
  forceOpen(): void {
    this.open();
  }

  /**
   * Force close the circuit (for testing/recovery)
   */
  forceClose(): void {
    this.close();
  }
}
