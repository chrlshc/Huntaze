/**
 * Retry Strategy Utilities
 * 
 * Provides configurable retry logic with exponential backoff,
 * jitter, and circuit breaker patterns
 */

import { logger } from '@/lib/utils/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  operationName?: string;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

/**
 * Execute operation with exponential backoff retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    jitter = true,
    operationName = 'operation',
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Retry attempt ${attempt + 1}/${maxRetries + 1}`, {
        operation: operationName,
        attempt: attempt + 1
      });
      
      const result = await operation();
      
      if (attempt > 0) {
        logger.info(`Operation succeeded after retries`, {
          operation: operationName,
          attempts: attempt + 1
        });
      }
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        logger.warn(`Non-retryable error encountered`, {
          operation: operationName,
          error: lastError.message
        });
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      let delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }
      
      logger.warn(`Operation failed, retrying`, {
        operation: operationName,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        delayMs: Math.round(delay),
        error: lastError.message
      });
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      await sleep(delay);
    }
  }
  
  logger.error(`Operation failed after all retries`, {
    operation: operationName,
    attempts: maxRetries + 1,
    error: lastError?.message
  });
  
  throw new RetryExhaustedError(
    `${operationName} failed after ${maxRetries + 1} attempts`,
    maxRetries + 1,
    { cause: lastError }
  );
}

/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime?: number;
  private successCount = 0;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {}
  ) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitoringPeriod = 120000
    } = options;

    this.options = { failureThreshold, resetTimeout, monitoringPeriod };
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - (this.lastFailureTime || 0);
      
      if (timeSinceFailure < (this.options.resetTimeout || 60000)) {
        logger.warn(`Circuit breaker is open`, {
          circuitBreaker: this.name,
          state: this.state,
          failureCount: this.failureCount
        });
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
      
      // Try half-open state
      this.state = 'half-open';
      logger.info(`Circuit breaker entering half-open state`, {
        circuitBreaker: this.name
      });
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

  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === 'half-open') {
      // Reset circuit after successful half-open attempt
      this.state = 'closed';
      this.failureCount = 0;
      this.successCount = 0;
      
      logger.info(`Circuit breaker closed after successful recovery`, {
        circuitBreaker: this.name
      });
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    const threshold = this.options.failureThreshold || 5;
    
    if (this.failureCount >= threshold) {
      this.state = 'open';
      
      logger.error(`Circuit breaker opened due to failures`, {
        circuitBreaker: this.name,
        failureCount: this.failureCount,
        threshold
      });
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    successCount: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    
    logger.info(`Circuit breaker manually reset`, {
      circuitBreaker: this.name
    });
  }
}

/**
 * Retry with circuit breaker
 */
export async function withRetryAndCircuitBreaker<T>(
  operation: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return circuitBreaker.execute(() => withRetry(operation, retryOptions));
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry exhausted error
 */
class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RetryExhaustedError';
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (error.message.includes('ECONNREFUSED')) return true;
  if (error.message.includes('ETIMEDOUT')) return true;
  if (error.message.includes('ENOTFOUND')) return true;
  
  // Rate limit errors are retryable
  if (error.message.includes('429')) return true;
  if (error.message.includes('rate limit')) return true;
  
  // Server errors are retryable
  if (error.message.includes('500')) return true;
  if (error.message.includes('502')) return true;
  if (error.message.includes('503')) return true;
  if (error.message.includes('504')) return true;
  
  // Validation errors are NOT retryable
  if (error.name === 'ValidationError') return false;
  if (error.message.includes('400')) return false;
  if (error.message.includes('401')) return false;
  if (error.message.includes('403')) return false;
  if (error.message.includes('404')) return false;
  
  // Default: retry
  return true;
}

/**
 * Batch retry - retry multiple operations with shared backoff
 */
export async function batchRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const results: T[] = [];
  
  for (const operation of operations) {
    const result = await withRetry(operation, options);
    results.push(result);
  }
  
  return results;
}

/**
 * Parallel retry - retry multiple operations in parallel
 */
export async function parallelRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(
    operations.map(operation => withRetry(operation, options))
  );
}

/**
 * Alias for withRetry for backward compatibility
 */
export const retryWithBackoff = withRetry;
