/**
 * Integrations Management Types
 * 
 * Shared types for the integrations management system with comprehensive
 * error handling, retry strategies, and API response types.
 * 
 * Requirements: 11.1, 11.2, 11.4
 */

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Supported OAuth providers
 */
export type Provider = 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  supportsRefreshToken: boolean;
  supportsRevoke: boolean;
  requiresPKCE: boolean;
  tokenType: 'oauth' | 'cookie';
}

/**
 * Provider capabilities map
 */
export const PROVIDER_CAPABILITIES: Record<Provider, ProviderCapabilities> = {
  instagram: {
    supportsRefreshToken: true,
    supportsRevoke: true,
    requiresPKCE: false,
    tokenType: 'oauth',
  },
  tiktok: {
    supportsRefreshToken: true,
    supportsRevoke: false,
    requiresPKCE: true,
    tokenType: 'oauth',
  },
  reddit: {
    supportsRefreshToken: true,
    supportsRevoke: false,
    requiresPKCE: false,
    tokenType: 'oauth',
  },
  onlyfans: {
    supportsRefreshToken: false,
    supportsRevoke: false,
    requiresPKCE: false,
    tokenType: 'cookie',
  },
};

// ============================================================================
// Integration Types
// ============================================================================

/**
 * Integration status
 */
export type IntegrationStatus = 'connected' | 'expired' | 'error' | 'disconnected';

/**
 * Integration with full metadata
 */
export interface Integration {
  id?: number;
  provider: Provider;
  providerAccountId: string;
  isConnected: boolean;
  status: IntegrationStatus;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  errorMessage?: string;
}

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * OAuth configuration for a provider
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  revokeEndpoint?: string;
}

/**
 * OAuth authorization result
 */
export interface OAuthResult {
  authUrl: string;
  state: string;
  codeVerifier?: string; // For PKCE (TikTok)
  expiresAt?: Date;
}

/**
 * Token response from OAuth provider
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
  issuedAt?: Date;
}

/**
 * Account information from provider
 */
export interface AccountInfo {
  providerAccountId: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  email?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for integrations service
 */
export enum IntegrationErrorCode {
  // Provider errors
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
  
  // OAuth errors
  OAUTH_INIT_ERROR = 'OAUTH_INIT_ERROR',
  OAUTH_CALLBACK_ERROR = 'OAUTH_CALLBACK_ERROR',
  INVALID_STATE = 'INVALID_STATE',
  INVALID_CODE = 'INVALID_CODE',
  
  // Token errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REFRESH_ERROR = 'TOKEN_REFRESH_ERROR',
  NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN',
  NO_ACCESS_TOKEN = 'NO_ACCESS_TOKEN',
  TOKEN_REVOKE_ERROR = 'TOKEN_REVOKE_ERROR',
  
  // Account errors
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  ACCOUNT_ALREADY_CONNECTED = 'ACCOUNT_ALREADY_CONNECTED',
  DISCONNECT_ERROR = 'DISCONNECT_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Encryption errors
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Integration service error with metadata
 */
export interface IntegrationsServiceError extends Error {
  code: IntegrationErrorCode;
  provider?: Provider;
  retryable: boolean;
  statusCode?: number;
  correlationId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Create an integration error
 */
export function createIntegrationError(
  code: IntegrationErrorCode,
  message: string,
  options?: {
    provider?: Provider;
    statusCode?: number;
    correlationId?: string;
    metadata?: Record<string, any>;
    cause?: Error;
  }
): IntegrationsServiceError {
  const error = new Error(message) as IntegrationsServiceError;
  error.code = code;
  error.provider = options?.provider;
  error.statusCode = options?.statusCode;
  error.correlationId = options?.correlationId;
  error.timestamp = new Date();
  error.metadata = options?.metadata;
  
  // Determine if error is retryable
  error.retryable = [
    IntegrationErrorCode.NETWORK_ERROR,
    IntegrationErrorCode.TIMEOUT_ERROR,
    IntegrationErrorCode.API_ERROR,
    IntegrationErrorCode.DATABASE_ERROR,
  ].includes(code);
  
  if (options?.cause) {
    error.cause = options.cause;
  }
  
  return error;
}

// ============================================================================
// Retry Strategy Types
// ============================================================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: IntegrationErrorCode[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    IntegrationErrorCode.NETWORK_ERROR,
    IntegrationErrorCode.TIMEOUT_ERROR,
    IntegrationErrorCode.API_ERROR,
    IntegrationErrorCode.DATABASE_ERROR,
  ],
};

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: IntegrationsServiceError;
  attempts: number;
  duration: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    correlationId?: string;
    duration?: number;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Integration status API response
 * 
 * Response from GET /api/integrations/status
 * Includes all connected accounts with summary statistics
 */
export interface IntegrationStatusApiResponse extends ApiResponse<{
  integrations: IntegrationApiData[];
  summary: IntegrationSummary;
}> {}

/**
 * Integration data from API (serialized format)
 * 
 * Represents a single connected account as returned by the API
 */
export interface IntegrationApiData {
  id: number;
  provider: Provider;
  accountId: string;
  accountName: string;
  status: IntegrationStatus;
  expiresAt?: string; // ISO 8601 string
  metadata?: IntegrationMetadata;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  error?: string;
}

/**
 * Integration metadata
 * 
 * Provider-specific metadata for each account
 */
export interface IntegrationMetadata {
  username?: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  businessAccount?: boolean;
  [key: string]: any;
}

/**
 * Integration summary statistics
 * 
 * Aggregated statistics across all integrations
 */
export interface IntegrationSummary {
  total: number;
  connected: number;
  expired: number;
  error: number;
  byProvider: Partial<Record<Provider, number>>;
  multiAccountProviders: Provider[];
}

/**
 * Connect integration API response
 * 
 * Response from POST /api/integrations/connect/:provider
 */
export interface ConnectIntegrationApiResponse extends ApiResponse<{
  authUrl: string;
  state: string;
  expiresAt: string; // ISO 8601 string
  provider: Provider;
}> {}

/**
 * OAuth callback API response
 * 
 * Response from GET /api/integrations/callback/:provider
 */
export interface OAuthCallbackApiResponse extends ApiResponse<{
  provider: Provider;
  accountId: string;
  accountName: string;
  redirectUrl: string;
}> {}

/**
 * Disconnect integration API response
 * 
 * Response from DELETE /api/integrations/disconnect/:provider/:accountId
 */
export interface DisconnectIntegrationApiResponse extends ApiResponse<{
  provider: Provider;
  accountId: string;
  message: string;
}> {}

/**
 * Refresh token API response
 * 
 * Response from POST /api/integrations/refresh/:provider/:accountId
 */
export interface RefreshTokenApiResponse extends ApiResponse<{
  provider: Provider;
  accountId: string;
  expiresAt: string; // ISO 8601 string
  message: string;
}> {}

// ============================================================================
// Logging Types
// ============================================================================

/**
 * Log level
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log metadata
 */
export interface LogMetadata {
  correlationId?: string;
  userId?: number;
  provider?: Provider;
  accountId?: string;
  duration?: number;
  attempt?: number;
  [key: string]: any;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl: number; // Time to live in seconds
  key: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if error is IntegrationsServiceError
 */
export function isIntegrationError(error: any): error is IntegrationsServiceError {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'retryable' in error &&
    'timestamp' in error
  );
}

/**
 * Check if response is successful API response
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Check if response is error API response
 */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false; error: NonNullable<ApiResponse<T>['error']> } {
  return response.success === false && response.error !== undefined;
}

/**
 * Check if integration data is valid
 */
export function isValidIntegrationData(data: any): data is IntegrationApiData {
  return (
    data &&
    typeof data === 'object' &&
    'id' in data &&
    'provider' in data &&
    'accountId' in data &&
    'status' in data &&
    'createdAt' in data &&
    'updatedAt' in data
  );
}

/**
 * Check if provider has multiple accounts
 */
export function isMultiAccountProvider(
  provider: Provider,
  integrations: IntegrationApiData[]
): boolean {
  const providerIntegrations = integrations.filter(
    (int) => int.provider === provider
  );
  return providerIntegrations.length > 1;
}

/**
 * Get all multi-account providers
 */
export function getMultiAccountProviders(
  integrations: IntegrationApiData[]
): Provider[] {
  const providerCounts = integrations.reduce((acc, int) => {
    acc[int.provider] = (acc[int.provider] || 0) + 1;
    return acc;
  }, {} as Record<Provider, number>);
  
  return Object.entries(providerCounts)
    .filter(([_, count]) => count > 1)
    .map(([provider]) => provider as Provider);
}

/**
 * Check if provider supports refresh tokens
 */
export function supportsRefreshToken(provider: Provider): boolean {
  return PROVIDER_CAPABILITIES[provider].supportsRefreshToken;
}

/**
 * Check if provider supports token revocation
 */
export function supportsRevoke(provider: Provider): boolean {
  return PROVIDER_CAPABILITIES[provider].supportsRevoke;
}

/**
 * Check if provider requires PKCE
 */
export function requiresPKCE(provider: Provider): boolean {
  return PROVIDER_CAPABILITIES[provider].requiresPKCE;
}
