/**
 * AI Test API Client
 * 
 * Type-safe client for the AI test endpoint with automatic retry logic.
 * 
 * @example
 * ```typescript
 * import { testAIGeneration } from '@/app/api/ai/test/client';
 * 
 * const result = await testAIGeneration({
 *   creatorId: 'creator_123',
 *   prompt: 'Write a greeting message',
 * });
 * 
 * if (result.success) {
 *   console.log('Generated text:', result.data.text);
 *   console.log('Cost:', result.data.usage.costUsd);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */

import type { AITestRequest, AITestResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * Retry configuration
 */
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
  
  // 429 (rate limit) is retryable after delay
  if (status === 429) {
    return true;
  }
  
  // Timeout errors are retryable
  if (errorCode === 'TIMEOUT_ERROR') {
    return true;
  }
  
  return false;
}

/**
 * Test AI text generation
 * 
 * @param request - Request parameters
 * @param options - Fetch options
 * @returns AI test response
 * 
 * @throws Error if all retries fail
 */
export async function testAIGeneration(
  request: AITestRequest,
  options?: RequestInit
): Promise<AITestResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/api/ai/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000), // 30 second timeout
        ...options,
      });

      const data: AITestResponse = await response.json();

      // If request succeeded, return data
      if (response.ok) {
        return data;
      }

      // If error is not retryable, return error response
      if (!isRetryableError(response.status, data.success === false ? data.error.code : undefined)) {
        return data;
      }

      // If this is the last attempt, return error response
      if (attempt === RETRY_CONFIG.maxRetries) {
        return data;
      }

      // Calculate delay for retry
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
        RETRY_CONFIG.maxDelay
      );

      // Get Retry-After header if present
      const retryAfter = response.headers.get('Retry-After');
      const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;

      console.warn(`AI test request failed (attempt ${attempt}/${RETRY_CONFIG.maxRetries}), retrying in ${retryDelay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));

    } catch (error) {
      lastError = error as Error;

      // If this is the last attempt, throw error
      if (attempt === RETRY_CONFIG.maxRetries) {
        throw new Error(`AI test request failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`);
      }

      // Calculate delay for retry
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
        RETRY_CONFIG.maxDelay
      );

      console.warn(`AI test request error (attempt ${attempt}/${RETRY_CONFIG.maxRetries}), retrying in ${delay}ms...`, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error(`AI test request failed: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Test AI generation with custom retry configuration
 * 
 * @param request - Request parameters
 * @param maxRetries - Maximum number of retries
 * @param options - Fetch options
 * @returns AI test response
 */
export async function testAIGenerationWithRetry(
  request: AITestRequest,
  maxRetries: number = 3,
  options?: RequestInit
): Promise<AITestResponse> {
  const originalMaxRetries = RETRY_CONFIG.maxRetries;
  RETRY_CONFIG.maxRetries = maxRetries;
  
  try {
    return await testAIGeneration(request, options);
  } finally {
    RETRY_CONFIG.maxRetries = originalMaxRetries;
  }
}
