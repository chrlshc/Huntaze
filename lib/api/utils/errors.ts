/**
 * Error handling utilities for API endpoints
 * Provides standardized error codes, custom error class, and logging
 */

/**
 * Standardized error codes used across the API
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ONBOARDING_REQUIRED: 'ONBOARDING_REQUIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server & External
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * HTTP status codes mapped to error types
 */
export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Custom API Error class with correlation ID support
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly correlationId: string;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.correlationId = crypto.randomUUID();
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Maps error codes to appropriate HTTP status codes
 */
export function getStatusCodeForError(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    [ErrorCodes.UNAUTHORIZED]: HttpStatusCodes.UNAUTHORIZED,
    [ErrorCodes.FORBIDDEN]: HttpStatusCodes.FORBIDDEN,
    [ErrorCodes.ONBOARDING_REQUIRED]: HttpStatusCodes.FORBIDDEN,
    [ErrorCodes.SESSION_EXPIRED]: HttpStatusCodes.UNAUTHORIZED,
    [ErrorCodes.VALIDATION_ERROR]: HttpStatusCodes.BAD_REQUEST,
    [ErrorCodes.INVALID_INPUT]: HttpStatusCodes.BAD_REQUEST,
    [ErrorCodes.MISSING_REQUIRED_FIELD]: HttpStatusCodes.BAD_REQUEST,
    [ErrorCodes.INVALID_FORMAT]: HttpStatusCodes.BAD_REQUEST,
    [ErrorCodes.NOT_FOUND]: HttpStatusCodes.NOT_FOUND,
    [ErrorCodes.ALREADY_EXISTS]: HttpStatusCodes.CONFLICT,
    [ErrorCodes.CONFLICT]: HttpStatusCodes.CONFLICT,
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: HttpStatusCodes.TOO_MANY_REQUESTS,
    [ErrorCodes.TOO_MANY_REQUESTS]: HttpStatusCodes.TOO_MANY_REQUESTS,
    [ErrorCodes.INTERNAL_ERROR]: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    [ErrorCodes.DATABASE_ERROR]: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    [ErrorCodes.EXTERNAL_API_ERROR]: HttpStatusCodes.SERVICE_UNAVAILABLE,
    [ErrorCodes.SERVICE_UNAVAILABLE]: HttpStatusCodes.SERVICE_UNAVAILABLE,
    [ErrorCodes.TIMEOUT_ERROR]: 408,
    [ErrorCodes.NETWORK_ERROR]: HttpStatusCodes.SERVICE_UNAVAILABLE,
  };

  return statusMap[code] || HttpStatusCodes.INTERNAL_SERVER_ERROR;
}

/**
 * Logs an error with correlation ID for tracking
 */
export function logError(error: Error | ApiError, context?: Record<string, any>): void {
  const correlationId = error instanceof ApiError ? error.correlationId : crypto.randomUUID();
  
  const logData = {
    correlationId,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof ApiError && {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      }),
    },
    context,
  };

  // Log to console (in production, this would go to a logging service)
  console.error('[API Error]', JSON.stringify(logData, null, 2));
}

/**
 * Formats an error for API response
 */
export function formatErrorResponse(error: Error | ApiError) {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
    };
  }

  // Handle unknown errors
  const correlationId = crypto.randomUUID();
  logError(error, { correlationId });

  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    correlationId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response with proper status code
 */
export function createErrorResponse(error: Error | ApiError): Response {
  const statusCode = error instanceof ApiError 
    ? error.statusCode 
    : HttpStatusCodes.INTERNAL_SERVER_ERROR;

  const errorData = formatErrorResponse(error);

  return Response.json(
    {
      success: false,
      error: errorData,
    },
    { status: statusCode }
  );
}

/**
 * Helper function to create ApiError instances
 */
export function createApiError(
  code: ErrorCode | string,
  message: string,
  statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
  details?: any,
  correlationId?: string
): ApiError {
  // Map string codes to ErrorCode
  const errorCode = (ErrorCodes as any)[code] || code as ErrorCode;
  
  const error = new ApiError(errorCode, message, statusCode, details);
  
  // Override correlationId if provided
  if (correlationId) {
    (error as any).correlationId = correlationId;
  }
  
  return error;
}

/**
 * Check if error is retryable based on error code or type
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const retryableCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'ECONNRESET',
    'EPIPE',
    'P2024', // Prisma connection timeout
    'P2034', // Prisma transaction conflict
  ];
  
  const errorCode = error.code || error.message || '';
  return retryableCodes.some(code => errorCode.includes(code));
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes?: number[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @param correlationId - Correlation ID for tracking
 * @returns Promise with the result
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await fetch('/api/data'),
 *   { maxRetries: 3, initialDelay: 100 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  correlationId?: string
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const cid = correlationId || crypto.randomUUID();
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const shouldRetry = 
        attempt < finalConfig.maxRetries &&
        (isRetryableError(error) || 
         (error.statusCode && finalConfig.retryableStatusCodes?.includes(error.statusCode)));
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );
      
      // Log retry attempt
      console.warn(`[Retry] Attempt ${attempt}/${finalConfig.maxRetries} failed, retrying in ${delay}ms`, {
        correlationId: cid,
        error: error.message,
        attempt,
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  throw lastError;
}
