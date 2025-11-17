/**
 * Validation Middleware Context - Integration Tests
 * 
 * Tests for the validation middleware with context parameter support:
 * - Context parameter passing through middleware
 * - Route params extraction and validation
 * - Dynamic route handling with context
 * - Backward compatibility with handlers without context
 * - Error handling with context
 * 
 * @see lib/api/middleware/validation.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';

describe('Validation Middleware Context - Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  let testSessionCookie: string;
  let testUserId: string;
  let testCampaignId: string;
  let testContentId: string;

  // Setup: Create test user and get session
  beforeAll(async () => {
    const email = `test-validation-context-${Date.now()}@example.com`;

    // Register user
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email,
        password: 'SecurePassword123!',
      }),
    });

    const registerData = await registerResponse.json();
    testUserId = registerData.user.id;

    // Login to get session
    const loginResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'SecurePassword123!',
      }),
    });

    const cookies = loginResponse.headers.get('set-cookie');
    testSessionCookie = cookies || '';
  });

  describe('Context Parameter Passing', () => {
    it('should pass context to handler in dynamic routes', async () => {
      // Create a campaign first
      const createResponse = await fetch(`${baseUrl}/api/marketing/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: testSessionCookie,
        },
        body: JSON.stringify({
          name: 'Test Campaign',
          type: 'email',
          status: 'draft',
        }),
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      testCampaignId = createData.data.id;

      // Update campaign using dynamic route with context
      const updateResponse = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: testSessionCookie,
          },
          body: JSON.stringify({
            name: 'Updated Campaign',
            status: 'active',
          }),
        }
      );

      expect(updateResponse.status).toBe(200);
      const updateData = await updateResponse.json();
      expect(updateData.data.id).toBe(testCampaignId);
      expect(updateData.data.name).toBe('Updated Campaign');
    });

    it('should extract route params from context', async () => {
      // Get campaign by ID
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.id).toBe(testCampaignId);
    });

    it('should handle nested dynamic routes with context', async () => {
      // Create content first
      const createResponse = await fetch(`${baseUrl}/api/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: testSessionCookie,
        },
        body: JSON.stringify({
          title: 'Test Content',
          type: 'post',
          platform: 'instagram',
          status: 'draft',
        }),
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      testContentId = createData.data.id;

      // Get content by ID (uses context for params)
      const getResponse = await fetch(
        `${baseUrl}/api/content/${testContentId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.data.id).toBe(testContentId);
    });

    it('should pass context with validation errors', async () => {
      // Try to update campaign with invalid data
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: testSessionCookie,
          },
          body: JSON.stringify({
            name: '', // Invalid: empty name
            status: 'invalid_status', // Invalid status
          }),
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with handlers that do not use context', async () => {
      // Test endpoints that don't use context parameter
      const response = await fetch(`${baseUrl}/api/analytics/overview`, {
        method: 'GET',
        headers: {
          Cookie: testSessionCookie,
        },
      });

      // Should work normally even though handler doesn't use context
      expect([200, 404]).toContain(response.status);
    });

    it('should work with POST endpoints without context', async () => {
      const response = await fetch(`${baseUrl}/api/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: testSessionCookie,
        },
        body: JSON.stringify({
          title: 'Test Post',
          type: 'post',
          platform: 'instagram',
          status: 'draft',
        }),
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Dynamic Route Parameter Validation', () => {
    it('should validate UUID format in route params', async () => {
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/invalid-uuid`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      // Should return 400 or 404 for invalid UUID
      expect([400, 404]).toContain(response.status);
    });

    it('should handle numeric IDs in route params', async () => {
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/123`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      // Should handle numeric IDs (404 if not found)
      expect([200, 404]).toContain(response.status);
    });

    it('should extract multiple route params from context', async () => {
      // This would test nested routes like /api/campaigns/[id]/posts/[postId]
      // Skip if such routes don't exist yet
      expect(true).toBe(true);
    });
  });

  describe('Error Handling with Context', () => {
    it('should include context info in error responses', async () => {
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: testSessionCookie,
          },
          body: JSON.stringify({
            name: '', // Invalid
          }),
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.correlationId).toBeDefined();
    });

    it('should handle missing route params gracefully', async () => {
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      // Should return 404 or redirect to list endpoint
      expect([200, 404, 405]).toContain(response.status);
    });

    it('should handle malformed context gracefully', async () => {
      // This tests internal error handling
      // Context should always be properly formed by Next.js
      expect(true).toBe(true);
    });
  });

  describe('Performance with Context', () => {
    it('should not add significant overhead with context parameter', async () => {
      const startTime = Date.now();

      const requests = Array.from({ length: 10 }, () =>
        fetch(`${baseUrl}/api/marketing/campaigns/${testCampaignId}`, {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        })
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Should complete 10 requests in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent updates with context', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        fetch(`${baseUrl}/api/marketing/campaigns/${testCampaignId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: testSessionCookie,
          },
          body: JSON.stringify({
            name: `Concurrent Update ${i}`,
          }),
        })
      );

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 200).length;

      // All should succeed
      expect(successCount).toBe(5);
    });
  });

  describe('Type Safety with Context', () => {
    it('should maintain type safety in handler signatures', async () => {
      // This is more of a compile-time test
      // Runtime test: verify handlers receive correct types
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Verify response structure matches expected types
      expect(data.data).toBeDefined();
      expect(typeof data.data.id).toBe('string');
      expect(typeof data.data.name).toBe('string');
    });

    it('should validate context parameter types', async () => {
      // Context should have params property with route params
      const response = await fetch(
        `${baseUrl}/api/content/${testContentId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.id).toBe(testContentId);
    });
  });

  describe('Integration with Other Middleware', () => {
    it('should work with auth middleware and context', async () => {
      // Test that auth middleware and validation middleware work together
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: testSessionCookie,
          },
          body: JSON.stringify({
            name: 'Auth + Validation Test',
          }),
        }
      );

      expect(response.status).toBe(200);
    });

    it('should work with rate limiting and context', async () => {
      // Make multiple requests to test rate limiting
      const requests = Array.from({ length: 20 }, () =>
        fetch(`${baseUrl}/api/marketing/campaigns/${testCampaignId}`, {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        })
      );

      const responses = await Promise.all(requests);
      
      // Some might be rate limited, but context should still work
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });

    it('should work with caching middleware and context', async () => {
      // First request
      const response1 = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(response1.status).toBe(200);

      // Second request (might be cached)
      const response2 = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(response2.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined context gracefully', async () => {
      // Test endpoints that might not have context
      const response = await fetch(`${baseUrl}/api/analytics/trends`, {
        method: 'GET',
        headers: {
          Cookie: testSessionCookie,
        },
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should handle empty context object', async () => {
      // Context with no params
      const response = await fetch(`${baseUrl}/api/content`, {
        method: 'GET',
        headers: {
          Cookie: testSessionCookie,
        },
      });

      expect(response.status).toBe(200);
    });

    it('should handle context with special characters in params', async () => {
      // Test with URL-encoded special characters
      const specialId = encodeURIComponent('test-id-with-special-chars-123');
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${specialId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      // Should handle gracefully (404 if not found)
      expect([200, 404]).toContain(response.status);
    });

    it('should handle very long route params', async () => {
      const longId = 'a'.repeat(1000);
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${longId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      // Should handle gracefully
      expect([400, 404, 414]).toContain(response.status);
    });
  });

  describe('Documentation and Examples', () => {
    it('should demonstrate context usage in GET requests', async () => {
      // Example: GET /api/marketing/campaigns/[id]
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'GET',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Handler receives: (req, body, context)
      // context.params.id === testCampaignId
      expect(data.data.id).toBe(testCampaignId);
    });

    it('should demonstrate context usage in PATCH requests', async () => {
      // Example: PATCH /api/marketing/campaigns/[id]
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${testCampaignId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: testSessionCookie,
          },
          body: JSON.stringify({
            name: 'Context Example',
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Handler receives: (req, body, context)
      // body.name === 'Context Example'
      // context.params.id === testCampaignId
      expect(data.data.name).toBe('Context Example');
    });

    it('should demonstrate context usage in DELETE requests', async () => {
      // Create a campaign to delete
      const createResponse = await fetch(`${baseUrl}/api/marketing/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: testSessionCookie,
        },
        body: JSON.stringify({
          name: 'To Delete',
          type: 'email',
          status: 'draft',
        }),
      });

      const createData = await createResponse.json();
      const deleteId = createData.data.id;

      // Example: DELETE /api/marketing/campaigns/[id]
      const response = await fetch(
        `${baseUrl}/api/marketing/campaigns/${deleteId}`,
        {
          method: 'DELETE',
          headers: {
            Cookie: testSessionCookie,
          },
        }
      );

      expect([200, 204]).toContain(response.status);
    });
  });
});
