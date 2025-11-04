/**
 * Core types and interfaces for OAuth credentials validation framework
 */

// Platform types
export type Platform = 'tiktok' | 'instagram' | 'reddit';

// Validation result interfaces
export interface CredentialValidationResult {
  isValid: boolean;
  platform: Platform;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationMetadata {
  validatedAt: Date;
  responseTime: number;
  apiVersion?: string;
  permissions?: string[];
}

// Platform-specific credential interfaces
export interface TikTokCredentials {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
}

export interface InstagramCredentials {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  userAgent: string;
}

// Union type for all platform credentials
export type PlatformCredentials = TikTokCredentials | InstagramCredentials | RedditCredentials;

// Validation configuration
export interface ValidationConfig {
  enableCaching: boolean;
  cacheTimeout: number; // milliseconds
  maxConcurrentValidations: number;
  timeout: number; // milliseconds per validation
}

// Health status interfaces
export interface ValidationHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  platforms: Record<Platform, 'healthy' | 'unhealthy'>;
  lastChecked: Date;
}

// Batch validation interfaces
export interface BatchValidationRequest {
  platform: Platform;
  credentials: PlatformCredentials;
}

export interface BatchValidationResult {
  results: CredentialValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    errors: number;
    warnings: number;
  };
}

// Error codes enum
export enum ValidationErrorCode {
  // Format errors
  MISSING_CLIENT_KEY = 'MISSING_CLIENT_KEY',
  MISSING_CLIENT_SECRET = 'MISSING_CLIENT_SECRET',
  MISSING_APP_ID = 'MISSING_APP_ID',
  MISSING_APP_SECRET = 'MISSING_APP_SECRET',
  MISSING_CLIENT_ID = 'MISSING_CLIENT_ID',
  MISSING_USER_AGENT = 'MISSING_USER_AGENT',
  INVALID_REDIRECT_URI = 'INVALID_REDIRECT_URI',
  INVALID_APP_ID_FORMAT = 'INVALID_APP_ID_FORMAT',
  INVALID_APP_SECRET_FORMAT = 'INVALID_APP_SECRET_FORMAT',
  
  // API connectivity errors
  API_CONNECTIVITY_FAILED = 'API_CONNECTIVITY_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System errors
  VALIDATION_TIMEOUT = 'VALIDATION_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Warning codes enum
export enum ValidationWarningCode {
  MISSING_PERMISSIONS = 'MISSING_PERMISSIONS',
  INVALID_USER_AGENT = 'INVALID_USER_AGENT',
  DEVELOPMENT_CREDENTIALS = 'DEVELOPMENT_CREDENTIALS',
  REDIRECT_URI_WARNING = 'REDIRECT_URI_WARNING',
}

// Cache interfaces
export interface ValidationCacheEntry {
  result: CredentialValidationResult;
  expiresAt: number;
}

export interface ValidationCache {
  get(key: string): ValidationCacheEntry | undefined;
  set(key: string, entry: ValidationCacheEntry): void;
  delete(key: string): void;
  clear(): void;
  size(): number;
}