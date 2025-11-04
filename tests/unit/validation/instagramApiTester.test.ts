/**
 * Unit Tests - Instagram API Tester (Task 3.2)
 * 
 * Tests for Instagram API connectivity testing using Facebook Graph API
 * Based on: .kiro/specs/oauth-credentials-validation/tasks.md (Task 3.2)
 * 
 * Coverage:
 * - App access token generation
 * - App information retrieval
 * - Permission validation
 * - Webhook configuration testing
 * - Error handling for Facebook Graph API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstagramApiTester } from '../../../lib/validation/validators/instagramApiTester';
import { InstagramCredentials } from '../../../lib/validation/index';

// Mock fetch globally
global.fetch = vi.fn();

describe('InstagramApiTester - API Connectivity (Task 3.2)', () => {
  let apiTester: InstagramApiTester;
  let mockCredentials: InstagramCredentials;

  beforeEach(() => {
    apiTester = new InstagramApiTester();
    mockCredentials = {
      appId: '123456789012345',
      appSecret: 'abcd1234efgh5678ijkl9012mnop3456',
      redirectUri: 'https://example.com/api/auth/instagram/callback',
    };

    // Reset fetch mock
    vi.clearAllMocks();
  });

  describe('App Access Token Generation', () => {
    it('should generate app access token successfully', async () => {
      const mockResponse = {
        access_token: 'test_app_access_token_123',
        token_type: 'bearer',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const token = await apiTester.generateAppAccessToken(mockCredentials);
      
      expect(token).toBe('test_app_access_token_123');
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should handle invalid credentials error', async () => {
      const mockErrorResponse = {
        error: {
          code: 101,
          message: 'Invalid API key',
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(apiTester.generateAppAccessToken(mockCredentials))
        .rejects.toThrow();
    });

    it('should handle invalid app secret error', async () => {
      const mockErrorResponse = {
        error: {
          code: 190,
          message: 'Invalid access token',
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(apiTester.generateAppAccessToken(mockCredentials))
        .rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiTester.generateAppAccessToken(mockCredentials))
        .rejects.toThrow();
    });
  });

  describe('App Information Retrieval', () => {
    it('should retrieve app information successfully', async () => {
      const mockAppInfo = {
        id: '123456789012345',
        name: 'Test Instagram App',
        category: 'Business',
        company: 'Test Company',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAppInfo),
      });

      const appInfo = await apiTester.getAppInfo('123456789012345', 'test_token');
      
      expect(appInfo).toEqual(mockAppInfo);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.facebook.com/123456789012345')
      );
    });

    it('should handle app info retrieval errors', async () => {
      const mockErrorResponse = {
        error: {
          message: 'App not found',
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(apiTester.getAppInfo('123456789012345', 'test_token'))
        .rejects.toThrow();
    });
  });

  describe('Permission Validation', () => {
    it('should validate required permissions correctly', () => {
      const permissions = ['instagram_basic', 'pages_show_list', 'instagram_content_publish'];
      
      const validation = apiTester.validatePermissions(permissions);
      
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should detect missing required permissions', () => {
      const permissions = ['instagram_content_publish']; // Missing required permissions
      
      const validation = apiTester.validatePermissions(permissions);
      
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('instagram_basic');
      expect(validation.missing).toContain('pages_show_list');
    });

    it('should warn about missing optional permissions', () => {
      const permissions = ['instagram_basic', 'pages_show_list']; // Missing optional permissions
      
      const validation = apiTester.validatePermissions(permissions);
      
      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('Missing optional permissions');
    });

    it('should handle empty permissions array', () => {
      const permissions: string[] = [];
      
      const validation = apiTester.validatePermissions(permissions);
      
      expect(validation.valid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive Connectivity Testing', () => {
    it('should perform comprehensive connectivity test successfully', async () => {
      // Mock app access token generation
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test_token' }),
        })
        // Mock app info retrieval
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '123456789012345',
            name: 'Test App',
          }),
        })
        // Mock permissions retrieval
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { permission: 'instagram_basic' },
              { permission: 'pages_show_list' },
            ],
          }),
        })
        // Mock Instagram Basic API test
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            error: { code: 190, message: 'Expected error for app token' },
          }),
        });

      const result = await apiTester.testConnectivity(mockCredentials);
      
      expect(result.isConnected).toBe(true);
      expect(result.appInfo).toBeDefined();
      expect(result.permissions).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle connectivity test failure', async () => {
      // Mock failed app access token generation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          error: { code: 101, message: 'Invalid API key' },
        }),
      });

      const result = await apiTester.testConnectivity(mockCredentials);
      
      expect(result.isConnected).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Webhook Configuration Testing', () => {
    it('should detect configured webhooks', async () => {
      const mockWebhookResponse = {
        data: [
          {
            object: 'instagram',
            callback_url: 'https://example.com/webhook',
            fields: ['comments', 'story_insights'],
          },
        ],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWebhookResponse),
      });

      const result = await apiTester.testWebhookConfiguration('123456789012345', 'test_token');
      
      expect(result.configured).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing webhook configuration', async () => {
      const mockWebhookResponse = {
        data: [], // No webhooks configured
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWebhookResponse),
      });

      const result = await apiTester.testWebhookConfiguration('123456789012345', 'test_token');
      
      expect(result.configured).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle webhook configuration errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await apiTester.testWebhookConfiguration('123456789012345', 'test_token');
      
      expect(result.configured).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Instagram Business Account', () => {
    it('should retrieve Instagram business account info', async () => {
      const mockBusinessAccount = {
        instagram_business_account: {
          id: 'ig_business_123',
          username: 'test_business_account',
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBusinessAccount),
      });

      const result = await apiTester.getInstagramBusinessAccount('page_123', 'test_token');
      
      expect(result).toEqual(mockBusinessAccount.instagram_business_account);
    });

    it('should handle missing business account', async () => {
      const mockResponse = {
        id: 'page_123',
        name: 'Test Page',
        // No instagram_business_account field
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiTester.getInstagramBusinessAccount('page_123', 'test_token');
      
      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors properly', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiTester.generateAppAccessToken(mockCredentials))
        .rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiTester.generateAppAccessToken(mockCredentials))
        .rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiTester.generateAppAccessToken(mockCredentials))
        .rejects.toThrow();
    });
  });
});