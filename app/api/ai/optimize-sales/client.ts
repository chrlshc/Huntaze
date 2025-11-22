/**
 * AI Optimize Sales API Client
 * 
 * Type-safe client for the optimize sales API endpoint.
 * Includes automatic retry logic and error handling.
 * 
 * @example
 * ```typescript
 * import { optimizeSalesMessage } from '@/app/api/ai/optimize-sales/client';
 * 
 * const result = await optimizeSalesMessage({
 *   fanId: 'fan_123',
 *   context: {
 *     currentMessage: 'Check out my new content!',
 *     engagementLevel: 'high',
 *     pricePoint: 25
 *   }
 * });
 * 
 * if (result.success) {
 *   console.log('Optimized message:', result.data.message);
 *   console.log('Tactics:', result.data.tactics);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */

import type { OptimizeSalesRequest, OptimizeSalesResponse } from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_ENDPOINT = '/api/ai/optimize-sales';
const REQUEST_TIMEOUT_MS = 35000; // 35 seconds (slightly longer than server timeout)

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

/**
 * Check if error is retryable
 */
function isRetryableError(status: number, errorCode?: string): boolean {
  // 5xx errors are retryable
  if (status >= 500) {
    return true;
  }

  // 429 with retryable flag
  if (status === 429 && errorCode === 'RATE_LIMIT_EXCEEDED') {
    return false; // Don't auto-retry rate limits
  }

  // 408 Request Timeout
  if (status === 408) {
    return true;
  }

  return false;
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const retryable = error.retryable !== false && isRetryableError(error.status, error.code);

    if (!retryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    console.warn(`[AI Optimize Sales] Retrying request (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}) after ${delay}ms`);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, attempt + 1);
  }
}

// ============================================================================
// Main Client Function
// ============================================================================

/**
 * Optimize sales message with AI-powered conversion tactics
 * 
 * @param request - Sales optimization request
 * @returns Promise resolving to optimization result
 * @throws Error if request fails after retries
 * 
 * @example
 * ```typescript
 * const result = await optimizeSalesMessage({
 *   fanId: 'fan_123',
 *   context: {
 *     currentMessage: 'Check out my new content!',
 *     engagementLevel: 'high',
 *     pricePoint: 25
 *   }
 * });
 * ```
 */
export async function optimizeSalesMessage(
  request: OptimizeSalesRequest
): Promise<OptimizeSalesResponse> {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error: any = new Error(data.error?.message || 'Failed to optimize sales message');
        error.status = response.status;
        error.code = data.error?.code;
        error.retryable = data.error?.retryable;
        error.correlationId = data.meta?.requestId;
        throw error;
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError: any = new Error('Request timed out');
        timeoutError.status = 504;
        timeoutError.code = 'TIMEOUT_ERROR';
        timeoutError.retryable = true;
        throw timeoutError;
      }

      throw error;
    }
  });
}

/**
 * Optimize sales message with custom options
 * 
 * @param request - Sales optimization request
 * @param options - Custom options (timeout, retries, etc.)
 * @returns Promise resolving to optimization result
 * 
 * @example
 * ```typescript
 * const result = await optimizeSalesMessageWithOptions(
 *   { fanId: 'fan_123', context: { ... } },
 *   { timeout: 10000, maxRetries: 2 }
 * );
 * ```
 */
export async function optimizeSalesMessageWithOptions(
  request: OptimizeSalesRequest,
  options: {
    timeout?: number;
    maxRetries?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<OptimizeSalesResponse> {
  const timeout = options.timeout || REQUEST_TIMEOUT_MS;
  const maxRetries = options.maxRetries || RETRY_CONFIG.maxRetries;

  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error: any = new Error(data.error?.message || 'Failed to optimize sales message');
        error.status = response.status;
        error.code = data.error?.code;
        error.retryable = data.error?.retryable;
        error.correlationId = data.meta?.requestId;
        throw error;
      }

      return data;
    } catch (error: any) {
      attempt++;

      if (error.name === 'AbortError') {
        error.message = 'Request timed out';
        error.status = 504;
        error.code = 'TIMEOUT_ERROR';
        error.retryable = true;
      }

      const retryable = error.retryable !== false && isRetryableError(error.status, error.code);

      if (!retryable || attempt >= maxRetries) {
        throw error;
      }

      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
        RETRY_CONFIG.maxDelay
      );

      if (options.onRetry) {
        options.onRetry(attempt, error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
