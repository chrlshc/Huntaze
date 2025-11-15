/**
 * Rate Limiter API Client
 * 
 * Provides retry logic, error handling, and timeout management for rate limiting operations
 */

import { RateLimitError, RateLimitErrorType } from './types';

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
} as const;

const TIMEOUT_MS = 10000; // 10 seconds

export class RateLimiterAPIClient {
  /**
   * Execute operation with retry and timeout
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    operationName: string
  ): Promise<T> {
    const correlationId = this.generateCorrelationId();
    let lastError: Error | undefined;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        console.log(`[RateLimiterAPI] ${operationName} attempt ${attempt}/${RETRY_CONFIG.maxAttempts}`, {
          correlationId,
        });

        const result = await this.executeWithTimeout(operation, TIMEOUT_MS);
        
        console.log(`[RateLimiterAPI] ${operationName} succeeded`, {
          correlationId,
          attempt,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        console.error(`[RateLimiterAPI] ${operationName} failed`, {
          correlationId,
          attempt,
          error: lastError.message,
        });

        // Don't retry on validation or configuration errors
        if (this.isRateLimitError(error)) {
          if (
            error.type === RateLimitErrorType.VALIDATION_ERROR ||
            error.type === RateLimitErrorType.CONFIGURATION_ERROR
          ) {
            throw error;
          }
        }

        // Last attempt - use fallback
        if (attempt === RETRY_CONFIG.maxAttempts) {
          console.warn(`[RateLimiterAPI] ${operationName} exhausted retries, using fallback`, {
            correlationId,
          });
          return fallback();
        }

        // Wait before retry
        await this.sleep(delay);
        delay = Math.min(
          delay * RETRY_CONFIG.backoffFactor,
          RETRY_CONFIG.maxDelay
        ) as typeof RETRY_CONFIG.initialDelay;
      }
    }

    // Fallback if all retries failed
    console.error(`[RateLimiterAPI] ${operationName} failed completely, using fallback`, {
      error: lastError?.message,
    });
    return fallback();
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Check if error is a RateLimitError
   */
  private isRateLimitError(error: unknown): error is RateLimitError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error &&
      'userMessage' in error &&
      'retryable' in error
    );
  }

  /**
   * Wrap error with correlation ID
   */
  wrapError(error: Error, correlationId: string): RateLimitError {
    if (this.isRateLimitError(error)) {
      return { ...error, correlationId };
    }

    return {
      type: RateLimitErrorType.REDIS_ERROR,
      message: error.message,
      userMessage: 'Rate limiting service temporarily unavailable. Your request has been allowed.',
      retryable: true,
      correlationId,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `rl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export singleton instance
export const rateLimiterAPI = new RateLimiterAPIClient();
