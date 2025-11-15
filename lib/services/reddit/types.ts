/**
 * Reddit OAuth Service - Type Definitions
 */

export enum RedditErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

export interface RedditError {
  type: RedditErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  correlationId?: string;
  statusCode?: number;
  originalError?: Error;
  timestamp: string;
}

export interface RedditAuthUrl {
  url: string;
  state: string;
}

export interface RedditTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface RedditUserInfo {
  id: string;
  name: string;
  icon_img: string;
  created_utc: number;
  link_karma: number;
  comment_karma: number;
}

export interface RedditSubreddit {
  name: string;
  display_name: string;
  subscribers: number;
  public_description: string;
}

export interface TokenData {
  token: string;
  tokenType: string;
  expiresAt: number;
  refreshedAt: number;
  userId: string;
  refreshToken?: string;
}

export interface RedditErrorResponse {
  error: string;
  error_description?: string;
  message?: string;
}
