/**
 * Monitoring Metrics API Client
 * 
 * Type-safe client for fetching monitoring metrics with automatic retry logic.
 * 
 * @example
 * ```typescript
 * import { metricsClient } from '@/app/api/monitoring/metrics/client';
 * 
 * // Fetch metrics with retry
 * const metrics = await metricsClient.getMetrics();
 * console.log('Total requests:', metrics.metrics.requests.total);
 * 
 * // Fetch with custom retry config
 * const metrics = await metricsClient.getMetrics({
 *   maxRetries: 5,
 *   timeout: 15000
 * });
 * ```
 */

import type {
  MetricsResponse,
  MetricsSuccessResponse,
  MetricsErrorResponse,
  isMetricsSuccess,
  isMetricsError,
} from './types';

/**
 * Client configuration options
 */
export interface MetricsClientConfig {
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onError?: (error: MetricsClientError) => void;
}

/**
 * Fetch options
 */
export interface FetchMetricsOptions {
  maxRetries?: number;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Custom error class for metrics client
 */
export class MetricsClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public correlationId?: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MetricsClientError';
  }
}

/**
 * Monitoring Metrics API Client
 */
export class MetricsClient {
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;
  private onRetry?: (attempt: number, error: Error) => void;
  private onError?: (error: MetricsClientError) => void;

  constructor(config: MetricsClientConfig = {}) {
    // Use full URL in test environment, relative URL otherwise
    const defaultBaseUrl = typeof window === 'undefined' && process.env.NODE_ENV === 'test'
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/monitoring/metrics`
      : '/api/monitoring/metrics';
    
    this.baseUrl = config.baseUrl || defaultBaseUrl;
    this.maxRetries = config.maxRetries ?? 3;
    this.timeout = config.timeout ?? 10000;
    this.onRetry = config.onRetry;
    this.onError = config.onError;
  }

  /**
   * Fetch monitoring metrics with automatic retry
   */
  async getMetrics(
    options: FetchMetricsOptions = {}
  ): Promise<MetricsSuccessResponse['data']> {
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const timeout = options.timeout ?? this.timeout;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Combine signals if provided
        const signal = options.signal
          ? this.combineSignals([controller.signal, options.signal])
          : controller.signal;

        const response = await fetch(this.baseUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const data: MetricsResponse = await response.json();

        // Handle error response
        if (!response.ok || !data.success) {
          const errorData = data as MetricsErrorResponse;
          const error = new MetricsClientError(
            errorData.error || `HTTP ${response.status}`,
            response.status,
            errorData.correlationId,
            errorData.retryable || response.status >= 500
          );

          // Retry if retryable and attempts remaining
          if (error.retryable && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            
            if (this.onRetry) {
              this.onRetry(attempt, error);
            }

            await this.sleep(delay);
            continue;
          }

          if (this.onError) {
            this.onError(error);
          }

          throw error;
        }

        // Return successful data
        const successData = data as MetricsSuccessResponse;
        return successData.data;

      } catch (error) {
        // Handle fetch errors (network, timeout, etc.)
        if (error instanceof MetricsClientError) {
          throw error;
        }

        const isNetworkError = error instanceof TypeError;
        const isAbortError = error instanceof Error && error.name === 'AbortError';
        const retryable = isNetworkError || isAbortError;

        const clientError = new MetricsClientError(
          error instanceof Error ? error.message : 'Unknown error',
          undefined,
          undefined,
          retryable,
          error instanceof Error ? error : undefined
        );

        // Retry if retryable and attempts remaining
        if (retryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          
          if (this.onRetry) {
            this.onRetry(attempt, clientError);
          }

          await this.sleep(delay);
          continue;
        }

        if (this.onError) {
          this.onError(clientError);
        }

        throw clientError;
      }
    }

    // Should never reach here
    throw new MetricsClientError('Max retries exceeded', undefined, undefined, false);
  }

  /**
   * Fetch metrics without retry (single attempt)
   */
  async getMetricsOnce(
    signal?: AbortSignal
  ): Promise<MetricsSuccessResponse['data']> {
    return this.getMetrics({ maxRetries: 1, signal });
  }

  /**
   * Check if metrics endpoint is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getMetricsOnce();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Combine multiple abort signals
   */
  private combineSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }

      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return controller.signal;
  }
}

/**
 * Default metrics client instance
 */
export const metricsClient = new MetricsClient();

/**
 * Convenience function to fetch metrics
 */
export async function getMetrics(
  options?: FetchMetricsOptions
): Promise<MetricsSuccessResponse['data']> {
  return metricsClient.getMetrics(options);
}

/**
 * Convenience function to check health
 */
export async function checkMetricsHealth(): Promise<boolean> {
  return metricsClient.healthCheck();
}
