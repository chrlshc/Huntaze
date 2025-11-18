/**
 * Fetch with Retry Utility
 * 
 * Implements exponential backoff retry logic for API calls.
 * Supports multi-account integrations with proper error handling.
 * 
 * @see .kiro/specs/integrations-management/MULTI_ACCOUNT_API_OPTIMIZATION.md
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('fetch-with-retry');

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
  timeout?: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  timeout: 30000, // 30 seconds
};

/**
 * Fetch error with retry information
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public correlationId?: string,
    public attempt?: number
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, config: RetryConfig): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors are retryable
  if (error.name === 'AbortError') {
    return true;
  }
  
  // HTTP status codes
  if (error.statusCode && config.retryableStatusCodes.includes(error.statusCode)) {
    return true;
  }
  
  return false;
}

/**
 * Wait for specified delay
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Fetch with automatic retry and exponential backoff
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Parsed JSON response
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const data = await fetchWithRetry('/api/integrations/status');
 * 
 * // With custom config
 * const data = await fetchWithRetry('/api/integrations/connect/instagram', {
 *   method: 'POST',
 *   body: JSON.stringify({ redirectUrl: '...' }),
 * }, {
 *   maxRetries: 5,
 *   initialDelay: 2000,
 * });
 * 
 * // Multi-account operation
 * const data = await fetchWithRetry(
 *   `/api/integrations/disconnect/instagram/${accountId}`,
 *   { method: 'DELETE' }
 * );
 * ```
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  let lastError: FetchError | null = null;
  let delay = finalConfig.initialDelay;
  
  logger.info('Starting fetch with retry', {
    url,
    method: options.method || 'GET',
    correlationId,
    maxRetries: finalConfig.maxRetries,
  });
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = finalConfig.timeout
        ? setTimeout(() => controller.abort(), finalConfig.timeout)
        : null;
      
      // Make fetch request
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          ...options.headers,
        },
      });
      
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Success - parse and return
      if (response.ok) {
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        logger.info('Fetch successful', {
          url,
          correlationId,
          attempt,
          duration,
          statusCode: response.status,
        });
        
        return data;
      }
      
      // Error response - check if retryable
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      
      lastError = new FetchError(
        errorMessage,
        response.status,
        finalConfig.retryableStatusCodes.includes(response.status),
        correlationId,
        attempt
      );
      
      // If not retryable, throw immediately
      if (!lastError.retryable) {
        logger.warn('Non-retryable error', {
          url,
          correlationId,
          attempt,
          statusCode: response.status,
          error: errorMessage,
        });
        throw lastError;
      }
      
      logger.warn('Retryable error, will retry', {
        url,
        correlationId,
        attempt,
        statusCode: response.status,
        error: errorMessage,
        nextDelay: delay,
      });
      
    } catch (error: any) {
      // Handle network errors and timeouts
      if (error instanceof FetchError) {
        lastError = error;
      } else {
        lastError = new FetchError(
          error.message || 'Network error',
          undefined,
          true, // Network errors are retryable
          correlationId,
          attempt
        );
      }
      
      // Check if error is retryable
      if (!isRetryableError(lastError, finalConfig)) {
        logger.error('Non-retryable error', lastError, {
          url,
          correlationId,
          attempt,
        });
        throw lastError;
      }
      
      logger.warn('Network error, will retry', {
        url,
        correlationId,
        attempt,
        error: lastError.message,
        nextDelay: delay,
      });
    }
    
    // Don't wait after last attempt
    if (attempt < finalConfig.maxRetries) {
      await wait(delay);
      delay = calculateDelay(attempt + 1, finalConfig);
    }
  }
  
  // All retries exhausted
  const duration = Date.now() - startTime;
  logger.error('Max retries exceeded', lastError!, {
    url,
    correlationId,
    attempts: finalConfig.maxRetries + 1,
    duration,
  });
  
  throw lastError || new FetchError(
    'Max retries exceeded',
    undefined,
    false,
    correlationId,
    finalConfig.maxRetries
  );
}

/**
 * Fetch with retry for multi-account operations
 * 
 * Specialized version that includes provider and accountId in logs
 * 
 * @param url - URL to fetch
 * @param provider - Provider name (instagram, tiktok, etc.)
 * @param accountId - Account ID
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Parsed JSON response
 */
export async function fetchMultiAccountWithRetry<T = any>(
  url: string,
  provider: string,
  accountId: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const correlationId = crypto.randomUUID();
  
  logger.info('Multi-account operation started', {
    url,
    provider,
    accountId,
    correlationId,
    method: options.method || 'GET',
  });
  
  try {
    const result = await fetchWithRetry<T>(url, options, config);
    
    logger.info('Multi-account operation successful', {
      url,
      provider,
      accountId,
      correlationId,
    });
    
    return result;
  } catch (error: any) {
    logger.error('Multi-account operation failed', error, {
      url,
      provider,
      accountId,
      correlationId,
      retryable: error.retryable,
    });
    
    throw error;
  }
}

/**
 * Batch fetch with retry for multiple accounts
 * 
 * Fetches data for multiple accounts in parallel with retry logic
 * 
 * @param requests - Array of request configurations
 * @param config - Retry configuration
 * @returns Array of results (successful or error)
 */
export async function batchFetchWithRetry<T = any>(
  requests: Array<{
    url: string;
    provider: string;
    accountId: string;
    options?: RequestInit;
  }>,
  config: Partial<RetryConfig> = {}
): Promise<Array<{ success: boolean; data?: T; error?: FetchError }>> {
  const correlationId = crypto.randomUUID();
  
  logger.info('Batch fetch started', {
    count: requests.length,
    correlationId,
  });
  
  const results = await Promise.allSettled(
    requests.map((req) =>
      fetchMultiAccountWithRetry<T>(
        req.url,
        req.provider,
        req.accountId,
        req.options,
        config
      )
    )
  );
  
  const formattedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { success: true, data: result.value };
    } else {
      return {
        success: false,
        error: result.reason instanceof FetchError
          ? result.reason
          : new FetchError(result.reason.message, undefined, false, correlationId),
      };
    }
  });
  
  const successCount = formattedResults.filter((r) => r.success).length;
  
  logger.info('Batch fetch completed', {
    total: requests.length,
    successful: successCount,
    failed: requests.length - successCount,
    correlationId,
  });
  
  return formattedResults;
}
