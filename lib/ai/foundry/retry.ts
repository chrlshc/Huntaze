/**
 * Retry utility with exponential backoff
 * 
 * Provides retry logic for transient failures when calling
 * the AI Router or Azure AI Foundry services.
 * 
 * Requirements: 6.2
 */

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Jitter factor 0-1 to add randomness (default: 0.1) */
  jitterFactor: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for retry events */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Error codes that are considered transient and retryable
 */
export const RETRYABLE_ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN',
];

/**
 * HTTP status codes that are considered transient and retryable
 */
export const RETRYABLE_HTTP_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

/**
 * Check if an error is retryable based on error code or HTTP status
 * 
 * @param error - Error to check
 * @returns true if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Check for network error codes
  if (error instanceof Error) {
    const errorCode = (error as NodeJS.ErrnoException).code;
    if (errorCode && RETRYABLE_ERROR_CODES.includes(errorCode)) {
      return true;
    }

    // Check for HTTP status in error message or properties
    const errorAny = error as Record<string, unknown>;
    const status = errorAny.status || errorAny.statusCode;
    if (typeof status === 'number' && RETRYABLE_HTTP_STATUS_CODES.includes(status)) {
      return true;
    }

    // Check for rate limiting
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return true;
    }

    // Check for timeout
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return true;
    }

    // Check for connection errors
    if (error.message.includes('ECONNRESET') || error.message.includes('ECONNREFUSED')) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate delay for a given attempt with exponential backoff and jitter
 * 
 * @param attempt - Current attempt number (1-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  
  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * config.jitterFactor * Math.random();
  
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a given number of milliseconds
 * 
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * Requirement 6.2: Retry with exponential backoff
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration (optional)
 * @returns Result with success status, data, and retry statistics
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const isRetryable = fullConfig.isRetryable || isRetryableError;
  
  let lastError: Error | undefined;
  let totalDelayMs = 0;
  
  for (let attempt = 1; attempt <= fullConfig.maxRetries + 1; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const isLastAttempt = attempt > fullConfig.maxRetries;
      const shouldRetry = !isLastAttempt && isRetryable(error);
      
      if (!shouldRetry) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDelayMs,
        };
      }
      
      // Calculate delay and wait
      const delayMs = calculateDelay(attempt, fullConfig);
      totalDelayMs += delayMs;
      
      // Notify about retry
      if (fullConfig.onRetry) {
        fullConfig.onRetry(attempt, error, delayMs);
      }
      
      await sleep(delayMs);
    }
  }
  
  // Should not reach here, but just in case
  return {
    success: false,
    error: lastError || new Error('Max retries exceeded'),
    attempts: fullConfig.maxRetries + 1,
    totalDelayMs,
  };
}

/**
 * Execute a function with retry, throwing on final failure
 * Convenience wrapper that throws instead of returning result object
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration (optional)
 * @returns Result data
 * @throws Error if all retries fail
 */
export async function retryWithThrow<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const result = await withRetry(fn, config);
  
  if (!result.success) {
    const error = result.error || new Error('Retry failed');
    (error as Record<string, unknown>).attempts = result.attempts;
    (error as Record<string, unknown>).totalDelayMs = result.totalDelayMs;
    throw error;
  }
  
  return result.data as T;
}

/**
 * Create a retry wrapper with pre-configured options
 * 
 * @param config - Retry configuration
 * @returns Function that wraps async functions with retry logic
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(fn: () => Promise<T>): Promise<RetryResult<T>> => {
    return withRetry(fn, config);
  };
}
