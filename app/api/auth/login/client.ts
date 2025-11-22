/**
 * Login API Client
 * 
 * Type-safe client for the login API endpoint with automatic retry logic,
 * error handling, and structured responses.
 * 
 * @example
 * ```typescript
 * import { loginUser, LoginError } from '@/app/api/auth/login/client';
 * 
 * try {
 *   const result = await loginUser('user@example.com', 'password123');
 *   console.log('Logged in:', result.user);
 * } catch (error) {
 *   if (error instanceof LoginError) {
 *     console.error('Login failed:', error.message, error.type);
 *   }
 * }
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

/**
 * Login request data
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User data returned on successful login
 */
export interface LoginUser {
  id: number;
  email: string;
  name: string | null;
}

/**
 * Login success response
 */
export interface LoginSuccessResponse {
  success: true;
  message: string;
  user: LoginUser;
}

/**
 * Login error types
 */
export type LoginErrorType =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

/**
 * Login error response from API
 */
export interface LoginErrorResponse {
  error: string;
  type: LoginErrorType;
  correlationId: string;
  retryable?: boolean;
}

/**
 * Login error class for structured error handling
 */
export class LoginError extends Error {
  constructor(
    message: string,
    public type: LoginErrorType,
    public correlationId: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LoginError';
  }
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const LoginSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    name: z.string().nullable(),
  }),
});

const LoginErrorResponseSchema = z.object({
  error: z.string(),
  type: z.enum([
    'VALIDATION_ERROR',
    'INVALID_CREDENTIALS',
    'EMAIL_NOT_VERIFIED',
    'INTERNAL_ERROR',
    'DATABASE_ERROR',
  ]),
  correlationId: z.string(),
  retryable: z.boolean().optional(),
});

// ============================================================================
// Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  backoffFactor: 2,
  timeout: 10000, // 10 seconds
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  // API indicated retryable
  if (error instanceof LoginError && error.retryable) {
    return true;
  }

  return false;
}

// ============================================================================
// Main API Functions
// ============================================================================

/**
 * Login user with email and password
 * 
 * Automatically retries on transient failures with exponential backoff.
 * 
 * @param email - User email address
 * @param password - User password
 * @param options - Optional configuration
 * @returns Login success response with user data
 * @throws {LoginError} On authentication failure or error
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await loginUser('user@example.com', 'password123');
 *   console.log('User ID:', result.user.id);
 *   console.log('Email:', result.user.email);
 *   console.log('Name:', result.user.name);
 * } catch (error) {
 *   if (error instanceof LoginError) {
 *     switch (error.type) {
 *       case 'INVALID_CREDENTIALS':
 *         console.error('Invalid email or password');
 *         break;
 *       case 'EMAIL_NOT_VERIFIED':
 *         console.error('Please verify your email');
 *         break;
 *       case 'NETWORK_ERROR':
 *         console.error('Network error, please try again');
 *         break;
 *       default:
 *         console.error('Login failed:', error.message);
 *     }
 *   }
 * }
 * ```
 */
export async function loginUser(
  email: string,
  password: string,
  options: {
    maxRetries?: number;
    timeout?: number;
    baseUrl?: string;
  } = {}
): Promise<LoginSuccessResponse> {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    timeout = RETRY_CONFIG.timeout,
    baseUrl = '',
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
          credentials: 'include', // Include cookies
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        // Handle error responses
        if (!response.ok) {
          const errorResult = LoginErrorResponseSchema.safeParse(data);

          if (errorResult.success) {
            const errorData = errorResult.data;
            throw new LoginError(
              errorData.error,
              errorData.type,
              errorData.correlationId,
              errorData.retryable ?? false
            );
          }

          // Fallback for unexpected error format
          throw new LoginError(
            data.error || 'Login failed',
            'INTERNAL_ERROR',
            data.correlationId || 'unknown',
            response.status >= 500
          );
        }

        // Validate success response
        const successResult = LoginSuccessResponseSchema.safeParse(data);

        if (!successResult.success) {
          throw new LoginError(
            'Invalid response format from server',
            'INTERNAL_ERROR',
            'validation-error',
            false
          );
        }

        return successResult.data;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      lastError = error;

      // Handle timeout
      if (error.name === 'AbortError') {
        const timeoutError = new LoginError(
          'Request timeout. Please try again.',
          'TIMEOUT_ERROR',
          `timeout-${Date.now()}`,
          true
        );
        lastError = timeoutError;

        if (attempt < maxRetries) {
          const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
            RETRY_CONFIG.maxDelay
          );
          await sleep(delay);
          continue;
        }

        throw timeoutError;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new LoginError(
          'Network error. Please check your connection.',
          'NETWORK_ERROR',
          `network-${Date.now()}`,
          true
        );
        lastError = networkError;

        if (attempt < maxRetries) {
          const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
            RETRY_CONFIG.maxDelay
          );
          await sleep(delay);
          continue;
        }

        throw networkError;
      }

      // Check if error is retryable
      if (isRetryableError(error) && attempt < maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
          RETRY_CONFIG.maxDelay
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new LoginError(
    'Login failed after maximum retries',
    'INTERNAL_ERROR',
    'max-retries',
    false
  );
}

/**
 * Check if user can login (without actually logging in)
 * Useful for pre-validation before showing login form
 * 
 * @param email - User email address
 * @returns True if user exists and can login
 * 
 * @example
 * ```typescript
 * const canLogin = await checkLoginAvailable('user@example.com');
 * if (!canLogin) {
 *   console.log('User not found or cannot login');
 * }
 * ```
 */
export async function checkLoginAvailable(email: string): Promise<boolean> {
  try {
    // Attempt login with empty password to check user existence
    // This will fail but give us information about the user
    await loginUser(email, '');
    return true;
  } catch (error) {
    if (error instanceof LoginError) {
      // User exists but password is wrong
      if (error.type === 'INVALID_CREDENTIALS') {
        return true;
      }
      // User doesn't exist or other error
      return false;
    }
    return false;
  }
}

/**
 * Login with automatic redirect on success
 * 
 * @param email - User email address
 * @param password - User password
 * @param redirectUrl - URL to redirect to on success (default: '/home')
 * @returns Never returns on success (redirects), throws on error
 * 
 * @example
 * ```typescript
 * try {
 *   await loginAndRedirect('user@example.com', 'password123', '/dashboard');
 * } catch (error) {
 *   console.error('Login failed:', error);
 * }
 * ```
 */
export async function loginAndRedirect(
  email: string,
  password: string,
  redirectUrl: string = '/home'
): Promise<never> {
  const result = await loginUser(email, password);

  // Redirect on success
  if (typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }

  // This will never execute due to redirect, but TypeScript needs it
  return undefined as never;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get user-friendly error message for login error type
 * 
 * @param type - Login error type
 * @returns User-friendly error message
 * 
 * @example
 * ```typescript
 * const message = getErrorMessage('INVALID_CREDENTIALS');
 * console.log(message); // "Invalid email or password"
 * ```
 */
export function getErrorMessage(type: LoginErrorType): string {
  const messages: Record<LoginErrorType, string> = {
    VALIDATION_ERROR: 'Please check your email and password',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
    INTERNAL_ERROR: 'An error occurred. Please try again.',
    DATABASE_ERROR: 'Service temporarily unavailable. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT_ERROR: 'Request timeout. Please try again.',
  };

  return messages[type] || 'An unexpected error occurred';
}

/**
 * Check if error type is retryable
 * 
 * @param type - Login error type
 * @returns True if error is retryable
 * 
 * @example
 * ```typescript
 * if (isErrorRetryable('NETWORK_ERROR')) {
 *   console.log('You can retry this operation');
 * }
 * ```
 */
export function isErrorRetryable(type: LoginErrorType): boolean {
  const retryableTypes: LoginErrorType[] = [
    'INTERNAL_ERROR',
    'DATABASE_ERROR',
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
  ];

  return retryableTypes.includes(type);
}
