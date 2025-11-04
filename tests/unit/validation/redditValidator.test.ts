/**
 * Unit tests for RedditCredentialValidator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedditCredentialValidator } from '@/lib/validation/validators/redditValidator';
import { RedditCredentials, ValidationErrorCode, ValidationWarningCode } from '@/lib/validation';

// Mock the API tester
vi.mock('@/lib/validation/validators/redditApiTester', () => ({
  RedditApiTester: vi.fn().mockImplementation(() => ({
    testConnectivity: vi.fn().mockResolvedValue({
      isConnected: true,
      errors: [],
      warnings: [],
    }),
  })),
}));

// Mock the format validator
vi.mock('@/lib/validation/validators/redditFormatValidator', () => ({
  RedditFormatValidator: vi.fn().mockImplementation(() => ({
    validateFormat: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    }),
    validateForProduction: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    }),
  })),
}));

describe('RedditCredentialValidator', () => {
  let validator: RedditCredentialValidator;
  let validCredentials: RedditCredentials;

  beforeEach(() => {
    validator = new RedditCredentialValidator();
    validCredentials = {
      clientId: 'test_client_id_12345',
      clientSecret: 'test_client_secret_abcdef123456',
      redirectUri: 'https://example.com/auth/reddit/callback',
      userAgent: 'web:testapp:v1.0 (by /u/testuser)',
    };
  });

  describe('validateCredentials', () => {
    it('should validate valid Reddit credentials', async () => {
      const result = await validator.validateCredentials(validCredentials);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('reddit');
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.validatedAt).toBeInstanceOf(Date);
      expect(result.metadata.responseTime).toBeGreaterThan(0);
    });

    it('should handle missing client ID', async () => {
      const invalidCredentials = {
        ...validCredentials,
        clientId: '',
      };

      const result = await validator.validateCredentials(invalidCredentials);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === ValidationErrorCode.MISSING_CLIENT_ID
      )).toBe(true);
    });

    it('should handle missing client secret', async () => {
      const invalidCredentials = {
        ...validCredentials,
        clientSecret: '',
      };

      const result = await validator.validateCredentials(invalidCredentials);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === ValidationErrorCode.MISSING_CLIENT_SECRET
      )).toBe(true);
    });

    it('should handle missing user agent', async () => {
      const invalidCredentials = {
        ...validCredentials,
        userAgent: '',
      };

      const result = await validator.validateCredentials(invalidCredentials);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.code === ValidationErrorCode.MISSING_USER_AGENT
      )).toBe(true);
    });
  });  describe('validateUserAgent', () => {
    it('should validate proper User-Agent format', () => {
      const result = validator.validateUserAgent(validCredentials);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about improper User-Agent format', () => {
      const invalidCredentials = {
        ...validCredentials,
        userAgent: 'invalid-user-agent',
      };

      const result = validator.validateUserAgent(invalidCredentials);

      expect(result.warnings.some(warning => 
        warning.code === ValidationWarningCode.INVALID_USER_AGENT
      )).toBe(true);
    });

    it('should warn about problematic terms in User-Agent', () => {
      const invalidCredentials = {
        ...validCredentials,
        userAgent: 'web:botapp:v1.0 (by /u/testuser)',
      };

      const result = validator.validateUserAgent(invalidCredentials);

      expect(result.warnings.some(warning => 
        warning.code === ValidationWarningCode.INVALID_USER_AGENT &&
        warning.message.includes('flagged by Reddit')
      )).toBe(true);
    });
  });

  describe('validateForProduction', () => {
    it('should validate production credentials', () => {
      const result = validator.validateForProduction(validCredentials);

      expect(result.platform).toBe('reddit');
      expect(result.metadata.apiVersion).toBe('production-validation');
    });

    it('should reject localhost redirect URI in production', () => {
      const devCredentials = {
        ...validCredentials,
        redirectUri: 'https://localhost:3000/auth/reddit/callback',
      };

      // Mock production environment
      vi.stubEnv('NODE_ENV', 'production');

      const result = validator.validateForProduction(devCredentials);

      vi.unstubAllEnvs();

      expect(result.warnings.some(warning => 
        warning.message.includes('development')
      )).toBe(true);
    });
  });

  describe('validateScopes', () => {
    it('should validate required scopes', async () => {
      const requiredScopes = ['identity', 'submit', 'edit', 'read'];
      const result = await validator.validateScopes(validCredentials, requiredScopes);

      expect(result.platform).toBe('reddit');
      expect(result.metadata.apiVersion).toBe('scope-validation');
    });
  });

  describe('getErrorSuggestion', () => {
    it('should provide helpful error suggestions', () => {
      const suggestion = validator['getErrorSuggestion'](ValidationErrorCode.MISSING_CLIENT_ID);
      
      expect(suggestion).toContain('Reddit App Preferences');
      expect(suggestion).toContain('https://www.reddit.com/prefs/apps');
    });

    it('should return null for unknown error codes', () => {
      const suggestion = validator['getErrorSuggestion']('UNKNOWN_ERROR_CODE');
      
      expect(suggestion).toBeNull();
    });
  });
});