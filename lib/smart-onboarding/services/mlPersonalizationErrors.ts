/**
 * Custom Error Classes for ML Personalization Engine
 * 
 * Provides type-safe error handling for ML operations
 */

/**
 * Base error class for ML Personalization operations
 */
export class MLPersonalizationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MLPersonalizationError';
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends MLPersonalizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Processing error for ML operation failures
 */
export class ProcessingError extends MLPersonalizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PROCESSING_ERROR', details);
    this.name = 'ProcessingError';
  }
}

/**
 * Retry exhausted error when max retries reached
 */
export class RetryExhaustedError extends MLPersonalizationError {
  constructor(
    message: string,
    public readonly attempts: number,
    details?: Record<string, any>
  ) {
    super(message, 'RETRY_EXHAUSTED', { ...details, attempts });
    this.name = 'RetryExhaustedError';
  }
}

/**
 * Cache error for Redis operations
 */
export class CacheError extends MLPersonalizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CACHE_ERROR', details);
    this.name = 'CacheError';
  }
}

/**
 * Database error for PostgreSQL operations
 */
export class DatabaseError extends MLPersonalizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

/**
 * Model error for ML model operations
 */
export class ModelError extends MLPersonalizationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'MODEL_ERROR', details);
    this.name = 'ModelError';
  }
}

/**
 * Type guard to check if error is an ML Personalization error
 */
export function isMLPersonalizationError(error: unknown): error is MLPersonalizationError {
  return error instanceof MLPersonalizationError;
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if error is a retry exhausted error
 */
export function isRetryExhaustedError(error: unknown): error is RetryExhaustedError {
  return error instanceof RetryExhaustedError;
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle error and return appropriate response
   */
  static handle(error: unknown): {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, any>;
  } {
    if (isMLPersonalizationError(error)) {
      return {
        message: error.message,
        code: error.code,
        statusCode: this.getStatusCode(error),
        details: error.details
      };
    }

    // Unknown error
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      details: {
        originalError: error instanceof Error ? error.message : String(error)
      }
    };
  }

  /**
   * Get HTTP status code for error
   */
  private static getStatusCode(error: MLPersonalizationError): number {
    if (error instanceof ValidationError) return 400;
    if (error instanceof RetryExhaustedError) return 503;
    if (error instanceof CacheError) return 500;
    if (error instanceof DatabaseError) return 500;
    if (error instanceof ModelError) return 500;
    return 500;
  }

  /**
   * Log error with context
   */
  static log(error: unknown, context?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: 'ml-personalization-engine',
      error: isMLPersonalizationError(error) ? error.toJSON() : {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      context
    };

    console.error('[ML Personalization Error]', JSON.stringify(logEntry));
  }
}
