/**
 * Request Optimization Service
 * Handles request deduplication, batching, debouncing, and retry logic
 */

interface BatchRequest {
  id: string;
  query: string;
  variables?: Record<string, any>;
}

interface BatchResponse<T> {
  id: string;
  data?: T;
  error?: Error;
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

class RequestOptimizer {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Deduplicate identical requests
   * If a request with the same key is already in flight, return the existing promise
   */
  async deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const promise = fetcher()
      .then((result) => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Batch multiple requests together
   * Collects requests and sends them in a single batch after a short delay
   */
  async batch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
    return new Promise((resolve) => {
      // Add requests to queue
      this.batchQueue.push(...requests);

      // Clear existing timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }

      // Set new timer to process batch
      this.batchTimer = setTimeout(async () => {
        const batch = [...this.batchQueue];
        this.batchQueue = [];
        this.batchTimer = null;

        try {
          // Send batch request
          const response = await fetch('/api/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: batch }),
          });

          const results = await response.json();
          resolve(results);
        } catch (error) {
          // Return errors for all requests in batch
          resolve(
            batch.map((req) => ({
              id: req.id,
              error: error as Error,
            }))
          );
        }
      }, 50); // 50ms batch window
    });
  }

  /**
   * Debounce rapid API calls
   * Only executes the function after the specified delay has passed without new calls
   */
  async debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = 300
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Clear existing timer for this key
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Retry failed requests with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Increase delay for next attempt (exponential backoff)
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    this.pendingRequests.clear();
    this.batchQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Get statistics about current operations
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedBatchRequests: this.batchQueue.length,
      activeDebounces: this.debounceTimers.size,
    };
  }
}

// Export singleton instance
export const requestOptimizer = new RequestOptimizer();

// Export types
export type { BatchRequest, BatchResponse, RetryOptions };
