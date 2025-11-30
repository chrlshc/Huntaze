/**
 * CSRF Token API Types
 * 
 * TypeScript type definitions for the CSRF token API endpoint.
 * Provides type safety for client-side integration.
 * 
 * @module app/api/csrf/token/types
 */

import type { ApiResponse } from '@/lib/api/utils/response';

// ============================================================================
// Request Types
// ============================================================================

/**
 * CSRF token request options
 */
export interface CsrfTokenRequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * CSRF token data structure
 */
export interface CsrfTokenData {
  /** CSRF token string */
  token: string;
  /** Token expiration time in milliseconds */
  expiresIn: number;
}

/**
 * Successful CSRF token response
 */
export type CsrfTokenSuccessResponse = ApiResponse<CsrfTokenData>;

/**
 * CSRF token error response
 */
export interface CsrfTokenErrorResponse {
  success: false;
  error: {
    code: 'UNAUTHORIZED' | 'INTERNAL_ERROR' | 'SESSION_ERROR';
    message: string;
    retryable: boolean;
    retryAfter?: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
    duration?: number;
  };
}

/**
 * Union type for all possible CSRF token responses
 */
export type CsrfTokenResponse = CsrfTokenSuccessResponse | CsrfTokenErrorResponse;

// ============================================================================
// Client Types
// ============================================================================

/**
 * CSRF token state for React hooks
 */
export interface CsrfTokenState {
  /** Current CSRF token */
  token: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Token expiration timestamp */
  expiresAt: number | null;
  /** Refresh token function */
  refresh: () => Promise<void>;
}

/**
 * CSRF token fetch result
 */
export interface CsrfTokenFetchResult {
  /** Fetched token */
  token: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** Request duration in milliseconds */
  duration: number;
}

/**
 * CSRF token validation result
 */
export interface CsrfTokenValidation {
  /** Whether token is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * CSRF token error codes
 */
export enum CsrfTokenErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SESSION_ERROR = 'SESSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

/**
 * CSRF token error class
 */
export class CsrfTokenError extends Error {
  constructor(
    public code: CsrfTokenErrorCode,
    message: string,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'CsrfTokenError';
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for successful CSRF token response
 */
export function isCsrfTokenSuccess(
  response: CsrfTokenResponse
): response is CsrfTokenSuccessResponse {
  return response.success === true && 'data' in response;
}

/**
 * Type guard for CSRF token error response
 */
export function isCsrfTokenError(
  response: CsrfTokenResponse
): response is CsrfTokenErrorResponse {
  return response.success === false && 'error' in response;
}

/**
 * Type guard for retryable error
 */
export function isRetryableError(
  response: CsrfTokenErrorResponse
): boolean {
  return response.error.retryable === true;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract token from response
 */
export type ExtractToken<T> = T extends CsrfTokenSuccessResponse
  ? CsrfTokenData['token']
  : never;

/**
 * Extract error from response
 */
export type ExtractError<T> = T extends CsrfTokenErrorResponse
  ? T['error']
  : never;
