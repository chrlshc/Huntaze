/**
 * TikTok Service - TypeScript Types
 * 
 * Comprehensive type definitions for TikTok API integration
 */

// ============================================================================
// Error Types
// ============================================================================

export enum TikTokErrorType {
  // Network & Infrastructure
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication & Authorization
  AUTH_ERROR = 'AUTH_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SCOPE_NOT_AUTHORIZED = 'SCOPE_NOT_AUTHORIZED',
  
  // Rate Limiting & Quotas
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAM = 'INVALID_PARAM',
  
  // API Errors
  API_ERROR = 'API_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Upload Specific
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  URL_OWNERSHIP_UNVERIFIED = 'URL_OWNERSHIP_UNVERIFIED',
}

export interface TikTokError extends Error {
  type: TikTokErrorType;
  correlationId: string;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;
  logId?: string;
  timestamp: Date;
  originalError?: Error;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface TikTokAuthUrl {
  url: string;
  state: string;
  codeVerifier?: string; // PKCE code verifier (optional)
}

export interface TikTokTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Seconds (typically 86400 = 24h)
  refresh_expires_in: number; // Seconds (typically 31536000 = 365d)
  open_id: string;
  scope: string;
  token_type: string;
}

export interface TikTokRefreshResponse {
  access_token: string;
  refresh_token?: string; // May rotate
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

// ============================================================================
// Token Management Types
// ============================================================================

export interface TokenData {
  token: string;
  tokenType: string;
  expiresAt: number; // Timestamp in milliseconds
  refreshedAt: number; // Timestamp in milliseconds
  userId: string;
  refreshToken?: string;
  refreshExpiresAt?: number; // Timestamp in milliseconds
}

export interface TokenInfo {
  userId: string;
  token: string;
  tokenType: string;
  expiresAt: number; // Timestamp in milliseconds
  refreshedAt: number; // Timestamp in milliseconds
}

// ============================================================================
// Upload Types
// ============================================================================

export type UploadSource = 'FILE_UPLOAD' | 'PULL_FROM_URL';

export type UploadStatus = 
  | 'PROCESSING_UPLOAD' 
  | 'SEND_TO_USER_INBOX' 
  | 'PUBLISH_COMPLETE' 
  | 'FAILED';

export type PrivacyLevel = 
  | 'PUBLIC_TO_EVERYONE' 
  | 'MUTUAL_FOLLOW_FRIENDS' 
  | 'SELF_ONLY';

export interface PostInfo {
  title: string;
  privacy_level: PrivacyLevel;
  disable_duet?: boolean;
  disable_comment?: boolean;
  disable_stitch?: boolean;
  video_cover_timestamp_ms?: number;
  brand_content_toggle?: boolean;
  brand_organic_toggle?: boolean;
}

export interface InitUploadParams {
  accessToken: string;
  source: UploadSource;
  videoUrl?: string; // Required for PULL_FROM_URL
  postInfo: PostInfo;
}

export interface InitUploadResponse {
  publish_id: string;
  upload_url?: string; // Only for FILE_UPLOAD
}

export interface UploadStatusResponse {
  status: UploadStatus;
  fail_reason?: string;
  publicaly_available_post_id?: string[];
}

export interface UploadChunkParams {
  uploadUrl: string;
  chunk: Buffer;
  chunkIndex: number;
  totalChunks: number;
}

// ============================================================================
// Video Query Types
// ============================================================================

export interface VideoQueryParams {
  fields: string[];
  max_count?: number; // 1-20, default 20
  cursor?: string;
}

export interface VideoInfo {
  id: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  title: string;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface VideoListResponse {
  videos: VideoInfo[];
  cursor?: string;
  has_more: boolean;
}

// ============================================================================
// Circuit Breaker Types
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  lastFailureTime: number | null;
  lastStateChange: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold?: number;
  timeout?: number; // Alias for resetTimeout
  resetTimeout: number;
  monitoringPeriod: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface TikTokAPIResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    log_id?: string;
  };
}

export interface TikTokErrorResponse {
  error?: string;
  error_description?: string;
  message?: string;
  data?: {
    error?: {
      code: string;
      message: string;
      log_id?: string;
    };
  };
}
