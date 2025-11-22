/**
 * Logout API Client
 * 
 * Client-side utility for calling the logout endpoint with automatic retry logic.
 * 
 * Requirements: 3.1, 3.2, 16.5
 * 
 * @example
 * ```typescript
 * import { logoutUser } from '@/app/api/auth/logout/client';
 * 
 * const result = await logoutUser(csrfToken);
 * if (result.success) {
 *   console.log('Logged out successfully');
 *   router.push('/auth');
 * }
 * ```
 */

import type { LogoutResponse } from './types';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
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
  
  // Specific error codes that are retryable
  if (errorCode === 'INTERNAL_ERROR') {
    return true;
  }
  
  return false;
}

/**
 * Logout user with automatic retry logic
 * 
 * @param csrfToken - CSRF token for request validation
 * @param config - Optional retry configuration
 * @returns Logout response
 * 
 * @throws Error if all retries fail
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await logoutUser(csrfToken);
 *   if (result.success) {
 *     // Redirect to login page
 *     window.location.href = '/auth';
 *   }
 * } catch (error) {
 *   console.error('Logout failed:', error);
 * }
 * ```
 */
export async function logoutUser(
  csrfToken: string,
  config: Partial<RetryConfig> = {}
): Promise<LogoutResponse> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      const data: LogoutResponse = await response.json();
      
      // If request succeeded, return data
      if (response.ok) {
        return data;
      }
      
      // Check if error is retryable
      const retryable = isRetryableError(
        response.status,
        data.success === false ? data.code : undefined
      );
      
      if (!retryable || attempt >= retryConfig.maxRetries) {
        return data;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
        retryConfig.maxDelay
      );
      
      console.warn(`Logout attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      // Network error or timeout
      if (attempt >= retryConfig.maxRetries) {
        throw new Error(`Logout failed after ${retryConfig.maxRetries} attempts: ${error}`);
      }
      
      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
        retryConfig.maxDelay
      );
      
      console.warn(`Logout attempt ${attempt} failed with network error, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Logout failed after all retry attempts');
}

/**
 * Logout user without retry (for cases where immediate failure is acceptable)
 * 
 * @param csrfToken - CSRF token for request validation
 * @returns Logout response
 * 
 * @example
 * ```typescript
 * const result = await logoutUserNoRetry(csrfToken);
 * if (!result.success) {
 *   console.error('Logout failed:', result.error);
 * }
 * ```
 */
export async function logoutUserNoRetry(csrfToken: string): Promise<LogoutResponse> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    signal: AbortSignal.timeout(10000),
  });
  
  return await response.json();
}
