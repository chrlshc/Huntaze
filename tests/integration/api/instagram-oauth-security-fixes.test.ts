/**
 * Instagram OAuth Security Fixes Integration Tests
 * 
 * Tests the complete Instagram OAuth flow with security improvements:
 * - End-to-end authentication flow
 * - State management integration
 * - Error handling scenarios
 * - Database integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';

// Test configuration
const TEST_USER = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
};

const MOCK_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjAwMDAwMDAwfQ.test';

describe('Instagram OAuth Security Integration', () => {
  beforeEach(() => {
    // Set up test environment
    process.env.FACEBOOK_APP_ID = 'test_app_id';
    process.env.FACEBOOK_APP_SECRET = 'test_app_secret';
    process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'https://example.com/callback';
    process.env.JWT_SECRET = 'test_jwt_secret';
  });

  afterEach(() => {
    // Clean up
    delete process.env.FACEBOOK_APP_ID;
    delete process.env.FACEBOOK_APP_SECRET;
    delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
  });

  describe('OAuth Init Endpoint', () => {
    it('should reject unauthenticated requests', async () => {
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
          });
          
          expect(response.status).toBe(302); // Redirect to error page
          
          const location = response.headers.get('location');
          expect(location).toContain('error=');
        },
      });
    });

    it('should redirect authenticated users to Instagram OAuth', async () => {
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('facebook.com');
          expect(location).toContain('client_id=test_app_id');
          expect(location).toContain('state=');
        },
      });
    });

    it('should handle missing credentials', async () => {
      delete process.env.FACEBOOK_APP_ID;
      
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=oauth_not_configured');
        },
      });
    });
  });

  describe('OAuth Callback Endpoint', () => {
    it('should reject unauthenticated requests', async () => {
      const handler = await import('@/app/api/auth/instagram/callback/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '/callback?code=test&state=test',
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=');
        },
      });
    });

    it('should handle missing parameters', async () => {
      const handler = await import('@/app/api/auth/instagram/callback/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '/callback',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=missing_code');
        },
      });
    });

    it('should handle OAuth errors', async () => {
      const handler = await import('@/app/api/auth/instagram/callback/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '/callback?error=access_denied&error_description=User%20denied',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=access_denied');
          expect(location).toContain('message=User%20denied');
        },
      });
    });

    it('should validate state parameter', async () => {
      const handler = await import('@/app/api/auth/instagram/callback/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '/callback?code=test&state=invalid_state',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=invalid_state');
        },
      });
    });
  });

  describe('Disconnect Endpoint', () => {
    it('should require authentication', async () => {
      const handler = await import('@/app/api/instagram/disconnect/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
          });
          
          expect(response.status).toBe(401);
          
          const data = await response.json();
          expect(data.error).toBe('authentication_required');
        },
      });
    });

    it('should handle no connected account', async () => {
      const handler = await import('@/app/api/instagram/disconnect/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(404);
          
          const data = await response.json();
          expect(data.error).toBe('No Instagram account connected');
        },
      });
    });
  });

  describe('Test Auth Endpoint', () => {
    it('should require authentication', async () => {
      const handler = await import('@/app/api/instagram/test-auth/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
          });
          
          expect(response.status).toBe(401);
          
          const data = await response.json();
          expect(data.error).toBe('authentication_required');
        },
      });
    });

    it('should return configuration status for authenticated users', async () => {
      const handler = await import('@/app/api/instagram/test-auth/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(200);
          
          const data = await response.json();
          expect(data.success).toBe(true);
          expect(data.config).toBeDefined();
          expect(data.config.hasAppId).toBe(true);
          expect(data.config.hasAppSecret).toBe(true);
          expect(data.config.hasRedirectUri).toBe(true);
          expect(data.serviceTest).toBeDefined();
          expect(data.connectionStatus).toBeDefined();
          expect(data.user.id).toBe(1);
          expect(data.user.email).toBe('test@example.com');
        },
      });
    });

    it('should detect missing credentials', async () => {
      delete process.env.FACEBOOK_APP_ID;
      
      const handler = await import('@/app/api/instagram/test-auth/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(200);
          
          const data = await response.json();
          expect(data.config.hasAppId).toBe(false);
          expect(data.recommendations).toContain('Set FACEBOOK_APP_ID environment variable');
        },
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should provide user-friendly error messages', async () => {
      const handler = await import('@/app/api/auth/instagram/callback/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '/callback?error=access_denied&error_description=User%20cancelled%20the%20authorization',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          const url = new URL(location!);
          
          expect(url.searchParams.get('error')).toBe('access_denied');
          expect(url.searchParams.get('message')).toContain('cancelled');
        },
      });
    });

    it('should handle service unavailable errors', async () => {
      // Simulate service unavailable by removing credentials
      delete process.env.FACEBOOK_APP_SECRET;
      
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=');
        },
      });
    });
  });

  describe('Security Validation', () => {
    it('should reject requests without proper authentication headers', async () => {
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': 'Bearer invalid_token',
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=');
        },
      });
    });

    it('should validate JWT token format', async () => {
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': 'Bearer not.a.jwt',
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=');
        },
      });
    });

    it('should handle expired JWT tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNjAwMDAwMDAwfQ.test';
      
      const handler = await import('@/app/api/auth/instagram/route');
      
      await testApiHandler({
        handler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${expiredToken}`,
            },
          });
          
          expect(response.status).toBe(302);
          
          const location = response.headers.get('location');
          expect(location).toContain('error=');
        },
      });
    });
  });
});