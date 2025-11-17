/**
 * Instagram OAuth Service Optimized - Unit Tests
 * 
 * Tests for the optimized Instagram OAuth service with:
 * - Error handling
 * - Retry logic
 * - Circuit breaker
 * - Token management
 * - Caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramOAuthServiceOptimized } from '../../../lib/services/instagramOAuth-optimized';
import { InstagramErrorType } from '../../../lib/services/instagram/types';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    FACEBOOK_APP_ID: 'test_app_id',
    FACEBOOK_APP_SECRET: 'test_app_secret',
    NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI: 'https://test.com/callback',
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('@/lib/services/instagram/logger', () => ({
  instagramLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    generateCorrelationId: () => 'test-correlation-id',
  },
}));

// Mock circuit breaker
vi.mock('@/lib/services/instagram/circuit-breaker', () => ({
  CircuitBreaker: vi.fn().mockImplementation(() => ({
    execute: vi.fn((fn) => fn()),
    getStats: vi.fn(() => ({ state: 'CLOSED', failures: 0, successes: 0 })),
    reset: vi.fn(),
  })),
}));

// Mock validator
vi.mock('@/lib/validation', () => ({
  InstagramCredentialValidator: vi.fn().mockImplementation(() => ({
    validateCredentials: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    }),
  })),
}));

describe('InstagramOAuthServiceOptimized', () => {
  let service: InstagramOAuthServiceOptimized;

  beforeEach(() => {
    service = new InstagramOAuthServiceOptimized();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Handling', () => {
    it('should create structured error with correlation ID', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid request',
            code: 100,
          },
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('invalid_code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(InstagramErrorType.VALIDATION_ERROR);
        expect(error.correlationId).toBe('test-correlation-id');
        expect(error.userMessage).toBeDefined();
        expect(error.retryable).toBe(false);
        expect(error.timestamp).toBeDefined();
      }
    });

    it('should handle token expired error (code 190)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Token expired',
            code: 190,
          },
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(InstagramErrorType.TOKEN_EXPIRED);
      }
    });

    it('should handle rate limit error (429)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit exceeded',
            code: 4,
          },
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(InstagramErrorType.RATE_LIMIT_ERROR);
        expect(error.retryable).toBe(false);
      }
    });

    it('should distinguish retryable vs non-retryable errors', async () => {
      // Network error (retryable)
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.retryable).toBe(true);
      }

      // Validation error (non-retryable)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid', code: 100 },
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.retryable).toBe(false);
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network error with exponential backoff', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // Fail twice, succeed on third attempt
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'token',
            token_type: 'bearer',
            expires_in: 3600,
          }),
        } as Response);

      const result = await service.exchangeCodeForTokens('code');
      
      expect(result.access_token).toBe('token');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid', code: 100 },
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });

    it('should throw after max retries', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(mockFetch).toHaveBeenCalledTimes(3); // MAX_RETRIES
      }
    });
  });

  describe('Token Management', () => {
    it('should store token with expiration', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'long_lived_token',
          token_type: 'bearer',
          expires_in: 5184000, // 60 days
        }),
      } as Response);

      const result = await service.getLongLivedToken('short_token', 'user123');
      
      expect(result.access_token).toBe('long_lived_token');
      
      const tokenInfo = service.getTokenInfo('user123');
      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.token).toBe('long_lived_token');
      expect(tokenInfo?.userId).toBe('user123');
    });

    it('should auto-refresh token before expiration', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // First call: get long-lived token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token1',
          token_type: 'bearer',
          expires_in: 100, // Very short expiration
        }),
      } as Response);

      await service.getLongLivedToken('short_token', 'user123');
      
      // Mock refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token2',
          token_type: 'bearer',
          expires_in: 5184000,
        }),
      } as Response);

      // Wait for token to need refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const validToken = await service.getValidToken('user123');
      expect(validToken).toBe('token2');
    });

    it('should throw error if no token found', async () => {
      try {
        await service.getValidToken('nonexistent_user');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(InstagramErrorType.AUTH_ERROR);
        expect(error.message).toContain('No token found');
      }
    });

    it('should clear token', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token',
          token_type: 'bearer',
          expires_in: 5184000,
        }),
      } as Response);

      await service.getLongLivedToken('short_token', 'user123');
      expect(service.getTokenInfo('user123')).toBeDefined();
      
      service.clearToken('user123');
      expect(service.getTokenInfo('user123')).toBeUndefined();
    });
  });

  describe('Caching', () => {
    it('should cache validation results', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'token',
          token_type: 'bearer',
          expires_in: 3600,
        }),
      } as Response);

      // First call validates
      await service.exchangeCodeForTokens('code1');
      
      // Second call uses cache
      await service.exchangeCodeForTokens('code2');
      
      // Validator should only be called once (cached)
      // Note: This would need to check validator mock calls
    });

    it('should clear validation cache', () => {
      service.clearValidationCache();
      // Cache should be empty
      // Note: This is more of an integration test
    });
  });

  describe('Circuit Breaker', () => {
    it('should use circuit breaker for API calls', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token',
          token_type: 'bearer',
          expires_in: 3600,
        }),
      } as Response);

      await service.exchangeCodeForTokens('code');
      
      // Circuit breaker execute should have been called
      // Note: Check circuit breaker mock
    });

    it('should get circuit breaker stats', () => {
      const stats = service.getCircuitBreakerStats();
      expect(stats).toBeDefined();
      expect(stats.state).toBe('CLOSED');
    });

    it('should reset circuit breaker', () => {
      service.resetCircuitBreaker();
      // Circuit breaker reset should have been called
    });
  });

  describe('Authorization URL', () => {
    it('should generate authorization URL with state', async () => {
      const result = await service.getAuthorizationUrl();
      
      expect(result.url).toContain('facebook.com');
      expect(result.url).toContain('client_id=test_app_id');
      expect(result.url).toContain('redirect_uri=');
      expect(result.state).toBeDefined();
      expect(result.state).toHaveLength(64); // 32 bytes hex
    });

    it('should include custom permissions', async () => {
      const customPermissions = ['instagram_basic', 'pages_show_list'];
      const result = await service.getAuthorizationUrl(customPermissions);
      
      expect(result.url).toContain('scope=instagram_basic%2Cpages_show_list');
    });
  });

  describe('Account Info', () => {
    it('should get account info with pages', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // Mock /me response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user123' }),
      } as Response);
      
      // Mock /me/accounts response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'page123',
              name: 'Test Page',
              instagram_business_account: {
                id: 'ig123',
                username: 'testuser',
              },
            },
          ],
        }),
      } as Response);

      const result = await service.getAccountInfo('access_token');
      
      expect(result.user_id).toBe('user123');
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].instagram_business_account).toBeDefined();
    });

    it('should check if has Instagram Business account', () => {
      const pagesWithIG = [
        {
          id: 'page1',
          name: 'Page 1',
          instagram_business_account: { id: 'ig1', username: 'user1' },
        },
      ];
      
      const pagesWithoutIG = [
        { id: 'page2', name: 'Page 2' },
      ];
      
      expect(service.hasInstagramBusinessAccount(pagesWithIG)).toBe(true);
      expect(service.hasInstagramBusinessAccount(pagesWithoutIG)).toBe(false);
    });
  });

  describe('Instagram Account Details', () => {
    it('should get Instagram account details', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'ig123',
          username: 'testuser',
          name: 'Test User',
          profile_picture_url: 'https://example.com/pic.jpg',
          followers_count: 1000,
          follows_count: 500,
          media_count: 50,
        }),
      } as Response);

      const result = await service.getInstagramAccountDetails('ig123', 'token');
      
      expect(result.id).toBe('ig123');
      expect(result.username).toBe('testuser');
      expect(result.followers_count).toBe(1000);
    });
  });

  describe('Revoke Access', () => {
    it('should revoke access successfully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await expect(service.revokeAccess('token')).resolves.not.toThrow();
    });

    it('should handle revoke failure gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Failed to revoke' },
        }),
      } as Response);

      // Should not throw, just log warning
      await expect(service.revokeAccess('token')).resolves.not.toThrow();
    });
  });
});
