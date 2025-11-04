/**
 * Custom error classes for OAuth credentials validation
 */

import { ValidationError, ValidationErrorCode, Platform } from './types';

/**
 * Base validation error class
 */
export class ValidationException extends Error {
  public readonly code: string;
  public readonly platform?: Platform;
  public readonly field?: string;
  public readonly suggestion?: string;

  constructor(
    message: string,
    code: string = ValidationErrorCode.UNKNOWN_ERROR,
    platform?: Platform,
    field?: string,
    suggestion?: string
  ) {
    super(message);
    this.name = 'ValidationException';
    this.code = code;
    this.platform = platform;
    this.field = field;
    this.suggestion = suggestion;
  }

  /**
   * Convert to ValidationError interface
   */
  toValidationError(): ValidationError {
    return {
      code: this.code,
      message: this.message,
      field: this.field,
      suggestion: this.suggestion,
    };
  }
}

/**
 * Credentials not configured error
 */
export class CredentialsNotConfiguredError extends ValidationException {
  constructor(platform: Platform, missingFields: string[]) {
    const message = `${platform} OAuth credentials not configured. Missing: ${missingFields.join(', ')}`;
    const suggestion = `Configure ${platform} credentials in environment variables`;
    
    super(message, ValidationErrorCode.INVALID_CREDENTIALS, platform, undefined, suggestion);
    this.name = 'CredentialsNotConfiguredError';
  }
}

/**
 * API connectivity error
 */
export class ApiConnectivityError extends ValidationException {
  constructor(platform: Platform, originalError?: Error) {
    const message = `Cannot connect to ${platform} API`;
    const suggestion = `Check if ${platform} credentials are correct and API is accessible`;
    
    super(message, ValidationErrorCode.API_CONNECTIVITY_FAILED, platform, undefined, suggestion);
    this.name = 'ApiConnectivityError';
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Validation timeout error
 */
export class ValidationTimeoutError extends ValidationException {
  constructor(platform: Platform, timeout: number) {
    const message = `Validation timeout after ${timeout}ms for ${platform}`;
    const suggestion = 'Check network connectivity and API response times';
    
    super(message, ValidationErrorCode.VALIDATION_TIMEOUT, platform, undefined, suggestion);
    this.name = 'ValidationTimeoutError';
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends ValidationException {
  constructor(platform: Platform, retryAfter?: number) {
    const message = `Rate limit exceeded for ${platform} API`;
    const suggestion = retryAfter 
      ? `Retry after ${retryAfter} seconds`
      : 'Wait before making more validation requests';
    
    super(message, ValidationErrorCode.RATE_LIMIT_EXCEEDED, platform, undefined, suggestion);
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Invalid credentials format error
 */
export class InvalidCredentialsFormatError extends ValidationException {
  constructor(platform: Platform, field: string, expectedFormat: string) {
    const message = `Invalid ${field} format for ${platform}`;
    const suggestion = `${field} should be ${expectedFormat}`;
    
    super(message, ValidationErrorCode.INVALID_CREDENTIALS, platform, field, suggestion);
    this.name = 'InvalidCredentialsFormatError';
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends ValidationException {
  constructor(platform: Platform, missingPermissions: string[]) {
    const message = `Insufficient permissions for ${platform}. Missing: ${missingPermissions.join(', ')}`;
    const suggestion = `Grant required permissions in ${platform} developer console`;
    
    super(message, ValidationErrorCode.INSUFFICIENT_PERMISSIONS, platform, undefined, suggestion);
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Utility functions for error handling
 */
export class ValidationErrorUtils {
  /**
   * Create ValidationError from Error object
   */
  static fromError(error: Error, platform?: Platform): ValidationError {
    if (error instanceof ValidationException) {
      return error.toValidationError();
    }
    
    return {
      code: ValidationErrorCode.UNKNOWN_ERROR,
      message: error.message,
      suggestion: 'Check logs for more details',
    };
  }
  
  /**
   * Create ValidationError for missing field
   */
  static missingField(field: string, platform: Platform): ValidationError {
    const fieldMap: Record<string, { code: ValidationErrorCode; suggestion: string }> = {
      clientKey: {
        code: ValidationErrorCode.MISSING_CLIENT_KEY,
        suggestion: 'Get Client Key from TikTok Developer Portal',
      },
      clientSecret: {
        code: ValidationErrorCode.MISSING_CLIENT_SECRET,
        suggestion: 'Get Client Secret from TikTok Developer Portal',
      },
      appId: {
        code: ValidationErrorCode.MISSING_APP_ID,
        suggestion: 'Get App ID from Facebook Developer Console',
      },
      appSecret: {
        code: ValidationErrorCode.MISSING_APP_SECRET,
        suggestion: 'Get App Secret from Facebook Developer Console',
      },
      clientId: {
        code: ValidationErrorCode.MISSING_CLIENT_ID,
        suggestion: 'Get Client ID from Reddit App Preferences',
      },
      userAgent: {
        code: ValidationErrorCode.MISSING_USER_AGENT,
        suggestion: 'Set User-Agent like "YourApp/1.0.0 by YourUsername"',
      },
    };
    
    const config = fieldMap[field] || {
      code: ValidationErrorCode.UNKNOWN_ERROR,
      suggestion: `Configure ${field} in environment variables`,
    };
    
    return {
      code: config.code,
      message: `${field} is required for ${platform}`,
      field,
      suggestion: config.suggestion,
    };
  }
  
  /**
   * Create ValidationError for invalid format
   */
  static invalidFormat(field: string, platform: Platform, expectedFormat: string): ValidationError {
    const codeMap: Record<string, ValidationErrorCode> = {
      appId: ValidationErrorCode.INVALID_APP_ID_FORMAT,
      appSecret: ValidationErrorCode.INVALID_APP_SECRET_FORMAT,
      redirectUri: ValidationErrorCode.INVALID_REDIRECT_URI,
    };
    
    return {
      code: codeMap[field] || ValidationErrorCode.INVALID_CREDENTIALS,
      message: `Invalid ${field} format for ${platform}`,
      field,
      suggestion: `${field} should be ${expectedFormat}`,
    };
  }
  
  /**
   * Sanitize error message to remove sensitive information
   */
  static sanitizeErrorMessage(message: string): string {
    // Remove potential credential values from error messages
    return message
      .replace(/client_secret=[^&\s]+/gi, 'client_secret=***')
      .replace(/app_secret=[^&\s]+/gi, 'app_secret=***')
      .replace(/access_token=[^&\s]+/gi, 'access_token=***')
      .replace(/refresh_token=[^&\s]+/gi, 'refresh_token=***')
      .replace(/"client_secret":\s*"[^"]+"/gi, '"client_secret": "***"')
      .replace(/"app_secret":\s*"[^"]+"/gi, '"app_secret": "***"')
      .replace(/"access_token":\s*"[^"]+"/gi, '"access_token": "***"')
      .replace(/"refresh_token":\s*"[^"]+"/gi, '"refresh_token": "***"');
  }
}