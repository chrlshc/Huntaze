/**
 * OAuth Services Validation Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TikTokOAuthService } from '@/lib/services/tiktokOAuth';
import { InstagramOAuthService } from '@/lib/services/instagramOAuth';
import { RedditOAuthService } from '@/lib/services/redditOAuth';

// Mock the validation modules
vi.mock('@/lib/validation', () => ({
  TikTokCredentialValidator: vi.fn().mockImplementation(() => ({
    validateCredentials: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      platform: 'tiktok',
      metadata: { validatedAt: new Date(), responseTime: 100 },
    }),
  })),
  InstagramCredentialValidator: vi.fn().mockImplementation(() => ({
    validateCredentials: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      platform: 'instagram',
      metadata: { validatedAt: new Date(), responseTime: 100 },
    }),
  })),
  RedditCredentialValidator: vi.fn().mockImplementation(() => ({
    validateCredentials: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      platform: 'reddit',
      metadata: { validatedAt: new Date(), responseTime: 100 },
    }),
  })),
}));

describe('OAuth Services Validation Integration', () => {
  beforeEach(() => {
    // Set up valid test credentials
    process.env.TIKTOK_CLIENT_KEY = 'test_client_key';
    process.env.TIKTOK_CLIENT_SECRET = 'test_client_secret';
    process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'https://example.com/auth/tiktok/callback';

    process.env.FACEBOOK_APP_ID = '123456789';
    process.env.FACEBOOK_APP_SECRET = 'test_app_secret';
    process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'https://example.com/auth/instagram/callback';

    process.env.REDDIT_CLIENT_ID = 'test_client_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_client_secret';
    process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'https://example.com/auth/reddit/callback';
    process.env.REDDIT_USER_AGENT = 'web:testapp:v1.0 (by /u/testuser)';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TikTokOAuthService', () => {
    it('should validate credentials before generating authorization URL', async () => {
      const service = new TikTokOAuthService();
      
      const result = await service.getAuthorizationUrl();
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('tiktok.com');
      expect(result.state).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should cache validation results', async () => {
      const service = new TikTokOAuthService();
      
      // First call should validate
      await service.getAuthorizationUrl();
      
      // Second call should use cache
      await service.getAuthorizationUrl();
      
      // Validation should only be called once due to caching
      expect(service['validator'].validateCredentials).toHaveBeenCalledTimes(1);
    });

    it('should clear validation cache', async () => {
      const service = new TikTokOAuthService();
      
      await service.getAuthorizationUrl();
      service.clearValidationCache();
      await service.getAuthorizationUrl();
      
      // Should validate twice since cache was cleared
      expect(service['validator'].validateCredentials).toHaveBeenCalledTimes(2);
    });
  });

  describe('InstagramOAuthService', () => {
    it('should validate credentials before generating authorization URL', async () => {
      const service = new InstagramOAuthService();
      
      const result = await service.getAuthorizationUrl();
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('facebook.com');
      expect(result.state).toHaveLength(64);
    });

    it('should validate credentials before token exchange', async () => {
      const service = new InstagramOAuthService();
      
      // Mock fetch for token exchange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'test_token',
          token_type: 'bearer',
          expires_in: 7200,
        }),
      });

      await expect(service.exchangeCodeForTokens('test_code')).resolves.toBeDefined();
      expect(service['validator'].validateCredentials).toHaveBeenCalled();
    });
  });

  describe('RedditOAuthService', () => {
    it('should validate credentials before generating authorization URL', async () => {
      const service = new RedditOAuthService();
      
      const result = await service.getAuthorizationUrl();
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('reddit.com');
      expect(result.state).toHaveLength(64);
    });

    it('should include user agent in validation', async () => {
      const service = new RedditOAuthService();
      
      await service.getAuthorizationUrl();
      
      expect(service['validator'].validateCredentials).toHaveBeenCalledWith({
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        redirectUri: 'https://example.com/auth/reddit/callback',
        userAgent: 'web:testapp:v1.0 (by /u/testuser)',
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw validation errors with helpful messages', async () => {
      // Mock validation failure
      const mockValidator = {
        validateCredentials: vi.fn().mockResolvedValue({
          isValid: false,
          errors: [
            {
              code: 'MISSING_CLIENT_KEY',
              message: 'Client key is required',
              suggestion: 'Get your client key from the developer portal',
            },
          ],
          warnings: [],
          platform: 'tiktok',
          metadata: { validatedAt: new Date(), responseTime: 100 },
        }),
      };

      const service = new TikTokOAuthService();
      service['validator'] = mockValidator as any;

      await expect(service.getAuthorizationUrl()).rejects.toThrow(
        'TikTok OAuth credentials validation failed: Client key is required Suggestions: Get your client key from the developer portal'
      );
    });

    it('should handle missing credentials gracefully', async () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      
      const service = new TikTokOAuthService();
      
      await expect(service.getAuthorizationUrl()).rejects.toThrow(
        'TikTok OAuth credentials not configured'
      );
    });
  });
});