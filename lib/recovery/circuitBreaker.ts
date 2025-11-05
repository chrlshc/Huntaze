/**
 * Circuit Breaker Implementation
 * Prevents cascade failures by monitoring service health
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringWindow: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  failureRate: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private nextAttempt: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      // Transition to HALF_OPEN for testing
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      this.totalRequests++;
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Recovery successful, close circuit
      this.state = CircuitState.CLOSED;
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
    }
  }

  getMetrics(): CircuitBreakerMetrics {
    const failureRate = this.totalRequests > 0 
      ? (this.failures / this.totalRequests) * 100 
      : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      failureRate
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
    this.nextAttempt = 0;
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.resetTimeout;
  }

  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
  }
}

// Circuit Breaker Manager
class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        timeout: 30000,
        resetTimeout: 60000,
        monitoringWindow: 300000
      };

      const finalConfig = { ...defaultConfig, ...config };
      this.breakers.set(name, new CircuitBreaker(name, finalConfig));
    }

    return this.breakers.get(name)!;
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }

    return metrics;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Global instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Convenience functions
export const executeWithCircuitBreaker = async <T>(
  name: string,
  operation: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> => {
  const breaker = circuitBreakerManager.getOrCreate(name, config);
  return breaker.execute(operation);
};

export const getCircuitBreakerMetrics = (name?: string) => {
  if (name) {
    const breaker = circuitBreakerManager.getOrCreate(name);
    return breaker.getMetrics();
  }
  return circuitBreakerManager.getAllMetrics();
};

// Pre-configured circuit breakers for common services
export const databaseCircuitBreaker = circuitBreakerManager.getOrCreate('database', {
  failureThreshold: 5,
  timeout: 30000,
  resetTimeout: 60000
});

export const cacheCircuitBreaker = circuitBreakerManager.getOrCreate('cache', {
  failureThreshold: 3,
  timeout: 15000,
  resetTimeout: 30000
});

export const externalAPICircuitBreaker = circuitBreakerManager.getOrCreate('external-api', {
  failureThreshold: 3,
  timeout: 10000,
  resetTimeout: 30000
});