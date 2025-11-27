/**
 * API Retry Logic
 * Task 5.2: Implement error handling with retry mechanisms
 * Requirements: 4.2
 */

interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds
   */
  maxDelay?: number;

  /**
   * Backoff multiplier
   */
  backoffMultiplier?: number;

  /**
   * Function to determine if error is retryable
   */
  isRetryable?: (error: any) => boolean;

  /**
   * Callback on retry attempt
   */
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  isRetryable: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    if (error.status === 429) {
      // Rate limited
      return true;
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Execute a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!opts.isRetryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      // Call retry callback
      opts.onRetry(attempt + 1, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);

    // Throw error for non-ok responses
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response;
  }, options);
}

/**
 * Fetch JSON with retry logic
 */
export async function fetchJSONWithRetry<T = any>(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, init, options);
  return response.json();
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.timeout
      ) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
      this.failureCount = 0;
      this.lastFailureTime = null;

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold reached
      if (this.failureCount >= this.threshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed';
  }
}

/**
 * Create a circuit breaker for a specific API endpoint
 */
export function createCircuitBreaker(
  threshold?: number,
  timeout?: number
): CircuitBreaker {
  return new CircuitBreaker(threshold, timeout);
}

/**
 * Batch multiple API calls with retry logic
 */
export async function batchWithRetry<T>(
  calls: Array<() => Promise<T>>,
  options?: RetryOptions & {
    concurrency?: number;
    continueOnError?: boolean;
  }
): Promise<Array<T | Error>> {
  const { concurrency = 5, continueOnError = true, ...retryOptions } = options || {};

  const results: Array<T | Error> = [];
  const queue = [...calls];

  // Process calls in batches
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(call => withRetry(call, retryOptions))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        if (continueOnError) {
          results.push(result.reason);
        } else {
          throw result.reason;
        }
      }
    }
  }

  return results;
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(timeoutError || new Error('Operation timed out')),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry with timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryOptions?: RetryOptions,
  timeoutMs?: number
): Promise<T> {
  const promise = withRetry(fn, retryOptions);

  if (timeoutMs) {
    return withTimeout(promise, timeoutMs);
  }

  return promise;
}
