/**
 * OAuth Error Handler
 * 
 * Provides standardized error handling for OAuth flows across all platforms
 * Includes user-friendly messages, proper logging, and consistent response format
 */

import { NextRequest, NextResponse } from 'next/server';

export interface OAuthError {
  code: string;
  message: string;
  userMessage: string;
  suggestion?: string;
  retryable: boolean;
  statusCode?: number;
}

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: string;
    suggestion?: string;
    retryable: boolean;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * OAuth Error Definitions
 */
export const OAUTH_ERRORS = {
  // Configuration Errors (500)
  OAUTH_NOT_CONFIGURED: {
    code: 'oauth_not_configured',
    message: 'OAuth credentials not configured',
    userMessage: 'Social media connection is not available. Please contact support.',
    suggestion: 'Contact support to enable this social media platform.',
    retryable: false,
    statusCode: 500,
  },
  INVALID_CREDENTIALS: {
    code: 'invalid_credentials',
    message: 'OAuth credentials are invalid',
    userMessage: 'Social media connection is temporarily unavailable.',
    suggestion: 'Please try again later or contact support.',
    retryable: true,
    statusCode: 500,
  },
  SERVICE_UNAVAILABLE: {
    code: 'service_unavailable',
    message: 'OAuth service is temporarily unavailable',
    userMessage: 'Social media connection is temporarily unavailable.',
    suggestion: 'Please try again in a few minutes.',
    retryable: true,
    statusCode: 503,
  },

  // User Errors (400)
  ACCESS_DENIED: {
    code: 'access_denied',
    message: 'User denied OAuth authorization',
    userMessage: 'You denied access to your social media account.',
    suggestion: 'Please try connecting again and grant the required permissions.',
    retryable: true,
    statusCode: 400,
  },
  INVALID_REQUEST: {
    code: 'invalid_request',
    message: 'Invalid OAuth request parameters',
    userMessage: 'There was a problem with the connection request.',
    suggestion: 'Please try connecting again.',
    retryable: true,
    statusCode: 400,
  },
  MISSING_CODE: {
    code: 'missing_code',
    message: 'Authorization code missing from callback',
    userMessage: 'The authorization process was incomplete.',
    suggestion: 'Please try connecting again.',
    retryable: true,
    statusCode: 400,
  },
  INVALID_SCOPE: {
    code: 'invalid_scope',
    message: 'Requested OAuth scope not available',
    userMessage: 'Some required permissions are not available for your account.',
    suggestion: 'Please ensure your account has the necessary permissions.',
    retryable: false,
    statusCode: 400,
  },

  // Security Errors (403)
  INVALID_STATE: {
    code: 'invalid_state',
    message: 'OAuth state validation failed',
    userMessage: 'Security validation failed during connection.',
    suggestion: 'Please try connecting again.',
    retryable: true,
    statusCode: 403,
  },
  CSRF_DETECTED: {
    code: 'csrf_detected',
    message: 'Potential CSRF attack detected',
    userMessage: 'Security validation failed.',
    suggestion: 'Please try connecting again from a fresh browser session.',
    retryable: true,
    statusCode: 403,
  },
  UNAUTHORIZED: {
    code: 'unauthorized',
    message: 'User not authenticated',
    userMessage: 'You must be logged in to connect social media accounts.',
    suggestion: 'Please log in and try again.',
    retryable: true,
    statusCode: 401,
  },

  // Platform Errors (502)
  PLATFORM_ERROR: {
    code: 'platform_error',
    message: 'Social media platform returned an error',
    userMessage: 'There was a problem connecting to the social media platform.',
    suggestion: 'Please try again later.',
    retryable: true,
    statusCode: 502,
  },
  TOKEN_EXCHANGE_FAILED: {
    code: 'token_exchange_failed',
    message: 'Failed to exchange authorization code for tokens',
    userMessage: 'Failed to complete the authorization process.',
    suggestion: 'Please try connecting again.',
    retryable: true,
    statusCode: 502,
  },
  RATE_LIMITED: {
    code: 'rate_limited',
    message: 'Rate limit exceeded',
    userMessage: 'Too many connection attempts. Please wait before trying again.',
    suggestion: 'Please wait a few minutes and try again.',
    retryable: true,
    statusCode: 429,
  },

  // Business Logic Errors (400)
  NO_BUSINESS_ACCOUNT: {
    code: 'no_business_account',
    message: 'No business account found',
    userMessage: 'No Instagram Business or Creator account found.',
    suggestion: 'Please convert your Instagram account to a Business or Creator account and link it to a Facebook Page.',
    retryable: false,
    statusCode: 400,
  },
  ACCOUNT_NOT_ELIGIBLE: {
    code: 'account_not_eligible',
    message: 'Account not eligible for connection',
    userMessage: 'Your account is not eligible for connection.',
    suggestion: 'Please ensure your account meets the requirements for this platform.',
    retryable: false,
    statusCode: 400,
  },

  // Generic Errors
  CALLBACK_FAILED: {
    code: 'callback_failed',
    message: 'OAuth callback processing failed',
    userMessage: 'Failed to complete the connection process.',
    suggestion: 'Please try connecting again.',
    retryable: true,
    statusCode: 500,
  },
  UNKNOWN_ERROR: {
    code: 'unknown_error',
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred.',
    suggestion: 'Please try again or contact support if the problem persists.',
    retryable: true,
    statusCode: 500,
  },
} as const;

/**
 * Platform-specific error mapping
 */
export const PLATFORM_ERROR_MAPPING = {
  // TikTok errors
  tiktok: {
    'access_denied': OAUTH_ERRORS.ACCESS_DENIED,
    'invalid_request': OAUTH_ERRORS.INVALID_REQUEST,
    'invalid_scope': OAUTH_ERRORS.INVALID_SCOPE,
    'server_error': OAUTH_ERRORS.PLATFORM_ERROR,
    'temporarily_unavailable': OAUTH_ERRORS.SERVICE_UNAVAILABLE,
  },
  
  // Instagram/Facebook errors
  instagram: {
    'access_denied': OAUTH_ERRORS.ACCESS_DENIED,
    'invalid_request': OAUTH_ERRORS.INVALID_REQUEST,
    'invalid_scope': OAUTH_ERRORS.INVALID_SCOPE,
    'server_error': OAUTH_ERRORS.PLATFORM_ERROR,
    'temporarily_unavailable': OAUTH_ERRORS.SERVICE_UNAVAILABLE,
  },
  
  // Reddit errors
  reddit: {
    'access_denied': OAUTH_ERRORS.ACCESS_DENIED,
    'invalid_request': OAUTH_ERRORS.INVALID_REQUEST,
    'invalid_scope': OAUTH_ERRORS.INVALID_SCOPE,
    'server_error': OAUTH_ERRORS.PLATFORM_ERROR,
  },
} as const;

/**
 * OAuth Error Handler Class
 */
export class OAuthErrorHandler {
  /**
   * Create standardized error response
   */
  static createErrorResponse(error: OAuthError, requestId?: string): NextResponse {
    const response: StandardErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        suggestion: error.suggestion,
        retryable: error.retryable,
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
      },
    };

    return NextResponse.json(response, {
      status: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Handle OAuth callback errors with redirect
   */
  static handleCallbackError(
    errorCode: string,
    errorDescription?: string,
    platform?: string,
    baseUrl?: string
  ): NextResponse {
    // Map platform-specific errors
    let oauthError: OAuthError;
    
    if (platform && PLATFORM_ERROR_MAPPING[platform as keyof typeof PLATFORM_ERROR_MAPPING]) {
      const platformMapping = PLATFORM_ERROR_MAPPING[platform as keyof typeof PLATFORM_ERROR_MAPPING];
      oauthError = platformMapping[errorCode as keyof typeof platformMapping] || OAUTH_ERRORS.UNKNOWN_ERROR;
    } else {
      // Generic error mapping
      oauthError = OAUTH_ERRORS[errorCode as keyof typeof OAUTH_ERRORS] || OAUTH_ERRORS.UNKNOWN_ERROR;
    }

    // Use error description if provided
    if (errorDescription) {
      oauthError = {
        ...oauthError,
        message: errorDescription,
      };
    }

    // Create relative redirect URL with error parameters
    const path = baseUrl && baseUrl.startsWith('/') ? baseUrl : `/platforms/connect/${platform ?? ''}`;
    const params = new URLSearchParams();
    params.set('error', oauthError.code);
    params.set('message', oauthError.userMessage);
    if (oauthError.suggestion) params.set('suggestion', oauthError.suggestion);
    return NextResponse.redirect(`${path}?${params.toString()}`);
  }

  /**
   * Handle OAuth init errors
   */
  static handleInitError(
    error: Error,
    platform: string,
    request: NextRequest
  ): NextResponse {
    let oauthError: OAuthError;

    // Categorize error
    if (error.message.includes('not configured') || error.message.includes('missing')) {
      oauthError = OAUTH_ERRORS.OAUTH_NOT_CONFIGURED;
    } else if (error.message.includes('invalid') || error.message.includes('validation failed')) {
      oauthError = OAUTH_ERRORS.INVALID_CREDENTIALS;
    } else {
      oauthError = OAUTH_ERRORS.SERVICE_UNAVAILABLE;
    }

    // Log error for debugging
    this.logError(error, {
      platform,
      endpoint: 'oauth_init',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });

    // Redirect to error page (relative path)
    const params = new URLSearchParams();
    params.set('error', oauthError.code);
    params.set('message', oauthError.userMessage);
    if (oauthError.suggestion) params.set('suggestion', oauthError.suggestion);
    const location = `/platforms/connect/${platform}?${params.toString()}`;
    return NextResponse.redirect(location);
  }

  /**
   * Log error with context
   */
  static logError(error: Error, context: Record<string, any>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      requestId: generateRequestId(),
    };

    // Use structured logging
    console.error('OAuth Error:', JSON.stringify(logData, null, 2));

    // TODO: Send to external logging service (e.g., Sentry, DataDog)
    // if (process.env.NODE_ENV === 'production') {
    //   sendToLoggingService(logData);
    // }
  }

  /**
   * Create user-friendly error message
   */
  static getUserFriendlyMessage(errorCode: string, platform?: string): string {
    const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'social media';
    
    switch (errorCode) {
      case 'access_denied':
        return `You denied access to your ${platformName} account. Please try again and grant the required permissions.`;
      case 'invalid_state':
        return 'Security validation failed. Please try connecting again.';
      case 'missing_code':
        return 'The authorization process was incomplete. Please try connecting again.';
      case 'no_business_account':
        return 'No Instagram Business or Creator account found. Please convert your account and try again.';
      case 'oauth_not_configured':
        return `${platformName} connection is not available. Please contact support.`;
      case 'rate_limited':
        return 'Too many connection attempts. Please wait a few minutes and try again.';
      default:
        return `Failed to connect to ${platformName}. Please try again.`;
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(errorCode: string): boolean {
    const nonRetryableErrors = [
      'oauth_not_configured',
      'invalid_scope',
      'no_business_account',
      'account_not_eligible',
    ];
    
    return !nonRetryableErrors.includes(errorCode);
  }

  /**
   * Get suggested action for error
   */
  static getSuggestion(errorCode: string, platform?: string): string | undefined {
    const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'social media';
    
    switch (errorCode) {
      case 'access_denied':
        return `Try connecting again and make sure to grant all required permissions for ${platformName}.`;
      case 'invalid_state':
        return 'Clear your browser cookies and try connecting again.';
      case 'no_business_account':
        return 'Convert your Instagram account to a Business or Creator account in the Instagram app settings.';
      case 'oauth_not_configured':
        return 'Contact support to enable this social media platform.';
      case 'rate_limited':
        return 'Wait 5-10 minutes before trying to connect again.';
      case 'service_unavailable':
        return `${platformName} may be experiencing issues. Try again in a few minutes.`;
      default:
        return undefined;
    }
  }
}

/**
 * Convenience function to handle common OAuth errors
 */
export function handleOAuthError(
  error: Error,
  request: NextRequest,
  platform?: string
): NextResponse {
  return OAuthErrorHandler.handleInitError(error, platform || 'unknown', request);
}

/**
 * Convenience function to handle callback errors
 */
export function handleCallbackError(
  errorCode: string,
  request: NextRequest,
  platform?: string,
  errorDescription?: string
): NextResponse {
  // Use relative path to avoid leaking internal hosts like localhost
  const relativePath = `/platforms/connect/${platform ?? ''}`;
  return OAuthErrorHandler.handleCallbackError(errorCode, errorDescription, platform, relativePath);
}

/**
 * Create success redirect URL
 */
export function createSuccessRedirect(
  request: NextRequest,
  platform: string,
  username?: string
): NextResponse {
  const params = new URLSearchParams({ success: 'true' });
  if (username) params.set('username', username);
  const location = `/platforms/connect/${platform}?${params.toString()}`;
  return NextResponse.redirect(location);
}
