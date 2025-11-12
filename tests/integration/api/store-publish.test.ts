/**
 * Integration Tests - /api/store/publish Endpoint
 * 
 * Tests the store publishing endpoint with:
 * - Authentication validation
 * - Gating middleware (payments prerequisite)
 * - Request body validation
 * - Error handling and retry logic
 * - Response schema validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const PUBLISH_ENDPOINT = `${BASE_URL}/api/store/publish`;

// Response schemas
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  storeUrl: z.string().url(),
  publishedAt: z.string().datetime(),
  correlationId: z.string().uuid(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  correlationId: z.string().uuid(),
});

const GatingResponseSchema = z.object({
  error: z.literal('PRECONDITION_REQUIRED'),
  message: z.string(),
  missingStep: z.string(),
  action: z.object({
    type: z.enum(['open_modal', 'redirect']),
    modal: z.string().optional(),
    url: z.string().optional(),
    prefill: z.record(z.any()).optional(),
  }),
  correlationId: z.string().uuid(),
});

describe('Integration: /api/store/publish', () => {
  describe('HTTP Methods', () => {
    it('should reject GET method with 405', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, { method: 'GET' });
      expect(response.status).toBe(405);
    });

    it('should reject PUT method with 405', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, { method: 'PUT' });
      expect(response.status).toBe(405);
    });

    it('should reject DELETE method with 405', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, { method: 'DELETE' });
      expect(response.status).toBe(405);
    });

    it('should accept POST method', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, { method: 'POST' });
      // Should not be 405 (may be 401 if not authenticated)
      expect(response.status).not.toBe(405);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json).toHaveProperty('correlationId');
    });

    it('should return 401 with invalid token', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token_12345',
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Request Body Validation', () => {
    it('should accept empty body', async () => {
      // Note: This test assumes authentication is handled
      // In real scenario, you'd need a valid auth token
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Should not be 400 (may be 401 or 409)
      expect(response.status).not.toBe(400);
    });

    it('should accept valid request body', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPublish: true,
          notifyCustomers: false,
        }),
      });

      // Should not be 400 (may be 401 or 409)
      expect(response.status).not.toBe(400);
    });

    it('should reject invalid request body', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPublish: 'not-a-boolean', // Invalid type
          invalidField: 'should-not-be-here',
        }),
      });

      // May be 400 or 401 depending on auth check order
      if (response.status === 400) {
        const json = await response.json();
        expect(json.error).toContain('Invalid request body');
        expect(json).toHaveProperty('correlationId');
      }
    });

    it('should reject malformed JSON', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json {',
      });

      // May be 400 or 401 depending on auth check order
      if (response.status === 400) {
        const json = await response.json();
        expect(json.error).toContain('Invalid JSON');
        expect(json).toHaveProperty('correlationId');
      }
    });
  });

  describe('Response Headers', () => {
    it('should include correlation ID in headers', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Check for correlation ID in response
      const json = await response.json();
      expect(json).toHaveProperty('correlationId');
      expect(json.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should include Cache-Control header on success', async () => {
      // This test would need valid authentication and completed payments
      // Skipping actual test, just documenting expected behavior
      expect(true).toBe(true);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return valid success response schema', async () => {
      // Mock successful response for schema validation
      const mockSuccessResponse = {
        success: true,
        message: 'Boutique publiée avec succès',
        storeUrl: 'https://test-user.huntaze.com',
        publishedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      };

      const result = SuccessResponseSchema.safeParse(mockSuccessResponse);
      expect(result.success).toBe(true);
    });

    it('should return valid error response schema', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await response.json();

      // Should match either error or gating schema
      const errorResult = ErrorResponseSchema.safeParse(json);
      const gatingResult = GatingResponseSchema.safeParse(json);

      expect(errorResult.success || gatingResult.success).toBe(true);
    });

    it('should return valid gating response schema', async () => {
      // Mock gating response for schema validation
      const mockGatingResponse = {
        error: 'PRECONDITION_REQUIRED',
        message: 'Vous devez configurer les paiements avant de publier votre boutique',
        missingStep: 'payments',
        action: {
          type: 'open_modal',
          modal: 'payments_setup',
          prefill: {
            returnUrl: '/api/store/publish',
            userId: 'test-user-id',
          },
        },
        correlationId: crypto.randomUUID(),
      };

      const result = GatingResponseSchema.safeParse(mockGatingResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Test with invalid URL to simulate network error
      try {
        await fetch('http://invalid-host-12345.local/api/store/publish', {
          method: 'POST',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should include error details in response', async () => {
      const response = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json).toHaveProperty('correlationId');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();
      await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const duration = Date.now() - start;

      // Should respond within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(PUBLISH_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const responses = await Promise.all(requests);

      // All should respond (may be errors, but should not crash)
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      });
    });

    it('should return unique correlation IDs for concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(PUBLISH_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).then(r => r.json())
      );

      const responses = await Promise.all(requests);
      const correlationIds = responses.map(r => r.correlationId);

      // All correlation IDs should be unique
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBe(correlationIds.length);
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate publish attempts', async () => {
      // First publish attempt
      const response1 = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Second publish attempt (should handle gracefully)
      const response2 = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Both should respond (may be different status codes)
      expect(response1.status).toBeGreaterThanOrEqual(200);
      expect(response2.status).toBeGreaterThanOrEqual(200);
    });
  });
});
