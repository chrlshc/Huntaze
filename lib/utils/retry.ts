/**
 * Centralized Retry Logic Utility
 * 
 * Provides reusable retry strategies with exponential backoff
 * for handling transient failures in API calls and database operations.
 * 
 * Requirements: Reliability, Error handling, Performance
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await prisma.user.findUnique({ where: { id: 123 } }),
 *   'find-user-123'
 * );
 * ```
 */

import { createLogger } from './logger';
import { Prisma } from '@prisma/client';

const logger = createLogger('retry-utility');

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Initial delay in milliseconds before first retry
   * @default 100
   */
  initialDelay?: number;
  
  /**
   * Maximum delay in milliseconds between retries
   * @default 2000
   */
  maxDelay?: number;
  
  /**
   * Backoff multiplier for exponential backoff
   * @default 2
   */
  backoffFactor?: number;
  
  /**
   * Custom function to determine if error is retryable
   */
  isRetryable?: (error: any) => boolean;
  
  /**
   * Callback called before each retry
   */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'isRetryable' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};

/**
 * Prisma error codes that are retryable
 */
export const RETRYABLE_PRISMA_ERRORS = [
  'P2024', // Timed out fetching a new connection
  'P2034', // Transaction failed due to a write conflict
  'P1001', // Can't reach database server
  'P1002', // Database server timeout
  'P1008', // Operations timed out
  'P1017', // Server closed the connection
];

/**
 * Network error codes that are retryable
 */
export const RETRYABLE_NETWORK_ERRORS = [
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'ECONNRESET',
];

/**
 * HTTP status codes that are retryable
 */
export const RETRYABLE_HTTP_STATUSES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

/**
 * Default function to determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_PRISMA_ERRORS.includes(error.code);
  }
  
  // Network errors
  if (error.code && RETRYABLE_NETWORK_ERRORS.includes(error.code)) {
    return true;
  }
  
  // HTTP errors
  if (error.status && RETRYABLE_HTTP_STATUSES.includes(error.status)) {
    return true;
  }
  
  // Fetch API errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  return false;
}

/**
 * Retry an async operation with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param correlationId - Unique identifier for tracking
 * @param config - Retry configuration options
 * @returns Promise that resolves with the function result
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * const user = await retryWithBackoff(
 *   async () => await prisma.user.findUnique({ where: { id: 123 } }),
 *   'find-user-123',
 *   { maxRetries: 5 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    initialDelay = DEFAULT_RETRY_CONFIG.initialDelay,
    maxDelay = DEFAULT_RETRY_CONFIG.maxDelay,
    backoffFactor = DEFAULT_RETRY_CONFIG.backoffFactor,
    isRetryable: customIsRetryable = isRetryableError,
    onRetry,
  } = config;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const retryable = customIsRetryable(error);
      
      if (!retryable || attempt >= maxRetries) {
        logger.error('Operation failed after retries', error, {
          correlationId,
          attempt,
          maxRetries,
          retryable,
        });
        throw error;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      logger.warn('Retrying operation', {
        correlationId,
        attempt,
        maxRetries,
        delay,
        error: error.message,
        errorCode: error.code,
      });
      
      if (onRetry) {
        onRetry(error, attempt, delay);
      }
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry with linear backoff (constant delay between retries)
 * 
 * @param fn - The async function to retry
 * @param correlationId - Unique identifier for tracking
 * @param delay - Delay in milliseconds between retries
 * @param maxRetries - Maximum number of retries
 * @returns Promise that resolves with the function result
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  delay: number = 1000,
  maxRetries: number = 3
): Promise<T> {
  return retryWithBackoff(fn, correlationId, {
    maxRetries,
    initialDelay: delay,
    maxDelay: delay,
    backoffFactor: 1,
  });
}

/**
 * Retry with jitter to avoid thundering herd problem
 * 
 * @param fn - The async function to retry
 * @param correlationId - Unique identifier for tracking
 * @param config - Retry configuration options
 * @returns Promise that resolves with the function result
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  correlationId: string,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    initialDelay = DEFAULT_RETRY_CONFIG.initialDelay,
    maxDelay = DEFAULT_RETRY_CONFIG.maxDelay,
    backoffFactor = DEFAULT_RETRY_CONFIG.backoffFactor,
    isRetryable: customIsRetryable = isRetryableError,
    onRetry,
  } = config;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const retryable = customIsRetryable(error);
      
      if (!retryable || attempt >= maxRetries) {
        throw error;
      }
      
      // Calculate base delay with exponential backoff
      const baseDelay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      // Add random jitter (0-50% of base delay)
      const jitter = Math.random() * baseDelay * 0.5;
      const delay = baseDelay + jitter;
      
      logger.warn('Retrying with jitter', {
        correlationId,
        attempt,
        maxRetries,
        baseDelay,
        jitter,
        totalDelay: delay,
      });
      
      if (onRetry) {
        onRetry(error, attempt, delay);
      }
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry with circuit breaker pattern
 * Stops retrying if too many failures occur in a time window
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}
  
  async execute<T>(
    fn: () => Promise<T>,
    correlationId: string
  ): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceLastFailure < this.resetTimeout) {
        throw new Error('Circuit breaker is open');
      }
      
      this.state = 'half-open';
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.threshold,
      });
    }
  }
  
  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    logger.info('Circuit breaker reset');
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Create a retry wrapper for a specific function
 * 
 * @param fn - The function to wrap
 * @param config - Retry configuration
 * @returns Wrapped function with automatic retry
 * 
 * @example
 * ```typescript
 * const fetchUserWithRetry = createRetryWrapper(
 *   (id: number) => prisma.user.findUnique({ where: { id } }),
 *   { maxRetries: 5 }
 * );
 * 
 * const user = await fetchUserWithRetry(123);
 * ```
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RetryConfig = {}
): T {
  return (async (...args: Parameters<T>) => {
    const correlationId = `retry-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    return retryWithBackoff(() => fn(...args), correlationId, config);
  }) as T;
}
