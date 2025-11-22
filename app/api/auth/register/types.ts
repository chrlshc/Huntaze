/**
 * Type definitions for User Registration API
 * 
 * @see app/api/auth/register/route.ts
 * @see app/api/auth/register/README.md
 */

/**
 * Registration request body
 */
export interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
}

/**
 * User data returned in response
 */
export interface UserData {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Success response structure
 */
export interface RegisterSuccessResponse {
  success: true;
  data: {
    user: UserData;
  };
  message: string;
  duration: number;
}

/**
 * Error response structure
 */
export interface RegisterErrorResponse {
  success: false;
  error: string;
  code: string;
  correlationId: string;
  retryable?: boolean;
}

/**
 * Response type (union)
 */
export type RegisterResponse = RegisterSuccessResponse | RegisterErrorResponse;

/**
 * Error codes
 */
export enum RegisterErrorCode {
  CSRF_ERROR = 'CSRF_ERROR',
  INVALID_BODY = 'INVALID_BODY',
  MISSING_EMAIL = 'MISSING_EMAIL',
  MISSING_PASSWORD = 'MISSING_PASSWORD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  USER_EXISTS = 'USER_EXISTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  HASH_ERROR = 'HASH_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Type guard to check if response is successful
 */
export function isRegisterSuccess(
  response: RegisterResponse
): response is RegisterSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isRegisterError(
  response: RegisterResponse
): response is RegisterErrorResponse {
  return response.success === false;
}
