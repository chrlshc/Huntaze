/**
 * OAuth Credentials Validation Framework
 * 
 * This module provides a comprehensive framework for validating OAuth credentials
 * across multiple social media platforms (TikTok, Instagram, Reddit).
 * 
 * @example
 * ```typescript
 * import { ValidationOrchestrator, TikTokCredentialValidator } from '@/lib/validation';
 * 
 * const orchestrator = new ValidationOrchestrator({
 *   enableCaching: true,
 *   cacheTimeout: 300000, // 5 minutes
 *   maxConcurrentValidations: 5,
 *   timeout: 30000, // 30 seconds
 * });
 * 
 * const result = await orchestrator.validatePlatform('tiktok', {
 *   clientKey: 'your-client-key',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'https://yourapp.com/callback'
 * });
 * 
 * if (result.isValid) {
 *   console.log('Credentials are valid!');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */

// Export types and interfaces
export * from './types';
export * from './interfaces';
export * from './errors';
export * from './config';
export * from './orchestrator';

// Export utility functions
export { ValidationErrorUtils } from './errors';

// Re-export commonly used types for convenience
export type {
  CredentialValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationMetadata,
  TikTokCredentials,
  InstagramCredentials,
  RedditCredentials,
  PlatformCredentials,
  ValidationConfig,
  ValidationHealthStatus,
  BatchValidationRequest,
  BatchValidationResult,
} from './types';

export {
  ValidationErrorCode,
  ValidationWarningCode,
  type Platform,
} from './types';

export {
  CredentialValidator,
  type IValidationOrchestrator,
  type IValidationMonitor,
  type ICredentialValidationService,
} from './interfaces';

export {
  ValidationException,
  CredentialsNotConfiguredError,
  ApiConnectivityError,
  ValidationTimeoutError,
  RateLimitExceededError,
  InvalidCredentialsFormatError,
  InsufficientPermissionsError,
} from './errors';

export {
  ValidationOrchestrator,
  DEFAULT_VALIDATION_CONFIG,
  createValidationOrchestrator,
} from './orchestrator';

export {
  ValidationConfigLoader,
  getValidationConfig,
  getPlatformConfig,
  isPlatformEnabled,
  reloadValidationConfig,
  ENV_VARS_DOCUMENTATION,
  type ValidationEnvironmentConfig,
  type PlatformConfig,
  type ValidationSystemConfig,
} from './config';

// Export platform-specific validators
export { TikTokCredentialValidator } from './validators/tiktokValidator';
export { InstagramCredentialValidator } from './validators/instagramValidator';
export { RedditCredentialValidator } from './validators/redditValidator';