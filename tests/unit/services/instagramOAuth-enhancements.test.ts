/**
 * Instagram OAuth Service Enhancements Tests
 * 
 * Tests for Phase 3 improvements:
 * - Token refresh functionality
 * - Retry logic with exponential backoff
 * - Rate limiting awareness
 * - Enhanced error handling
 */

import { InstagramOAuthService } from '@/lib/services/instagramOAuth';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  log: jest.spyOn(console, 'log').mockImplementation(),
};

describe('InstagramOAuthService - Phase 3 Enhancements', () => {
  let service: InstagramOAuthService;

  beforeEach(() => {
    // Set up environment variables
    process.env.FACEBOOK_APP_ID = 'test_app_id';
    process.env.FACEBOOK_APP_SECRET = 'test_app_secret';
    process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'https://test.com/callback';

    service = new InstagramOAuthService();
    
    // Clear all mocks
    mockFetch.mockClear();
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Refresh Functionality', () => {
    it('should refresh long-lived token successfully', async () => {
      const mockResponse = {
        access_token: 'new_long_lived_token',
        token_type: 'bearer',
        expires_in: 5184000, // 60 days
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.refreshLongLivedToken('old_token');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('oauth/access_token'),
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/1.0',
          },
        })
      );
    });

    it('should handle token refresh with expired token error', async () => {
      const mockErrorResponse = {
        error: {
          code: 190,
          message: 'Invalid OAuth access token.',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      } as Response);

      await expect(service.refreshLongLivedToken('expired_token'))
        .rejects.toThrow('Token has expired and cannot be refreshed. Please reconnect your Instagram account.');
    });

    it('should handle rate limiting during token refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      } as Response);

      await expect(service.refreshLongLivedToken('token'))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    beforeEach(() => {
      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return {} as NodeJS.Timeout;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should retry failed requests with exponential backoff', async () => {
      // First two calls fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Server error' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'success_token',
            token_type: 'bearer',
            expires_in: 5184000,
          }),
        } as Response);

      const result = await service.refreshLongLivedToken('token');

      expect(result.access_token).toBe('success_token');
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(2); // Two retry warnings
    });

    it('should not retry on authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid credentials' } }),
      } as Response);

      await expect(service.refreshLongLivedToken('token'))
        .rejects.toThrow('Invalid credentials');

      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should fail after maximum retries', async () => {
      // All calls fail with 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      } as Response);

      await expect(service.refreshLongLivedToken('token'))
        .rejects.toThrow('Server error');

      expect(mockFetch).toHaveBeenCalledTimes(3); // Max retries
      expect(consoleSpy.warn).toHaveBeenCalledTimes(2); // Two retry warnings
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('failed after 3 attempts'),
        expect.any(Error)
      );
    });
  });

  describe('Rate Limiting Awareness', () => {
    it('should handle rate limiting in token exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      } as Response);

      await expect(service.exchangeCodeForTokens('code'))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle rate limiting in account info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      } as Response);

      await expect(service.getAccountInfo('token'))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle rate limiting in account details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      } as Response);

      await expect(service.getInstagramAccountDetails('ig_id', 'token'))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should include User-Agent header in all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token',
          token_type: 'bearer',
          expires_in: 7200,
        }),
      } as Response);

      await service.exchangeCodeForTokens('code');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/1.0',
          },
        })
      );
    });

    it('should provide specific error messages for different scenarios', async () => {
      // Test specific error code handling
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 190,
            message: 'Invalid OAuth access token.',
          },
        }),
      } as Response);

      await expect(service.refreshLongLivedToken('token'))
        .rejects.toThrow('Token has expired and cannot be refreshed. Please reconnect your Instagram account.');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.exchangeCodeForTokens('code'))
        .rejects.toThrow('Network error');
    });
  });

  describe('Validation Cache Management', () => {
    it('should clear validation cache', () => {
      // This should not throw
      expect(() => service.clearValidationCache()).not.toThrow();
    });
  });

  describe('Business Account Validation', () => {
    it('should correctly identify pages with Instagram Business accounts', () => {
      const pagesWithBusiness = [
        {
          id: 'page1',
          name: 'Page 1',
          instagram_business_account: {
            id: 'ig1',
            username: 'business1',
          },
        },
        {
          id: 'page2',
          name: 'Page 2',
          // No Instagram Business account
        },
      ];

      const result = service.hasInstagramBusinessAccount(pagesWithBusiness);
      expect(result).toBe(true);
    });

    it('should return false when no pages have Instagram Business accounts', () => {
      const pagesWithoutBusiness = [
        {
          id: 'page1',
          name: 'Page 1',
        },
        {
          id: 'page2',
          name: 'Page 2',
        },
      ];

      const result = service.hasInstagramBusinessAccount(pagesWithoutBusiness);
      expect(result).toBe(false);
    });
  });
});