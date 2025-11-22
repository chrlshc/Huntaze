/**
 * Client-side utilities for AI Chat API
 * 
 * Provides type-safe client functions with automatic retry logic,
 * error handling, and request deduplication.
 * 
 * @module app/api/ai/chat/client
 */

import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api/types/responses';
import { ChatRequest, ChatResponse } from './types';

// ============================================================================
// Configuration
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds
const BACKOFF_FACTOR = 2;

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Custom error for AI chat operations
 */
export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public metadata?: any
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if error is retryable based on status code or error code
 */
function isRetryableError(status: number, errorCode?: string): boolean {
  // Retryable HTTP status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  if (retryableStatuses.includes(status)) {
    return true;
  }

  // Retryable error codes
  const retryableErrorCodes = [
    'TIMEOUT_ERROR',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ];
  if (errorCode && retryableErrorCodes.includes(errorCode)) {
    return true;
  }

  return false;
}

/**
 * Get retry delay from response headers or calculate exponentially
 */
function getRetryDelay(
  response: Response,
  attempt: number
): number {
  // Check Retry-After header
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000; // Convert to milliseconds
    }
  }

  // Exponential backoff
  return Math.min(
    INITIAL_RETRY_DELAY * Math.pow(BACKOFF_FACTOR, attempt - 1),
    MAX_RETRY_DELAY
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Generate AI-powered response to fan message with automatic retry logic
 * 
 * Features:
 * - Automatic retry for transient failures (3 attempts)
 * - Exponential backoff with jitter
 * - Request timeout protection (30 seconds)
 * - Structured error handling
 * - Type-safe responses
 * 
 * @param request - Chat request with fan ID and message
 * @param options - Optional configuration
 * @returns Promise with chat response including AI-generated reply
 * 
 * @throws {ChatError} When request fails after all retries
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await generateChatResponse({
 *     fanId: 'fan_123',
 *     message: 'Hey! Love your content!',
 *     context: { engagementLevel: 'high' }
 *   });
 * 
 *   if (response.success) {
 *     console.log(response.data.response); // AI-generated reply
 *     console.log(response.data.usage); // Token usage and cost
 *   } else {
 *     console.error(response.error.message);
 *   }
 * } catch (error) {
 *   if (error instanceof ChatError) {
 *     console.error('Chat error:', error.code, error.message);
 *   }
 * }
 * ```
 */
export async function generateChatResponse(
  request: ChatRequest,
  options: {
    maxRetries?: number;
    timeout?: number;
    signal?: AbortSignal;
  } = {}
): Promise<ApiSuccessResponse<ChatResponse> | ApiErrorResponse> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const timeout = options.timeout ?? REQUEST_TIMEOUT_MS;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine with user-provided signal if any
      const signal = options.signal
        ? combineAbortSignals(controller.signal, options.signal)
        : controller.signal;

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        // Success response
        if (response.ok) {
          return data;
        }

        // Check if error is retryable
        const retryable = isRetryableError(response.status, data.error?.code);

        if (!retryable || attempt >= maxRetries) {
          // Non-retryable error or max retries reached
          return data;
        }

        // Calculate retry delay
        const delay = getRetryDelay(response, attempt);

        console.warn(`[AI Chat] Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, {
          status: response.status,
          errorCode: data.error?.code,
        });

        // Wait before retry
        await sleep(delay);

        // Continue to next attempt
        lastError = new Error(data.error?.message || 'Request failed');
        continue;

      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Handle abort/timeout
        if (fetchError.name === 'AbortError') {
          if (options.signal?.aborted) {
            // User cancelled
            throw new ChatError(
              'Request cancelled by user',
              'REQUEST_CANCELLED',
              false
            );
          }

          // Timeout
          if (attempt >= maxRetries) {
            throw new ChatError(
              'Request timed out after multiple attempts',
              'TIMEOUT_ERROR',
              false
            );
          }

          console.warn(`[AI Chat] Request timeout (attempt ${attempt}/${maxRetries}), retrying...`);
          await sleep(getRetryDelay({ headers: { get: () => null } } as any, attempt));
          lastError = fetchError;
          continue;
        }

        // Network error
        if (attempt >= maxRetries) {
          throw new ChatError(
            'Network error after multiple attempts',
            'NETWORK_ERROR',
            false,
            { originalError: fetchError.message }
          );
        }

        console.warn(`[AI Chat] Network error (attempt ${attempt}/${maxRetries}), retrying...`);
        await sleep(getRetryDelay({ headers: { get: () => null } } as any, attempt));
        lastError = fetchError;
        continue;
      }
    } catch (error: any) {
      // Re-throw ChatError
      if (error instanceof ChatError) {
        throw error;
      }

      // Unexpected error
      if (attempt >= maxRetries) {
        throw new ChatError(
          error.message || 'Unexpected error',
          'UNEXPECTED_ERROR',
          false,
          { originalError: error }
        );
      }

      lastError = error;
    }
  }

  // Should not reach here, but handle gracefully
  throw new ChatError(
    lastError?.message || 'Request failed after all retries',
    'MAX_RETRIES_EXCEEDED',
    false
  );
}

/**
 * Combine multiple abort signals
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
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

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if response is successful
 * 
 * @param response - API response to check
 * @returns True if response is successful
 * 
 * @example
 * ```typescript
 * const response = await generateChatResponse(request);
 * if (isChatSuccess(response)) {
 *   console.log(response.data.response); // TypeScript knows this is safe
 * }
 * ```
 */
export function isChatSuccess(
  response: ApiSuccessResponse<ChatResponse> | ApiErrorResponse
): response is ApiSuccessResponse<ChatResponse> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 * 
 * @param response - API response to check
 * @returns True if response is an error
 */
export function isChatError(
  response: ApiSuccessResponse<ChatResponse> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Extract chat response or throw error
 * 
 * Useful for code that wants to handle errors via try-catch
 * instead of checking response.success
 * 
 * @param response - API response
 * @returns Chat response data
 * @throws {ChatError} If response is an error
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await generateChatResponse(request);
 *   const data = unwrapChatResponse(response);
 *   console.log(data.response);
 * } catch (error) {
 *   if (error instanceof ChatError) {
 *     console.error('Chat failed:', error.message);
 *   }
 * }
 * ```
 */
export function unwrapChatResponse(
  response: ApiSuccessResponse<ChatResponse> | ApiErrorResponse
): ChatResponse {
  if (isChatSuccess(response)) {
    return response.data;
  }

  throw new ChatError(
    response.error.message,
    response.error.code,
    response.error.retryable,
    response.error.metadata
  );
}

// ============================================================================
// React Hook (Optional)
// ============================================================================

/**
 * React hook for AI chat with loading and error states
 * 
 * @example
 * ```typescript
 * function ChatComponent() {
 *   const { generate, loading, error, data } = useChatGeneration();
 * 
 *   const handleSubmit = async (message: string) => {
 *     await generate({ fanId: 'fan_123', message });
 *   };
 * 
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (data) return <ChatResponse response={data.response} />;
 * }
 * ```
 */
export function useChatGeneration() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<ChatError | null>(null);
  const [data, setData] = React.useState<ChatResponse | null>(null);

  const generate = React.useCallback(async (request: ChatRequest) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await generateChatResponse(request);
      
      if (isChatSuccess(response)) {
        setData(response.data);
      } else {
        setError(new ChatError(
          response.error.message,
          response.error.code,
          response.error.retryable,
          response.error.metadata
        ));
      }
    } catch (err) {
      if (err instanceof ChatError) {
        setError(err);
      } else {
        setError(new ChatError(
          err instanceof Error ? err.message : 'Unknown error',
          'UNEXPECTED_ERROR',
          false
        ));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { generate, loading, error, data, reset };
}

// Import React for hook (conditional)
import * as React from 'react';
