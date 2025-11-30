/**
 * Authentication Module - Main Export
 * 
 * Centralized exports for authentication functionality
 */

// Types
export * from './types';

// Session management
export {
  getSession,
  getServerSession,
  getSessionFromRequest,
  getCurrentUser,
  getCurrentUserId,
  requireAuth,
  requireRole,
  isAuthenticated,
  hasRole,
  validateOwnership,
  requireOwnership,
  getSessionError,
  isSessionValid,
  getUserDisplayName,
  isEmailVerified,
} from './session';

// Error handling
export {
  createAuthError,
  isRetryableError,
  isUserError,
  isSystemError,
  getErrorMessage,
  parseAuthErrorFromUrl,
  logAuthError,
  handleAuthErrorWithRetry,
  validateAuthResponse,
  getRecoveryAction,
} from './errors';

// Validation
export {
  validateEmail,
  sanitizeEmail,
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  validateSignInCredentials,
  validateSignUpCredentials,
  validateOAuthProfile,
  getRateLimitKey,
  isDisposableEmail,
  sanitizeInput,
  sanitizeName,
} from './validators';

// API Protection (NextAuth migration utilities)
export {
  requireAuth as requireAuthAPI,
  requireAuthWithOnboarding,
  getOptionalAuth,
} from './api-protection';
export type { AuthenticatedRequest } from './api-protection';

// Re-export NextAuth types for convenience
export type { Session } from 'next-auth';
export type { JWT } from 'next-auth/jwt';
