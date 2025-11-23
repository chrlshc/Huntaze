/**
 * Integration Tests for CSRF Token API
 * 
 * Tests the complete CSRF token generation flow including:
 * - HTTP status codes
 * - Response schema validation
 * - Cookie configuration
 * - Concurrent access
 * - Rate limiting
 * - Environment-specific behavior
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

// Response schema validation
const CsrfTokenResponseSchema = z.object({
  token: z.string().length(64), // 32 bytes hex = 64 characters
});

const ErrorResponseSchema = z.object({
  error: z.string(),
});

describe('CSRF Token API Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('GET /api/csrf/token', () => {
    describe('Success Cases (200 OK)', () => {
      it('should return 200 with valid CSRF token', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        expect(response.status).toBe(200);
        expect(response.ok).toBe(true);
        
        const body = await response.json();
        
        // Validate response schema
        const validation = CsrfTokenResponseSchema.safeParse(body);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          expect(validation.data.token).toBeTruthy();
          expect(validation.data.token.length).toBe(64);
          expect(/^[a-f0-9]{64}$/.test(validation.data.token)).toBe(true);
        }
      });

      it('should set csrf-token cookie in response', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        expect(response.status).toBe(200);
        
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toBeTruthy();
        expect(setCookieHeader).toContain('csrf-token=');
      });

      it('should return token matching cookie value', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        expect(response.status).toBe(200);
        
        const body = await response.json();
        const setCookieHeader = response.headers.get('set-cookie');
        
        // Extract token from cookie
        const cookieMatch = setCookieHeader?.match(/csrf-token=([^;]+)/);
        expect(cookieMatch).toBeTruthy();
        
        const cookieToken = cookieMatch![1];
        expect(cookieToken).toBe(body.token);
      });

      it('should generate unique tokens on consecutive requests', async () => {
        const response1 = await fetch(`${baseUrl}/api/csrf/token`);
        const response2 = await fetch(`${baseUrl}/api/csrf/token`);
        const response3 = await fetch(`${baseUrl}/api/csrf/token`);
        
        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(response3.status).toBe(200);
        
        const body1 = await response1.json();
        const body2 = await response2.json();
        const body3 = await response3.json();
        
        // All tokens should be unique
        expect(body1.token).not.toBe(body2.token);
        expect(body2.token).not.toBe(body3.token);
        expect(body1.token).not.toBe(body3.token);
      });

      it('should work without authentication', async () => {
        // Make request without any auth headers
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          headers: {
            // Explicitly no Authorization header
          },
        });
        
        expect(response.status).toBe(200);
        
        const body = await response.json();
        expect(body.token).toBeTruthy();
      });

      it('should return valid JSON content-type', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        expect(response.status).toBe(200);
        
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
      });
    });

    describe('Cookie Configuration', () => {
      it('should set cookie with 24-hour expiration', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toContain('Max-Age=86400'); // 24 hours in seconds
      });

      it('should set cookie with HttpOnly flag', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toContain('HttpOnly');
      });

      it('should set cookie with SameSite=Lax', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader?.toLowerCase()).toContain('samesite=lax');
      });

      it('should set cookie with Path=/', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toContain('Path=/');
      });

      it('should set Secure flag in production', async () => {
        // This test assumes production environment
        if (process.env.NODE_ENV === 'production') {
          const response = await fetch(`${baseUrl}/api/csrf/token`);
          
          const setCookieHeader = response.headers.get('set-cookie');
          expect(setCookieHeader).toContain('Secure');
        }
      });

      it('should set domain to .huntaze.com in production', async () => {
        // This test assumes production environment
        if (process.env.NODE_ENV === 'production') {
          const response = await fetch(`${baseUrl}/api/csrf/token`);
          
          const setCookieHeader = response.headers.get('set-cookie');
          expect(setCookieHeader).toContain('Domain=.huntaze.com');
        }
      });

      it('should not set domain in development', async () => {
        // This test assumes development environment
        if (process.env.NODE_ENV === 'development') {
          const response = await fetch(`${baseUrl}/api/csrf/token`);
          
          const setCookieHeader = response.headers.get('set-cookie');
          expect(setCookieHeader).not.toContain('Domain=');
        }
      });
    });

    describe('HTTP Methods', () => {
      it('should accept GET requests', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          method: 'GET',
        });
        
        expect(response.status).toBe(200);
      });

      it('should reject POST requests', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          method: 'POST',
        });
        
        // Next.js returns 405 for unsupported methods
        expect(response.status).toBe(405);
      });

      it('should reject PUT requests', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          method: 'PUT',
        });
        
        expect(response.status).toBe(405);
      });

      it('should reject DELETE requests', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          method: 'DELETE',
        });
        
        expect(response.status).toBe(405);
      });

      it('should reject PATCH requests', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          method: 'PATCH',
        });
        
        expect(response.status).toBe(405);
      });
    });

    describe('Concurrent Access', () => {
      it('should handle 10 concurrent requests successfully', async () => {
        const requests = Array.from({ length: 10 }, () =>
          fetch(`${baseUrl}/api/csrf/token`)
        );
        
        const responses = await Promise.all(requests);
        
        // All requests should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });
        
        // All tokens should be unique
        const bodies = await Promise.all(responses.map((r) => r.json()));
        const tokens = bodies.map((b) => b.token);
        const uniqueTokens = new Set(tokens);
        
        expect(uniqueTokens.size).toBe(10);
      });

      it('should handle 50 concurrent requests successfully', async () => {
        const requests = Array.from({ length: 50 }, () =>
          fetch(`${baseUrl}/api/csrf/token`)
        );
        
        const responses = await Promise.all(requests);
        
        // All requests should succeed
        const successCount = responses.filter((r) => r.status === 200).length;
        expect(successCount).toBe(50);
        
        // All tokens should be unique
        const bodies = await Promise.all(responses.map((r) => r.json()));
        const tokens = bodies.map((b) => b.token);
        const uniqueTokens = new Set(tokens);
        
        expect(uniqueTokens.size).toBe(50);
      });

      it('should handle 100 concurrent requests without errors', async () => {
        const requests = Array.from({ length: 100 }, () =>
          fetch(`${baseUrl}/api/csrf/token`)
        );
        
        const responses = await Promise.all(requests);
        
        // Count successful responses
        const successCount = responses.filter((r) => r.status === 200).length;
        
        // At least 95% should succeed (allowing for some rate limiting)
        expect(successCount).toBeGreaterThanOrEqual(95);
      });
    });

    describe('Performance', () => {
      it('should respond within 100ms for single request', async () => {
        const startTime = Date.now();
        
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        const duration = Date.now() - startTime;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(100);
      });

      it('should handle 10 sequential requests within 500ms', async () => {
        const startTime = Date.now();
        
        for (let i = 0; i < 10; i++) {
          const response = await fetch(`${baseUrl}/api/csrf/token`);
          expect(response.status).toBe(200);
        }
        
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(500);
      });

      it('should maintain consistent response times under load', async () => {
        const durations: number[] = [];
        
        for (let i = 0; i < 20; i++) {
          const startTime = Date.now();
          const response = await fetch(`${baseUrl}/api/csrf/token`);
          const duration = Date.now() - startTime;
          
          expect(response.status).toBe(200);
          durations.push(duration);
        }
        
        // Calculate average and max duration
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        
        // Average should be under 50ms
        expect(avgDuration).toBeLessThan(50);
        
        // Max should be under 200ms
        expect(maxDuration).toBeLessThan(200);
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed requests gracefully', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Malformed-Header': '\x00\x01\x02', // Invalid characters
          },
        });
        
        // Should still succeed (GET requests are simple)
        expect(response.status).toBe(200);
      });

      it('should handle requests with invalid query parameters', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token?invalid=param&foo=bar`);
        
        // Should ignore query params and succeed
        expect(response.status).toBe(200);
      });

      it('should handle requests with large headers', async () => {
        const largeValue = 'x'.repeat(1000);
        
        const response = await fetch(`${baseUrl}/api/csrf/token`, {
          headers: {
            'X-Large-Header': largeValue,
          },
        });
        
        // Should still succeed
        expect(response.status).toBe(200);
      });
    });

    describe('Security Headers', () => {
      it('should include security headers in response', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        expect(response.status).toBe(200);
        
        // Check for common security headers
        const headers = response.headers;
        
        // These are set by Next.js config
        expect(headers.get('x-content-type-options')).toBeTruthy();
        expect(headers.get('x-frame-options')).toBeTruthy();
      });

      it('should not expose sensitive information in headers', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        
        const headers = response.headers;
        
        // Should not expose server details
        expect(headers.get('x-powered-by')).toBeNull();
        
        // Should not expose internal paths
        expect(headers.get('x-source-file')).toBeNull();
      });
    });

    describe('Token Validation', () => {
      it('should generate cryptographically secure tokens', async () => {
        const response = await fetch(`${baseUrl}/api/csrf/token`);
        const body = await response.json();
        
        const token = body.token;
        
        // Token should be 64 hex characters (32 bytes)
        expect(token.length).toBe(64);
        expect(/^[a-f0-9]{64}$/.test(token)).toBe(true);
        
        // Token should have high entropy (not all same character)
        const uniqueChars = new Set(token.split(''));
        expect(uniqueChars.size).toBeGreaterThan(10);
      });

      it('should not generate predictable tokens', async () => {
        const tokens: string[] = [];
        
        // Generate 20 tokens
        for (let i = 0; i < 20; i++) {
          const response = await fetch(`${baseUrl}/api/csrf/token`);
          const body = await response.json();
          tokens.push(body.token);
        }
        
        // Check for patterns (no sequential tokens)
        for (let i = 1; i < tokens.length; i++) {
          const prev = tokens[i - 1];
          const curr = tokens[i];
          
          // Tokens should not be sequential
          expect(curr).not.toBe(prev);
          
          // Tokens should not have similar prefixes
          const commonPrefix = getCommonPrefix(prev, curr);
          expect(commonPrefix.length).toBeLessThan(10);
        }
      });
    });

    describe('Rate Limiting', () => {
      it('should apply global rate limiting if configured', async () => {
        // Make many requests rapidly
        const requests = Array.from({ length: 200 }, () =>
          fetch(`${baseUrl}/api/csrf/token`)
        );
        
        const responses = await Promise.all(requests);
        
        // Check if any requests were rate limited
        const rateLimitedCount = responses.filter((r) => r.status === 429).length;
        
        // If rate limiting is enabled, some requests should be blocked
        // If not enabled, all should succeed
        const successCount = responses.filter((r) => r.status === 200).length;
        
        expect(successCount + rateLimitedCount).toBe(200);
      });

      it('should include rate limit headers if rate limited', async () => {
        // Make many requests to trigger rate limit
        const requests = Array.from({ length: 150 }, () =>
          fetch(`${baseUrl}/api/csrf/token`)
        );
        
        const responses = await Promise.all(requests);
        
        // Find a rate-limited response
        const rateLimitedResponse = responses.find((r) => r.status === 429);
        
        if (rateLimitedResponse) {
          // Should include rate limit headers
          expect(rateLimitedResponse.headers.get('x-ratelimit-limit')).toBeTruthy();
          expect(rateLimitedResponse.headers.get('retry-after')).toBeTruthy();
        }
      });
    });

    describe('Idempotency', () => {
      it('should generate new token on each request (not idempotent)', async () => {
        const response1 = await fetch(`${baseUrl}/api/csrf/token`);
        const response2 = await fetch(`${baseUrl}/api/csrf/token`);
        
        const body1 = await response1.json();
        const body2 = await response2.json();
        
        // Tokens should be different (endpoint is not idempotent)
        expect(body1.token).not.toBe(body2.token);
      });
    });
  });
});

/**
 * Helper function to find common prefix between two strings
 */
function getCommonPrefix(str1: string, str2: string): string {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return str1.substring(0, i);
}
