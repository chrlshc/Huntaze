/**
 * Instagram OAuth Phase 3 Improvements Integration Tests
 * 
 * Tests the complete Instagram OAuth flow with Phase 3 enhancements:
 * - Token refresh functionality
 * - Enhanced error handling
 * - Retry logic
 * - Rate limiting awareness
 */

import { NextRequest } from 'next/server';
import { GET as instagramInit } from '@/app/api/auth/instagram/route';
import { GET as instagramCallback } from '@/app/api/auth/instagram/callback/route';
import { POST as instagramDisconnect } from '@/app/api/instagram/disconnect/route';
import { GET as instagramTestAuth } from '@/app/api/instagram/test-auth/route';

// Mock external dependencies
jest.mock('@/lib/auth/getUserFromRequest');
jest.mock('@/lib/services/tokenManager');
jest.mock('@/lib/oauth/stateManager');
jest.mock('@/lib/services/instagramOAuth');

const mockRequireAuth = require('@/lib/auth/getUserFromRequest').requireAuth;
const mockTokenManager = require('@/lib/services/tokenManager').tokenManager;
const mockStateManager = require('@/lib/oauth/stateManager').oauthStateManager;

// Mock user
const mockUser = {
  id: 'user123',
  email: 'test@example.com',
};

// Mock Instagram OAuth Service
const mockInstagramOAuth = {
  getAuthorizationUrl: jest.fn(),
  exchangeCodeForTokens: jest.fn(),
  getLongLivedToken: jest.fn(),
  refreshLongLivedToken: jest.fn(),
  getAccountInfo: jest.fn(),
  hasInstagramBusinessAccount: jest.fn(),
  getInstagramAccountDetails: jest.fn(),
  revokeAccess: jest.fn(),
};

// Mock the dynamic import
jest.mock('@/lib/services/instagramOAuth', () => ({
  InstagramOAuthService: jest.fn(() => mockInstagramOAuth),
}));

describe('Instagram OAuth Phase 3 Improvements - Integration Tests', () => {
  beforeEach(() => {
    // Set up environment variables
    process.env.FACEBOOK_APP_ID = 'test_app_id';
    process.env.FACEBOOK_APP_SECRET = 'test_app_secret';
    process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'https://test.com/callback';

    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockRequireAuth.mockResolvedValue(mockUser);
    mockStateManager.storeState.mockResolvedValue('secure_state_123');
    mockStateManager.validateAndConsumeState.mockResolvedValue(true);
  });

  describe('OAuth Init with Enhanced Error Handling', () => {
    it('should handle missing credentials gracefully', async () => {
      // Remove credentials
      delete process.env.FACEBOOK_APP_ID;

      const request = new NextRequest('https://test.com/api/auth/instagram');
      const response = await instagramInit(request);

      expect(response.status).toBe(302); // Redirect to error page
      const location = response.headers.get('location');
      expect(location).toContain('error=configuration_error');
    });

    it('should handle Instagram OAuth service errors', async () => {
      mockInstagramOAuth.getAuthorizationUrl.mockRejectedValue(
        new Error('Instagram API temporarily unavailable')
      );

      const request = new NextRequest('https://test.com/api/auth/instagram');
      const response = await instagramInit(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('error=service_unavailable');
    });
  });

  describe('OAuth Callback with Token Refresh Support', () => {
    it('should complete OAuth flow and store tokens with refresh capability', async () => {
      const mockShortToken = {
        access_token: 'short_lived_token',
        token_type: 'bearer',
        expires_in: 7200,
      };

      const mockLongToken = {
        access_token: 'long_lived_token',
        token_type: 'bearer',
        expires_in: 5184000, // 60 days
      };

      const mockAccountInfo = {
        user_id: 'fb_user_123',
        access_token: 'long_lived_token',
        pages: [
          {
            id: 'page_123',
            name: 'Test Page',
            instagram_business_account: {
              id: 'ig_business_123',
              username: 'testbusiness',
            },
          },
        ],
      };

      const mockIgDetails = {
        id: 'ig_business_123',
        username: 'testbusiness',
        name: 'Test Business',
        profile_picture_url: 'https://example.com/pic.jpg',
        followers_count: 1000,
        follows_count: 500,
        media_count: 100,
      };

      // Mock successful OAuth flow
      mockInstagramOAuth.exchangeCodeForTokens.mockResolvedValue(mockShortToken);
      mockInstagramOAuth.getLongLivedToken.mockResolvedValue(mockLongToken);
      mockInstagramOAuth.getAccountInfo.mockResolvedValue(mockAccountInfo);
      mockInstagramOAuth.hasInstagramBusinessAccount.mockReturnValue(true);
      mockInstagramOAuth.getInstagramAccountDetails.mockResolvedValue(mockIgDetails);

      const request = new NextRequest(
        'https://test.com/api/auth/instagram/callback?code=auth_code&state=secure_state_123'
      );
      const response = await instagramCallback(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('success=true');
      expect(location).toContain('platform=instagram');

      // Verify tokens were stored with proper metadata for refresh
      expect(mockTokenManager.storeTokens).toHaveBeenCalledWith({
        userId: 'user123',
        provider: 'instagram',
        openId: 'fb_user_123',
        tokens: {
          accessToken: 'long_lived_token',
          refreshToken: undefined, // Instagram doesn't use refresh tokens
          expiresAt: expect.any(Date),
          scope: expect.any(String),
          metadata: expect.objectContaining({
            page_id: 'page_123',
            ig_business_id: 'ig_business_123',
            ig_username: 'testbusiness',
          }),
        },
      });
    });

    it('should handle rate limiting during OAuth callback', async () => {
      mockInstagramOAuth.exchangeCodeForTokens.mockRejectedValue(
        new Error('Rate limit exceeded. Please try again later.')
      );

      const request = new NextRequest(
        'https://test.com/api/auth/instagram/callback?code=auth_code&state=secure_state_123'
      );
      const response = await instagramCallback(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('error=rate_limit_exceeded');
    });

    it('should handle missing Instagram Business account', async () => {
      const mockShortToken = {
        access_token: 'short_lived_token',
        token_type: 'bearer',
        expires_in: 7200,
      };

      const mockLongToken = {
        access_token: 'long_lived_token',
        token_type: 'bearer',
        expires_in: 5184000,
      };

      const mockAccountInfo = {
        user_id: 'fb_user_123',
        access_token: 'long_lived_token',
        pages: [
          {
            id: 'page_123',
            name: 'Test Page',
            // No Instagram Business account
          },
        ],
      };

      mockInstagramOAuth.exchangeCodeForTokens.mockResolvedValue(mockShortToken);
      mockInstagramOAuth.getLongLivedToken.mockResolvedValue(mockLongToken);
      mockInstagramOAuth.getAccountInfo.mockResolvedValue(mockAccountInfo);
      mockInstagramOAuth.hasInstagramBusinessAccount.mockReturnValue(false);

      const request = new NextRequest(
        'https://test.com/api/auth/instagram/callback?code=auth_code&state=secure_state_123'
      );
      const response = await instagramCallback(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('error=no_business_account');
    });
  });

  describe('Disconnect with Enhanced Error Handling', () => {
    it('should disconnect Instagram account successfully', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        openId: 'fb_user_123',
        metadata: { ig_username: 'testbusiness' },
      };

      mockTokenManager.getAccount.mockResolvedValue(mockAccount);
      mockTokenManager.getValidToken.mockResolvedValue('valid_token');
      mockInstagramOAuth.revokeAccess.mockResolvedValue(undefined);
      mockTokenManager.deleteAccount.mockResolvedValue(undefined);

      const request = new NextRequest('https://test.com/api/instagram/disconnect', {
        method: 'POST',
      });
      const response = await instagramDisconnect(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Instagram account disconnected successfully');

      // Verify revocation was attempted
      expect(mockInstagramOAuth.revokeAccess).toHaveBeenCalledWith('valid_token');
      
      // Verify account was deleted
      expect(mockTokenManager.deleteAccount).toHaveBeenCalledWith({
        userId: 'user123',
        provider: 'instagram',
      });
    });

    it('should handle revocation failure gracefully', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        openId: 'fb_user_123',
      };

      mockTokenManager.getAccount.mockResolvedValue(mockAccount);
      mockTokenManager.getValidToken.mockResolvedValue('valid_token');
      mockInstagramOAuth.revokeAccess.mockRejectedValue(
        new Error('Instagram API error')
      );
      mockTokenManager.deleteAccount.mockResolvedValue(undefined);

      const request = new NextRequest('https://test.com/api/instagram/disconnect', {
        method: 'POST',
      });
      const response = await instagramDisconnect(request);

      // Should still succeed (revocation is best effort)
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Should still delete from database
      expect(mockTokenManager.deleteAccount).toHaveBeenCalled();
    });
  });

  describe('Test Auth Endpoint', () => {
    it('should provide comprehensive OAuth configuration test', async () => {
      const mockAccount = {
        id: 1,
        provider: 'instagram',
        metadata: { ig_username: 'testbusiness' },
      };

      mockTokenManager.getAccount.mockResolvedValue(mockAccount);
      mockInstagramOAuth.getAuthorizationUrl.mockResolvedValue({
        url: 'https://facebook.com/oauth',
        state: 'test_state',
      });

      const request = new NextRequest('https://test.com/api/instagram/test-auth');
      const response = await instagramTestAuth(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.config.hasAppId).toBe(true);
      expect(data.config.hasAppSecret).toBe(true);
      expect(data.config.hasRedirectUri).toBe(true);
      expect(data.serviceTest.canInstantiate).toBe(true);
      expect(data.serviceTest.canGenerateUrl).toBe(true);
      expect(data.connectionStatus.hasConnection).toBe(true);
      expect(data.connectionStatus.username).toBe('testbusiness');
    });

    it('should detect configuration issues', async () => {
      // Remove app ID
      delete process.env.FACEBOOK_APP_ID;

      mockInstagramOAuth.getAuthorizationUrl.mockRejectedValue(
        new Error('Instagram/Facebook OAuth credentials not configured')
      );

      const request = new NextRequest('https://test.com/api/instagram/test-auth');
      const response = await instagramTestAuth(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.config.hasAppId).toBe(false);
      expect(data.serviceTest.error).toContain('credentials not configured');
      expect(data.recommendations).toContain('Set FACEBOOK_APP_ID environment variable');
    });
  });

  describe('Error Handling Consistency', () => {
    it('should provide consistent error format across all endpoints', async () => {
      // Test authentication error
      mockRequireAuth.mockRejectedValue({
        code: 'unauthorized',
        message: 'Invalid token',
        statusCode: 401,
      });

      const request = new NextRequest('https://test.com/api/auth/instagram');
      const response = await instagramInit(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('error=unauthorized');
    });

    it('should handle network errors gracefully', async () => {
      mockInstagramOAuth.getAuthorizationUrl.mockRejectedValue(
        new Error('Network error')
      );

      const request = new NextRequest('https://test.com/api/auth/instagram');
      const response = await instagramInit(request);

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(location).toContain('error=network_error');
    });
  });
});