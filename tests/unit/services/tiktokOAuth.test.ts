/**
 * Unit Tests - TikTok OAuth Service
 * 
 * Tests for TikTok OAuth 2.0 implementation
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 3)
 * 
 * Coverage:
 * - Authorization URL generation with state
 * - Code exchange for tokens
 * - Token refresh with rotation
 * - Error handling for all OAuth flows
 * - User info retrieval
 * - Token revocation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set environment variables BEFORE any imports
process.env.TIKTOK_CLIENT_KEY = 'test_client_key';
process.env.TIKTOK_CLIENT_SECRET = 'test_client_secret';
process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'https://test.com/callback';

// Now import the service
const { TikTokOAuthService } = await import('../../../lib/services/tiktokOAuth');

describe('TikTokOAuthService - Unit Tests', () => {
  let service: TikTokOAuthService;

  beforeEach(() => {
    // Create fresh service instance
    service = new TikTokOAuthService();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 3.1 - TikTokOAuthService Creation', () => {
    describe('Constructor', () => {
      it('should initialize with environment variables', () => {
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(TikTokOAuthService);
      });

      it('should throw error if TIKTOK_CLIENT_KEY is missing', () => {
        const originalKey = process.env.TIKTOK_CLIENT_KEY;
        delete process.env.TIKTOK_CLIENT_KEY;
        
        expect(() => new TikTokOAuthService()).toThrow(
          'TikTok OAuth credentials not configured'
        );
        
        process.env.TIKTOK_CLIENT_KEY = originalKey;
      });

      it('should throw error if TIKTOK_CLIENT_SECRET is missing', () => {
        const originalSecret = process.env.TIKTOK_CLIENT_SECRET;
        delete process.env.TIKTOK_CLIENT_SECRET;
        
        expect(() => new TikTokOAuthService()).toThrow(
          'TikTok OAuth credentials not configured'
        );
        
        process.env.TIKTOK_CLIENT_SECRET = originalSecret;
      });

      it('should throw error if NEXT_PUBLIC_TIKTOK_REDIRECT_URI is missing', () => {
        const originalUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
        delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
        
        expect(() => new TikTokOAuthService()).toThrow(
          'TikTok OAuth credentials not configured'
        );
        
        process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = originalUri;
      });
    });

    describe('getAuthorizationUrl()', () => {
      it('should generate authorization URL with default scopes', () => {
        const result = service.getAuthorizationUrl();
        
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('state');
        expect(result.url).toContain('https://www.tiktok.com/v2/auth/authorize');
        expect(result.url).toContain('client_key=test_client_key');
        expect(result.url).toContain('scope=user.info.basic%2Cvideo.upload%2Cvideo.list');
        expect(result.url).toContain('response_type=code');
        expect(result.url).toContain('redirect_uri=https%3A%2F%2Ftest.com%2Fcallback');
        expect(result.url).toContain(`state=${result.state}`);
      });

      it('should generate authorization URL with custom scopes', () => {
        const customScopes = ['user.info.basic', 'video.publish'];
        const result = service.getAuthorizationUrl(customScopes);
        
        expect(result.url).toContain('scope=user.info.basic%2Cvideo.publish');
      });

      it('should generate unique state for each call (CSRF protection)', () => {
        const result1 = service.getAuthorizationUrl();
        const result2 = service.getAuthorizationUrl();
        
        expect(result1.state).not.toBe(result2.state);
        expect(result1.state).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(result2.state).toHaveLength(64);
      });

      it('should generate cryptographically secure state', () => {
        const result = service.getAuthorizationUrl();
        
        // State should be hex string
        expect(result.state).toMatch(/^[0-9a-f]{64}$/);
      });

      it('should handle empty scopes array', () => {
        const result = service.getAuthorizationUrl([]);
        
        expect(result.url).toContain('scope=');
        expect(result.state).toBeTruthy();
      });
    });

    describe('exchangeCodeForTokens()', () => {
      it('should exchange code for tokens successfully', async () => {
        const mockTokenResponse = {
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_in: 86400,
          refresh_expires_in: 31536000,
          open_id: 'test_open_id',
          scope: 'user.info.basic,video.upload',
          token_type: 'Bearer',
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockTokenResponse,
        });

        const result = await service.exchangeCodeForTokens('test_code');

        expect(result).toEqual(mockTokenResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://open.tiktokapis.com/v2/oauth/token/',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
        );
      });

      it('should include correct parameters in token request', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ access_token: 'token' }),
        });

        await service.exchangeCodeForTokens('test_code');

        const callArgs = (global.fetch as any).mock.calls[0];
        const body = callArgs[1].body;

        expect(body).toContain('client_key=test_client_key');
        expect(body).toContain('client_secret=test_client_secret');
        expect(body).toContain('code=test_code');
        expect(body).toContain('grant_type=authorization_code');
        expect(body).toContain('redirect_uri=https%3A%2F%2Ftest.com%2Fcallback');
      });

      it('should handle API error response', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code',
          }),
        });

        await expect(service.exchangeCodeForTokens('invalid_code')).rejects.toThrow(
          'Invalid authorization code'
        );
      });

      it('should handle network error', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        await expect(service.exchangeCodeForTokens('test_code')).rejects.toThrow(
          'Failed to exchange code for tokens'
        );
      });
    });

    describe('refreshAccessToken()', () => {
      it('should refresh access token successfully', async () => {
        const mockRefreshResponse = {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 86400,
          refresh_expires_in: 31536000,
          token_type: 'Bearer',
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockRefreshResponse,
        });

        const result = await service.refreshAccessToken('old_refresh_token');

        expect(result).toEqual(mockRefreshResponse);
      });

      it('should handle token rotation (new refresh token)', async () => {
        const mockRefreshResponse = {
          access_token: 'new_access_token',
          refresh_token: 'rotated_refresh_token',
          expires_in: 86400,
          token_type: 'Bearer',
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockRefreshResponse,
        });

        const result = await service.refreshAccessToken('old_refresh_token');

        expect(result.refresh_token).toBe('rotated_refresh_token');
        expect(result.refresh_token).not.toBe('old_refresh_token');
      });

      it('should handle expired refresh token', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Refresh token expired',
          }),
        });

        await expect(service.refreshAccessToken('expired_token')).rejects.toThrow(
          'Refresh token expired'
        );
      });
    });

    describe('revokeAccess()', () => {
      it('should revoke access token successfully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        });

        await expect(service.revokeAccess('test_token')).resolves.not.toThrow();
      });

      it('should not throw on revoke failure (best effort)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ error: 'invalid_token' }),
        });

        await expect(service.revokeAccess('invalid_token')).resolves.not.toThrow();
      });
    });

    describe('getUserInfo()', () => {
      it('should get user info successfully', async () => {
        const mockUserInfo = {
          data: {
            user: {
              open_id: 'test_open_id',
              union_id: 'test_union_id',
              avatar_url: 'https://example.com/avatar.jpg',
              display_name: 'Test User',
            },
          },
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockUserInfo,
        });

        const result = await service.getUserInfo('test_access_token');

        expect(result).toEqual(mockUserInfo.data.user);
      });

      it('should handle invalid access token', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({
            error: {
              code: 'invalid_token',
              message: 'Invalid access token',
            },
          }),
        });

        await expect(service.getUserInfo('invalid_token')).rejects.toThrow(
          'Invalid access token'
        );
      });
    });
  });

  describe('Security', () => {
    it('should use HTTPS for all API calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'token' }),
      });

      await service.exchangeCodeForTokens('code');

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[0]).toMatch(/^https:\/\//);
    });

    it('should use cryptographically secure random for state', () => {
      const states = new Set();
      
      for (let i = 0; i < 100; i++) {
        const { state } = service.getAuthorizationUrl();
        states.add(state);
      }
      
      expect(states.size).toBe(100);
    });
  });
});
