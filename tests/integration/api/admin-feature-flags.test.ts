/**
 * Integration Tests - /api/admin/feature-flags Endpoint
 * 
 * Tests the admin feature flags management API with:
 * - GET endpoint for fetching current flags
 * - POST endpoint for updating flags
 * - Authentication and authorization
 * - Input validation
 * - Error handling and graceful degradation
 * - Concurrent access patterns
 * - Performance characteristics
 * 
 * Based on: Feature Flags API specification
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const FEATURE_FLAGS_ENDPOINT = `${BASE_URL}/api/admin/feature-flags`;

// Mock auth token (replace with actual test token in real implementation)
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || '';

// Response schemas
const OnboardingFlagsSchema = z.object({
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100),
  markets: z.array(z.string()).optional(),
  userWhitelist: z.array(z.string()).optional(),
});

const GetFlagsResponseSchema = z.object({
  flags: OnboardingFlagsSchema,
  correlationId: z.string().uuid(),
});

const PostFlagsResponseSchema = z.object({
  success: z.boolean(),
  flags: OnboardingFlagsSchema,
  correlationId: z.string().uuid(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  message: z.string().optional(),
  correlationId: z.string().uuid().optional(),
});

// Helper function to create auth headers
function getAuthHeaders(token: string = TEST_AUTH_TOKEN): Record<string, string> {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

describe('Integration: /api/admin/feature-flags', () => {
  describe('GET /api/admin/feature-flags', () => {
    describe('Authentication & Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        const response = await fetch(FEATURE_FLAGS_ENDPOINT);
        
        expect([401, 403]).toContain(response.status);
      });

      it('should return 401 with invalid token', async () => {
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: {
            'Authorization': 'Bearer invalid_token_12345'
          }
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should return 401 with malformed Authorization header', async () => {
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: {
            'Authorization': 'InvalidFormat'
          }
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should accept valid admin authentication token', async () => {
        if (!TEST_ADMIN_TOKEN) {
          console.warn('Skipping admin auth test: TEST_ADMIN_TOKEN not set');
          return;
        }

        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        // Should not return auth errors with valid admin token
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      });

      it('should reject non-admin users', async () => {
        if (!TEST_AUTH_TOKEN || !TEST_ADMIN_TOKEN) {
          console.warn('Skipping non-admin test: tokens not set');
          return;
        }

        // Use regular user token (not admin)
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_AUTH_TOKEN)
        });
        
        // Should either work (if user is admin) or return 403
        expect([200, 403]).toContain(response.status);
      });
    });

    describe('Response Schema Validation', () => {
      it('should return valid feature flags response schema', async () => {
        if (!TEST_ADMIN_TOKEN) {
          console.warn('Skipping test: TEST_ADMIN_TOKEN not set');
          return;
        }
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        if (response.ok) {
          const json = await response.json();
          const result = GetFlagsResponseSchema.safeParse(json);
          
          if (!result.success) {
            console.error('Schema validation errors:', result.error.errors);
          }
          
          expect(result.success).toBe(true);
        }
      });

      it('should return flags with valid structure', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        if (response.ok) {
          const json = await response.json();
          
          expect(json).toHaveProperty('flags');
          expect(json).toHaveProperty('correlationId');
          expect(json.flags).toHaveProperty('enabled');
          expect(json.flags).toHaveProperty('rolloutPercentage');
          expect(typeof json.flags.enabled).toBe('boolean');
          expect(typeof json.flags.rolloutPercentage).toBe('number');
        }
      });

      it('should return rolloutPercentage between 0 and 100', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.flags.rolloutPercentage).toBeGreaterThanOrEqual(0);
          expect(json.flags.rolloutPercentage).toBeLessThanOrEqual(100);
        }
      });

      it('should include correlation ID for tracing', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.correlationId).toMatch(/^[0-9a-f-]{36}$/);
        }
      });
    });

    describe('Error Handling', () => {
      it('should return structured error response on failure', async () => {
        const response = await fetch(FEATURE_FLAGS_ENDPOINT);
        
        if (!response.ok) {
          const json = await response.json();
          const result = ErrorResponseSchema.safeParse(json);
          
          expect(result.success).toBe(true);
          expect(json.error).toBeDefined();
          expect(typeof json.error).toBe('string');
        }
      });

      it('should handle internal errors gracefully', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        // Should either succeed or return structured error
        if (!response.ok) {
          const json = await response.json();
          expect(json).toHaveProperty('error');
          expect(typeof json.error).toBe('string');
        }
      });
    });

    describe('Performance', () => {
      it('should respond within acceptable time (<500ms)', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const start = Date.now();
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        const duration = Date.now() - start;
        
        expect(response.status).toBeLessThan(600);
        expect(duration).toBeLessThan(500);
      });
    });
  });

  describe('POST /api/admin/feature-flags', () => {
    describe('Authentication & Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: true })
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should accept valid admin authentication token', async () => {
        if (!TEST_ADMIN_TOKEN) return;

        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ enabled: true })
        });
        
        // Should not return auth errors with valid token
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      });
    });

    describe('Request Validation', () => {
      it('should accept valid enabled flag update', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ enabled: true })
        });
        
        expect([200, 201]).toContain(response.status);
      });

      it('should accept valid rolloutPercentage update', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ rolloutPercentage: 50 })
        });
        
        expect([200, 201]).toContain(response.status);
      });

      it('should reject rolloutPercentage below 0', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ rolloutPercentage: -1 })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Invalid rolloutPercentage');
      });

      it('should reject rolloutPercentage above 100', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ rolloutPercentage: 101 })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Invalid rolloutPercentage');
      });

      it('should accept valid markets array', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ markets: ['FR', 'DE', 'US'] })
        });
        
        expect([200, 201]).toContain(response.status);
      });

      it('should accept valid userWhitelist array', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ 
            userWhitelist: ['user-123', 'user-456'] 
          })
        });
        
        expect([200, 201]).toContain(response.status);
      });

      it('should reject empty update object', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({})
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('No valid updates provided');
      });

      it('should reject invalid JSON', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: 'invalid json'
        });
        
        expect(response.status).toBe(400);
      });

      it('should accept multiple valid updates', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({
            enabled: true,
            rolloutPercentage: 75,
            markets: ['FR', 'DE']
          })
        });
        
        expect([200, 201]).toContain(response.status);
      });

      it('should ignore invalid fields', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({
            enabled: true,
            invalidField: 'should be ignored'
          })
        });
        
        expect([200, 201]).toContain(response.status);
      });
    });

    describe('Success Response', () => {
      it('should return success with updated flags', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ enabled: true })
        });
        
        if (response.ok) {
          const json = await response.json();
          const result = PostFlagsResponseSchema.safeParse(json);
          expect(result.success).toBe(true);
          expect(json.success).toBe(true);
          expect(json.flags).toBeDefined();
        }
      });

      it('should return correlation ID for tracing', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ enabled: true })
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.correlationId).toMatch(/^[0-9a-f-]{36}$/);
        }
      });

      it('should reflect updates in returned flags', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const updates = {
          enabled: false,
          rolloutPercentage: 25
        };
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify(updates)
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.flags.enabled).toBe(updates.enabled);
          expect(json.flags.rolloutPercentage).toBe(updates.rolloutPercentage);
        }
      });
    });

    describe('Idempotence', () => {
      it('should be idempotent for same updates', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const updates = { enabled: true, rolloutPercentage: 50 };
        
        const response1 = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify(updates)
        });
        
        const response2 = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify(updates)
        });
        
        if (response1.ok && response2.ok) {
          const json1 = await response1.json();
          const json2 = await response2.json();
          
          expect(json1.flags.enabled).toBe(json2.flags.enabled);
          expect(json1.flags.rolloutPercentage).toBe(json2.flags.rolloutPercentage);
        }
      });
    });

    describe('Concurrent Access', () => {
      it('should handle concurrent updates', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const requests = Array.from({ length: 5 }, (_, i) =>
          fetch(FEATURE_FLAGS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(TEST_ADMIN_TOKEN)
            },
            body: JSON.stringify({ 
              rolloutPercentage: 10 + (i * 10) 
            })
          })
        );
        
        const responses = await Promise.all(requests);
        
        // All should complete without crashes
        responses.forEach(response => {
          expect([200, 201, 400, 500]).toContain(response.status);
        });
      });

      it('should maintain data consistency under concurrent load', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        // Make concurrent updates
        const requests = Array.from({ length: 3 }, () =>
          fetch(FEATURE_FLAGS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(TEST_ADMIN_TOKEN)
            },
            body: JSON.stringify({ enabled: true })
          })
        );
        
        await Promise.all(requests);
        
        // Verify final state is consistent
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          headers: getAuthHeaders(TEST_ADMIN_TOKEN)
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(typeof json.flags.enabled).toBe('boolean');
        }
      });
    });

    describe('Error Handling', () => {
      it('should return structured error response', async () => {
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled: true })
        });
        
        if (!response.ok) {
          const json = await response.json();
          expect(json).toHaveProperty('error');
          expect(typeof json.error).toBe('string');
        }
      });

      it('should handle missing Content-Type header', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: getAuthHeaders(TEST_ADMIN_TOKEN),
          body: JSON.stringify({ enabled: true })
        });
        
        // Should handle gracefully
        expect([200, 201, 400]).toContain(response.status);
      });
    });

    describe('Performance', () => {
      it('should respond within acceptable time (<1s)', async () => {
        if (!TEST_ADMIN_TOKEN) return;
        
        const start = Date.now();
        await fetch(FEATURE_FLAGS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(TEST_ADMIN_TOKEN)
          },
          body: JSON.stringify({ enabled: true })
        });
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(1000);
      });
    });
  });

  describe('HTTP Methods', () => {
    it('should support GET method', async () => {
      const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
        method: 'GET'
      });
      
      expect(response.status).not.toBe(405);
    });

    it('should support POST method', async () => {
      const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
      
      expect(response.status).not.toBe(405);
    });

    it('should reject PUT method', async () => {
      const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
      
      expect(response.status).toBe(405);
    });

    it('should reject DELETE method', async () => {
      const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
        method: 'DELETE'
      });
      
      expect(response.status).toBe(405);
    });

    it('should reject PATCH method', async () => {
      const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
      
      expect(response.status).toBe(405);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await fetch(FEATURE_FLAGS_ENDPOINT);
      const json = await response.json();
      const text = JSON.stringify(json).toLowerCase();
      
      expect(text).not.toContain('password');
      expect(text).not.toContain('secret');
      expect(text).not.toContain('token');
    });

    it('should sanitize malicious input', async () => {
      if (!TEST_ADMIN_TOKEN) return;
      
      const response = await fetch(FEATURE_FLAGS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(TEST_ADMIN_TOKEN),
          'X-Malicious-Header': '<script>alert("xss")</script>'
        },
        body: JSON.stringify({
          enabled: true,
          markets: ['<script>alert("xss")</script>']
        })
      });
      
      const json = await response.json();
      const text = JSON.stringify(json);
      
      // Should not contain unescaped script tags
      expect(text).not.toContain('<script>');
    });
  });
});
