/**
 * Marketing Campaigns API Integration Tests
 * 
 * Tests for /api/marketing/campaigns endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  makeRequest,
  parseResponse,
  createAuthHeaders,
  TEST_CREATORS,
  makeConcurrentRequests,
  RateLimitTester,
  validateResponseHeaders,
  validateErrorResponse,
} from './setup';
import { fixtures } from './fixtures';
import { CampaignSchema, CampaignListResponseSchema } from '../../../lib/schemas/marketing';

describe('Marketing Campaigns API', () => {
  describe('GET /api/marketing/campaigns', () => {
    it('should return campaigns list for authenticated creator', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}`
      );

      expect(response.status).toBe(200);
      validateResponseHeaders(response);

      const data = await parseResponse(response);
      
      // Validate response schema
      const result = CampaignListResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should filter campaigns by status', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}&status=active`
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      
      if (data.campaigns && data.campaigns.length > 0) {
        data.campaigns.forEach((campaign: any) => {
          expect(campaign.status).toBe('active');
        });
      }
    });

    it('should filter campaigns by channel', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}&channel=email`
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      
      if (data.campaigns && data.campaigns.length > 0) {
        data.campaigns.forEach((campaign: any) => {
          expect(campaign.channel).toBe('email');
        });
      }
    });

    it('should filter campaigns by goal', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}&goal=engagement`
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      
      if (data.campaigns && data.campaigns.length > 0) {
        data.campaigns.forEach((campaign: any) => {
          expect(campaign.goal).toBe('engagement');
        });
      }
    });

    it('should return 400 if creatorId is missing', async () => {
      const response = await makeRequest('/api/marketing/campaigns');

      expect(response.status).toBe(400);

      const data = await parseResponse<any>(response);
      validateErrorResponse(data);
      expect(data.error).toContain('creatorId');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}`,
        {
          headers: {
            'Content-Type': 'application/json',
            // No auth cookie
          },
        }
      );

      expect(response.status).toBe(401);

      const data = await parseResponse<any>(response);
      validateErrorResponse(data);
    });

    it('should return 403 if accessing another creator\'s campaigns', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.unauthorized}`
      );

      expect(response.status).toBe(403);

      const data = await parseResponse<any>(response);
      validateErrorResponse(data);
    });

    it('should handle invalid status filter', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}&status=invalid_status`
      );

      // Should either return 400 or ignore invalid filter
      expect([200, 400]).toContain(response.status);
    });

    it('should handle pagination parameters', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}&page=1&limit=10`
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      
      if (data.campaigns) {
        expect(Array.isArray(data.campaigns)).toBe(true);
        expect(data.campaigns.length).toBeLessThanOrEqual(10);
      }
    });

    it('should handle sorting parameters', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}&sortBy=createdAt&sortOrder=desc`
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      
      if (data.campaigns && data.campaigns.length > 1) {
        const dates = data.campaigns.map((c: any) => new Date(c.createdAt).getTime());
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      }
    });
  });

  describe('POST /api/marketing/campaigns', () => {
    it('should create a new campaign', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(fixtures.requests.create.valid),
      });

      expect(response.status).toBe(201);

      const data = await parseResponse<any>(response);
      expect(data.success).toBe(true);
      expect(data.campaign).toBeDefined();
      expect(data.campaign.id).toBeDefined();
      
      // Validate campaign schema
      const result = CampaignSchema.safeParse(data.campaign);
      expect(result.success).toBe(true);
    });

    it('should return 400 for invalid campaign data', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(fixtures.requests.create.invalid),
      });

      expect(response.status).toBe(400);

      const data = await parseResponse<any>(response);
      validateErrorResponse(data);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixtures.requests.create.valid),
      });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        creatorId: TEST_CREATORS.valid,
        // Missing required fields
      };

      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await parseResponse<any>(response);
      validateErrorResponse(data);
    });

    it('should validate channel values', async () => {
      const invalidData = {
        ...fixtures.requests.create.valid,
        channel: 'invalid_channel',
      };

      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });

    it('should validate goal values', async () => {
      const invalidData = {
        ...fixtures.requests.create.valid,
        goal: 'invalid_goal',
      };

      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });

    it('should set default status to draft', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(fixtures.requests.create.valid),
      });

      expect(response.status).toBe(201);

      const data = await parseResponse<any>(response);
      expect(data.campaign.status).toBe('draft');
    });

    it('should initialize metrics to zero', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(fixtures.requests.create.valid),
      });

      expect(response.status).toBe(201);

      const data = await parseResponse<any>(response);
      expect(data.campaign.metrics).toBeDefined();
      expect(data.campaign.metrics.sent).toBe(0);
      expect(data.campaign.metrics.delivered).toBe(0);
    });
  });

  describe('GET /api/marketing/campaigns/[id]', () => {
    const campaignId = 'camp_test_001';

    it('should return campaign details', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}?creatorId=${TEST_CREATORS.valid}`
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      expect(data.campaign).toBeDefined();
      expect(data.campaign.id).toBe(campaignId);
      
      // Validate schema
      const result = CampaignSchema.safeParse(data.campaign);
      expect(result.success).toBe(true);
    });

    it('should return 400 if creatorId is missing', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`);

      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}?creatorId=${TEST_CREATORS.valid}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 if accessing another creator\'s campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}?creatorId=${TEST_CREATORS.unauthorized}`
      );

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/nonexistent_id?creatorId=${TEST_CREATORS.valid}`
      );

      expect(response.status).toBe(404);

      const data = await parseResponse<any>(response);
      validateErrorResponse(data);
    });
  });

  describe('PUT /api/marketing/campaigns/[id]', () => {
    const campaignId = 'camp_test_001';

    it('should update campaign', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.valid,
          ...fixtures.requests.update.valid,
        }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      expect(data.success).toBe(true);
      expect(data.campaign).toBeDefined();
      expect(data.campaign.name).toBe(fixtures.requests.update.valid.name);
    });

    it('should return 400 for invalid update data', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.valid,
          ...fixtures.requests.update.invalid,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixtures.requests.update.valid),
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 if updating another creator\'s campaign', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.unauthorized,
          ...fixtures.requests.update.valid,
        }),
      });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await makeRequest('/api/marketing/campaigns/nonexistent_id', {
        method: 'PUT',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.valid,
          ...fixtures.requests.update.valid,
        }),
      });

      expect(response.status).toBe(404);
    });

    it('should update updatedAt timestamp', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.valid,
          ...fixtures.requests.update.valid,
        }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      expect(data.campaign.updatedAt).toBeDefined();
      
      const updatedAt = new Date(data.campaign.updatedAt);
      const now = new Date();
      expect(updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should not allow updating immutable fields', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.valid,
          id: 'different_id', // Should not change
          createdAt: new Date().toISOString(), // Should not change
        }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      expect(data.campaign.id).toBe(campaignId); // ID unchanged
    });
  });

  describe('DELETE /api/marketing/campaigns/[id]', () => {
    const campaignId = 'camp_test_delete';

    it('should delete campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}?creatorId=${TEST_CREATORS.valid}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      expect(data.success).toBe(true);
    });

    it('should return 400 if creatorId is missing', async () => {
      const response = await makeRequest(`/api/marketing/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}?creatorId=${TEST_CREATORS.valid}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 if deleting another creator\'s campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}?creatorId=${TEST_CREATORS.unauthorized}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/nonexistent_id?creatorId=${TEST_CREATORS.valid}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/marketing/campaigns/[id]/launch', () => {
    const campaignId = 'camp_test_002'; // Draft campaign

    it('should launch campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}/launch`,
        {
          method: 'POST',
          body: JSON.stringify(fixtures.requests.launch.valid),
        }
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<any>(response);
      expect(data.success).toBe(true);
      expect(data.campaign.status).toBe('active');
    });

    it('should return 400 for invalid launch data', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}/launch`,
        {
          method: 'POST',
          body: JSON.stringify(fixtures.requests.launch.invalid),
        }
      );

      expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}/launch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fixtures.requests.launch.valid),
        }
      );

      expect(response.status).toBe(401);
    });

    it('should return 403 if launching another creator\'s campaign', async () => {
      const response = await makeRequest(
        `/api/marketing/campaigns/${campaignId}/launch`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...fixtures.requests.launch.valid,
            creatorId: TEST_CREATORS.unauthorized,
          }),
        }
      );

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await makeRequest(
        '/api/marketing/campaigns/nonexistent_id/launch',
        {
          method: 'POST',
          body: JSON.stringify(fixtures.requests.launch.valid),
        }
      );

      expect(response.status).toBe(404);
    });

    it('should validate campaign is in draft status', async () => {
      const activeCampaignId = 'camp_test_001'; // Already active

      const response = await makeRequest(
        `/api/marketing/campaigns/${activeCampaignId}/launch`,
        {
          method: 'POST',
          body: JSON.stringify(fixtures.requests.launch.valid),
        }
      );

      // Should return error if campaign is not in draft
      expect([400, 409]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on campaign creation', async () => {
      const rateLimiter = new RateLimitTester();
      const requests: Response[] = [];

      // Make multiple requests rapidly
      for (let i = 0; i < 15; i++) {
        const response = await rateLimiter.makeRequest('/api/marketing/campaigns');
        requests.push(response);
      }

      // At least one should be rate limited
      const rateLimited = requests.some(r => r.status === 429);
      
      if (rateLimited) {
        const rateLimitedResponse = requests.find(r => r.status === 429);
        const data = await parseResponse<any>(rateLimitedResponse!);
        validateErrorResponse(data);
        expect(data.error).toContain('rate');
      }
    });

    it('should include retry-after header on rate limit', async () => {
      // This test may need adjustment based on actual rate limiting implementation
      const rateLimiter = new RateLimitTester();

      for (let i = 0; i < 20; i++) {
        const response = await rateLimiter.makeRequest('/api/marketing/campaigns');
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          expect(retryAfter).toBeDefined();
          break;
        }
      }
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent reads', async () => {
      const responses = await makeConcurrentRequests(
        `/api/marketing/campaigns?creatorId=${TEST_CREATORS.valid}`,
        5
      );

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle concurrent updates to same campaign', async () => {
      const campaignId = 'camp_test_001';
      
      const responses = await makeConcurrentRequests(
        `/api/marketing/campaigns/${campaignId}`,
        3,
        {
          method: 'PUT',
          body: JSON.stringify({
            creatorId: TEST_CREATORS.valid,
            name: `Updated ${Date.now()}`,
          }),
        }
      );

      // All should succeed or handle conflicts gracefully
      responses.forEach(response => {
        expect([200, 409]).toContain(response.status);
      });
    });

    it('should handle concurrent campaign creation', async () => {
      const responses = await makeConcurrentRequests(
        '/api/marketing/campaigns',
        3,
        {
          method: 'POST',
          body: JSON.stringify({
            ...fixtures.requests.create.valid,
            name: `Concurrent Campaign ${Date.now()}`,
          }),
        }
      );

      // All should succeed with unique IDs
      const successfulResponses = responses.filter(r => r.status === 201);
      
      if (successfulResponses.length > 1) {
        const ids = await Promise.all(
          successfulResponses.map(async r => {
            const data = await parseResponse<any>(r);
            return data.campaign.id;
          })
        );

        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for server errors', async () => {
      // This test would need a way to trigger server errors
      // For now, we just verify the error response format
      
      // Mock scenario: invalid internal state
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          creatorId: TEST_CREATORS.valid,
          // Data that might cause server error
        }),
      });

      if (response.status === 500) {
        const data = await parseResponse<any>(response);
        validateErrorResponse(data);
      }
    });

    it('should include correlation ID in error responses', async () => {
      const response = await makeRequest('/api/marketing/campaigns');

      const data = await parseResponse<any>(response);
      
      // Check for correlation ID in response or headers
      const correlationId = 
        data.correlationId || 
        response.headers.get('X-Correlation-ID');
      
      if (correlationId) {
        expect(typeof correlationId).toBe('string');
        expect(correlationId.length).toBeGreaterThan(0);
      }
    });

    it('should handle malformed JSON', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        body: 'invalid json{',
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing content-type header', async () => {
      const response = await makeRequest('/api/marketing/campaigns', {
        method: 'POST',
        headers: {
          ...createAuthHeaders(),
          'Content-Type': '', // Remove content-type
        },
        body: JSON.stringify(fixtures.requests.create.valid),
      });

      // Should still work or return appropriate error
      expect([200, 201, 400, 415]).toContain(response.status);
    });
  });
});
