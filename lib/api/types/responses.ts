/**
 * API Response Types
 * 
 * Standardized TypeScript types for API responses across the application
 */

import type { ErrorCode } from '../utils/errors';

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  correlationId: string;
  timestamp: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
  correlationId: string;
  timestamp: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: PaginationMeta;
  };
  correlationId: string;
  timestamp: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  correlationId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    correlationId: correlationId || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  perPage: number,
  total: number,
  correlationId?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / perPage);
  
  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    correlationId: correlationId || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Type guard for API response
 */
export function isApiResponse(value: any): value is ApiResponse {
  return (
    value &&
    typeof value === 'object' &&
    'success' in value &&
    'correlationId' in value &&
    'timestamp' in value
  );
}

/**
 * Type guard for paginated response
 */
export function isPaginatedResponse(value: any): value is PaginatedResponse<any> {
  return (
    isApiResponse(value) &&
    value.success &&
    value.data &&
    'items' in value.data &&
    'pagination' in value.data
  );
}

/**
 * Extract data from API response with type safety
 */
export function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'API request failed');
  }
  return response.data;
}

/**
 * Extract items from paginated response
 */
export function extractItems<T>(response: PaginatedResponse<T>): T[] {
  return response.data.items;
}
