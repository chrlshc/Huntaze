/**
 * TikTok OAuth Service Optimized - Unit Tests
 * 
 * Tests for the optimized TikTok OAuth service with:
 * - Error handling
 * - Retry logic
 * - Circuit breaker
 * - Token management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TikTokOAuthServiceOptimized } from '../../../lib/services/tiktokOAuth-optimized';
import { TikTokErrorType } from '../../../lib/services/tiktok/types';

// Mock environment variables
process.env.TIKTOK_CLIENT_KEY = 'test_client_key';
process.env.TIKTOK_CLIENT_SECRET = 'test_client_secret';
process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'https://test.com/callback';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('@/lib/services/tiktok/logger', () => ({
  tiktokLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    generateCorrelationId: () => 'test-correlation-id',
  },
}));

// Mock circuit breaker
vi.mock('@/lib/services/tiktok/circuit-breaker', async (importOriginal) => {
  return {
    CircuitBreaker: class MockCircuitBreaker {
      async execute(fn: () => Promise<any>) {
        return await fn();
      }
      getStats() {
        return { state: 'CLOSED', failures: 0, successes: 0 };
      }
      reset() {}
    },
    CircuitState: {
      CLOSED: 'CLOSED',
      OPEN: 'OPEN',
      HALF_OPEN: 'HALF_OPEN',
    },
  };
});

describe('TikTokOAuthServiceOptimized', () => {
  let service: TikTokOAuthServiceOptimized;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
    service = new TikTokOAuthServiceOptimized();
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
          error: 'invalid_request',
          error_description: 'Invalid request parameters',
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('invalid_code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(TikTokErrorType.VALIDATION_ERROR);
        expect(error.correlationId).toBe('test-correlation-id');
        expect(error.userMessage).toBeDefined();
        expect(error.timestamp).toBeDefined();
      }
    });

    it('should handle rate limit error (429)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'rate_limit_exceeded',
          error_description: 'Too many requests',
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(TikTokErrorType.RATE_LIMIT_ERROR);
        expect(error.retryable).toBe(false);
      }
    });

    it('should handle auth error (401)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'unauthorized',
          error_description: 'Invalid credentials',
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(TikTokErrorType.AUTH_ERROR);
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      
      // First two attempts fail with network error
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            error: 'server_error',
            error_description: 'Internal server error',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            error: 'server_error',
            error_description: 'Internal server error',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              access_token: 'token',
              refresh_token: 'refresh',
              expires_in: 86400,
              refresh_expires_in: 31536000,
              open_id: 'user123',
              scope: 'user.info.basic',
              token_type: 'Bearer',
            },
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
          error: 'invalid_request',
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Token Management', () => {
    it('should store token with expiration', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            access_token: 'token123',
            refresh_token: 'refresh123',
            expires_in: 86400,
            refresh_expires_in: 31536000,
            open_id: 'user123',
            scope: 'user.info.basic',
            token_type: 'Bearer',
          },
        }),
      } as Response);

      const result = await service.exchangeCodeForTokens('code');
      
      expect(result.access_token).toBe('token123');
    });

    it('should get token info', () => {
      const tokenData = {
        token: 'test_token',
        tokenType: 'bearer',
        expiresAt: Date.now() + 86400000,
        refreshedAt: Date.now(),
        userId: 'user123',
      };
      
      service['tokenStore'].set('user123', tokenData);
      
      const info = service.getTokenInfo('user123');
      expect(info).toEqual(tokenData);
    });

    it('should clear token', () => {
      service['tokenStore'].set('user123', {
        token: 'test',
        tokenType: 'bearer',
        expiresAt: Date.now(),
        refreshedAt: Date.now(),
        userId: 'user123',
      });
      
      service.clearToken('user123');
      expect(service.getTokenInfo('user123')).toBeUndefined();
    });
  });

  describe('Authorization URL', () => {
    it('should generate authorization URL with state', async () => {
      const result = await service.getAuthorizationUrl();
      
      expect(result.url).toContain('tiktok.com');
      expect(result.url).toContain('client_key=test_client_key');
      expect(result.state).toBeDefined();
      expect(result.state).toHaveLength(64);
      expect(result.codeVerifier).toBeDefined();
    });

    it('should include custom scopes', async () => {
      const customScopes = ['user.info.basic', 'video.upload'];
      const result = await service.getAuthorizationUrl(customScopes);
      
      expect(result.url).toContain('scope=user.info.basic%2Cvideo.upload');
    });
  });

  describe('User Info', () => {
    it('should get user info', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              open_id: 'user123',
              union_id: 'union123',
              avatar_url: 'https://example.com/avatar.jpg',
              display_name: 'Test User',
            },
          },
        }),
      } as Response);

      const result = await service.getUserInfo('access_token');
      
      expect(result.open_id).toBe('user123');
      expect(result.display_name).toBe('Test User');
    });
  });

  describe('Circuit Breaker', () => {
    it('should get circuit breaker stats', () => {
      const stats = service.getCircuitBreakerStats();
      expect(stats).toBeDefined();
      expect(stats.state).toBe('CLOSED');
    });

    it('should reset circuit breaker', () => {
      service.resetCircuitBreaker();
      // Should not throw
    });
  });

  describe('Refresh Token', () => {
    it('should refresh access token', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            access_token: 'new_token',
            refresh_token: 'new_refresh',
            expires_in: 86400,
            refresh_expires_in: 31536000,
            open_id: 'user123',
            scope: 'user.info.basic',
            token_type: 'Bearer',
          },
        }),
      } as Response);

      const result = await service.refreshAccessToken('old_refresh_token');
      
      expect(result.access_token).toBe('new_token');
      expect(result.refresh_token).toBe('new_refresh');
    });
  });
});
