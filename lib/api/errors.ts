/**
 * API Error Types and Handlers
 * 
 * Standardized error handling for all API requests
 */

export enum APIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface APIError {
  type: APIErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  correlationId?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

export class APIErrorHandler {
  /**
   * Handle and normalize errors
   */
  static handle(error: unknown, correlationId?: string): APIError {
    // Already an APIError
    if (this.isAPIError(error)) {
      return error;
    }

    // Network/Fetch errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          type: APIErrorType.TIMEOUT_ERROR,
          message: error.message,
          userMessage: 'Request timed out. Please try again.',
          retryable: true,
          correlationId,
        };
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          type: APIErrorType.NETWORK_ERROR,
          message: error.message,
          userMessage: 'Connection issue. Please check your internet and try again.',
          retryable: true,
          correlationId,
        };
      }

      // Generic error
      return {
        type: APIErrorType.API_ERROR,
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        correlationId,
      };
    }

    // Unknown error
    return {
      type: APIErrorType.API_ERROR,
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true,
      correlationId,
    };
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(type: APIErrorType): boolean {
    return (
      type === APIErrorType.NETWORK_ERROR ||
      type === APIErrorType.API_ERROR ||
      type === APIErrorType.RATE_LIMIT_ERROR ||
      type === APIErrorType.TIMEOUT_ERROR
    );
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(type: APIErrorType, message?: string): string {
    switch (type) {
      case APIErrorType.NETWORK_ERROR:
        return 'Connection issue. Please check your internet and try again.';
      
      case APIErrorType.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      
      case APIErrorType.VALIDATION_ERROR:
        return message || 'Invalid input. Please check your data and try again.';
      
      case APIErrorType.AUTHENTICATION_ERROR:
        return 'You need to be logged in to perform this action.';
      
      case APIErrorType.PERMISSION_ERROR:
        return 'You don\'t have permission to perform this action.';
      
      case APIErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      
      case APIErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';
      
      case APIErrorType.API_ERROR:
        return 'Server error. Our team has been notified. Please try again later.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is an APIError
   */
  private static isAPIError(error: unknown): error is APIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error &&
      'userMessage' in error &&
      'retryable' in error
    );
  }

  /**
   * Create validation error
   */
  static validationError(
    message: string,
    details?: Record<string, any>,
    correlationId?: string
  ): APIError {
    return {
      type: APIErrorType.VALIDATION_ERROR,
      message,
      userMessage: message,
      retryable: false,
      correlationId,
      details,
    };
  }

  /**
   * Create authentication error
   */
  static authenticationError(correlationId?: string): APIError {
    return {
      type: APIErrorType.AUTHENTICATION_ERROR,
      message: 'Authentication required',
      userMessage: 'You need to be logged in to perform this action.',
      retryable: false,
      correlationId,
      statusCode: 401,
    };
  }

  /**
   * Create permission error
   */
  static permissionError(correlationId?: string): APIError {
    return {
      type: APIErrorType.PERMISSION_ERROR,
      message: 'Permission denied',
      userMessage: 'You don\'t have permission to perform this action.',
      retryable: false,
      correlationId,
      statusCode: 403,
    };
  }

  /**
   * Create not found error
   */
  static notFoundError(resource: string, correlationId?: string): APIError {
    return {
      type: APIErrorType.NOT_FOUND_ERROR,
      message: `${resource} not found`,
      userMessage: 'The requested resource was not found.',
      retryable: false,
      correlationId,
      statusCode: 404,
    };
  }

  /**
   * Create rate limit error
   */
  static rateLimitError(retryAfter?: number, correlationId?: string): APIError {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter}s`
      : 'Rate limit exceeded';
    
    const userMessage = retryAfter
      ? `Too many requests. Please wait ${retryAfter} seconds and try again.`
      : 'Too many requests. Please wait a moment and try again.';

    return {
      type: APIErrorType.RATE_LIMIT_ERROR,
      message,
      userMessage,
      retryable: true,
      correlationId,
      statusCode: 429,
      details: { retryAfter },
    };
  }
}
