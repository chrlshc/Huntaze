/**
 * Human-Friendly Error Messages
 * Maps technical validation errors to user-friendly messages
 * 
 * Requirements:
 * - 5.4: Human-friendly error messages with actionable guidance
 */

export type ErrorCode = 
  | 'REQUIRED'
  | 'INVALID_EMAIL'
  | 'EMAIL_TOO_LONG'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_LONG'
  | 'PASSWORD_NO_UPPERCASE'
  | 'PASSWORD_NO_LOWERCASE'
  | 'PASSWORD_NO_NUMBER'
  | 'PASSWORD_NO_SPECIAL'
  | 'PASSWORD_WEAK'
  | 'CSRF_MISSING'
  | 'CSRF_INVALID'
  | 'CSRF_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMIT'
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'OAUTH_FAILED'
  | 'OAUTH_CANCELLED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID';

interface ErrorMessage {
  message: string;
  guidance?: string;
}

/**
 * Error message dictionary with user-friendly messages
 */
const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // Required fields
  REQUIRED: {
    message: 'This field is required',
    guidance: 'Please fill in this field to continue',
  },

  // Email validation
  INVALID_EMAIL: {
    message: 'Please enter a valid email address',
    guidance: 'Make sure your email includes an @ symbol and a domain (e.g., you@example.com)',
  },
  EMAIL_TOO_LONG: {
    message: 'Email address is too long',
    guidance: 'Please use an email address with fewer than 255 characters',
  },
  EMAIL_EXISTS: {
    message: 'This email is already registered',
    guidance: 'Try signing in instead, or use a different email address',
  },

  // Password validation
  PASSWORD_TOO_SHORT: {
    message: 'Password must be at least 8 characters',
    guidance: 'Choose a longer password for better security',
  },
  PASSWORD_TOO_LONG: {
    message: 'Password is too long',
    guidance: 'Please use a password with fewer than 128 characters',
  },
  PASSWORD_NO_UPPERCASE: {
    message: 'Password must include at least one uppercase letter',
    guidance: 'Add a capital letter (A-Z) to your password',
  },
  PASSWORD_NO_LOWERCASE: {
    message: 'Password must include at least one lowercase letter',
    guidance: 'Add a lowercase letter (a-z) to your password',
  },
  PASSWORD_NO_NUMBER: {
    message: 'Password must include at least one number',
    guidance: 'Add a number (0-9) to your password',
  },
  PASSWORD_NO_SPECIAL: {
    message: 'Password must include at least one special character',
    guidance: 'Add a special character like !@#$%^&* to your password',
  },
  PASSWORD_WEAK: {
    message: 'Password is too weak',
    guidance: 'Use a mix of uppercase, lowercase, numbers, and special characters',
  },

  // CSRF errors
  CSRF_MISSING: {
    message: 'Security token is missing',
    guidance: 'Please refresh the page and try again',
  },
  CSRF_INVALID: {
    message: 'Security token is invalid',
    guidance: 'Please refresh the page and try again',
  },
  CSRF_EXPIRED: {
    message: 'Your session has expired',
    guidance: 'Please refresh the page to continue',
  },

  // Network errors
  NETWORK_ERROR: {
    message: 'Connection problem',
    guidance: 'Please check your internet connection and try again',
  },
  SERVER_ERROR: {
    message: 'Something went wrong on our end',
    guidance: 'Please try again in a few moments. If the problem persists, contact support',
  },
  RATE_LIMIT: {
    message: 'Too many attempts',
    guidance: 'Please wait a few minutes before trying again',
  },

  // Authentication errors
  INVALID_CREDENTIALS: {
    message: 'Email or password is incorrect',
    guidance: 'Please check your credentials and try again',
  },
  OAUTH_FAILED: {
    message: 'Sign in with Google failed',
    guidance: 'Please try again or use email signup instead',
  },
  OAUTH_CANCELLED: {
    message: 'Sign in was cancelled',
    guidance: 'Click the button again to continue with Google',
  },

  // Token errors
  TOKEN_EXPIRED: {
    message: 'This link has expired',
    guidance: 'Magic links expire after 24 hours. Request a new one to continue',
  },
  TOKEN_INVALID: {
    message: 'This link is invalid',
    guidance: 'Please request a new magic link to sign in',
  },
};

/**
 * Get user-friendly error message for error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code]?.message || 'An error occurred';
}

/**
 * Get error message with guidance
 */
export function getErrorWithGuidance(code: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code] || {
    message: 'An error occurred',
    guidance: 'Please try again',
  };
}

/**
 * Format error for display
 */
export function formatError(code: ErrorCode, includeGuidance = false): string {
  const error = ERROR_MESSAGES[code];
  if (!error) return 'An error occurred';

  if (includeGuidance && error.guidance) {
    return `${error.message}. ${error.guidance}`;
  }

  return error.message;
}

/**
 * Map technical error to user-friendly message
 */
export function mapTechnicalError(technicalError: string): string {
  const errorMap: Record<string, ErrorCode> = {
    'required': 'REQUIRED',
    'invalid_type': 'REQUIRED',
    'too_small': 'PASSWORD_TOO_SHORT',
    'too_big': 'EMAIL_TOO_LONG',
    'invalid_string': 'INVALID_EMAIL',
    'csrf': 'CSRF_INVALID',
    'expired': 'TOKEN_EXPIRED',
    'unauthorized': 'INVALID_CREDENTIALS',
    'rate_limit': 'RATE_LIMIT',
    'network': 'NETWORK_ERROR',
    'server': 'SERVER_ERROR',
  };

  for (const [key, code] of Object.entries(errorMap)) {
    if (technicalError.toLowerCase().includes(key)) {
      return getErrorMessage(code);
    }
  }

  return 'An error occurred. Please try again';
}

/**
 * Get contextual error message based on field
 */
export function getContextualError(
  field: string,
  error: string
): string {
  // Map field-specific errors
  if (field === 'email') {
    if (error.includes('invalid')) return getErrorMessage('INVALID_EMAIL');
    if (error.includes('exists')) return getErrorMessage('EMAIL_EXISTS');
    if (error.includes('required')) return 'Email address is required';
  }

  if (field === 'password') {
    if (error.includes('short')) return getErrorMessage('PASSWORD_TOO_SHORT');
    if (error.includes('uppercase')) return getErrorMessage('PASSWORD_NO_UPPERCASE');
    if (error.includes('lowercase')) return getErrorMessage('PASSWORD_NO_LOWERCASE');
    if (error.includes('number')) return getErrorMessage('PASSWORD_NO_NUMBER');
    if (error.includes('special')) return getErrorMessage('PASSWORD_NO_SPECIAL');
    if (error.includes('weak')) return getErrorMessage('PASSWORD_WEAK');
  }

  return mapTechnicalError(error);
}
