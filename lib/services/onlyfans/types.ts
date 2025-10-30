/**
 * OnlyFans Gateway Types
 * 
 * Type definitions for OnlyFans API integration with comprehensive
 * error handling, retry strategies, and authentication support.
 * 
 * @module lib/services/onlyfans/types
 */

// ============================================================================
// Core Data Types
// ============================================================================

export type Conversation = {
  userId: string;
  username: string;
  lastMessage: string;
  unreadCount: number;
  avatarUrl?: string;
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  createdAt: string; // ISO 8601 format
  direction: 'in' | 'out';
};

// ============================================================================
// API Response Types
// ============================================================================

export type ApiResponse<T> = {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId: string;
  };
} | {
  success: false;
  error: ApiError;
  metadata?: {
    timestamp: string;
    requestId: string;
  };
};

export type ApiError = {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
};

export enum ErrorCode {
  // Network errors (retryable)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Auth errors (not retryable)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Client errors (not retryable)
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (retryable)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Business logic errors (not retryable)
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  HUMAN_APPROVAL_REQUIRED = 'HUMAN_APPROVAL_REQUIRED',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Authentication Types
// ============================================================================

export type AuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: 'Bearer';
};

export type AuthCredentials = {
  sessionToken: string;
  cookies?: Record<string, string>;
};

// ============================================================================
// Retry Strategy Types
// ============================================================================

export type RetryConfig = {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
};

export type RetryContext = {
  attempt: number;
  lastError?: ApiError;
  nextRetryDelayMs?: number;
};

// ============================================================================
// Cache Types
// ============================================================================

export type CacheConfig = {
  enabled: boolean;
  ttlMs: number;
  maxSize?: number;
};

export type CacheEntry<T> = {
  data: T;
  cachedAt: number;
  expiresAt: number;
};

// ============================================================================
// Gateway Interface
// ============================================================================

/**
 * OnlyFans Gateway Interface
 * 
 * Provides methods to interact with OnlyFans API with built-in:
 * - Error handling and retry logic
 * - Authentication management
 * - Rate limiting
 * - Caching
 * - Logging
 * 
 * @example
 * ```typescript
 * const gateway = new OnlyFansGatewayImpl(config);
 * 
 * // Get conversations with automatic retry
 * const result = await gateway.getConversations();
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export interface OnlyFansGateway {
  /**
   * Get all conversations for the authenticated user
   * 
   * @returns Promise with conversations or error
   * @throws Never throws - returns error in response
   * 
   * @example
   * ```typescript
   * const result = await gateway.getConversations();
   * if (result.success) {
   *   result.data.forEach(conv => console.log(conv.username));
   * }
   * ```
   */
  getConversations(): Promise<ApiResponse<Conversation[]>>;

  /**
   * Get messages for a specific conversation
   * 
   * @param userId - The user ID to fetch messages for
   * @param cursor - Optional pagination cursor
   * @returns Promise with messages and next cursor
   * 
   * @example
   * ```typescript
   * const result = await gateway.getMessages('user123');
   * if (result.success) {
   *   const { messages, nextCursor } = result.data;
   *   // Load more with: gateway.getMessages('user123', nextCursor);
   * }
   * ```
   */
  getMessages(
    userId: string,
    cursor?: string
  ): Promise<ApiResponse<{ messages: Message[]; nextCursor?: string }>>;

  /**
   * Send a message to a user (requires human approval)
   * 
   * ⚠️ COMPLIANCE: This method requires explicit human approval.
   * The message must be reviewed and approved by a human before sending.
   * 
   * @param userId - The user ID to send message to
   * @param content - The message content (human-approved)
   * @param humanApproval - Explicit human approval metadata
   * @returns Promise with success status
   * 
   * @example
   * ```typescript
   * const result = await gateway.sendMessage(
   *   'user123',
   *   'Thanks for your message!',
   *   {
   *     approvedBy: 'creator-id',
   *     approvedAt: new Date().toISOString(),
   *     wasModified: false
   *   }
   * );
   * ```
   */
  sendMessage(
    userId: string,
    content: string,
    humanApproval: HumanApproval
  ): Promise<ApiResponse<{ messageId: string }>>;

  /**
   * Refresh authentication token
   * 
   * @returns Promise with new auth token
   */
  refreshAuth(): Promise<ApiResponse<AuthToken>>;

  /**
   * Check gateway health and connectivity
   * 
   * @returns Promise with health status
   */
  healthCheck(): Promise<ApiResponse<HealthStatus>>;
}

// ============================================================================
// Compliance Types
// ============================================================================

/**
 * Human approval metadata for message sending
 * Required by OnlyFans compliance rules
 */
export type HumanApproval = {
  approvedBy: string; // Creator user ID
  approvedAt: string; // ISO 8601 timestamp
  wasModified: boolean; // Was AI suggestion modified?
  originalSuggestion?: string; // Original AI suggestion if modified
};

// ============================================================================
// Monitoring Types
// ============================================================================

export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastSuccessfulRequest?: string; // ISO 8601
  errorRate: number; // 0-1
  averageLatencyMs: number;
  rateLimitRemaining?: number;
};

export type RequestMetrics = {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  retryCount: number;
  cached: boolean;
  timestamp: string;
};

// ============================================================================
// Configuration Types
// ============================================================================

export type OnlyFansGatewayConfig = {
  auth: AuthCredentials;
  retry: RetryConfig;
  cache: CacheConfig;
  timeout: number; // Request timeout in ms
  baseUrl?: string; // For testing/mocking
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  rateLimit?: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
};

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT,
    ErrorCode.RATE_LIMIT,
    ErrorCode.INTERNAL_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
  ],
};

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
};

export const DEFAULT_GATEWAY_CONFIG: Partial<OnlyFansGatewayConfig> = {
  retry: DEFAULT_RETRY_CONFIG,
  cache: DEFAULT_CACHE_CONFIG,
  timeout: 30000, // 30 seconds
  logging: {
    enabled: true,
    level: 'info',
  },
  rateLimit: {
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 500,
  },
};
