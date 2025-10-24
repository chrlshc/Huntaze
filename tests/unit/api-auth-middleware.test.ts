import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  APIAuthService,
  withAuth,
  withRateLimit,
  withAuthAndRateLimit,
  AuthContext,
} from '@/lib/middleware/api-auth';
import {
  AuthenticationError,
  AuthorizationError,
} from '@/lib/types/api-errors';

describe('APIAuthService', () => {
  let authService: APIAuthService;
  let mockRequest: NextRequest;

  beforeEach(() => {
    authService = APIAuthService.getInstance();
    
    // Create mock NextRequest
    mockRequest = {
      headers: new Map(),
      cookies: new Map(),
    } as any;

    // Reset rate limit store
    (authService as any).rateLimitStore.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authentication', () => {
    it('should authenticate with valid API key', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer test-creator-key-123']
      ]);

      const context = await authService.authenticate(mockRequest);

      expect(context.userId).toBe('creator-123');
      expect(context.role).toBe('creator');
      expect(context.permissions).toContain('content:generate');
    });

    it('should authenticate with X-API-Key header', async () => {
      mockRequest.headers = new Map([
        ['x-api-key', 'test-creator-key-123']
      ]);

      const context = await authService.authenticate(mockRequest);

      expect(context.userId).toBe('creator-123');
      expect(context.role).toBe('creator');
    });

    it('should authenticate admin with full permissions', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer test-admin-key-456']
      ]);

      const context = await authService.authenticate(mockRequest);

      expect(context.userId).toBe('admin-456');
      expect(context.role).toBe('admin');
      expect(context.permissions).toContain('*');
    });

    it('should throw error for invalid API key', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer invalid-key']
      ]);

      await expect(authService.authenticate(mockRequest))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw error for missing credentials', async () => {
      await expect(authService.authenticate(mockRequest))
        .rejects.toThrow(AuthenticationError);
    });

    it('should authenticate with JWT token', async () => {
      // Mock JWT token (base64 encoded payload)
      const payload = { sub: 'user-123', role: 'creator', exp: Date.now() / 1000 + 3600 };
      const mockJWT = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
      
      mockRequest.headers = new Map([
        ['authorization', `Bearer ${mockJWT}`]
      ]);

      const context = await authService.authenticate(mockRequest);

      expect(context.userId).toBe('user-123');
      expect(context.role).toBe('creator');
    });

    it('should throw error for expired JWT', async () => {
      const payload = { sub: 'user-123', exp: Date.now() / 1000 - 3600 }; // Expired
      const mockJWT = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
      
      mockRequest.headers = new Map([
        ['authorization', `Bearer ${mockJWT}`]
      ]);

      await expect(authService.authenticate(mockRequest))
        .rejects.toThrow(AuthenticationError);
    });

    it('should authenticate from cookies', async () => {
      const payload = { sub: 'user-456', role: 'creator', exp: Date.now() / 1000 + 3600 };
      const mockJWT = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
      
      mockRequest.cookies = new Map([
        ['auth-token', { value: mockJWT }]
      ]) as any;

      const context = await authService.authenticate(mockRequest);

      expect(context.userId).toBe('user-456');
    });
  });

  describe('authorization', () => {
    let mockContext: AuthContext;

    beforeEach(() => {
      mockContext = {
        userId: 'user-123',
        role: 'creator',
        permissions: ['content:generate', 'content:brainstorm'],
        rateLimits: {
          contentGeneration: 100,
          brainstorming: 50,
          trendAnalysis: 10,
        },
      };
    });

    it('should allow access with correct permission', () => {
      expect(() => {
        authService.authorize(mockContext, 'content:generate');
      }).not.toThrow();
    });

    it('should deny access without permission', () => {
      expect(() => {
        authService.authorize(mockContext, 'admin:delete');
      }).toThrow(AuthorizationError);
    });

    it('should allow admin access to all permissions', () => {
      const adminContext = {
        ...mockContext,
        role: 'admin' as const,
        permissions: ['*'],
      };

      expect(() => {
        authService.authorize(adminContext, 'any:permission');
      }).not.toThrow();
    });

    it('should provide detailed error context on authorization failure', () => {
      try {
        authService.authorize(mockContext, 'admin:delete');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        expect((error as AuthorizationError).context).toEqual({
          userId: 'user-123',
          role: 'creator',
          requiredPermission: 'admin:delete',
          userPermissions: ['content:generate', 'content:brainstorm'],
        });
      }
    });
  });

  describe('rate limiting', () => {
    let mockContext: AuthContext;

    beforeEach(() => {
      mockContext = {
        userId: 'user-123',
        role: 'creator',
        permissions: ['content:generate'],
        rateLimits: {
          contentGeneration: 2, // Low limit for testing
          brainstorming: 1,
          trendAnalysis: 1,
        },
      };
    });

    it('should allow requests within rate limit', async () => {
      await expect(
        authService.checkRateLimit(mockContext, 'contentGeneration')
      ).resolves.not.toThrow();

      await expect(
        authService.checkRateLimit(mockContext, 'contentGeneration')
      ).resolves.not.toThrow();
    });

    it('should block requests exceeding rate limit', async () => {
      // Use up the rate limit
      await authService.checkRateLimit(mockContext, 'contentGeneration');
      await authService.checkRateLimit(mockContext, 'contentGeneration');

      // This should fail
      await expect(
        authService.checkRateLimit(mockContext, 'contentGeneration')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should track different operations separately', async () => {
      await authService.checkRateLimit(mockContext, 'contentGeneration');
      await authService.checkRateLimit(mockContext, 'contentGeneration');

      // Should still allow brainstorming
      await expect(
        authService.checkRateLimit(mockContext, 'brainstorming')
      ).resolves.not.toThrow();
    });

    it('should clean up old rate limit entries', async () => {
      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let currentTime = Date.now();
      Date.now = vi.fn(() => currentTime);

      await authService.checkRateLimit(mockContext, 'contentGeneration');
      
      // Advance time by 2 hours
      currentTime += 2 * 60 * 60 * 1000;
      
      // Should allow new requests after window expires
      await expect(
        authService.checkRateLimit(mockContext, 'contentGeneration')
      ).resolves.not.toThrow();

      Date.now = originalNow;
    });

    it('should provide rate limit status', () => {
      const status = authService.getRateLimitStatus('user-123');
      
      expect(status).toHaveProperty('contentGeneration');
      expect(status).toHaveProperty('brainstorming');
      expect(status).toHaveProperty('trendAnalysis');
      
      expect(status.contentGeneration).toHaveProperty('current');
      expect(status.contentGeneration).toHaveProperty('limit');
      expect(status.contentGeneration).toHaveProperty('resetTime');
    });
  });

  describe('API key management', () => {
    it('should generate new API key', () => {
      const apiKey = authService.generateAPIKey(
        'new-user',
        'creator',
        ['content:generate'],
        {
          contentGeneration: 100,
          brainstorming: 50,
          trendAnalysis: 10,
        }
      );

      expect(typeof apiKey).toBe('string');
      expect(apiKey).toContain('creator-new-user');
    });

    it('should revoke API key', () => {
      const apiKey = authService.generateAPIKey(
        'test-user',
        'creator',
        ['content:generate'],
        {
          contentGeneration: 100,
          brainstorming: 50,
          trendAnalysis: 10,
        }
      );

      authService.revokeAPIKey(apiKey);

      // Should not be able to authenticate with revoked key
      mockRequest.headers = new Map([
        ['authorization', `Bearer ${apiKey}`]
      ]);

      expect(authService.authenticate(mockRequest))
        .rejects.toThrow(AuthenticationError);
    });

    it('should handle expired API keys', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const apiKey = authService.generateAPIKey(
        'expired-user',
        'creator',
        ['content:generate'],
        {
          contentGeneration: 100,
          brainstorming: 50,
          trendAnalysis: 10,
        },
        expiredDate
      );

      mockRequest.headers = new Map([
        ['authorization', `Bearer ${apiKey}`]
      ]);

      await expect(authService.authenticate(mockRequest))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('middleware functions', () => {
    it('should authenticate and authorize with withAuth', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer test-creator-key-123']
      ]);

      const context = await withAuth(mockRequest, 'content:generate');

      expect(context.userId).toBe('creator-123');
      expect(context.permissions).toContain('content:generate');
    });

    it('should throw on missing permission with withAuth', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer test-creator-key-123']
      ]);

      await expect(withAuth(mockRequest, 'admin:delete'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should check rate limits with withRateLimit', async () => {
      const context: AuthContext = {
        userId: 'user-123',
        role: 'creator',
        permissions: ['content:generate'],
        rateLimits: {
          contentGeneration: 1,
          brainstorming: 1,
          trendAnalysis: 1,
        },
      };

      await expect(withRateLimit(context, 'contentGeneration'))
        .resolves.not.toThrow();

      await expect(withRateLimit(context, 'contentGeneration'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should combine auth and rate limiting with withAuthAndRateLimit', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer test-creator-key-123']
      ]);

      const context = await withAuthAndRateLimit(
        mockRequest,
        'content:generate',
        'contentGeneration'
      );

      expect(context.userId).toBe('creator-123');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JWT tokens', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer invalid.jwt.token']
      ]);

      await expect(authService.authenticate(mockRequest))
        .rejects.toThrow(AuthenticationError);
    });

    it('should handle JWT without required fields', async () => {
      const payload = { invalid: 'payload' };
      const mockJWT = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
      
      mockRequest.headers = new Map([
        ['authorization', `Bearer ${mockJWT}`]
      ]);

      const context = await authService.authenticate(mockRequest);
      
      // Should use defaults for missing fields
      expect(context.role).toBe('creator');
      expect(context.permissions).toEqual(['content:generate']);
    });

    it('should handle concurrent rate limit checks', async () => {
      const context: AuthContext = {
        userId: 'concurrent-user',
        role: 'creator',
        permissions: ['content:generate'],
        rateLimits: {
          contentGeneration: 1,
          brainstorming: 1,
          trendAnalysis: 1,
        },
      };

      const promises = Array(3).fill(null).map(() =>
        authService.checkRateLimit(context, 'contentGeneration')
      );

      const results = await Promise.allSettled(promises);
      
      // Only one should succeed, others should fail
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = APIAuthService.getInstance();
      const instance2 = APIAuthService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across instances', () => {
      const instance1 = APIAuthService.getInstance();
      const instance2 = APIAuthService.getInstance();

      const apiKey = instance1.generateAPIKey(
        'singleton-test',
        'creator',
        ['test:permission'],
        {
          contentGeneration: 100,
          brainstorming: 50,
          trendAnalysis: 10,
        }
      );

      mockRequest.headers = new Map([
        ['authorization', `Bearer ${apiKey}`]
      ]);

      expect(instance2.authenticate(mockRequest))
        .resolves.toHaveProperty('userId', 'singleton-test');
    });
  });

  describe('performance', () => {
    it('should handle high-frequency authentication requests', async () => {
      mockRequest.headers = new Map([
        ['authorization', 'Bearer test-creator-key-123']
      ]);

      const startTime = Date.now();
      
      const promises = Array(100).fill(null).map(() =>
        authService.authenticate(mockRequest)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      results.forEach(context => {
        expect(context.userId).toBe('creator-123');
      });
    });

    it('should efficiently manage rate limit storage', async () => {
      const context: AuthContext = {
        userId: 'perf-test-user',
        role: 'creator',
        permissions: ['content:generate'],
        rateLimits: {
          contentGeneration: 1000,
          brainstorming: 1000,
          trendAnalysis: 1000,
        },
      };

      // Make many requests to test storage efficiency
      for (let i = 0; i < 100; i++) {
        await authService.checkRateLimit(context, 'contentGeneration');
      }

      const status = authService.getRateLimitStatus('perf-test-user');
      expect(status.contentGeneration.current).toBe(100);
    });
  });
});