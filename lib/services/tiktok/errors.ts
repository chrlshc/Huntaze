/**
 * TikTok Service - Structured Error Handling
 * 
 * Provides user-friendly error messages and retry logic
 */

import { TikTokError, TikTokErrorType } from './types';

/**
 * Create structured TikTok error
 */
export function createTikTokError(
  type: TikTokErrorType,
  message: string,
  correlationId: string,
  retryable: boolean = false,
  statusCode?: number,
  logId?: string
): TikTokError {
  const error = new Error(message) as TikTokError;
  error.type = type;
  error.correlationId = correlationId;
  error.userMessage = getUserMessage(type, message);
  error.retryable = retryable;
  error.statusCode = statusCode;
  error.logId = logId;
  error.timestamp = new Date();
  return error;
}

/**
 * Get user-friendly error message
 */
function getUserMessage(type: TikTokErrorType, technicalMessage: string): string {
  switch (type) {
    case TikTokErrorType.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection and try again.';
    
    case TikTokErrorType.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.';
    
    case TikTokErrorType.AUTH_ERROR:
      return 'Authentication failed. Please reconnect your TikTok account.';
    
    case TikTokErrorType.TOKEN_EXPIRED:
      return 'Your TikTok session has expired. Please reconnect your account.';
    
    case TikTokErrorType.INVALID_TOKEN:
      return 'Invalid TikTok access token. Please reconnect your account.';
    
    case TikTokErrorType.INVALID_CREDENTIALS:
      return 'Invalid TikTok credentials. Please check your configuration.';
    
    case TikTokErrorType.SCOPE_NOT_AUTHORIZED:
      return 'Missing required permissions. Please reconnect with the necessary permissions.';
    
    case TikTokErrorType.RATE_LIMIT_ERROR:
      return 'Too many requests. Please wait a moment and try again.';
    
    case TikTokErrorType.QUOTA_EXCEEDED:
      return 'Upload quota exceeded. Please try again later.';
    
    case TikTokErrorType.VALIDATION_ERROR:
      return `Validation error: ${technicalMessage}`;
    
    case TikTokErrorType.INVALID_PARAM:
      return `Invalid parameters: ${technicalMessage}`;
    
    case TikTokErrorType.UPLOAD_ERROR:
      return 'Video upload failed. Please try again.';
    
    case TikTokErrorType.URL_OWNERSHIP_UNVERIFIED:
      return 'Video URL ownership not verified. Please use a verified domain.';
    
    case TikTokErrorType.SERVER_ERROR:
      return 'TikTok server error. Please try again later.';
    
    case TikTokErrorType.API_ERROR:
    default:
      return 'An error occurred with TikTok. Please try again.';
  }
}

/**
 * Map TikTok API error code to error type
 */
export function mapErrorCode(errorCode: string, statusCode: number): TikTokErrorType {
  // Authentication errors
  if (errorCode === 'access_token_invalid' || errorCode === 'invalid_token') {
    return TikTokErrorType.INVALID_TOKEN;
  }
  if (errorCode === 'token_expired') {
    return TikTokErrorType.TOKEN_EXPIRED;
  }
  if (errorCode === 'invalid_client' || errorCode === 'invalid_credentials') {
    return TikTokErrorType.INVALID_CREDENTIALS;
  }
  if (errorCode === 'scope_not_authorized') {
    return TikTokErrorType.SCOPE_NOT_AUTHORIZED;
  }
  
  // Rate limiting
  if (errorCode === 'rate_limit_exceeded' || statusCode === 429) {
    return TikTokErrorType.RATE_LIMIT_ERROR;
  }
  if (errorCode === 'spam_risk_too_many_pending_share') {
    return TikTokErrorType.QUOTA_EXCEEDED;
  }
  
  // Validation
  if (errorCode === 'invalid_param' || errorCode === 'invalid_request') {
    return TikTokErrorType.INVALID_PARAM;
  }
  
  // Upload errors
  if (errorCode === 'url_ownership_unverified') {
    return TikTokErrorType.URL_OWNERSHIP_UNVERIFIED;
  }
  
  // Server errors
  if (errorCode === 'server_error' || statusCode >= 500) {
    return TikTokErrorType.SERVER_ERROR;
  }
  
  // Default
  return TikTokErrorType.API_ERROR;
}

/**
 * Check if error is retryable
 */
export function isRetryable(errorType: TikTokErrorType, statusCode?: number): boolean {
  // Retry on network errors, timeouts, and server errors
  if (
    errorType === TikTokErrorType.NETWORK_ERROR ||
    errorType === TikTokErrorType.TIMEOUT_ERROR ||
    errorType === TikTokErrorType.SERVER_ERROR ||
    errorType === TikTokErrorType.API_ERROR
  ) {
    return true;
  }
  
  // Retry on 5xx errors
  if (statusCode && statusCode >= 500) {
    return true;
  }
  
  // Don't retry on auth, validation, or rate limit errors
  return false;
}
