/**
 * Unit Tests - Instagram Credential Validator (Task 3.1)
 * 
 * Tests for Instagram credential format validation and API connectivity
 * Based on: .kiro/specs/oauth-credentials-validation/tasks.md (Task 3.1)
 * 
 * Coverage:
 * - Format validation for App ID, App Secret, and redirect URI
 * - Enhanced format validation with detailed error messages
 * - Production-specific validation rules
 * - Permission validation
 * - Error suggestions and actionable feedback
 * - Integration with InstagramFormatValidator and InstagramApiTester
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InstagramCredentialValidator } from '../../../lib/validation/validators/instagramValidator';
import { InstagramCredentials, ValidationErrorCode } from '../../../lib/validation/index';

describe('InstagramCredentialValidator - Format Validation (Task 3.1)', () => {
  let validator: InstagramCredentialValidator;

  beforeEach(() => {
    validator = new InstagramCredentialValidator();
  });

  describe('Basic Format Validation', () => {
    it('should validate correct Instagram credentials format', () => {
      const validCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const errors = validator.validateFormat(validCredentials);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing App ID', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe(ValidationErrorCode.MISSING_APP_ID);
      expect(errors[0].platform).toBe('instagram');
    });

    it('should detect missing App Secret', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: '',
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe(ValidationErrorCode.MISSING_APP_SECRET);
      expect(errors[0].platform).toBe('instagram');
    });

    it('should detect invalid redirect URI format', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'http://example.com/callback', // HTTP instead of HTTPS
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe(ValidationErrorCode.INVALID_REDIRECT_URI);
      expect(errors[0].platform).toBe('instagram');
    });

    it('should detect invalid App ID format (non-numeric)', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: 'abc123def456', // Non-numeric
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].platform).toBe('instagram');
    });

    it('should detect App ID that is too short', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '12345', // Too short (less than 10 characters)
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].platform).toBe('instagram');
    });

    it('should detect App Secret that is too short', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'short', // Too short (less than 16 characters)
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].platform).toBe('instagram');
    });

    it('should detect multiple format errors', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '', // Missing
        appSecret: 'short', // Too short
        redirectUri: 'invalid-url', // Invalid format
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors.length).toBe(3);
      expect(errors.every(error => error.platform === 'instagram')).toBe(true);
    });
  });

  describe('Enhanced Format Validation', () => {
    it('should provide detailed format validation results', () => {
      const credentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/api/auth/instagram/callback',
      };

      const result = validator.validateFormatEnhanced(credentials);
      expect(result.platform).toBe('instagram');
      expect(result.isValid).toBe(true);
      expect(result.metadata.apiVersion).toBe('format-validation');
      expect(result.metadata.validatedAt).toBeInstanceOf(Date);
    });

    it('should provide actionable suggestions for format errors', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '',
        appSecret: '',
        redirectUri: '',
      };

      const result = validator.validateFormatEnhanced(invalidCredentials);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3);
      
      result.errors.forEach(error => {
        expect(error.suggestion).toBeDefined();
        expect(error.suggestion.length).toBeGreaterThan(0);
        expect(error.platform).toBe('instagram');
      });
    });

    it('should include warnings for development credentials', () => {
      const devCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'test1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://localhost:3000/api/auth/instagram/callback',
      };

      const result = validator.validateFormatEnhanced(devCredentials);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Production Validation', () => {
    it('should apply stricter rules for production environment', () => {
      const credentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'short123', // Too short for production (less than 32 chars)
        redirectUri: 'https://localhost:3000/callback', // Localhost not allowed in production
      };

      const result = validator.validateForProduction(credentials);
      expect(result.isValid).toBe(false);
      expect(result.metadata.apiVersion).toBe('production-validation');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide production-specific error suggestions', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'http://localhost:3000/callback', // HTTP and localhost
      };

      const result = validator.validateForProduction(invalidCredentials);
      expect(result.isValid).toBe(false);
      
      const redirectUriError = result.errors.find(error => 
        error.code === ValidationErrorCode.INVALID_REDIRECT_URI
      );
      expect(redirectUriError?.suggestion).toBeDefined();
    });

    it('should reject development domains in production', () => {
      const devCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456789',
        redirectUri: 'https://ngrok.io/callback', // Development domain
      };

      const result = validator.validateForProduction(devCredentials);
      expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
    });

    it('should accept valid production credentials', () => {
      const prodCredentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456789abcdef',
        redirectUri: 'https://myapp.com/api/auth/instagram/callback',
      };

      const result = validator.validateForProduction(prodCredentials);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Suggestions', () => {
    it('should provide specific suggestions for missing App ID', () => {
      const credentials: InstagramCredentials = {
        appId: '',
        appSecret: 'valid_secret',
        redirectUri: 'https://example.com/callback',
      };

      const result = validator.validateFormatEnhanced(credentials);
      const appIdError = result.errors.find(error => 
        error.code === ValidationErrorCode.MISSING_APP_ID
      );
      
      expect(appIdError?.suggestion).toContain('App ID');
      expect(appIdError?.suggestion).toContain('Facebook Developer Portal');
    });

    it('should provide specific suggestions for missing App Secret', () => {
      const credentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: '',
        redirectUri: 'https://example.com/callback',
      };

      const result = validator.validateFormatEnhanced(credentials);
      const appSecretError = result.errors.find(error => 
        error.code === ValidationErrorCode.MISSING_APP_SECRET
      );
      
      expect(appSecretError?.suggestion).toContain('App Secret');
      expect(appSecretError?.suggestion).toContain('Facebook Developer Portal');
    });

    it('should provide specific suggestions for invalid redirect URI', () => {
      const credentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'valid_secret',
        redirectUri: 'invalid-uri',
      };

      const result = validator.validateFormatEnhanced(credentials);
      const redirectUriError = result.errors.find(error => 
        error.code === ValidationErrorCode.INVALID_REDIRECT_URI
      );
      
      expect(redirectUriError?.suggestion).toContain('HTTPS');
    });
  });

  describe('Platform-Specific Validations', () => {
    it('should validate numeric App ID format', () => {
      const credentials: InstagramCredentials = {
        appId: 'abc123def456', // Non-numeric
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/callback',
      };

      const errors = validator.validateFormat(credentials);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate alphanumeric App Secret format', () => {
      const credentials: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'invalid-secret-with-dashes!', // Contains invalid characters
        redirectUri: 'https://example.com/callback',
      };

      const errors = validator.validateFormat(credentials);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid Instagram credential formats', () => {
      const validCredentials: InstagramCredentials = {
        appId: '1234567890123456789', // 19 digits
        appSecret: 'abcdef1234567890abcdef1234567890ab', // 32 chars alphanumeric
        redirectUri: 'https://myapp.com/auth/instagram/callback',
      };

      const errors = validator.validateFormat(validCredentials);
      expect(errors).toHaveLength(0);
    });
  });
});