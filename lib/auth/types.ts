/**
 * Authentication Types
 * 
 * Shared TypeScript types for authentication and authorization
 */

import type { User as NextAuthUser, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Re-export User from next-auth
export type User = NextAuthUser;

// Export AuthState interface
export interface AuthState {
  user: ExtendedUser | null;
  session: ExtendedSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

// ============================================================================
// User Types
// ============================================================================

export interface ExtendedUser extends NextAuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: UserRole;
  creatorId?: string;
  emailVerified?: Date | null;
  image?: string | null;
  onboardingCompleted: boolean;
}

export enum UserRole {
  CREATOR = 'creator',
  ADMIN = 'admin',
  USER = 'user',
}

// ============================================================================
// Session Types
// ============================================================================

export interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: UserRole;
    creatorId?: string;
    image?: string | null;
    onboardingCompleted: boolean;
  };
  error?: AuthError;
}

// ============================================================================
// Token Types
// ============================================================================

export interface ExtendedToken extends JWT {
  id: string;
  email?: string;
  role?: UserRole;
  creatorId?: string;
  error?: AuthError;
  iat?: number;
  exp?: number;
  jti?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export enum AuthError {
  CONFIGURATION = 'Configuration',
  ACCESS_DENIED = 'AccessDenied',
  VERIFICATION = 'Verification',
  OAUTH_ACCOUNT_NOT_LINKED = 'OAuthAccountNotLinked',
  OAUTH_CALLBACK = 'OAuthCallback',
  OAUTH_CREATE_ACCOUNT = 'OAuthCreateAccount',
  EMAIL_CREATE_ACCOUNT = 'EmailCreateAccount',
  CALLBACK = 'Callback',
  OAUTH_SIGNIN = 'OAuthSignin',
  EMAIL_SIGNIN = 'EmailSignin',
  CREDENTIALS_SIGNIN = 'CredentialsSignin',
  SESSION_REQUIRED = 'SessionRequired',
  JWT_ERROR = 'JWTError',
}

export interface AuthErrorResponse {
  error: AuthError;
  message: string;
  correlationId?: string;
  retryable: boolean;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface SignInRequest {
  email: string;
  password: string;
  callbackUrl?: string;
}

export interface SignInResponse {
  ok: boolean;
  error?: string;
  status: number;
  url?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignUpResponse {
  success: boolean;
  userId?: string;
  error?: string;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  email_verified?: boolean;
}

export interface OAuthAccount {
  provider: string;
  providerAccountId: string;
  type: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// ============================================================================
// Helper Types
// ============================================================================

export type AuthProvider = 'credentials' | 'google' | 'github';

export interface AuthConfig {
  providers: AuthProvider[];
  sessionMaxAge: number;
  jwtMaxAge: number;
  passwordRequirements: PasswordRequirements;
}
