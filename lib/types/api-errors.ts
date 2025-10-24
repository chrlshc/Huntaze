/**
 * API Error Types and Utilities
 * Définitions complètes des erreurs pour l'API Huntaze
 */

/**
 * Base API Error class
 */
export class APIError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly retryable?: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      retryable?: boolean;
      context?: Record<string, any>;
    } = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable;
    this.context = options.context;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

/**
 * AI Service specific errors
 */
export class AIServiceError extends APIError {
  constructor(message: string, options: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    context?: Record<string, any>;
  } = {}) {
    super(message, {
      code: 'AI_SERVICE_ERROR',
      status: 503,
      retryable: true,
      context: options,
    });
    this.name = 'AIServiceError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends APIError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, {
      code: 'VALIDATION_ERROR',
      status: 400,
      retryable: false,
      context,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Network related errors
 */
export class NetworkError extends APIError {
  constructor(message: string, options: {
    timeout?: number;
    retries?: number;
    context?: Record<string, any>;
  } = {}) {
    super(message, {
      code: 'NETWORK_ERROR',
      status: 503,
      retryable: true,
      context: options,
    });
    this.name = 'NetworkError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends APIError {
  public readonly resetTime?: number;
  public readonly limit?: number;
  public readonly remaining?: number;

  constructor(message: string, options: {
    resetTime?: number;
    limit?: number;
    remaining?: number;
    context?: Record<string, any>;
  } = {}) {
    super(message, {
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      retryable: true,
      context: options,
    });
    this.name = 'RateLimitError';
    this.resetTime = options.resetTime;
    this.limit = options.limit;
    this.remaining = options.remaining;
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends APIError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, {
      code: 'AUTHENTICATION_ERROR',
      status: 401,
      retryable: false,
      context,
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends APIError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, {
      code: 'AUTHORIZATION_ERROR',
      status: 403,
      retryable: false,
      context,
    });
    this.name = 'AuthorizationError';
  }
}

/**
 * Circuit breaker errors
 */
export class CircuitBreakerOpenError extends APIError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, {
      code: 'CIRCUIT_BREAKER_OPEN',
      status: 503,
      retryable: true,
      context,
    });
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends APIError {
  constructor(message: string, options: {
    timeout?: number;
    operation?: string;
    context?: Record<string, any>;
  } = {}) {
    super(message, {
      code: 'TIMEOUT_ERROR',
      status: 408,
      retryable: true,
      context: options,
    });
    this.name = 'TimeoutError';
  }
}

/**
 * Utility functions for error handling
 */

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: Error | APIError): boolean {
  if (error instanceof APIError) {
    return error.retryable ?? false;
  }

  // Check for common retryable error patterns
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /ECONNRESET/,
    /ENOTFOUND/,
    /ETIMEDOUT/,
  ];

  return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Calculates retry delay with exponential backoff
 */
export function getRetryDelay(
  error: Error | APIError,
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 10000,
  backoffMultiplier: number = 2
): number {
  // For rate limit errors, use the reset time if available
  if (error instanceof RateLimitError && error.resetTime) {
    return Math.min(error.resetTime - Date.now(), maxDelay);
  }

  // Exponential backoff with jitter
  const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.1 * delay; // 10% jitter
  
  return Math.floor(delay + jitter);
}

/**
 * Enhances an error with additional context
 */
export function enhanceErrorWithContext(
  error: Error,
  context: Record<string, any>
): APIError {
  if (error instanceof APIError) {
    return new APIError(error.message, {
      code: error.code,
      status: error.status,
      retryable: error.retryable,
      context: { ...error.context, ...context },
    });
  }

  return new APIError(error.message, {
    code: 'ENHANCED_ERROR',
    context: { originalError: error.name, ...context },
  });
}

/**
 * Formats error for logging
 */
export function formatErrorForLogging(error: Error | APIError): Record<string, any> {
  const baseInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof APIError) {
    return {
      ...baseInfo,
      code: error.code,
      status: error.status,
      retryable: error.retryable,
      context: error.context,
      timestamp: error.timestamp.toISOString(),
    };
  }

  return baseInfo;
}

/**
 * Determines if an error should be logged
 */
export function shouldLogError(error: Error | APIError): boolean {
  // Don't log validation errors in production (they're user errors)
  if (error instanceof ValidationError && process.env.NODE_ENV === 'production') {
    return false;
  }

  // Don't log authentication errors (they're expected)
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return false;
  }

  // Log all other errors
  return true;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: Error | APIError,
  includeStack: boolean = process.env.NODE_ENV === 'development'
): {
  success: false;
  error: {
    type: string;
    message: string;
    code?: string;
    details?: any;
    stack?: string;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
} {
  const errorInfo = formatErrorForLogging(error);

  return {
    success: false,
    error: {
      type: error.name,
      message: error.message,
      code: error instanceof APIError ? error.code : undefined,
      details: error instanceof APIError ? error.context : undefined,
      ...(includeStack && { stack: error.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: error instanceof APIError ? error.context?.requestId : undefined,
    },
  };
}

/**
 * Error classification for monitoring
 */
export function classifyError(error: Error | APIError): {
  category: 'client' | 'server' | 'network' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertable: boolean;
} {
  if (error instanceof ValidationError || error instanceof AuthenticationError) {
    return { category: 'client', severity: 'low', alertable: false };
  }

  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return { category: 'network', severity: 'medium', alertable: true };
  }

  if (error instanceof AIServiceError) {
    return { category: 'external', severity: 'high', alertable: true };
  }

  if (error instanceof CircuitBreakerOpenError) {
    return { category: 'server', severity: 'critical', alertable: true };
  }

  // Default classification
  return { category: 'server', severity: 'medium', alertable: true };
}

/**
 * Type guards for error checking
 */
export function isAPIError(error: any): error is APIError {
  return error instanceof APIError;
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isRateLimitError(error: any): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isTimeoutError(error: any): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Error aggregation for monitoring
 */
export class ErrorAggregator {
  private errors: Map<string, { count: number; lastSeen: Date; examples: APIError[] }> = new Map();

  addError(error: Error | APIError): void {
    const key = this.getErrorKey(error);
    const existing = this.errors.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
      
      // Keep only last 3 examples
      if (error instanceof APIError) {
        existing.examples.push(error);
        if (existing.examples.length > 3) {
          existing.examples.shift();
        }
      }
    } else {
      this.errors.set(key, {
        count: 1,
        lastSeen: new Date(),
        examples: error instanceof APIError ? [error] : [],
      });
    }
  }

  private getErrorKey(error: Error | APIError): string {
    if (error instanceof APIError && error.code) {
      return `${error.code}:${error.message}`;
    }
    return `${error.name}:${error.message}`;
  }

  getTopErrors(limit: number = 10): Array<{
    key: string;
    count: number;
    lastSeen: Date;
    examples: APIError[];
  }> {
    return Array.from(this.errors.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  reset(): void {
    this.errors.clear();
  }
}

// Export singleton error aggregator
export const errorAggregator = new ErrorAggregator();