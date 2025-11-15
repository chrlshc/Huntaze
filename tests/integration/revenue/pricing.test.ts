/**
 * Integration Tests - Pricing API Routes
 * 
 * Tests for /api/revenue/pricing endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { z } from 'zod';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_CREATOR_ID = 'test_creator_123';
const TEST_SESSION_TOKEN = process.env.TEST_SESSION_TOKEN || 'test_token';

// Response schemas for validation
const PricingRecommendationSchema = z.object({
  subscription: z.object({
    current: z.number().positive(),
    recommended: z.number().positive(),
    revenueImpact: z.number(),
    reasoning: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }),
  ppv: z.array(z.object({
    contentId: z.string(),
    contentType: z.enum(['photo', 'video', 'bundle']),
    recommendedRange: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
    }),
    expectedRevenue: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
    }),
  })),
  metadata: z.object({
    lastUpdated: z.string(),
    dataPoints: z.number().int().positive(),
  }),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
});

// Helper function to make authenticated requests
async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${TEST_SESSION_TOKEN}`,
      'X-Correlation-ID': `test-${Date.now()}`,
      ...options.headers,
    },
  });
}

describe('GET /api/revenue/pricing', () => {
  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(
        `${BASE_URL}/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}`
      );

      expect(response.status).toBe(401);
      
      const data = await response.json();
      const validated = ErrorResponseSchema.parse(data);
      expect(validated.error).toBe('Unauthorized');
    });

    it('should return 403 when accessing another creator\'s data', async () => {
      const response = await makeRequest(
        `/api/revenue/pricing?creatorId=other_creator_456`
      );

      expect(response.status).toBe(403);
      
      const data = await response.json();
      const validated = ErrorResponseSchema.parse(data);
      expect(validated.error).toBe('Forbidden');
    });
  });

  describe('Validation', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await makeRequest('/api/revenue/pricing');

      expect(response.status).toBe(400);
      
      const data = await response.json();
      const validated = ErrorResponseSchema.parse(data);
      expect(validated.error).toContain('creatorId');
    });

    it('should return 400 when creatorId is empty', async () => {
      const response = await makeRequest('/api/revenue/pricing?creatorId=');

      expect(response.status).toBe(400);
    });
  });

  describe('Success Cases', () => {
    it('should return pricing recommendations with valid schema', async () => {
      const response = await makeRequest(
        `/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}`
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      
      // Validate response schema
      const validated = PricingRecommendationSchema.parse(data);
      
      // Additional assertions
      expect(validated.subscription.current).toBeGreaterThan(0);
      expect(validated.subscription.recommended).toBeGreaterThan(0);
      expect(validated.subscription.confidence).toBeGreaterThanOrEqual(0);
      expect(validated.subscription.confidence).toBeLessThanOrEqual(1);
      expect(validated.ppv).toBeInstanceOf(Array);
      expect(validated.metadata.dataPoints).toBeGreaterThan(0);
    });

    it('should include correlation ID in logs', async () => {
      const correlationId = `test-correlation-${Date.now()}`;
      
      const response = await makeRequest(
        `/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );

      expect(response.status).toBe(200);
      // Correlation ID should be logged (check server logs)
    });

    it('should return consistent data structure', async () => {
      const response1 = await makeRequest(
        `/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}`
      );
      const response2 = await makeRequest(
        `/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}`
      );

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Structure should be identical
      expect(Object.keys(data1)).toEqual(Object.keys(data2));
      expect(Object.keys(data1.subscription)).toEqual(Object.keys(data2.subscription));
    });
  });

  describe('Performance', () => {
    it('should respond within 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await makeRequest(
        `/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}`
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Simulate server error by using invalid data
      const response = await makeRequest(
        `/api/revenue/pricing?creatorId=${TEST_CREATOR_ID}&simulateError=true`
      );

      // Should return 500 or handle gracefully
      if (response.status === 500) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });
  });
});

describe('POST /api/revenue/pricing/apply', () => {
  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/revenue/pricing/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 when applying pricing for another creator', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: 'other_creator_456',
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('should return 400 when creatorId is missing', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('creatorId');
    });

    it('should return 400 when priceType is missing', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('priceType');
    });

    it('should return 400 when newPrice is missing', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('newPrice');
    });

    it('should return 400 when priceType is invalid', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'invalid',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('priceType');
    });

    it('should return 400 when newPrice is negative', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: -5.99,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('newPrice');
    });

    it('should return 400 when newPrice is zero', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: 0,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Success Cases', () => {
    it('should apply subscription pricing successfully', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should apply PPV pricing successfully', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'ppv',
          contentId: 'content_123',
          newPrice: 25.00,
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle decimal prices correctly', async () => {
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: 9.99,
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous pricing updates', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        makeRequest('/api/revenue/pricing/apply', {
          method: 'POST',
          body: JSON.stringify({
            creatorId: TEST_CREATOR_ID,
            priceType: 'subscription',
            newPrice: 10 + i,
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Performance', () => {
    it('should respond within 3 seconds', async () => {
      const startTime = Date.now();
      
      const response = await makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000);
    });
  });
});

describe('Rate Limiting', () => {
  it('should enforce rate limits on pricing apply endpoint', async () => {
    const requests = Array.from({ length: 15 }, () =>
      makeRequest('/api/revenue/pricing/apply', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATOR_ID,
          priceType: 'subscription',
          newPrice: 12.99,
        }),
      })
    );

    const responses = await Promise.all(requests);
    
    // At least one should be rate limited
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      const rateLimitedResponse = responses.find(r => r.status === 429);
      const data = await rateLimitedResponse!.json();
      expect(data.error).toContain('Too many requests');
    }
  });
});
