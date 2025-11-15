/**
 * Reddit OAuth Service Optimized - Unit Tests
 * 
 * Tests for the optimized Reddit OAuth service with:
 * - Error handling
 * - Retry logic
 * - Circuit breaker
 * - Token management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedditOAuthServiceOptimized } from '../../../lib/services/redditOAuth-optimized';
import { RedditErrorType } from '../../../lib/services/reddit/types';

// Mock environment variables
process.env.REDDIT_CLIENT_ID = 'test_client_id';
process.env.REDDIT_CLIENT_SECRET = 'test_client_secret';
process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'https://test.com/callback';
process.env.REDDIT_USER_AGENT = 'TestApp/1.0.0';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('@/lib/services/reddit/logger', () => ({
  redditLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    generateCorrelationId: () => 'test-correlation-id',
  },
}));

// Mock circuit breaker
vi.mock('@/lib/services/reddit/circuit-breaker', async (importOriginal) => {
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

describe('RedditOAuthServiceOptimized', () => {
  let service: RedditOAuthServiceOptimized;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
    service = new RedditOAuthServiceOptimized();
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
        expect(error.type).toBe(RedditErrorType.VALIDATION_ERROR);
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
          error: 'rate_limit',
          error_description: 'Rate limit exceeded',
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(RedditErrorType.RATE_LIMIT_ERROR);
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
        }),
      } as Response);

      try {
        await service.exchangeCodeForTokens('code');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(RedditErrorType.AUTH_ERROR);
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            error: 'server_error',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            error: 'server_error',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            token_type: 'bearer',
            scope: 'identity submit',
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
          access_token: 'token123',
          refresh_token: 'refresh123',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'identity',
        }),
      } as Response);

      const result = await service.exchangeCodeForTokens('code');
      
      expect(result.access_token).toBe('token123');
      expect(result.refresh_token).toBe('refresh123');
    });

    it('should get token info', () => {
      const tokenData = {
        token: 'test_token',
        tokenType: 'bearer',
        expiresAt: Date.now() + 3600000,
        refreshedAt: Date.now(),
        userId: 'user123',
        refreshToken: 'refresh_token',
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
      
      expect(result.url).toContain('reddit.com');
      expect(result.url).toContain('client_id=test_client_id');
      expect(result.state).toBeDefined();
      expect(result.state).toHaveLength(64);
    });

    it('should include custom scopes', async () => {
      const customScopes = ['identity', 'submit', 'read'];
      const result = await service.getAuthorizationUrl(customScopes);
      
      expect(result.url).toContain('scope=identity+submit+read');
    });

    it('should support temporary duration', async () => {
      const result = await service.getAuthorizationUrl(undefined, 'temporary');
      
      expect(result.url).toContain('duration=temporary');
    });

    it('should support permanent duration', async () => {
      const result = await service.getAuthorizationUrl(undefined, 'permanent');
      
      expect(result.url).toContain('duration=permanent');
    });
  });

  describe('User Info', () => {
    it('should get user info', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user123',
          name: 'testuser',
          icon_img: 'https://example.com/icon.png',
          created_utc: 1234567890,
          link_karma: 100,
          comment_karma: 50,
        }),
      } as Response);

      const result = await service.getUserInfo('access_token');
      
      expect(result.id).toBe('user123');
      expect(result.name).toBe('testuser');
      expect(result.link_karma).toBe(100);
    });
  });

  describe('Subreddits', () => {
    it('should get subscribed subreddits', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            children: [
              {
                data: {
                  name: 'r/test',
                  display_name: 'test',
                  subscribers: 1000,
                  public_description: 'Test subreddit',
                },
              },
            ],
          },
        }),
      } as Response);

      const result = await service.getSubscribedSubreddits('access_token');
      
      expect(result).toHaveLength(1);
      expect(result[0].display_name).toBe('test');
      expect(result[0].subscribers).toBe(1000);
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
          access_token: 'new_token',
          token_type: 'bearer',
          expires_in: 3600,
          scope: 'identity',
        }),
      } as Response);

      const result = await service.refreshAccessToken('old_refresh_token');
      
      expect(result.access_token).toBe('new_token');
      expect(result.refresh_token).toBe('old_refresh_token'); // Reddit doesn't rotate
    });
  });

  describe('Basic Auth Header', () => {
    it('should use Basic Auth for token requests', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'identity',
        }),
      } as Response);

      await service.exchangeCodeForTokens('code');
      
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      
      expect(headers['Authorization']).toContain('Basic ');
      expect(headers['User-Agent']).toBe('TestApp/1.0.0');
    });
  });
});
