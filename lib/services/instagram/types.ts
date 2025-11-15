/**
 * Instagram OAuth Service - Type Definitions
 * 
 * Centralized type definitions for Instagram OAuth integration
 */

// ============================================================================
// Error Types
// ============================================================================

export enum InstagramErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

export interface InstagramError {
  type: InstagramErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  correlationId?: string;
  statusCode?: number;
  originalError?: Error;
  timestamp: string;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface InstagramAuthUrl {
  url: string;
  state: string;
}

export interface InstagramTokens {
  access_token: string;
  token_type: string;
  expires_in?: number; // Short-lived tokens expire in ~2 hours
}

export interface InstagramLongLivedToken {
  access_token: string;
  token_type: string;
  expires_in: number; // Long-lived tokens expire in 60 days
}

// ============================================================================
// Account Types
// ============================================================================

export interface InstagramPage {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

export interface InstagramAccountInfo {
  user_id: string;
  access_token: string;
  pages: InstagramPage[];
}

export interface InstagramAccountDetails {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

// ============================================================================
// Token Management Types
// ============================================================================

export interface TokenData {
  token: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp
  refreshedAt: number; // Unix timestamp
  userId: string;
}

export interface TokenRefreshResult {
  success: boolean;
  token?: string;
  expiresAt?: number;
  error?: InstagramError;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface FacebookErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookUserResponse {
  id: string;
  name?: string;
  email?: string;
}

export interface FacebookPagesResponse {
  data: InstagramPage[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}
