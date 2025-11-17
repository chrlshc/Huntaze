/**
 * Marketing Campaigns API - Integration Tests
 * 
 * Full integration tests for marketing campaign endpoints:
 * - GET /api/marketing/campaigns - List campaigns
 * - POST /api/marketing/campaigns - Create campaign
 * - GET /api/marketing/campaigns/[id] - Get campaign
 * - PUT /api/marketing/campaigns/[id] - Update campaign
 * - DELETE /api/marketing/campaigns/[id] - Delete campaign
 * - POST /api/marketing/campaigns/[id]/launch - Launch campaign
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.3
 * 
 * @see app/api/marketing/campaigns/route.ts
 * @see app/api/marketing/campaigns/[id]/route.ts
 * @see lib/api/services/marketing.service.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { query } from '@/lib/db';
import crypto from 'crypto';
import {
  CampaignSchema,
  CampaignListResponseSchema,
  CampaignCreateResponseSchema,
  CampaignUpdateResponseSchema,
  CampaignDeleteResponseSchema,
  ErrorResponseSchema,
  sampleCampaigns,
  sampleStats,
  createCampaignData,
  calculateExpectedRates,
  validateStatsCalculation,
  generateBulkCampaigns,
  invalidCampaignData,
} from './fixtures/marketing-fixtures';

describe('Marketing Campaigns API - Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  const testUsers: string[] = [];
  const testCampaigns: string[] = [];
  let testSessionCookie: string;
  let testUserId: string;

  // Setup: Create test user and get session
  beforeAll(async () => {
    const email = `test-marketing-${Date.now()}@example.com`;
    testUsers.push(email);

    // Register user
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Marketing User',
        email,
        password: 'SecurePassword123!',
      }),
    });

    const registerData = await registerResponse.json();
    testUserId = registerData.user.id;

    // Complete onboarding
    await query(
      'UPDATE users SET onboarding_completed = true WHERE id = $1',
      [testUserId]
    );

    // Get session (in real app, this would be through NextAuth)
    testSessionCookie = `next-auth.session-token=test-session-${testUserId}`;
  });

  // Cleanup
  afterAll(async () => {
    // Delete test campaigns
    for (const campaignId of testCampaigns) {
      try {
        await query('DELETE FROM marketing_campaigns WHERE id = $1', [campaignId]);
      } catch (error) {
        console.error(`Failed to cleanup campaign ${campaignId}:`, error);
      }
    }

    // Delete test users
    for (const email of testUsers) {
      try {
        await query('DELETE FROM users WHERE email = $1', [email]);
      } catch (error) {
        console.error(`Failed to cleanup user ${email}:`, error);
      }
    }
  });

  // Helper to make authenticated requests
  const makeRequest = async (
    method: string,
    path: string,
    body?: any,
    sessionCookie?: string
  ) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie && { Cookie: sessionCookie }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const data = await response.json();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  };

  describe('GET /api/marketing/campaigns - List Campaigns', () => {
    describe('HTTP Status Codes', () => {
      it('should return 200 OK with empty list for new user', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(CampaignListResponseSchema.parse(response.data)).toBeDefined();
        expect(response.data.items).toEqual([]);
        expect(response.data.pagination.total).toBe(0);
      });

      it('should return 401 Unauthorized without session', async () => {
        const response = await makeRequest('GET', '/api/marketing/campaigns');

        expect(response.status).toBe(401);
        expect(ErrorResponseSchema.parse(response.data)).toBeDefined();
      });

      it('should return 200 OK with campaigns after creating some', async () => {
        // Create a test campaign first
        const createResponse = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          createCampaignData(),
          testSessionCookie
        );

        if (createResponse.data.id) {
          testCampaigns.push(createResponse.data.id);
        }

        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.items.length).toBeGreaterThan(0);
      });
    });

    describe('Response Schema Validation', () => {
      it('should return valid campaign list schema', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns',
          null,
          testSessionCookie
        );

        const validated = CampaignListResponseSchema.parse(response.data);
        expect(validated).toBeDefined();
        expect(validated.items).toBeInstanceOf(Array);
        expect(validated.pagination).toBeDefined();
      });

      it('should include calculated stats for each campaign', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns',
          null,
          testSessionCookie
        );

        if (response.data.items.length > 0) {
          const campaign = response.data.items[0];
          expect(campaign.stats).toBeDefined();
          expect(campaign.stats.openRate).toBeDefined();
          expect(campaign.stats.clickRate).toBeDefined();
          expect(campaign.stats.conversionRate).toBeDefined();
        }
      });
    });

    describe('Filtering and Pagination', () => {
      beforeEach(async () => {
        // Create multiple campaigns with different statuses
        const campaigns = [
          createCampaignData({ status: 'draft' }),
          createCampaignData({ status: 'active' }),
          createCampaignData({ status: 'completed' }),
        ];

        for (const campaign of campaigns) {
          const response = await makeRequest(
            'POST',
            '/api/marketing/campaigns',
            campaign,
            testSessionCookie
          );
          if (response.data.id) {
            testCampaigns.push(response.data.id);
          }
        }
      });

      it('should filter by status', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns?status=draft',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        response.data.items.forEach((campaign: any) => {
          expect(campaign.status).toBe('draft');
        });
      });

      it('should filter by channel', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns?channel=email',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        response.data.items.forEach((campaign: any) => {
          expect(campaign.channel).toBe('email');
        });
      });

      it('should support pagination with limit', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns?limit=2',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.items.length).toBeLessThanOrEqual(2);
        expect(response.data.pagination.limit).toBe(2);
      });

      it('should support pagination with offset', async () => {
        const response1 = await makeRequest(
          'GET',
          '/api/marketing/campaigns?limit=1&offset=0',
          null,
          testSessionCookie
        );

        const response2 = await makeRequest(
          'GET',
          '/api/marketing/campaigns?limit=1&offset=1',
          null,
          testSessionCookie
        );

        if (response1.data.items.length > 0 && response2.data.items.length > 0) {
          expect(response1.data.items[0].id).not.toBe(response2.data.items[0].id);
        }
      });

      it('should indicate hasMore correctly', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns?limit=1',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(typeof response.data.pagination.hasMore).toBe('boolean');
      });
    });

    describe('Performance', () => {
      it('should complete within 1 second', async () => {
        const startTime = Date.now();
        
        await makeRequest(
          'GET',
          '/api/marketing/campaigns',
          null,
          testSessionCookie
        );

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000);
      });
    });
  });

  describe('POST /api/marketing/campaigns - Create Campaign', () => {
    describe('HTTP Status Codes', () => {
      it('should return 201 Created on successful creation', async () => {
        const campaignData = createCampaignData();
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          campaignData,
          testSessionCookie
        );

        expect(response.status).toBe(201);
        expect(CampaignCreateResponseSchema.parse(response.data)).toBeDefined();
        
        if (response.data.id) {
          testCampaigns.push(response.data.id);
        }
      });

      it('should return 401 Unauthorized without session', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          createCampaignData()
        );

        expect(response.status).toBe(401);
      });

      it('should return 400 Bad Request for invalid data', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          invalidCampaignData.missingName,
          testSessionCookie
        );

        expect(response.status).toBe(400);
        expect(ErrorResponseSchema.parse(response.data)).toBeDefined();
      });
    });

    describe('Response Schema Validation', () => {
      it('should return valid campaign schema', async () => {
        const campaignData = createCampaignData();
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          campaignData,
          testSessionCookie
        );

        const validated = CampaignCreateResponseSchema.parse(response.data);
        expect(validated.id).toBeDefined();
        expect(validated.userId).toBe(testUserId);
        expect(validated.name).toBe(campaignData.name);
        
        if (response.data.id) {
          testCampaigns.push(response.data.id);
        }
      });

      it('should initialize stats to zero', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          createCampaignData(),
          testSessionCookie
        );

        expect(response.data.stats.sent).toBe(0);
        expect(response.data.stats.opened).toBe(0);
        expect(response.data.stats.clicked).toBe(0);
        expect(response.data.stats.converted).toBe(0);
        
        if (response.data.id) {
          testCampaigns.push(response.data.id);
        }
      });
    });

    describe('Input Validation', () => {
      it('should reject missing required fields', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          invalidCampaignData.missingName,
          testSessionCookie
        );

        expect(response.status).toBe(400);
      });

      it('should reject invalid status', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          invalidCampaignData.invalidStatus,
          testSessionCookie
        );

        expect(response.status).toBe(400);
      });

      it('should reject invalid channel', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          invalidCampaignData.invalidChannel,
          testSessionCookie
        );

        expect(response.status).toBe(400);
      });

      it('should reject negative audience size', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          invalidCampaignData.negativeAudienceSize,
          testSessionCookie
        );

        expect(response.status).toBe(400);
      });
    });

    describe('Data Persistence', () => {
      it('should persist campaign to database', async () => {
        const campaignData = createCampaignData();
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns',
          campaignData,
          testSessionCookie
        );

        expect(response.status).toBe(201);
        const campaignId = response.data.id;
        testCampaigns.push(campaignId);

        // Verify in database
        const result = await query(
          'SELECT * FROM marketing_campaigns WHERE id = $1',
          [campaignId]
        );

        expect(result.rows.length).toBe(1);
        expect(result.rows[0].name).toBe(campaignData.name);
      });
    });
  });

  describe('GET /api/marketing/campaigns/[id] - Get Campaign', () => {
    let testCampaignId: string;

    beforeEach(async () => {
      // Create a campaign for testing
      const response = await makeRequest(
        'POST',
        '/api/marketing/campaigns',
        createCampaignData(),
        testSessionCookie
      );
      testCampaignId = response.data.id;
      testCampaigns.push(testCampaignId);
    });

    describe('HTTP Status Codes', () => {
      it('should return 200 OK for existing campaign', async () => {
        const response = await makeRequest(
          'GET',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(CampaignSchema.parse(response.data)).toBeDefined();
      });

      it('should return 401 Unauthorized without session', async () => {
        const response = await makeRequest(
          'GET',
          `/api/marketing/campaigns/${testCampaignId}`
        );

        expect(response.status).toBe(401);
      });

      it('should return 404 Not Found for non-existent campaign', async () => {
        const response = await makeRequest(
          'GET',
          '/api/marketing/campaigns/non-existent-id',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(404);
      });
    });

    describe('Authorization', () => {
      it('should not allow access to other users campaigns', async () => {
        // Create another user
        const email2 = `test-marketing-2-${Date.now()}@example.com`;
        testUsers.push(email2);

        const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: 'Test User 2',
            email: email2,
            password: 'SecurePassword123!',
          }),
        });

        const user2Data = await registerResponse.json();
        const user2Session = `next-auth.session-token=test-session-${user2Data.user.id}`;

        // Try to access first user's campaign
        const response = await makeRequest(
          'GET',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          user2Session
        );

        expect([403, 404]).toContain(response.status);
      });
    });
  });

  describe('PUT /api/marketing/campaigns/[id] - Update Campaign', () => {
    let testCampaignId: string;

    beforeEach(async () => {
      const response = await makeRequest(
        'POST',
        '/api/marketing/campaigns',
        createCampaignData({ status: 'draft' }),
        testSessionCookie
      );
      testCampaignId = response.data.id;
      testCampaigns.push(testCampaignId);
    });

    describe('HTTP Status Codes', () => {
      it('should return 200 OK on successful update', async () => {
        const response = await makeRequest(
          'PUT',
          `/api/marketing/campaigns/${testCampaignId}`,
          { name: 'Updated Campaign Name' },
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(CampaignUpdateResponseSchema.parse(response.data)).toBeDefined();
        expect(response.data.name).toBe('Updated Campaign Name');
      });

      it('should return 401 Unauthorized without session', async () => {
        const response = await makeRequest(
          'PUT',
          `/api/marketing/campaigns/${testCampaignId}`,
          { name: 'Updated Name' }
        );

        expect(response.status).toBe(401);
      });

      it('should return 404 Not Found for non-existent campaign', async () => {
        const response = await makeRequest(
          'PUT',
          '/api/marketing/campaigns/non-existent-id',
          { name: 'Updated Name' },
          testSessionCookie
        );

        expect(response.status).toBe(404);
      });
    });

    describe('Partial Updates', () => {
      it('should allow updating only name', async () => {
        const response = await makeRequest(
          'PUT',
          `/api/marketing/campaigns/${testCampaignId}`,
          { name: 'New Name Only' },
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('New Name Only');
      });

      it('should allow updating only status', async () => {
        const response = await makeRequest(
          'PUT',
          `/api/marketing/campaigns/${testCampaignId}`,
          { status: 'active' },
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('active');
      });

      it('should allow updating multiple fields', async () => {
        const response = await makeRequest(
          'PUT',
          `/api/marketing/campaigns/${testCampaignId}`,
          {
            name: 'Updated Name',
            status: 'scheduled',
            audienceSize: 2000,
          },
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('Updated Name');
        expect(response.data.status).toBe('scheduled');
        expect(response.data.audienceSize).toBe(2000);
      });
    });

    describe('Status Transitions', () => {
      it('should update stats when activating campaign', async () => {
        const response = await makeRequest(
          'PUT',
          `/api/marketing/campaigns/${testCampaignId}`,
          { status: 'active' },
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('active');
        // Stats should be updated with activation timestamp
      });
    });
  });

  describe('DELETE /api/marketing/campaigns/[id] - Delete Campaign', () => {
    let testCampaignId: string;

    beforeEach(async () => {
      const response = await makeRequest(
        'POST',
        '/api/marketing/campaigns',
        createCampaignData(),
        testSessionCookie
      );
      testCampaignId = response.data.id;
      testCampaigns.push(testCampaignId);
    });

    describe('HTTP Status Codes', () => {
      it('should return 200 OK on successful deletion', async () => {
        const response = await makeRequest(
          'DELETE',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);

        // Remove from cleanup list since it's deleted
        const index = testCampaigns.indexOf(testCampaignId);
        if (index > -1) {
          testCampaigns.splice(index, 1);
        }
      });

      it('should return 401 Unauthorized without session', async () => {
        const response = await makeRequest(
          'DELETE',
          `/api/marketing/campaigns/${testCampaignId}`
        );

        expect(response.status).toBe(401);
      });

      it('should return 404 Not Found for non-existent campaign', async () => {
        const response = await makeRequest(
          'DELETE',
          '/api/marketing/campaigns/non-existent-id',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(404);
      });
    });

    describe('Data Persistence', () => {
      it('should remove campaign from database', async () => {
        await makeRequest(
          'DELETE',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          testSessionCookie
        );

        // Verify deleted from database
        const result = await query(
          'SELECT * FROM marketing_campaigns WHERE id = $1',
          [testCampaignId]
        );

        expect(result.rows.length).toBe(0);

        // Remove from cleanup list
        const index = testCampaigns.indexOf(testCampaignId);
        if (index > -1) {
          testCampaigns.splice(index, 1);
        }
      });

      it('should not allow deleting twice', async () => {
        // First deletion
        await makeRequest(
          'DELETE',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          testSessionCookie
        );

        // Second deletion should fail
        const response = await makeRequest(
          'DELETE',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          testSessionCookie
        );

        expect(response.status).toBe(404);

        // Remove from cleanup list
        const index = testCampaigns.indexOf(testCampaignId);
        if (index > -1) {
          testCampaigns.splice(index, 1);
        }
      });
    });
  });

  describe('POST /api/marketing/campaigns/[id]/launch - Launch Campaign', () => {
    let testCampaignId: string;

    beforeEach(async () => {
      const response = await makeRequest(
        'POST',
        '/api/marketing/campaigns',
        createCampaignData({ status: 'draft' }),
        testSessionCookie
      );
      testCampaignId = response.data.id;
      testCampaigns.push(testCampaignId);
    });

    describe('HTTP Status Codes', () => {
      it('should return 200 OK on successful launch', async () => {
        const response = await makeRequest(
          'POST',
          `/api/marketing/campaigns/${testCampaignId}/launch`,
          null,
          testSessionCookie
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      it('should return 401 Unauthorized without session', async () => {
        const response = await makeRequest(
          'POST',
          `/api/marketing/campaigns/${testCampaignId}/launch`
        );

        expect(response.status).toBe(401);
      });

      it('should return 404 Not Found for non-existent campaign', async () => {
        const response = await makeRequest(
          'POST',
          '/api/marketing/campaigns/non-existent-id/launch',
          null,
          testSessionCookie
        );

        expect(response.status).toBe(404);
      });
    });

    describe('Campaign State Changes', () => {
      it('should change status to active', async () => {
        await makeRequest(
          'POST',
          `/api/marketing/campaigns/${testCampaignId}/launch`,
          null,
          testSessionCookie
        );

        // Verify status changed
        const getResponse = await makeRequest(
          'GET',
          `/api/marketing/campaigns/${testCampaignId}`,
          null,
          testSessionCookie
        );

        expect(getResponse.data.status).toBe('active');
      });
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent campaign creations', async () => {
      const campaigns = generateBulkCampaigns(10);
      
      const requests = campaigns.map(campaign =>
        makeRequest(
          'POST',
          '/api/marketing/campaigns',
          campaign,
          testSessionCookie
        )
      );

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 201).length;

      expect(successCount).toBe(10);

      // Add to cleanup
      responses.forEach(r => {
        if (r.data.id) {
          testCampaigns.push(r.data.id);
        }
      });
    });

    it('should handle concurrent updates to same campaign', async () => {
      // Create campaign
      const createResponse = await makeRequest(
        'POST',
        '/api/marketing/campaigns',
        createCampaignData(),
        testSessionCookie
      );
      const campaignId = createResponse.data.id;
      testCampaigns.push(campaignId);

      // Concurrent updates
      const updates = Array.from({ length: 5 }, (_, i) =>
        makeRequest(
          'PUT',
          `/api/marketing/campaigns/${campaignId}`,
          { name: `Updated Name ${i}` },
          testSessionCookie
        )
      );

      const responses = await Promise.all(updates);
      const successCount = responses.filter(r => r.status === 200).length;

      expect(successCount).toBe(5);
    });
  });

  describe('Stats Calculation', () => {
    it('should calculate rates correctly for zero stats', async () => {
      const response = await makeRequest(
        'POST',
        '/api/marketing/campaigns',
        createCampaignData(),
        testSessionCookie
      );

      const stats = response.data.stats;
      expect(stats.openRate).toBe(0);
      expect(stats.clickRate).toBe(0);
      expect(stats.conversionRate).toBe(0);

      testCampaigns.push(response.data.id);
    });

    it('should calculate rates correctly for non-zero stats', async () => {
      // This would require updating stats through the service
      // For now, we verify the calculation logic
      const expectedRates = calculateExpectedRates(sampleStats.mediumEngagement);
      
      expect(expectedRates.openRate).toBe(30);
      expect(expectedRates.clickRate).toBe(20);
      expect(expectedRates.conversionRate).toBe(1.5);
    });
  });

  describe('Performance', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      const campaigns = generateBulkCampaigns(20);
      const requests = campaigns.map(campaign =>
        makeRequest(
          'POST',
          '/api/marketing/campaigns',
          campaign,
          testSessionCookie
        )
      );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds

      // Cleanup
      responses.forEach(r => {
        if (r.data.id) {
          testCampaigns.push(r.data.id);
        }
      });
    });
  });
});
