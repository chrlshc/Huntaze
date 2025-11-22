/**
 * Standardized API Response Types
 * 
 * Provides consistent response structure across all API endpoints.
 * Includes success and error response wrappers with metadata.
 * 
 * Usage:
 * ```typescript
 * import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api/types/responses';
 * 
 * // Success response
 * return NextResponse.json<ApiSuccessResponse<UserData>>(
 *   createSuccessResponse(userData, { correlationId })
 * );
 * 
 * // Error response
 * return NextResponse.json<ApiErrorResponse>(
 *   createErrorResponse('User not found', 'NOT_FOUND', { correlationId })
 * );
 * ```
 */

/**
 * Response metadata
 */
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  duration?: number;
  version?: string;
}

/**
 * Success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

/**
 * Error details
 */
export interface ErrorDetails {
  code: string;
  message: string;
  retryable?: boolean;
  severity?: string;
  metadata?: Record<string, any>;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: ErrorDetails;
  meta: ResponseMeta;
}

/**
 * Generic API response (union type)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta: ResponseMeta;
}

/**
 * Options for creating responses
 */
export interface ResponseOptions {
  correlationId?: string;
  startTime?: number;
  version?: string;
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  options: ResponseOptions = {}
): ApiSuccessResponse<T> {
  const { correlationId, startTime, version } = options;
  const timestamp = new Date().toISOString();
  const duration = startTime ? Date.now() - startTime : undefined;

  return {
    success: true,
    data,
    meta: {
      timestamp,
      requestId: correlationId || generateRequestId(),
      ...(duration !== undefined && { duration }),
      ...(version && { version }),
    },
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  options: ResponseOptions & {
    retryable?: boolean;
    severity?: string;
    metadata?: Record<string, any>;
  } = {}
): ApiErrorResponse {
  const { correlationId, startTime, version, retryable, severity, metadata } = options;
  const timestamp = new Date().toISOString();
  const duration = startTime ? Date.now() - startTime : undefined;

  return {
    success: false,
    error: {
      code,
      message,
      ...(retryable !== undefined && { retryable }),
      ...(severity && { severity }),
      ...(metadata && { metadata }),
    },
    meta: {
      timestamp,
      requestId: correlationId || generateRequestId(),
      ...(duration !== undefined && { duration }),
      ...(version && { version }),
    },
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  options: ResponseOptions = {}
): PaginatedResponse<T> {
  const { correlationId, startTime, version } = options;
  const timestamp = new Date().toISOString();
  const duration = startTime ? Date.now() - startTime : undefined;

  return {
    success: true,
    data,
    pagination,
    meta: {
      timestamp,
      requestId: correlationId || generateRequestId(),
      ...(duration !== undefined && { duration }),
      ...(version && { version }),
    },
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Type guard for success response
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard for error response
 */
export function isErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Extract data from response or throw error
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }

  throw new Error(response.error.message);
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
