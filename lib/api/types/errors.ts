/**
 * Standardized API Error Types
 * 
 * Provides consistent error handling across all API endpoints.
 * Includes error codes, types, and factory functions.
 * 
 * Usage:
 * ```typescript
 * import { ApiError, ApiErrorCode } from '@/lib/api/types/errors';
 * 
 * throw new ApiError(
 *   ApiErrorCode.VALIDATION_ERROR,
 *   'Invalid email format',
 *   { field: 'email' }
 * );
 * ```
 */

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  CSRF_ERROR = 'CSRF_ERROR',
  
  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict (409)
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server Errors (500, 503)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  OAUTH_ERROR = 'OAUTH_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',       // User error, expected
  MEDIUM = 'MEDIUM', // Validation error, retryable
  HIGH = 'HIGH',     // Service error, needs attention
  CRITICAL = 'CRITICAL', // System failure, immediate action
}

/**
 * Standardized API error class
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly severity: ErrorSeverity;
  public readonly metadata?: Record<string, any>;
  public readonly correlationId?: string;
  public readonly timestamp: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      statusCode?: number;
      retryable?: boolean;
      severity?: ErrorSeverity;
      metadata?: Record<string, any>;
      correlationId?: string;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = options.statusCode || this.getDefaultStatusCode(code);
    this.retryable = options.retryable ?? this.isRetryableByDefault(code);
    this.severity = options.severity || this.getDefaultSeverity(code);
    this.metadata = options.metadata;
    this.correlationId = options.correlationId;
    this.timestamp = new Date().toISOString();

    // Preserve stack trace
    if (options.cause) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }
  }

  /**
   * Get default HTTP status code for error code
   */
  private getDefaultStatusCode(code: ApiErrorCode): number {
    const statusMap: Record<ApiErrorCode, number> = {
      [ApiErrorCode.UNAUTHORIZED]: 401,
      [ApiErrorCode.FORBIDDEN]: 403,
      [ApiErrorCode.INVALID_TOKEN]: 401,
      [ApiErrorCode.TOKEN_EXPIRED]: 401,
      [ApiErrorCode.CSRF_ERROR]: 403,
      
      [ApiErrorCode.VALIDATION_ERROR]: 400,
      [ApiErrorCode.INVALID_INPUT]: 400,
      [ApiErrorCode.MISSING_FIELD]: 400,
      [ApiErrorCode.INVALID_FORMAT]: 400,
      
      [ApiErrorCode.NOT_FOUND]: 404,
      [ApiErrorCode.USER_NOT_FOUND]: 404,
      [ApiErrorCode.RESOURCE_NOT_FOUND]: 404,
      
      [ApiErrorCode.CONFLICT]: 409,
      [ApiErrorCode.ALREADY_EXISTS]: 409,
      [ApiErrorCode.DUPLICATE_ENTRY]: 409,
      
      [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
      [ApiErrorCode.TOO_MANY_REQUESTS]: 429,
      
      [ApiErrorCode.INTERNAL_ERROR]: 500,
      [ApiErrorCode.DATABASE_ERROR]: 503,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ApiErrorCode.TIMEOUT_ERROR]: 504,
      
      [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
      [ApiErrorCode.OAUTH_ERROR]: 502,
      [ApiErrorCode.PAYMENT_ERROR]: 502,
    };

    return statusMap[code] || 500;
  }

  /**
   * Determine if error is retryable by default
   */
  private isRetryableByDefault(code: ApiErrorCode): boolean {
    const retryableCodes = [
      ApiErrorCode.DATABASE_ERROR,
      ApiErrorCode.SERVICE_UNAVAILABLE,
      ApiErrorCode.TIMEOUT_ERROR,
      ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
    ];

    return retryableCodes.includes(code);
  }

  /**
   * Get default severity for error code
   */
  private getDefaultSeverity(code: ApiErrorCode): ErrorSeverity {
    const severityMap: Record<ApiErrorCode, ErrorSeverity> = {
      [ApiErrorCode.UNAUTHORIZED]: ErrorSeverity.LOW,
      [ApiErrorCode.FORBIDDEN]: ErrorSeverity.LOW,
      [ApiErrorCode.INVALID_TOKEN]: ErrorSeverity.LOW,
      [ApiErrorCode.TOKEN_EXPIRED]: ErrorSeverity.LOW,
      [ApiErrorCode.CSRF_ERROR]: ErrorSeverity.MEDIUM,
      
      [ApiErrorCode.VALIDATION_ERROR]: ErrorSeverity.LOW,
      [ApiErrorCode.INVALID_INPUT]: ErrorSeverity.LOW,
      [ApiErrorCode.MISSING_FIELD]: ErrorSeverity.LOW,
      [ApiErrorCode.INVALID_FORMAT]: ErrorSeverity.LOW,
      
      [ApiErrorCode.NOT_FOUND]: ErrorSeverity.LOW,
      [ApiErrorCode.USER_NOT_FOUND]: ErrorSeverity.LOW,
      [ApiErrorCode.RESOURCE_NOT_FOUND]: ErrorSeverity.LOW,
      
      [ApiErrorCode.CONFLICT]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.ALREADY_EXISTS]: ErrorSeverity.LOW,
      [ApiErrorCode.DUPLICATE_ENTRY]: ErrorSeverity.MEDIUM,
      
      [ApiErrorCode.RATE_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.TOO_MANY_REQUESTS]: ErrorSeverity.MEDIUM,
      
      [ApiErrorCode.INTERNAL_ERROR]: ErrorSeverity.CRITICAL,
      [ApiErrorCode.DATABASE_ERROR]: ErrorSeverity.HIGH,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
      [ApiErrorCode.TIMEOUT_ERROR]: ErrorSeverity.MEDIUM,
      
      [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.OAUTH_ERROR]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.PAYMENT_ERROR]: ErrorSeverity.HIGH,
    };

    return severityMap[code] || ErrorSeverity.MEDIUM;
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        severity: this.severity,
        ...(this.metadata && { metadata: this.metadata }),
      },
      meta: {
        timestamp: this.timestamp,
        ...(this.correlationId && { requestId: this.correlationId }),
      },
    };
  }
}

/**
 * Factory functions for common errors
 */
export const ErrorFactory = {
  unauthorized(message = 'Unauthorized', correlationId?: string): ApiError {
    return new ApiError(ApiErrorCode.UNAUTHORIZED, message, { correlationId });
  },

  forbidden(message = 'Forbidden', correlationId?: string): ApiError {
    return new ApiError(ApiErrorCode.FORBIDDEN, message, { correlationId });
  },

  validation(message: string, field?: string, correlationId?: string): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, message, {
      correlationId,
      metadata: field ? { field } : undefined,
    });
  },

  notFound(resource: string, correlationId?: string): ApiError {
    return new ApiError(
      ApiErrorCode.NOT_FOUND,
      `${resource} not found`,
      { correlationId }
    );
  },

  conflict(message: string, correlationId?: string): ApiError {
    return new ApiError(ApiErrorCode.CONFLICT, message, { correlationId });
  },

  rateLimit(retryAfter: number, correlationId?: string): ApiError {
    return new ApiError(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded. Please try again later.',
      {
        correlationId,
        metadata: { retryAfter },
      }
    );
  },

  database(message: string, correlationId?: string, cause?: Error): ApiError {
    return new ApiError(
      ApiErrorCode.DATABASE_ERROR,
      message,
      {
        correlationId,
        cause,
        retryable: true,
      }
    );
  },

  timeout(message = 'Request timeout', correlationId?: string): ApiError {
    return new ApiError(
      ApiErrorCode.TIMEOUT_ERROR,
      message,
      {
        correlationId,
        retryable: true,
      }
    );
  },

  internal(message = 'Internal server error', correlationId?: string, cause?: Error): ApiError {
    return new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      message,
      {
        correlationId,
        cause,
        severity: ErrorSeverity.CRITICAL,
      }
    );
  },
};

/**
 * Check if error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convert any error to ApiError
 */
export function toApiError(error: any, correlationId?: string): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return ErrorFactory.internal(error.message, correlationId, error);
  }

  return ErrorFactory.internal('Unknown error occurred', correlationId);
}
