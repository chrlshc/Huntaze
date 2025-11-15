/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures when Redis is unavailable by implementing
 * a circuit breaker that fails open (allows requests) when Redis is down.
 */

import { CircuitBreakerState, CircuitBreakerConfig } from './types';

/**
 * Circuit Breaker for Redis operations
 * 
 * States:
 * - CLOSED: Normal operation, requests go through
 * - OPEN: Too many failures, requests bypass Redis
 * - HALF_OPEN: Testing if Redis is back, limited requests go through
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private lastStateChange = Date.now();
  
  private readonly config: CircuitBreakerConfig;
  
  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      resetTimeout: config?.resetTimeout ?? 30000, // 30 seconds
      halfOpenSuccessThreshold: config?.halfOpenSuccessThreshold ?? 2,
    };
  }
  
  /**
   * Execute a function with circuit breaker protection
   * 
   * @param fn Function to execute (typically a Redis operation)
   * @param fallback Fallback function to call when circuit is open
   * @returns Result from fn or fallback
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback: () => T
  ): Promise<T> {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.transitionTo('half-open');
      } else {
        // Circuit is open, use fallback
        return fallback();
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return fallback();
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      
      if (this.successCount >= this.config.halfOpenSuccessThreshold) {
        // Enough successes in half-open state, close the circuit
        this.transitionTo('closed');
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Log the error
    console.error('Circuit breaker detected failure:', error);
    
    if (this.state === 'half-open') {
      // Failure in half-open state, reopen the circuit
      this.transitionTo('open');
      this.successCount = 0;
    } else if (this.state === 'closed') {
      // Check if we've hit the failure threshold
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    // Log state transition
    console.warn(`Circuit breaker state transition: ${oldState} -> ${newState}`, {
      failureCount: this.failureCount,
      successCount: this.successCount,
      timeSinceLastFailure: Date.now() - this.lastFailureTime,
    });
    
    // Emit metric for monitoring
    this.emitMetric(newState);
  }
  
  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      timeSinceLastFailure: Date.now() - this.lastFailureTime,
      config: this.config,
    };
  }
  
  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    console.info('Circuit breaker manually reset');
  }
  
  /**
   * Emit metric for monitoring
   */
  private emitMetric(state: CircuitBreakerState): void {
    // This would integrate with your monitoring system
    // For now, we'll just log it
    if (typeof window === 'undefined') {
      // Server-side only
      console.info('Circuit breaker metric:', {
        state,
        timestamp: new Date().toISOString(),
        failureCount: this.failureCount,
      });
    }
  }
}

/**
 * Global circuit breaker instance for Redis operations
 */
export const redisCircuitBreaker = new CircuitBreaker();
