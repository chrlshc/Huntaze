/**
 * Unit Tests - Instagram Permission Validation (Task 3.3)
 * 
 * Tests for Instagram permission validation and business account setup
 * Based on: .kiro/specs/oauth-credentials-validation/tasks.md (Task 3.3)
 * 
 * Coverage:
 * - Required permission validation
 * - Optional permission warnings
 * - Business account setup validation
 * - App ID and App Secret format validation
 * - Permission-specific error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstagramCredentialValidator } from '../../../lib/validation/validators/instagramValidator';
import { InstagramCredentials, ValidationErrorCode, ValidationWarningCode } from '../../../lib/validation/index';

// Mock fetch globally
global.fetch = vi.fn();

describe('InstagramCredentialValidator - Permission Validation (Task 3.3)', () => {
  let validator: InstagramCredentialValidator;
  let mockCredentials: InstagramCredentials;

  beforeEach(() => {
    validator = new InstagramCredentialValidator();
    mockCredentials = {
      appId: '123456789012345',
      appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
      redirectUri: 'https://example.com/api/auth/instagram/callback',
    };

    // Reset fetch mock
    vi.clearAllMocks();
  });

  describe('Required Permission Validation', () => {
    it('should validate required permissions successfully', async () => {
      // Mock successful API responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '123456789012345',
            name: 'Test App',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { permission: 'instagram_basic' },
              { permission: 'pages_show_list' },
              { permission: 'instagram_content_publish' },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            error: { code: 190, message: 'Expected error for app token' },
          }),
        });

      const result = await validator.validatePermissions(mockCredentials);
      
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('instagram');
      expect(result.metadata.apiVersion).toBe('permission-validation');
      expect(result.metadata.permissions).toContain('instagram_basic');
      expect(result.metadata.permissions).toContain('pages_show_list');
    });

    it('should detect missing required permissions', async () => {
      // Mock API responses with missing permissions
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '123456789012345',
            name: 'Test App',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { permission: 'instagram_content_publish' }, // Missing required permissions
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            error: { code: 190, message: 'Expected error for app token' },
          }),
        });

      const result = await validator.validatePermissions(mockCredentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const permissionError = result.errors.find(error => 
        error.code === ValidationErrorCode.INSUFFICIENT_PERMISSIONS
      );
      expect(permissionError).toBeDefined();
      expect(permissionError?.message).toContain('Missing required permissions');
    });

    it('should warn about missing optional permissions', async () => {
      // Mock API responses with only required permissions
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '123456789012345',
            name: 'Test App',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { permission: 'instagram_basic' },
              { permission: 'pages_show_list' },
              // Missing optional permissions
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            error: { code: 190, message: 'Expected error for app token' },
          }),
        });

      const result = await validator.validatePermissions(mockCredentials);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const permissionWarning = result.warnings.find(warning => 
        warning.code === ValidationWarningCode.MISSING_PERMISSIONS
      );
      expect(permissionWarning).toBeDefined();
    });
  });

  describe('Specific Permission Validation', () => {
    it('should validate specific required permissions', async () => {
      const requiredPermissions = ['instagram_basic', 'instagram_content_publish'];

      // Mock successful API responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '123456789012345',
            name: 'Test App',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { permission: 'instagram_basic' },
              { permission: 'pages_show_list' },
              { permission: 'instagram_content_publish' },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            error: { code: 190, message: 'Expected error for app token' },
          }),
        });

      const result = await validator.validateSpecificPermissions(mockCredentials, requiredPermissions);
      
      expect(result.isValid).toBe(true);
      expect(result.metadata.apiVersion).toBe('specific-permission-validation');
      expect(result.metadata.permissions).toContain('instagram_basic');
      expect(result.metadata.permissions).toContain('instagram_content_publish');
    });

    it('should detect missing specific permissions', async () => {
      const requiredPermissions = ['instagram_basic', 'instagram_manage_insights'];

      // Mock API responses missing specific permission
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '123456789012345',
            name: 'Test App',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { permission: 'instagram_basic' },
              { permission: 'pages_show_list' },
              // Missing instagram_manage_insights
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            error: { code: 190, message: 'Expected error for app token' },
          }),
        });

      const result = await validator.validateSpecificPermissions(mockCredentials, requiredPermissions);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const permissionError = result.errors.find(error => 
        error.code === ValidationErrorCode.INSUFFICIENT_PERMISSIONS
      );
      expect(permissionError?.message).toContain('instagram_manage_insights');
    });
  });

  describe('Business Account Setup Validation', () => {
    it('should validate business account setup successfully', async () => {
      const pageId = 'page_123456789';

      // Mock successful API responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            instagram_business_account: {
              id: 'ig_business_123',
              username: 'test_business_account',
            },
          }),
        });

      const result = await validator.validateBusinessAccountSetup(mockCredentials, pageId);
      
      expect(result.isValid).toBe(true);
      expect(result.metadata.apiVersion).toBe('business-account-validation');
      expect(result.metadata.businessAccountId).toBe('ig_business_123');
    });

    it('should warn when no business account is connected', async () => {
      const pageId = 'page_123456789';

      // Mock API responses with no business account
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'page_123456789',
            name: 'Test Page',
            // No instagram_business_account field
          }),
        });

      const result = await validator.validateBusinessAccountSetup(mockCredentials, pageId);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const businessAccountWarning = result.warnings.find(warning => 
        warning.message.includes('No Instagram Business Account connected')
      );
      expect(businessAccountWarning).toBeDefined();
    });

    it('should warn when no page ID is provided', async () => {
      // Mock successful token generation (even though we won't use it)
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });

      const result = await validator.validateBusinessAccountSetup(mockCredentials);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const pageIdWarning = result.warnings.find(warning => 
        warning.message.includes('No Facebook Page ID provided')
      );
      expect(pageIdWarning).toBeDefined();
    });
  });

  describe('App ID and App Secret Format Validation', () => {
    it('should validate numeric App ID format', () => {
      const validCredentials: InstagramCredentials = {
        appId: '1234567890123456', // Valid numeric format
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/callback',
      };

      const errors = validator.validateFormat(validCredentials);
      expect(errors).toHaveLength(0);
    });

    it('should reject non-numeric App ID', () => {
      const invalidCredentials: InstagramCredentials = {
        appId: 'abc123def456', // Non-numeric
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/callback',
      };

      const errors = validator.validateFormat(invalidCredentials);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate App ID length requirements', () => {
      const shortAppId: InstagramCredentials = {
        appId: '12345', // Too short
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/callback',
      };

      const longAppId: InstagramCredentials = {
        appId: '123456789012345678901', // Too long
        appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
        redirectUri: 'https://example.com/callback',
      };

      expect(validator.validateFormat(shortAppId).length).toBeGreaterThan(0);
      expect(validator.validateFormat(longAppId).length).toBeGreaterThan(0);
    });

    it('should validate App Secret format requirements', () => {
      const invalidSecret: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'invalid-secret-with-dashes!', // Contains invalid characters
        redirectUri: 'https://example.com/callback',
      };

      const errors = validator.validateFormat(invalidSecret);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate App Secret length requirements', () => {
      const shortSecret: InstagramCredentials = {
        appId: '123456789012345',
        appSecret: 'short', // Too short
        redirectUri: 'https://example.com/callback',
      };

      const errors = validator.validateFormat(shortSecret);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API connectivity failures gracefully', async () => {
      // Mock failed API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          error: { code: 101, message: 'Invalid API key' },
        }),
      });

      const result = await validator.validatePermissions(mockCredentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const connectivityError = result.errors.find(error => 
        error.code === ValidationErrorCode.API_CONNECTIVITY_FAILED
      );
      expect(connectivityError).toBeDefined();
    });

    it('should handle network errors during permission validation', async () => {
      // Mock network error
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await validator.validatePermissions(mockCredentials);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide helpful error suggestions', async () => {
      const invalidCredentials: InstagramCredentials = {
        appId: '',
        appSecret: '',
        redirectUri: '',
      };

      const result = validator.validateFormatEnhanced(invalidCredentials);
      
      expect(result.isValid).toBe(false);
      result.errors.forEach(error => {
        expect(error.suggestion).toBeDefined();
        expect(error.suggestion.length).toBeGreaterThan(0);
      });
    });
  });
});