/**
 * Client-side utilities for User Registration API
 * 
 * Provides type-safe functions for calling the registration API with:
 * - Automatic CSRF token handling
 * - Retry logic with exponential backoff
 * - Timeout protection
 * - Type safety
 * 
 * @see app/api/auth/register/route.ts
 * @see app/api/auth/register/README.md
 */

import type {
  RegisterRequestBody,
  RegisterResponse,
  RegisterSuccessResponse,
  RegisterErrorResponse,
} from './types';

// Configuration
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000; // 1 second

/**
 * Options for registration request
 */
export interface RegisterOptions {
  timeout?: number;
  maxRetries?: number;
  baseDelay?: number;
  signal?: AbortSignal;
}

/**
 * Get CSRF token from API
 */
async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf/token', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get CSRF token');
  }

  const data = await response.json();
  return data.token;
}

/**
 * Register a new user account
 * 
 * @param data - Registration data (email, password, name)
 * @param options - Request options (timeout, retries, etc.)
 * @returns User data if successful
 * @throws Error with user-friendly message if registration fails
 * 
 * @example
 * ```typescript
 * try {
 *   const user = await register({
 *     email: 'john@example.com',
 *     password: 'SecurePass123!',
 *     name: 'John Doe'
 *   });
 *   console.log('User created:', user);
 * } catch (error) {
 *   console.error('Registration failed:', error.message);
 * }
 * ```
 */
export async function register(
  data: RegisterRequestBody,
  options: RegisterOptions = {}
): Promise<RegisterSuccessResponse['data']['user']> {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
    signal,
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get CSRF token
      const csrfToken = await getCsrfToken();

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine signals if provided
      const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;

      try {
        // Make registration request
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(data),
          credentials: 'include',
          signal: combinedSignal,
        });

        clearTimeout(timeoutId);

        const result: RegisterResponse = await response.json();

        // Handle error response
        if (!result.success) {
          const errorResponse = result as RegisterErrorResponse;

          // Check if error is retryable
          if (errorResponse.retryable && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.warn(
              `Registration failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
              errorResponse.error
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // Non-retryable error or max retries reached
          throw new Error(errorResponse.error);
        }

        // Success
        return result.data.user;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Registration timeout (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('Request timed out. Please try again.');
      }

      // Handle network errors
      if (error.message === 'Failed to fetch' || error.message.includes('network')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Network error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('Network error. Please check your connection and try again.');
      }

      // Re-throw other errors
      if (attempt === maxRetries) {
        throw error;
      }

      // Retry on unexpected errors
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `Unexpected error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Registration failed after all retries');
}

/**
 * Register a new user account (raw response)
 * 
 * Returns the full API response instead of just the user data.
 * Useful when you need access to duration, correlation ID, etc.
 * 
 * @param data - Registration data (email, password, name)
 * @param options - Request options (timeout, retries, etc.)
 * @returns Full API response
 * 
 * @example
 * ```typescript
 * const response = await registerRaw({
 *   email: 'john@example.com',
 *   password: 'SecurePass123!'
 * });
 * 
 * if (response.success) {
 *   console.log('User:', response.data.user);
 *   console.log('Duration:', response.duration);
 * } else {
 *   console.error('Error:', response.error);
 *   console.error('Code:', response.code);
 * }
 * ```
 */
export async function registerRaw(
  data: RegisterRequestBody,
  options: RegisterOptions = {}
): Promise<RegisterResponse> {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
    signal,
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get CSRF token
      const csrfToken = await getCsrfToken();

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine signals if provided
      const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;

      try {
        // Make registration request
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(data),
          credentials: 'include',
          signal: combinedSignal,
        });

        clearTimeout(timeoutId);

        const result: RegisterResponse = await response.json();

        // Check if error is retryable
        if (!result.success && result.retryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Registration failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
            result.error
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Registration timeout (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          success: false,
          error: 'Request timed out. Please try again.',
          code: 'TIMEOUT_ERROR',
          correlationId: 'client-timeout',
          retryable: true,
        };
      }

      // Handle network errors
      if (error.message === 'Failed to fetch' || error.message.includes('network')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Network error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
          code: 'NETWORK_ERROR',
          correlationId: 'client-network-error',
          retryable: true,
        };
      }

      // Re-throw other errors on last attempt
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred',
          code: 'CLIENT_ERROR',
          correlationId: 'client-error',
          retryable: false,
        };
      }

      // Retry on unexpected errors
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `Unexpected error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    success: false,
    error: 'Registration failed after all retries',
    code: 'MAX_RETRIES_EXCEEDED',
    correlationId: 'client-max-retries',
    retryable: false,
  };
}

/**
 * Validate email format (client-side)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (client-side)
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
