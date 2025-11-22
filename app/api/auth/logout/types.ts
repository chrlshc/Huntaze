/**
 * Logout API Types
 * 
 * Type definitions for the logout endpoint.
 * 
 * Requirements: 3.1, 3.2, 16.5
 */

/**
 * Logout success response
 */
export interface LogoutSuccessResponse {
  success: true;
  message: string;
}

/**
 * Logout error response
 */
export interface LogoutErrorResponse {
  success: false;
  error: string;
  code: 'UNAUTHORIZED' | 'CSRF_ERROR' | 'INTERNAL_ERROR';
  correlationId: string;
  retryable?: boolean;
}

/**
 * Logout response (union type)
 */
export type LogoutResponse = LogoutSuccessResponse | LogoutErrorResponse;

/**
 * Logout error codes
 */
export enum LogoutErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  CSRF_ERROR = 'CSRF_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
