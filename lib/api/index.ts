/**
 * API Utilities - Main Export
 * Centralized exports for API infrastructure
 */

// API Client (new)
export { 
  ApiClient, 
  apiClient, 
  createApiClient,
  clearCache as clearApiCache,
  clearCacheEntry,
  type RequestOptions,
} from './client/api-client';

// Response utilities
export {
  successResponse,
  successResponseWithStatus,
  errorResponse,
  errorResponseWithStatus,
  paginatedResponse,
  // Convenience methods
  ok,
  created,
  accepted,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  serviceUnavailable,
} from './utils/response';
export type {
  ApiResponse,
  PaginatedResponse,
  ResponseOptions,
} from './utils/response';

// Response types (new)
export type {
  ApiResponse as ApiResponseV2,
  ApiErrorResponse,
  PaginatedResponse as PaginatedResponseV2,
  PaginationMeta,
} from './types/responses';

export {
  createSuccessResponse,
  createPaginatedResponse,
  isApiResponse,
  isPaginatedResponse,
  extractData,
  extractItems,
} from './types/responses';

// Error utilities
export {
  ErrorCodes,
  HttpStatusCodes,
  ApiError,
  getStatusCodeForError,
  logError,
  formatErrorResponse,
  createErrorResponse,
  createApiError,
  isRetryableError,
  retryWithBackoff,
  DEFAULT_RETRY_CONFIG,
} from './utils/errors';
export type {
  ErrorCode,
  RetryConfig,
} from './utils/errors';

// Cache utilities
export {
  getCached,
  invalidateCache,
  invalidateCacheKey,
  isRedisAvailable,
  getCacheStats,
  clearAllCache,
} from './utils/cache';
export type {
  CacheOptions,
} from './utils/cache';

// Authentication middleware
export {
  withAuth,
  withOnboarding,
  withOptionalAuth,
} from './middleware/auth';
export type {
  AuthenticatedRequest,
  AuthenticatedHandler,
} from './middleware/auth';

// Rate limiting middleware
export {
  withRateLimit,
  rateLimitPresets,
  limiter,
} from './middleware/rate-limit';

// Validation middleware
export {
  withValidation,
  withSanitization,
  validators,
  validateQueryParams,
} from './middleware/validation';
export type {
  ValidationSchema,
  ValidationResult,
  ValidationError,
  FieldValidator,
} from './middleware/validation';
