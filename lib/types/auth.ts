/**
 * Authentication Types
 * 
 * Shared TypeScript types for authentication across the application
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * Auth error types for structured error handling
 */
export enum AuthErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured auth error
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  correlationId: string;
  statusCode: number;
  retryable: boolean;
  timestamp: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Auth response with metadata
 */
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
  correlationId: string;
  duration: number;
}

/**
 * Sign in request
 */
export interface SignInRequest {
  email: string;
  password: string;
  callbackUrl?: string;
}

/**
 * Sign in response
 */
export interface SignInResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    creatorId?: string;
  };
  session?: {
    expires: string;
  };
}

/**
 * Session data
 */
export interface SessionData {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    creatorId?: string;
  };
  expires: string;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User from database
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  password?: string;
  role?: string;
  creator_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Safe user (without password)
 */
export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  creatorId?: string;
}

// ============================================================================
// JWT Types
// ============================================================================

/**
 * JWT token payload
 */
export interface JWTPayload {
  id: string;
  email: string;
  role?: string;
  creatorId?: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// Provider Types
// ============================================================================

/**
 * OAuth provider
 */
export type OAuthProvider = 'google' | 'facebook' | 'github';

/**
 * OAuth profile
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider: OAuthProvider;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// Retry Types
// ============================================================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  duration: number;
}

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
  userId?: string;
  email?: string;
  duration?: number;
  attempt?: number;
  [key: string]: any;
}

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  timestamp: string;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if error is AuthError
 */
export function isAuthError(error: any): error is AuthError {
  return (
    error &&
    typeof error === 'object' &&
    'type' in error &&
    'correlationId' in error &&
    'userMessage' in error
  );
}

/**
 * Check if response is AuthResponse
 */
export function isAuthResponse(response: any): response is AuthResponse {
  return (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'correlationId' in response &&
    'duration' in response
  );
}

/**
 * Check if user is SafeUser
 */
export function isSafeUser(user: any): user is SafeUser {
  return (
    user &&
    typeof user === 'object' &&
    'id' in user &&
    'email' in user &&
    !('password' in user)
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make all properties required except specified keys
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

/**
 * Extract promise type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;
