/**
 * Login API Types
 * 
 * Shared TypeScript types for the login API endpoint.
 * These types are used by both the server-side route handler and client-side code.
 */

/**
 * Login request body
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
  | 'DATABASE_ERROR';

/**
 * Login error response
 */
export interface LoginErrorResponse {
  error: string;
  type: LoginErrorType;
  correlationId: string;
  retryable?: boolean;
}

/**
 * Login response (union type)
 */
export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

/**
 * Type guard to check if response is success
 */
export function isLoginSuccess(
  response: LoginResponse
): response is LoginSuccessResponse {
  return 'success' in response && response.success === true;
}

/**
 * Type guard to check if response is error
 */
export function isLoginError(
  response: LoginResponse
): response is LoginErrorResponse {
  return 'error' in response;
}
