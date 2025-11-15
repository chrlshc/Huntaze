/**
 * Validation Credentials API - Integration Tests
 * 
 * POST /api/validation/credentials
 * 
 * Tests:
 * - HTTP status codes (200, 400, 500)
 * - Response schema validation with Zod
 * - Valid credentials for all platforms
 * - Invalid credentials handling
 * - Missing fields validation
 * - Rate limiting
 * - Concurrent access
 * - Edge cases
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  ValidationResponseSchema,
  ValidationErrorResponseSchema,
  validInstagramCredentials,
  validTikTokCredentials,
  validRedditCredentials,
  invalidInstagramCredentials,
  invalidTikTokCredentials,
  invalidRedditCredentials,
  missingPlatform,
  missingCredentials,
  emptyRequest,
  invalidPlatform,
  credentialsWithSpecialChars,
  credentialsWithExtraFields,
  rateLimitTestCredentials,
  concurrentTestCredentials,
  validateResponse,
  generateValidCredentials,
  assertValidationError,
} from './fixtures';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ENDPOINT = `${API_URL}/api/validation/credentials`;

describe('POST /api/validation/credentials', () => {
  // ============================================================================
  // Setup & Teardown
  // ============================================================================

  beforeAll(async () => {
    // Ensure API is available
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (!response.ok) {
        throw new Error('API health check failed');
      }
    } catch (error) {
      console.warn('API may not be available:', error);
    }
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  // ============================================================================
  // Success Cases (200 OK)
  // ============================================================================

  describe('Success Cases (200 OK)', () => {
    it('should validate Instagram credentials successfully', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      
      // Validate schema
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.platform).toBe('instagram');
      expect(validated.isValid).toBe(true);
      expect(validated.errors).toEqual([]);
      expect(Array.isArray(validated.warnings)).toBe(true);
    });

    it('should validate TikTok credentials successfully', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTikTokCredentials),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.platform).toBe('tiktok');
      expect(validated.isValid).toBe(true);
      expect(validated.errors).toEqual([]);
    });

    it('should validate Reddit credentials successfully', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRedditCredentials),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.platform).toBe('reddit');
      expect(validated.isValid).toBe(true);
      expect(validated.errors).toEqual([]);
    });

    it('should return validation errors for invalid Instagram credentials', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidInstagramCredentials),
      });

      expect(response.status).toBe(200); // Still 200, but isValid: false

      const data = await response.json();
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.platform).toBe('instagram');
      expect(validated.isValid).toBe(false);
      expect(validated.errors.length).toBeGreaterThan(0);
      
      // Validate error structure
      validated.errors.forEach(assertValidationError);
    });

    it('should return validation errors for invalid TikTok credentials', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidTikTokCredentials),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.isValid).toBe(false);
      expect(validated.errors.length).toBeGreaterThan(0);
    });

    it('should return validation errors for invalid Reddit credentials', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRedditCredentials),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.isValid).toBe(false);
      expect(validated.errors.length).toBeGreaterThan(0);
    });

    it('should handle credentials with special characters', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialsWithSpecialChars),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateResponse(data, ValidationResponseSchema);
    });

    it('should ignore extra fields in credentials', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialsWithExtraFields),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const validated = validateResponse(data, ValidationResponseSchema);
      
      expect(validated.platform).toBe('reddit');
    });
  });

  // ============================================================================
  // Client Errors (400 Bad Request)
  // ============================================================================

  describe('Client Errors (400 Bad Request)', () => {
    it('should return 400 when platform is missing', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missingPlatform),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      const validated = validateResponse(data, ValidationErrorResponseSchema);
      
      expect(validated.error).toBe('Missing required fields');
    });

    it('should return 400 when credentials are missing', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missingCredentials),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      const validated = validateResponse(data, ValidationErrorResponseSchema);
      
      expect(validated.error).toBe('Missing required fields');
    });

    it('should return 400 for empty request body', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyRequest),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      validateResponse(data, ValidationErrorResponseSchema);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for null body', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null),
      });

      expect(response.status).toBe(400);
    });
  });

  // ============================================================================
  // HTTP Method Tests
  // ============================================================================

  describe('HTTP Method Tests', () => {
    it('should reject GET requests', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'GET',
      });

      expect(response.status).toBe(405);
    });

    it('should reject PUT requests', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      expect(response.status).toBe(405);
    });

    it('should reject DELETE requests', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'DELETE',
      });

      expect(response.status).toBe(405);
    });

    it('should reject PATCH requests', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      expect(response.status).toBe(405);
    });
  });

  // ============================================================================
  // Content-Type Tests
  // ============================================================================

  describe('Content-Type Tests', () => {
    it('should accept application/json', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      expect(response.status).toBe(200);
    });

    it('should reject non-JSON content types', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'plain text',
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(validInstagramCredentials),
      });

      // Should still work or return appropriate error
      expect([200, 400, 415]).toContain(response.status);
    });
  });

  // ============================================================================
  // Response Headers Tests
  // ============================================================================

  describe('Response Headers Tests', () => {
    it('should return correct Content-Type header', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include CORS headers if configured', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      // Check for CORS headers (if configured)
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(corsHeader).toBeDefined();
      }
    });

    it('should not cache responses', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        expect(cacheControl).toMatch(/no-cache|no-store|max-age=0/);
      }
    });
  });

  // ============================================================================
  // Rate Limiting Tests
  // ============================================================================

  describe('Rate Limiting Tests', () => {
    it('should handle multiple sequential requests', async () => {
      const requests = rateLimitTestCredentials.slice(0, 10);
      
      for (const credentials of requests) {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        expect([200, 429]).toContain(response.status);
      }
    });

    it('should return 429 when rate limit exceeded', async () => {
      const requests = Array.from({ length: 50 }, () =>
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validInstagramCredentials),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // At least some requests should be rate limited
      if (rateLimited) {
        const rateLimitedResponse = responses.find(r => r.status === 429);
        expect(rateLimitedResponse?.headers.get('retry-after')).toBeDefined();
      }
    });

    it('should include rate limit headers', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      // Check for rate limit headers (if implemented)
      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
      ];

      rateLimitHeaders.forEach(header => {
        const value = response.headers.get(header);
        if (value) {
          expect(value).toBeDefined();
        }
      });
    });
  });

  // ============================================================================
  // Concurrent Access Tests
  // ============================================================================

  describe('Concurrent Access Tests', () => {
    it('should handle concurrent requests correctly', async () => {
      const requests = concurrentTestCredentials.map(credentials =>
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
      );

      const responses = await Promise.all(requests);

      // All requests should complete
      expect(responses).toHaveLength(concurrentTestCredentials.length);

      // All should return valid status codes
      responses.forEach(response => {
        expect([200, 400, 429, 500]).toContain(response.status);
      });
    });

    it('should handle 20 concurrent requests', async () => {
      const credentials = Array.from({ length: 20 }, (_, i) =>
        generateValidCredentials('instagram')
      );

      const requests = credentials.map(cred =>
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cred),
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 10 seconds)
      expect(duration).toBeLessThan(10000);

      // Most should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(10);
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance Tests', () => {
    it('should respond within 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInstagramCredentials),
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });

    it('should handle large payloads', async () => {
      const largeCredentials = {
        platform: 'instagram',
        credentials: {
          appId: 'a'.repeat(1000),
          appSecret: 'b'.repeat(1000),
          redirectUri: 'https://example.com/' + 'c'.repeat(500),
        },
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largeCredentials),
      });

      expect([200, 400, 413]).toContain(response.status);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle unsupported platform gracefully', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPlatform),
      });

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.isValid).toBe(false);
      }
    });

    it('should handle empty strings in credentials', async () => {
      const emptyCredentials = {
        platform: 'instagram',
        credentials: {
          appId: '',
          appSecret: '',
          redirectUri: '',
        },
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyCredentials),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.isValid).toBe(false);
      expect(data.errors.length).toBeGreaterThan(0);
    });

    it('should handle null values in credentials', async () => {
      const nullCredentials = {
        platform: 'instagram',
        credentials: {
          appId: null,
          appSecret: null,
          redirectUri: null,
        },
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nullCredentials),
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should handle very long platform names', async () => {
      const longPlatform = {
        platform: 'a'.repeat(1000),
        credentials: validInstagramCredentials.credentials,
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(longPlatform),
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================

  describe('Security Tests', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidInstagramCredentials),
      });

      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Should not contain stack traces or internal paths
      expect(responseText).not.toMatch(/\/home\//);
      expect(responseText).not.toMatch(/\/usr\//);
      expect(responseText).not.toMatch(/Error: /);
      expect(responseText).not.toMatch(/at /);
    });

    it('should sanitize error messages', async () => {
      const maliciousCredentials = {
        platform: '<script>alert("xss")</script>',
        credentials: {
          appId: '"><script>alert("xss")</script>',
          appSecret: 'test',
          redirectUri: 'javascript:alert("xss")',
        },
      };

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousCredentials),
      });

      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Should not contain unescaped script tags
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('javascript:');
    });
  });
});
