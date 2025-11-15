/**
 * TikTok Service - Circuit Breaker
 * 
 * Prevents cascading failures by failing fast when service is down
 */

import { CircuitState, CircuitBreakerStats, CircuitBreakerConfig } from './types';
import { tiktokLogger } from './logger';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private totalCalls: number = 0;
  private lastFailureTime: number | null = null;
  private lastStateChange: number = Date.now();
  
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check circuit state
    if (this.state === 'OPEN') {
      // Check if reset timeout has passed
      if (Date.now() - this.lastStateChange >= this.config.resetTimeout) {
        this.transitionTo('HALF_OPEN');
      } else {
        const error = new Error('Circuit breaker is OPEN');
        tiktokLogger.warn(`Circuit breaker ${this.name} is OPEN`, {
          failures: this.failures,
          lastFailureTime: this.lastFailureTime,
        });
        throw error;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successes++;
    
    if (this.state === 'HALF_OPEN') {
      // Recovered - close circuit
      this.transitionTo('CLOSED');
      this.failures = 0;
      tiktokLogger.info(`Circuit breaker ${this.name} recovered`, {
        successes: this.successes,
      });
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      // Still failing - reopen circuit
      this.transitionTo('OPEN');
      tiktokLogger.warn(`Circuit breaker ${this.name} reopened`, {
        failures: this.failures,
      });
    } else if (this.state === 'CLOSED' && this.failures >= this.config.failureThreshold) {
      // Too many failures - open circuit
      this.transitionTo('OPEN');
      tiktokLogger.error(`Circuit breaker ${this.name} opened`, new Error('Failure threshold reached'), {
        failures: this.failures,
        threshold: this.config.failureThreshold,
      });
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    tiktokLogger.info(`Circuit breaker ${this.name} state transition`, {
      from: oldState,
      to: newState,
    });
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    
    tiktokLogger.info(`Circuit breaker ${this.name} reset`);
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create circuit breaker
   */
  getOrCreate(name: string, config: CircuitBreakerConfig): CircuitBreaker {
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
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
