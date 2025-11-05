/**
 * Retry Manager with Exponential Backoff
 * Handles transient failures with intelligent retry logic
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageAttempts: number;
  lastRetryTime: number;
}

class RetryManager {
  private metrics = new Map<string, RetryMetrics>();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName?: string
  ): Promise<T> {
    const finalConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: this.defaultRetryCondition,
      ...config
    };

    let lastError: any;
    let attempt = 0;

    while (attempt < finalConfig.maxAttempts) {
      try {
        const result = await operation();
        
        // Update metrics on success
        if (operationName && attempt > 0) {
          this.updateMetrics(operationName, attempt + 1, true);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if we should retry this error
        if (!finalConfig.retryCondition!(error)) {
          break;
        }

        // Don't delay on the last attempt
        if (attempt < finalConfig.maxAttempts) {
          const delay = this.calculateDelay(
            attempt,
            finalConfig.baseDelay,
            finalConfig.maxDelay,
            finalConfig.backoffMultiplier,
            finalConfig.jitter
          );
          
          await this.sleep(delay);
        }
      }
    }

    // Update metrics on failure
    if (operationName) {
      this.updateMetrics(operationName, attempt, false);
    }

    throw lastError;
  }

  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    multiplier: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    delay = Math.min(delay, maxDelay);

    if (jitter) {
      // Add random jitter (±25%)
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private defaultRetryCondition(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx status codes
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }

    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Don't retry on 4xx client errors (except 429 rate limit)
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }

    return true;
  }

  private updateMetrics(operationName: string, attempts: number, success: boolean): void {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, {
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageAttempts: 0,
        lastRetryTime: 0
      });
    }

    const metrics = this.metrics.get(operationName)!;
    metrics.totalAttempts += attempts;
    metrics.lastRetryTime = Date.now();

    if (success && attempts > 1) {
      metrics.successfulRetries++;
    } else if (!success) {
      metrics.failedRetries++;
    }

    // Calculate average attempts
    const totalOperations = metrics.successfulRetries + metrics.failedRetries;
    if (totalOperations > 0) {
      metrics.averageAttempts = metrics.totalAttempts / totalOperations;
    }
  }

  getMetrics(operationName?: string): RetryMetrics | Record<string, RetryMetrics> {
    if (operationName) {
      return this.metrics.get(operationName) || {
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageAttempts: 0,
        lastRetryTime: 0
      };
    }

    const allMetrics: Record<string, RetryMetrics> = {};
    for (const [name, metrics] of this.metrics) {
      allMetrics[name] = { ...metrics };
    }
    return allMetrics;
  }

  resetMetrics(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
    }
  }
}

// Global instance
export const retryManager = new RetryManager();

// Convenience functions with pre-configured retry policies
export const retryDatabaseOperation = <T>(operation: () => Promise<T>): Promise<T> => {
  return retryManager.executeWithRetry(
    operation,
    {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 2000,
      retryCondition: (error) => {
        // Retry on connection errors and timeouts
        return error.code === 'ECONNRESET' || 
               error.code === 'ETIMEDOUT' ||
               error.message?.includes('connection');
      }
    },
    'database'
  );
};

export const retryCacheOperation = <T>(operation: () => Promise<T>): Promise<T> => {
  return retryManager.executeWithRetry(
    operation,
    {
      maxAttempts: 2,
      baseDelay: 50,
      maxDelay: 500,
      retryCondition: (error) => {
        // Quick retries for cache operations
        return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
      }
    },
    'cache'
  );
};

export const retryExternalAPI = <T>(operation: () => Promise<T>): Promise<T> => {
  return retryManager.executeWithRetry(
    operation,
    {
      maxAttempts: 3,
      baseDelay: 200,
      maxDelay: 5000,
      retryCondition: (error) => {
        // Retry on 5xx errors and rate limits
        return (error.status >= 500 && error.status < 600) || 
               error.status === 429;
      }
    },
    'external-api'
  );
};

// Utility function for combining circuit breaker and retry
export const executeWithCircuitBreakerAndRetry = async <T>(
  circuitBreakerName: string,
  operation: () => Promise<T>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> => {
  const { executeWithCircuitBreaker } = await import('./circuitBreaker');
  
  return retryManager.executeWithRetry(
    () => executeWithCircuitBreaker(circuitBreakerName, operation),
    retryConfig,
    `${circuitBreakerName}-with-retry`
  );
};