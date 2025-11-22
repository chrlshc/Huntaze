/**
 * Standardized API Response Utilities
 * 
 * Provides consistent response formats across all API endpoints with:
 * - Type-safe response structures
 * - Correlation ID tracking for debugging
 * - Performance metrics
 * - Error handling with retry information
 * - Pagination support
 * - Cache control headers
 * 
 * @module lib/api/utils/response
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-response');

// ============================================================================
// Response Types
// ============================================================================

/**
 * Standard API response structure
 * @template T - Type of the response data
 */
export interface ApiResponse<T = any> {
  /** Indicates if the request was successful */
  success: boolean;
  
  /** Response data (only present on success) */
  data?: T;
  
  /** Error information (only present on failure) */
  error?: {
    /** Machine-readable error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: any;
    /** Whether the request can be retried */
    retryable?: boolean;
    /** Suggested retry delay in seconds */
    retryAfter?: number;
  };
  
  /** Response metadata */
  meta: {
    /** ISO 8601 timestamp */
    timestamp: string;
    /** Unique request identifier for tracing */
    requestId: string;
    /** Request duration in milliseconds */
    duration?: number;
    /** API version */
    version?: string;
  };
}

/**
 * Paginated API response structure
 * @template T - Type of the items in the response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    /** Total number of items across all pages */
    total: number;
    /** Number of items per page */
    limit: number;
    /** Current offset */
    offset: number;
    /** Current page number (1-indexed) */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there are more pages */
    hasMore: boolean;
    /** Link to next page (if available) */
    nextPage?: string;
    /** Link to previous page (if available) */
    prevPage?: string;
  };
}

/**
 * Response options for customization
 */
export interface ResponseOptions {
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Request start time for duration calculation */
  startTime?: number;
  /** API version */
  version?: string;
  /** Cache control directives */
  cache?: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    public?: boolean;
  };
  /** Additional headers to include */
  headers?: Record<string, string>;
}

// ============================================================================
// Success Response Builders
// ============================================================================

/**
 * Creates a successful API response with metadata
 * 
 * @template T - Type of the response data
 * @param data - The response data
 * @param options - Response customization options
 * @returns Standardized success response
 * 
 * @example
 * ```typescript
 * return Response.json(
 *   successResponse({ user: { id: '123', name: 'John' } }, {
 *     correlationId: 'req-123',
 *     startTime: Date.now(),
 *   })
 * );
 * ```
 */
export function successResponse<T>(
  data: T,
  options: ResponseOptions = {}
): ApiResponse<T> {
  const requestId = options.correlationId || generateRequestId();
  const duration = options.startTime ? Date.now() - options.startTime : undefined;

  logger.info('API response success', {
    requestId,
    duration,
    hasData: data !== null && data !== undefined,
  });

  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      duration,
      version: options.version || process.env.API_VERSION || '1.0',
    },
  };
}

/**
 * Creates a successful response with custom status code
 * Useful for 201 Created, 202 Accepted, etc.
 * 
 * @template T - Type of the response data
 * @param data - The response data
 * @param statusCode - HTTP status code
 * @param options - Response customization options
 * @returns Response object with custom status
 * 
 * @example
 * ```typescript
 * return successResponseWithStatus(
 *   { id: '123', status: 'created' },
 *   201,
 *   { correlationId: 'req-123' }
 * );
 * ```
 */
export function successResponseWithStatus<T>(
  data: T,
  statusCode: number,
  options: ResponseOptions = {}
): Response {
  const response = successResponse(data, options);
  const headers = buildResponseHeaders(options);

  return Response.json(response, {
    status: statusCode,
    headers,
  });
}

// ============================================================================
// Error Response Builders
// ============================================================================

/**
 * Creates an error API response with retry information
 * 
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param options - Response customization options
 * @returns Standardized error response
 * 
 * @example
 * ```typescript
 * return Response.json(
 *   errorResponse('VALIDATION_ERROR', 'Invalid email format', {
 *     field: 'email',
 *     value: 'invalid',
 *   }),
 *   { status: 400 }
 * );
 * ```
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any,
  options: ResponseOptions = {}
): ApiResponse {
  const requestId = options.correlationId || generateRequestId();
  const duration = options.startTime ? Date.now() - options.startTime : undefined;

  // Determine if error is retryable based on code
  const retryable = isRetryableError(code);
  const retryAfter = retryable ? getRetryDelay(code) : undefined;

  logger.warn('API response error', {
    requestId,
    code,
    message,
    retryable,
    duration,
  });

  return {
    success: false,
    error: {
      code,
      message,
      details,
      retryable,
      retryAfter,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      duration,
      version: options.version || process.env.API_VERSION || '1.0',
    },
  };
}

/**
 * Creates an error response with appropriate HTTP status code
 * 
 * @param code - Error code
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Optional error details
 * @param options - Response customization options
 * @returns Response object with error
 * 
 * @example
 * ```typescript
 * return errorResponseWithStatus(
 *   'UNAUTHORIZED',
 *   'Authentication required',
 *   401,
 *   { redirectTo: '/auth' }
 * );
 * ```
 */
export function errorResponseWithStatus(
  code: string,
  message: string,
  statusCode: number,
  details?: any,
  options: ResponseOptions = {}
): Response {
  const response = errorResponse(code, message, details, options);
  const headers = buildResponseHeaders(options);

  // Add Retry-After header for rate limiting
  if (response.error?.retryAfter) {
    headers['Retry-After'] = response.error.retryAfter.toString();
  }

  return Response.json(response, {
    status: statusCode,
    headers,
  });
}

// ============================================================================
// Pagination Response Builders
// ============================================================================

/**
 * Creates a paginated API response with navigation links
 * 
 * @template T - Type of the items
 * @param items - Array of items for current page
 * @param total - Total number of items across all pages
 * @param limit - Number of items per page
 * @param offset - Current offset
 * @param baseUrl - Base URL for pagination links
 * @param options - Response customization options
 * @returns Standardized paginated response
 * 
 * @example
 * ```typescript
 * return Response.json(
 *   paginatedResponse(
 *     users,
 *     totalCount,
 *     20,
 *     0,
 *     '/api/users'
 *   )
 * );
 * ```
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
  baseUrl?: string,
  options: ResponseOptions = {}
): PaginatedResponse<T> {
  const requestId = options.correlationId || generateRequestId();
  const duration = options.startTime ? Date.now() - options.startTime : undefined;

  // Calculate pagination metadata
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasMore = offset + items.length < total;

  // Generate navigation links if baseUrl provided
  const nextPage = hasMore && baseUrl
    ? `${baseUrl}?limit=${limit}&offset=${offset + limit}`
    : undefined;
  
  const prevPage = offset > 0 && baseUrl
    ? `${baseUrl}?limit=${limit}&offset=${Math.max(0, offset - limit)}`
    : undefined;

  logger.info('API paginated response', {
    requestId,
    itemCount: items.length,
    total,
    page,
    totalPages,
    duration,
  });

  return {
    success: true,
    data: items,
    pagination: {
      total,
      limit,
      offset,
      page,
      totalPages,
      hasMore,
      nextPage,
      prevPage,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      duration,
      version: options.version || process.env.API_VERSION || '1.0',
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Determines if an error code represents a retryable error
 */
function isRetryableError(code: string): boolean {
  const retryableCodes = [
    'RATE_LIMIT_ERROR',
    'TIMEOUT_ERROR',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ];
  
  return retryableCodes.includes(code);
}

/**
 * Gets suggested retry delay for error code
 */
function getRetryDelay(code: string): number | undefined {
  const delays: Record<string, number> = {
    'RATE_LIMIT_ERROR': 60,      // 1 minute
    'TIMEOUT_ERROR': 5,           // 5 seconds
    'NETWORK_ERROR': 10,          // 10 seconds
    'SERVICE_UNAVAILABLE': 30,    // 30 seconds
    'INTERNAL_ERROR': 15,         // 15 seconds
  };
  
  return delays[code];
}

/**
 * Builds response headers from options
 */
function buildResponseHeaders(options: ResponseOptions): Record<string, string> {
  const requestId = options.correlationId || generateRequestId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Correlation-Id': requestId, // Also include for compatibility
    ...options.headers,
  };

  // Add cache control headers if specified
  if (options.cache) {
    const cacheDirectives: string[] = [];
    
    if (options.cache.public) {
      cacheDirectives.push('public');
    } else {
      cacheDirectives.push('private');
    }
    
    if (options.cache.maxAge !== undefined) {
      cacheDirectives.push(`max-age=${options.cache.maxAge}`);
    }
    
    if (options.cache.sMaxAge !== undefined) {
      cacheDirectives.push(`s-maxage=${options.cache.sMaxAge}`);
    }
    
    if (options.cache.staleWhileRevalidate !== undefined) {
      cacheDirectives.push(`stale-while-revalidate=${options.cache.staleWhileRevalidate}`);
    }
    
    if (cacheDirectives.length > 0) {
      headers['Cache-Control'] = cacheDirectives.join(', ');
    }
  }

  return headers;
}

// ============================================================================
// Convenience Response Builders
// ============================================================================

/**
 * Creates a 200 OK response
 */
export function ok<T>(data: T, options?: ResponseOptions): Response {
  return successResponseWithStatus(data, 200, options);
}

/**
 * Creates a 201 Created response
 */
export function created<T>(data: T, options?: ResponseOptions): Response {
  return successResponseWithStatus(data, 201, options);
}

/**
 * Creates a 202 Accepted response
 */
export function accepted<T>(data: T, options?: ResponseOptions): Response {
  return successResponseWithStatus(data, 202, options);
}

/**
 * Creates a 204 No Content response
 */
export function noContent(options?: ResponseOptions): Response {
  const headers = buildResponseHeaders(options || {});
  return new Response(null, { status: 204, headers });
}

/**
 * Creates a 400 Bad Request response
 */
export function badRequest(message: string, details?: any, options?: ResponseOptions): Response {
  return errorResponseWithStatus('BAD_REQUEST', message, 400, details, options);
}

/**
 * Creates a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Authentication required', options?: ResponseOptions): Response {
  return errorResponseWithStatus('UNAUTHORIZED', message, 401, undefined, options);
}

/**
 * Creates a 403 Forbidden response
 */
export function forbidden(message: string = 'Access denied', options?: ResponseOptions): Response {
  return errorResponseWithStatus('FORBIDDEN', message, 403, undefined, options);
}

/**
 * Creates a 404 Not Found response
 */
export function notFound(resource: string = 'Resource', options?: ResponseOptions): Response {
  return errorResponseWithStatus('NOT_FOUND', `${resource} not found`, 404, undefined, options);
}

/**
 * Creates a 409 Conflict response
 */
export function conflict(message: string, details?: any, options?: ResponseOptions): Response {
  return errorResponseWithStatus('CONFLICT', message, 409, details, options);
}

/**
 * Creates a 422 Unprocessable Entity response
 */
export function unprocessableEntity(message: string, details?: any, options?: ResponseOptions): Response {
  return errorResponseWithStatus('VALIDATION_ERROR', message, 422, details, options);
}

/**
 * Creates a 429 Too Many Requests response
 */
export function tooManyRequests(retryAfter: number = 60, options?: ResponseOptions): Response {
  return errorResponseWithStatus(
    'RATE_LIMIT_ERROR',
    'Too many requests. Please try again later.',
    429,
    { retryAfter },
    options
  );
}

/**
 * Creates a 500 Internal Server Error response
 */
export function internalServerError(message: string = 'Internal server error', options?: ResponseOptions): Response {
  return errorResponseWithStatus('INTERNAL_ERROR', message, 500, undefined, options);
}

/**
 * Creates a 503 Service Unavailable response
 */
export function serviceUnavailable(message: string = 'Service temporarily unavailable', options?: ResponseOptions): Response {
  return errorResponseWithStatus('SERVICE_UNAVAILABLE', message, 503, undefined, options);
}
