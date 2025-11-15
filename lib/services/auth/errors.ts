/**
 * Auth Service - Structured Error Handling
 * 
 * Provides user-friendly error messages and retry logic
 */

import { AuthError, AuthErrorType } from './types';

/**
 * Create structured Auth error
 */
export function createAuthError(
  type: AuthErrorType,
  message: string,
  correlationId: string,
  retryable: boolean = false,
  statusCode?: number
): AuthError {
  const error = new Error(message) as AuthError;
  error.type = type;
  error.correlationId = correlationId;
  error.userMessage = getUserMessage(type, message);
  error.retryable = retryable;
  error.statusCode = statusCode;
  error.timestamp = new Date();
  return error;
}

/**
 * Get user-friendly error message
 */
function getUserMessage(type: AuthErrorType, technicalMessage: string): string {
  switch (type) {
    case AuthErrorType.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    
    case AuthErrorType.INVALID_EMAIL:
      return 'Please enter a valid email address.';
    
    case AuthErrorType.INVALID_PASSWORD:
      return 'Password must be at least 8 characters long.';
    
    case AuthErrorType.MISSING_FIELDS:
      return 'Please fill in all required fields.';
    
    case AuthErrorType.USER_EXISTS:
      return 'An account with this email already exists.';
    
    case AuthErrorType.USER_NOT_FOUND:
      return 'No account found with this email.';
    
    case AuthErrorType.INVALID_CREDENTIALS:
      return 'Invalid email or password.';
    
    case AuthErrorType.TOKEN_EXPIRED:
      return 'Your session has expired. Please log in again.';
    
    case AuthErrorType.INVALID_TOKEN:
      return 'Invalid authentication token. Please log in again.';
    
    case AuthErrorType.DATABASE_ERROR:
      return 'A database error occurred. Please try again.';
    
    case AuthErrorType.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection.';
    
    case AuthErrorType.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.';
    
    case AuthErrorType.INTERNAL_ERROR:
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Check if error is retryable
 */
export function isRetryable(errorType: AuthErrorType): boolean {
  return [
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.TIMEOUT_ERROR,
    AuthErrorType.DATABASE_ERROR,
  ].includes(errorType);
}

/**
 * Map database error to auth error type
 */
export function mapDatabaseError(error: any): AuthErrorType {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Unique constraint violation
  if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
    return AuthErrorType.USER_EXISTS;
  }
  
  // Connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('econnrefused')) {
    return AuthErrorType.NETWORK_ERROR;
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout')) {
    return AuthErrorType.TIMEOUT_ERROR;
  }
  
  return AuthErrorType.DATABASE_ERROR;
}
