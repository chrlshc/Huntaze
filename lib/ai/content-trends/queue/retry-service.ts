/**
 * Retry Service with Exponential Backoff
 * 
 * Implements retry logic with exponential backoff delays
 * (2s, 4s, 8s, 16s) for failed AI inference tasks.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Section 4.5
 */

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay in milliseconds */
  baseDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  multiplier: number;
  /** Whether to add jitter to delays */
  jitter: boolean;
  /** Maximum jitter percentage (0-1) */
  jitterFactor: number;
  /** Error types that should not be retried */
  nonRetryableErrors: string[];
}

/**
 * Default retry configuration
 * Implements 2s, 4s, 8s, 16s exponential backoff
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 4,
  baseDelayMs: 2000, // 2 seconds
  maxDelayMs: 16000, // 16 seconds
  multiplier: 2,
  jitter: true,
  jitterFactor: 0.1, // 10% jitter
  nonRetryableErrors: [
    'INVALID_INPUT',
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'NOT_FOUND',
    'VALIDATION_ERROR',
  ],
};

/**
 * Retry attempt result
 */
export interface RetryAttempt<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attemptNumber: number;
  delayMs: number;
  totalTimeMs: number;
}

/**
 * Retry execution result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RetryAttempt<T>[];
  totalAttempts: number;
  totalTimeMs: number;
}

/**
 * Retry Service
 * 
 * Provides retry functionality with exponential backoff
 * for handling transient failures in AI inference tasks.
 */
export class RetryService {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<RetryResult<T>> {
    const attempts: RetryAttempt<T>[] = [];
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      const delay = this.calculateDelay(attempt);

      try {
        // Wait before retry (except for first attempt)
        if (attempt > 1) {
          await this.sleep(delay);
        }

        const result = await fn();

        const attemptResult: RetryAttempt<T> = {
          success: true,
          result,
          attemptNumber: attempt,
          delayMs: attempt > 1 ? delay : 0,
          totalTimeMs: Date.now() - attemptStartTime,
        };

        attempts.push(attemptResult);

        return {
          success: true,
          result,
          attempts,
          totalAttempts: attempt,
          totalTimeMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const attemptResult: RetryAttempt<T> = {
          success: false,
          error: lastError,
          attemptNumber: attempt,
          delayMs: attempt > 1 ? delay : 0,
          totalTimeMs: Date.now() - attemptStartTime,
        };

        attempts.push(attemptResult);

        // Check if error is non-retryable
        if (this.isNonRetryable(lastError)) {
          break;
        }

        // Log retry attempt
        if (context) {
          console.warn(
            `[RetryService] ${context} - Attempt ${attempt}/${this.config.maxAttempts} failed: ${lastError.message}`
          );
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalAttempts: attempts.length,
      totalTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Calculate delay for a given attempt number
   */
  calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * multiplier^(attempt-1)
    let delay = this.config.baseDelayMs * Math.pow(this.config.multiplier, attempt - 1);

    // Cap at maximum delay
    delay = Math.min(delay, this.config.maxDelayMs);

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterRange = delay * this.config.jitterFactor;
      const jitter = (Math.random() * 2 - 1) * jitterRange;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Get the delay sequence for all attempts
   */
  getDelaySequence(): number[] {
    const delays: number[] = [];
    for (let i = 1; i <= this.config.maxAttempts; i++) {
      delays.push(this.calculateDelay(i));
    }
    return delays;
  }

  /**
   * Check if an error is non-retryable
   */
  isNonRetryable(error: Error): boolean {
    // Check error code if available
    const errorCode = (error as any).code;
    if (errorCode && this.config.nonRetryableErrors.includes(errorCode)) {
      return true;
    }

    // Check error name
    if (this.config.nonRetryableErrors.includes(error.name)) {
      return true;
    }

    // Check error message for known patterns
    const nonRetryablePatterns = [
      /invalid/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /validation/i,
    ];

    return nonRetryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let retryServiceInstance: RetryService | null = null;

/**
 * Get or create the retry service singleton
 */
export function getRetryService(config?: Partial<RetryConfig>): RetryService {
  if (!retryServiceInstance) {
    retryServiceInstance = new RetryService(config);
  }
  return retryServiceInstance;
}

/**
 * Create a new retry service instance
 */
export function createRetryService(config?: Partial<RetryConfig>): RetryService {
  return new RetryService(config);
}

/**
 * Decorator for adding retry logic to async functions
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: Partial<RetryConfig>
): T {
  const retryService = new RetryService(config);

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const result = await retryService.execute(() => fn(...args));
    
    if (result.success) {
      return result.result as ReturnType<T>;
    }

    throw result.error;
  }) as T;
}
