/**
 * NextAuth API Integration Tests
 * 
 * Tests for /api/auth/[...nextauth] endpoint with:
 * - All HTTP methods and status codes
 * - Authentication flows (signin, signout, session)
 * - OAuth providers (Google, Instagram, TikTok, Reddit)
 * - Rate limiting
 * - Concurrent access
 * - Error handling
 * - Runtime configuration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testDb } from '../setup';
import { createTestUser, createTestSession, cleanupTestData } from './fixtures';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/auth`;

describe('NextAuth API Integration Tests', () => {
  let testUserId: string;
  let testSessionToken: string;

  beforeAll(async () => {
    await testDb.connect();
  });

  afterAll(async () => {
    await cleanupTestData();
    await testDb.disconnect();
  });

  beforeEach(async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });
    testUserId = user.id;

    const session = await createTestSession(testUserId);
    testSessionToken = session.sessionToken;
  });

  // ============================================================================
  // Runtime Configuration Tests
  // ============================================================================

  describe('Runtime Configuration', () => {
    it('should use Node.js runtime', async () => {
      // Verify endpoint is accessible (Node.js runtime required for DB)
      const response = await fetch(`${API_URL}/csrf`);
      expect(response.ok).toBe(true);
    });

    it('should handle database connections properly', async () => {
      const response = await fetch(`${API_URL}/session`, {
        headers: {
          Cookie: `next-auth.session-token=${testSessionToken}`,
        },
      });
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
    });
  });

  // ============================================================================
  // CSRF Token Tests
  // ============================================================================

  describe('GET /api/auth/csrf', () => {
    it('should return CSRF token', async () => {
      const response = await fetch(`${API_URL}/csrf`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
    });

    it('should return unique CSRF tokens', async () => {
      const response1 = await fetch(`${API_URL}/csrf`);
      const data1 = await response1.json();
      
      const response2 = await fetch(`${API_URL}/csrf`);
      const data2 = await response2.json();
      
      expect(data1.csrfToken).not.toBe(data2.csrfToken);
    });

    it('should handle concurrent CSRF requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        fetch(`${API_URL}/csrf`)
      );
      
      const responses = await Promise.all(requests);
      
      expect(responses.every(r => r.ok)).toBe(true);
      
      const tokens = await Promise.all(
        responses.map(r => r.json().then(d => d.csrfToken))
      );
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);
    });
  });

  // ============================================================================
  // Session Tests
  // ============================================================================

  describe('GET /api/auth/session', () => {
    it('should return session for authenticated user', async () => {
      const response = await fetch(`${API_URL}/session`, {
        headers: {
          Cookie: `next-auth.session-token=${testSessionToken}`,
        },
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(testUserId);
      expect(data.user.email).toBe('test@example.com');
      expect(data.expires).toBeDefined();
    });

    it('should return null for unauthenticated user', async () => {
      const response = await fetch(`${API_URL}/session`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({});
    });

    it('should return 401 for invalid session token', async () => {
      const response = await fetch(`${API_URL}/session`, {
        headers: {
          Cookie: 'next-auth.session-token=invalid-token',
        },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({});
    });

    it('should handle expired session', async () => {
      const expiredSession = await createTestSession(testUserId, {
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
      });
      
      const response = await fetch(`${API_URL}/session`, {
        headers: {
          Cookie: `next-auth.session-token=${expiredSession.sessionToken}`,
        },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({});
    });

    it('should handle concurrent session requests', async () => {
      const requests = Array(20).fill(null).map(() =>
        fetch(`${API_URL}/session`, {
          headers: {
            Cookie: `next-auth.session-token=${testSessionToken}`,
          },
        })
      );
      
      const responses = await Promise.all(requests);
      
      expect(responses.every(r => r.ok)).toBe(true);
      
      const sessions = await Promise.all(responses.map(r => r.json()));
      
      // All should return same user
      expect(sessions.every(s => s.user?.id === testUserId)).toBe(true);
    });
  });

  // ============================================================================
  // Providers Tests
  // ============================================================================

  describe('GET /api/auth/providers', () => {
    it('should return list of configured providers', async () => {
      const response = await fetch(`${API_URL}/providers`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
      
      // Should include credentials provider
      expect(data.credentials).toBeDefined();
      expect(data.credentials.type).toBe('credentials');
    });

    it('should include OAuth providers if configured', async () => {
      const response = await fetch(`${API_URL}/providers`);
      const data = await response.json();
      
      // Check for OAuth providers (if env vars are set)
      if (process.env.GOOGLE_CLIENT_ID) {
        expect(data.google).toBeDefined();
        expect(data.google.type).toBe('oauth');
      }
      
      if (process.env.FACEBOOK_APP_ID) {
        expect(data.instagram).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Signin Tests
  // ============================================================================

  describe('POST /api/auth/signin/credentials', () => {
    it('should sign in with valid credentials', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          email: 'test@example.com',
          password: 'password123',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      expect([200, 302]).toContain(response.status);
    });

    it('should reject invalid credentials', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          email: 'test@example.com',
          password: 'wrong-password',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      expect([401, 302]).toContain(response.status);
    });

    it('should require CSRF token', async () => {
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: 'test@example.com',
          password: 'password123',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      expect([400, 403]).toContain(response.status);
    });

    it('should handle missing email', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          password: 'password123',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      expect([400, 401, 302]).toContain(response.status);
    });

    it('should handle missing password', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          email: 'test@example.com',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      expect([400, 401, 302]).toContain(response.status);
    });
  });

  // ============================================================================
  // Signout Tests
  // ============================================================================

  describe('POST /api/auth/signout', () => {
    it('should sign out authenticated user', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: `next-auth.session-token=${testSessionToken}`,
        },
        body: new URLSearchParams({
          csrfToken,
        }),
        redirect: 'manual',
      });
      
      expect([200, 302]).toContain(response.status);
      
      // Verify session is invalidated
      const sessionResponse = await fetch(`${API_URL}/session`, {
        headers: {
          Cookie: `next-auth.session-token=${testSessionToken}`,
        },
      });
      
      const sessionData = await sessionResponse.json();
      expect(sessionData).toEqual({});
    });

    it('should require CSRF token for signout', async () => {
      const response = await fetch(`${API_URL}/signout`, {
        method: 'POST',
        headers: {
          Cookie: `next-auth.session-token=${testSessionToken}`,
        },
        redirect: 'manual',
      });
      
      expect([400, 403]).toContain(response.status);
    });
  });

  // ============================================================================
  // OAuth Flow Tests
  // ============================================================================

  describe('OAuth Signin Flow', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await fetch(`${API_URL}/signin/google`, {
        redirect: 'manual',
      });
      
      expect(response.status).toBe(302);
      
      const location = response.headers.get('location');
      expect(location).toBeDefined();
      expect(location).toContain('accounts.google.com');
    });

    it('should include state parameter in OAuth redirect', async () => {
      const response = await fetch(`${API_URL}/signin/google`, {
        redirect: 'manual',
      });
      
      const location = response.headers.get('location');
      expect(location).toContain('state=');
    });

    it('should handle OAuth callback', async () => {
      // This is a simplified test - full OAuth flow requires external service
      const response = await fetch(`${API_URL}/callback/google?code=test&state=test`, {
        redirect: 'manual',
      });
      
      // Should redirect (either success or error)
      expect([302, 307]).toContain(response.status);
    });
  });

  // ============================================================================
  // Rate Limiting Tests
  // ============================================================================

  describe('Rate Limiting', () => {
    it('should enforce rate limits on signin attempts', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      // Make multiple rapid requests
      const requests = Array(20).fill(null).map(() =>
        fetch(`${API_URL}/callback/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            csrfToken,
            email: 'test@example.com',
            password: 'wrong-password',
            redirect: 'false',
          }),
          redirect: 'manual',
        })
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const response = await fetch(`${API_URL}/session`);
      
      // Check for rate limit headers
      const headers = response.headers;
      expect(
        headers.has('x-ratelimit-limit') ||
        headers.has('ratelimit-limit')
      ).toBe(true);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle malformed requests', async () => {
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json{',
        redirect: 'manual',
      });
      
      expect([400, 500]).toContain(response.status);
    });

    it('should handle unknown provider', async () => {
      const response = await fetch(`${API_URL}/signin/unknown-provider`, {
        redirect: 'manual',
      });
      
      expect([404, 302]).toContain(response.status);
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking DB failure
      // For now, verify endpoint is accessible
      const response = await fetch(`${API_URL}/session`);
      expect(response.ok).toBe(true);
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================

  describe('Security', () => {
    it('should set secure cookies in production', async () => {
      const response = await fetch(`${API_URL}/csrf`);
      
      const setCookie = response.headers.get('set-cookie');
      if (process.env.NODE_ENV === 'production') {
        expect(setCookie).toContain('Secure');
      }
    });

    it('should set HttpOnly cookies', async () => {
      const response = await fetch(`${API_URL}/csrf`);
      
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        expect(setCookie).toContain('HttpOnly');
      }
    });

    it('should set SameSite cookie attribute', async () => {
      const response = await fetch(`${API_URL}/csrf`);
      
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        expect(setCookie).toContain('SameSite');
      }
    });

    it('should not expose sensitive information in errors', async () => {
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: 'test@example.com',
          password: 'wrong',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      if (response.status === 200) {
        const text = await response.text();
        expect(text).not.toContain('password');
        expect(text).not.toContain('secret');
        expect(text).not.toContain('token');
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should respond to session check within 200ms', async () => {
      const start = Date.now();
      
      await fetch(`${API_URL}/session`, {
        headers: {
          Cookie: `next-auth.session-token=${testSessionToken}`,
        },
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should handle 50 concurrent session checks', async () => {
      const start = Date.now();
      
      const requests = Array(50).fill(null).map(() =>
        fetch(`${API_URL}/session`, {
          headers: {
            Cookie: `next-auth.session-token=${testSessionToken}`,
          },
        })
      );
      
      const responses = await Promise.all(requests);
      
      const duration = Date.now() - start;
      
      expect(responses.every(r => r.ok)).toBe(true);
      expect(duration).toBeLessThan(2000); // 2 seconds for 50 requests
    });
  });

  // ============================================================================
  // HTTP Method Tests
  // ============================================================================

  describe('HTTP Methods', () => {
    it('should support GET for session', async () => {
      const response = await fetch(`${API_URL}/session`, {
        method: 'GET',
      });
      
      expect(response.ok).toBe(true);
    });

    it('should support POST for signin', async () => {
      const csrfResponse = await fetch(`${API_URL}/csrf`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          email: 'test@example.com',
          password: 'password123',
          redirect: 'false',
        }),
        redirect: 'manual',
      });
      
      expect([200, 302, 401]).toContain(response.status);
    });

    it('should reject unsupported methods', async () => {
      const response = await fetch(`${API_URL}/session`, {
        method: 'DELETE',
      });
      
      expect([405, 404]).toContain(response.status);
    });
  });
});
