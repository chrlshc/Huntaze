/**
 * Authentication Error Handling
 * 
 * Centralized error handling for authentication flows
 */

import { AuthError, AuthErrorResponse } from './types';

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<AuthError, string> = {
  [AuthError.CONFIGURATION]: 'Authentication service is misconfigured. Please contact support.',
  [AuthError.ACCESS_DENIED]: 'Access denied. You do not have permission to sign in.',
  [AuthError.VERIFICATION]: 'Email verification required. Please check your inbox.',
  [AuthError.OAUTH_ACCOUNT_NOT_LINKED]: 'This account is not linked. Please sign in with your original method.',
  [AuthError.OAUTH_CALLBACK]: 'OAuth callback failed. Please try again.',
  [AuthError.OAUTH_CREATE_ACCOUNT]: 'Failed to create account with OAuth provider.',
  [AuthError.EMAIL_CREATE_ACCOUNT]: 'Failed to create account with email.',
  [AuthError.CALLBACK]: 'Authentication callback failed. Please try again.',
  [AuthError.OAUTH_SIGNIN]: 'OAuth sign in failed. Please try again.',
  [AuthError.EMAIL_SIGNIN]: 'Email sign in failed. Please check your credentials.',
  [AuthError.CREDENTIALS_SIGNIN]: 'Invalid email or password.',
  [AuthError.SESSION_REQUIRED]: 'You must be signed in to access this resource.',
  [AuthError.JWT_ERROR]: 'Session token error. Please sign in again.',
};

// ============================================================================
// Error Classification
// ============================================================================

const RETRYABLE_ERRORS: AuthError[] = [
  AuthError.OAUTH_CALLBACK,
  AuthError.CALLBACK,
  AuthError.OAUTH_SIGNIN,
  AuthError.JWT_ERROR,
];

const USER_ERRORS: AuthError[] = [
  AuthError.CREDENTIALS_SIGNIN,
  AuthError.ACCESS_DENIED,
  AuthError.VERIFICATION,
  AuthError.OAUTH_ACCOUNT_NOT_LINKED,
];

const SYSTEM_ERRORS: AuthError[] = [
  AuthError.CONFIGURATION,
  AuthError.OAUTH_CREATE_ACCOUNT,
  AuthError.EMAIL_CREATE_ACCOUNT,
];

// ============================================================================
// Error Handling Functions
// ============================================================================

/**
 * Create standardized auth error response
 */
export function createAuthError(
  error: AuthError,
  correlationId?: string
): AuthErrorResponse {
  return {
    error,
    message: ERROR_MESSAGES[error] || 'An authentication error occurred.',
    correlationId,
    retryable: RETRYABLE_ERRORS.includes(error),
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AuthError): boolean {
  return RETRYABLE_ERRORS.includes(error);
}

/**
 * Check if error is user-caused
 */
export function isUserError(error: AuthError): boolean {
  return USER_ERRORS.includes(error);
}

/**
 * Check if error is system-caused
 */
export function isSystemError(error: AuthError): boolean {
  return SYSTEM_ERRORS.includes(error);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: AuthError | string): string {
  if (typeof error === 'string') {
    // Try to match string to AuthError enum
    const authError = Object.values(AuthError).find(
      (e) => e.toLowerCase() === error.toLowerCase()
    );
    if (authError) {
      return ERROR_MESSAGES[authError as AuthError];
    }
    return 'An authentication error occurred.';
  }
  return ERROR_MESSAGES[error] || 'An authentication error occurred.';
}

/**
 * Parse NextAuth error from URL
 */
export function parseAuthErrorFromUrl(url: string): AuthError | null {
  try {
    const urlObj = new URL(url);
    const error = urlObj.searchParams.get('error');
    
    if (!error) return null;

    // Match to AuthError enum
    const authError = Object.values(AuthError).find(
      (e) => e.toLowerCase() === error.toLowerCase()
    );

    return authError as AuthError || null;
  } catch {
    return null;
  }
}

/**
 * Log authentication error with context
 */
export function logAuthError(
  error: AuthError | string,
  context: {
    userId?: string;
    email?: string;
    provider?: string;
    correlationId?: string;
    [key: string]: any;
  }
): void {
  const errorMessage = getErrorMessage(error as AuthError);
  const isRetryable = typeof error === 'string' ? false : isRetryableError(error);
  const isUser = typeof error === 'string' ? false : isUserError(error);
  const isSystem = typeof error === 'string' ? false : isSystemError(error);

  console.error('[Auth Error]', {
    error,
    message: errorMessage,
    retryable: isRetryable,
    userError: isUser,
    systemError: isSystem,
    ...context,
    timestamp: new Date().toISOString(),
  });

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production' && isSystem) {
    // TODO: Send to Sentry, DataDog, etc.
    // Example: Sentry.captureException(new Error(errorMessage), { extra: context });
  }
}

/**
 * Handle authentication error with retry logic
 */
export async function handleAuthErrorWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context?: Record<string, any>
): Promise<T> {
  let lastError: Error | null = null;
  let delay = 100;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const authError = parseAuthErrorFromUrl(lastError.message);
      if (authError && !isRetryableError(authError)) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(`[Auth] Retry attempt ${attempt}/${maxRetries}:`, {
        error: lastError.message,
        ...context,
      });

      // Last attempt - throw error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 2000);
    }
  }

  throw lastError;
}

/**
 * Validate authentication response
 */
export function validateAuthResponse(response: any): {
  valid: boolean;
  error?: AuthError;
} {
  // Check for error in response
  if (response?.error) {
    const authError = Object.values(AuthError).find(
      (e) => e.toLowerCase() === response.error.toLowerCase()
    );
    return {
      valid: false,
      error: authError as AuthError || AuthError.CALLBACK,
    };
  }

  // Check for required fields
  if (!response?.ok) {
    return {
      valid: false,
      error: AuthError.CALLBACK,
    };
  }

  return { valid: true };
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Get recovery action for error
 */
export function getRecoveryAction(error: AuthError): {
  action: string;
  description: string;
} {
  switch (error) {
    case AuthError.CREDENTIALS_SIGNIN:
      return {
        action: 'retry',
        description: 'Check your email and password and try again.',
      };
    
    case AuthError.VERIFICATION:
      return {
        action: 'verify_email',
        description: 'Please verify your email address before signing in.',
      };
    
    case AuthError.OAUTH_ACCOUNT_NOT_LINKED:
      return {
        action: 'link_account',
        description: 'Sign in with your original method to link accounts.',
      };
    
    case AuthError.SESSION_REQUIRED:
      return {
        action: 'sign_in',
        description: 'Please sign in to continue.',
      };
    
    case AuthError.ACCESS_DENIED:
      return {
        action: 'contact_support',
        description: 'Contact support if you believe this is an error.',
      };
    
    default:
      return {
        action: 'retry',
        description: 'Please try again. If the problem persists, contact support.',
      };
  }
}
