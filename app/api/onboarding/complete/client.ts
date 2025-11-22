/**
 * Onboarding Complete API Client
 * 
 * Type-safe client for completing user onboarding with automatic retry logic.
 * 
 * Requirements: 5.4, 5.6, 5.9
 * 
 * @example
 * ```typescript
 * import { completeOnboarding } from '@/app/api/onboarding/complete/client';
 * 
 * const result = await completeOnboarding({
 *   contentTypes: ['photos', 'videos'],
 *   goal: 'increase-revenue',
 *   revenueGoal: 5000,
 * });
 * 
 * if (result.success) {
 *   console.log('Onboarding completed:', result.data.user);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */

import type {
  OnboardingCompleteRequest,
  OnboardingCompleteResponse,
  OnboardingCompleteError,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_ENDPOINT = '/api/onboarding/complete';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Check if error is retryable
 */
function isRetryableError(error: OnboardingCompleteError): boolean {
  return error.retryable === true;
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), 10000);
}

// ============================================================================
// API Client
// ============================================================================

/**
 * Complete user onboarding with retry logic
 * 
 * @param data - Onboarding data (contentTypes, goal, revenueGoal, platform)
 * @param csrfToken - CSRF token for request validation
 * @returns Promise with success or error response
 * 
 * @throws Never throws - always returns a response object
 */
export async function completeOnboarding(
  data: OnboardingCompleteRequest,
  csrfToken?: string
): Promise<OnboardingCompleteResponse> {
  let lastError: OnboardingCompleteError | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
        credentials: 'include', // Include cookies for session
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      // Success response
      if (response.ok && result.success) {
        return {
          success: true,
          data: result,
        };
      }

      // Error response
      const error: OnboardingCompleteError = {
        error: result.error || 'Unknown error',
        correlationId: result.correlationId || 'unknown',
        retryable: result.retryable ?? false,
        statusCode: result.statusCode || response.status,
      };

      // Check if we should retry
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        lastError = error;
        const delay = getRetryDelay(attempt);
        
        console.warn(`Onboarding completion failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`, {
          correlationId: error.correlationId,
          statusCode: error.statusCode,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error or max retries reached
      return {
        success: false,
        error,
      };

    } catch (fetchError: any) {
      // Network error or timeout
      const error: OnboardingCompleteError = {
        error: fetchError.name === 'AbortError' 
          ? 'Request timeout. Please try again.'
          : 'Network error. Please check your connection.',
        correlationId: 'client-error',
        retryable: true,
        statusCode: 0,
      };

      if (attempt < MAX_RETRIES) {
        lastError = error;
        const delay = getRetryDelay(attempt);
        
        console.warn(`Network error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`, {
          error: fetchError.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return {
        success: false,
        error,
      };
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    success: false,
    error: lastError || {
      error: 'Unknown error after retries',
      correlationId: 'unknown',
      retryable: false,
      statusCode: 500,
    },
  };
}

/**
 * Complete onboarding without retry logic (for testing)
 * 
 * @param data - Onboarding data
 * @param csrfToken - CSRF token
 * @returns Promise with response
 */
export async function completeOnboardingNoRetry(
  data: OnboardingCompleteRequest,
  csrfToken?: string
): Promise<OnboardingCompleteResponse> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result,
      };
    }

    return {
      success: false,
      error: {
        error: result.error || 'Unknown error',
        correlationId: result.correlationId || 'unknown',
        retryable: result.retryable ?? false,
        statusCode: result.statusCode || response.status,
      },
    };

  } catch (error: any) {
    return {
      success: false,
      error: {
        error: error.message || 'Network error',
        correlationId: 'client-error',
        retryable: true,
        statusCode: 0,
      },
    };
  }
}
