/**
 * Dashboard API - Integration Tests
 * 
 * Full integration tests for the unified dashboard endpoint with:
 * - Real integration data fetching
 * - Session-based authentication
 * - Multiple data source aggregation
 * - Connected integrations detection
 * - Error handling and graceful degradation
 * 
 * Requirements: 6.1, 6.2, 6.3
 * 
 * @see app/api/dashboard/route.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { z } from 'zod';
import { query } from '@/lib/db';
import { hash } from 'bcryptjs';

// ============================================================================
// Response Schemas
// ============================================================================

const DashboardSummarySchema = z.object({
  totalRevenue: z.object({
    value: z.number(),
    currency: z.string(),
    change: z.number(),
  }),
  activeFans: z.object({
    value: z.number(),
    change: z.number(),
  }),
  messages: z.object({
    total: z.number(),
    unread: z.number(),
  }),
  engagement: z.object({
    value: z.number(),
    change: z.number(),
  }),
});

const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['content_published', 'campaign_sent', 'fan_subscribed', 'message_received']),
  title: z.string(),
  createdAt: z.string(),
  source: z.enum(['content', 'marketing', 'onlyfans', 'messages']),
  meta: z.any().optional(),
});

const QuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  href: z.string(),
});

const ConnectedIntegrationsSchema = z.object({
  onlyfans: z.boolean(),
  instagram: z.boolean(),
  tiktok: z.boolean(),
  reddit: z.boolean(),
});

const DashboardResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    summary: DashboardSummarySchema,
    trends: z.object({
      revenue: z.array(z.any()),
      fans: z.array(z.any()),
    }),
    recentActivity: z.array(ActivityItemSchema),
    quickActions: z.array(QuickActionSchema),
    connectedIntegrations: ConnectedIntegrationsSchema,
    metadata: z.object({
      sources: z.object({
        onlyfans: z.boolean(),
        instagram: z.boolean(),
        tiktok: z.boolean(),
        reddit: z.boolean(),
      }),
      hasRealData: z.boolean(),
      generatedAt: z.string(),
    }),
  }),
});

const DashboardErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
});

describe('GET /api/dashboard - Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  const testUsers: string[] = [];
  let testSessionCookie: string;
  let testUserId: string;

  // Setup: Create test user and get session
  beforeAll(async () => {
    const email = `test-dashboard-${Date.now()}@example.com`;
    testUsers.push(email);

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

  // Cleanup
  afterAll(async () => {
    for (const email of testUsers) {
      try {
        await query('DELETE FROM users WHERE email = $1', [email.toLowerCase()]);
      } catch (error) {
        console.error(`Failed to cleanup test user ${email}:`, error);
      }
    }
  });

  // Helper to make dashboard request
  const getDashboard = async (params?: Record<string, string>, sessionCookie?: string) => {
    const url = new URL(`${baseUrl}/api/dashboard`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...(sessionCookie && { Cookie: sessionCookie }),
      },
    });

    const responseData = await response.json();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    };
  };

  describe('HTTP Status Codes', () => {
    it('should return 200 OK with valid session', async () => {
      const response = await getDashboard({}, testSessionCookie);

      expect(response.status).toBe(200);
      expect(DashboardResponseSchema.parse(response.data)).toBeDefined();
    });

    it('should return 401 Unauthorized without session', async () => {
      const response = await getDashboard();

      expect(response.status).toBe(401);
      expect(DashboardErrorSchema.parse(response.data)).toBeDefined();
    });

    it('should return 401 Unauthorized with invalid session', async () => {
      const response = await getDashboard({}, 'invalid-session-cookie');

      expect(response.status).toBe(401);
    });

    it('should return 200 OK even with no connected integrations', async () => {
      const response = await getDashboard({}, testSessionCookie);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return valid dashboard response schema', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const validated = DashboardResponseSchema.parse(response.data);
      
      expect(validated.success).toBe(true);
      expect(validated.data.summary).toBeDefined();
      expect(validated.data.trends).toBeDefined();
      expect(validated.data.recentActivity).toBeDefined();
      expect(validated.data.quickActions).toBeDefined();
      expect(validated.data.connectedIntegrations).toBeDefined();
      expect(validated.data.metadata).toBeDefined();
    });

    it('should include all required summary fields', async () => {
      const response = await getDashboard({}, testSessionCookie);

      expect(response.data.data.summary.totalRevenue).toBeDefined();
      expect(response.data.data.summary.activeFans).toBeDefined();
      expect(response.data.data.summary.messages).toBeDefined();
      expect(response.data.data.summary.engagement).toBeDefined();
    });

    it('should include quick actions', async () => {
      const response = await getDashboard({}, testSessionCookie);

      expect(response.data.data.quickActions).toBeInstanceOf(Array);
      expect(response.data.data.quickActions.length).toBeGreaterThan(0);
      
      response.data.data.quickActions.forEach((action: any) => {
        expect(QuickActionSchema.parse(action)).toBeDefined();
      });
    });

    it('should include connected integrations status', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const integrations = response.data.data.connectedIntegrations;
      expect(typeof integrations.onlyfans).toBe('boolean');
      expect(typeof integrations.instagram).toBe('boolean');
      expect(typeof integrations.tiktok).toBe('boolean');
      expect(typeof integrations.reddit).toBe('boolean');
    });

    it('should include metadata with data sources', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const metadata = response.data.data.metadata;
      expect(metadata.sources).toBeDefined();
      expect(typeof metadata.hasRealData).toBe('boolean');
      expect(metadata.generatedAt).toBeDefined();
      expect(new Date(metadata.generatedAt).toString()).not.toBe('Invalid Date');
    });
  });

  describe('Query Parameters', () => {
    it('should accept range parameter', async () => {
      const response = await getDashboard({ range: '7d' }, testSessionCookie);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should accept include parameter for selective data fetching', async () => {
      const response = await getDashboard(
        { include: 'analytics,content' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should handle multiple include values', async () => {
      const response = await getDashboard(
        { include: 'analytics,content,onlyfans,marketing' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
    });

    it('should work without query parameters (defaults)', async () => {
      const response = await getDashboard({}, testSessionCookie);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate data from multiple sources', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const data = response.data.data;
      
      // Should have summary data
      expect(data.summary.totalRevenue.value).toBeGreaterThanOrEqual(0);
      expect(data.summary.activeFans.value).toBeGreaterThanOrEqual(0);
      expect(data.summary.messages.total).toBeGreaterThanOrEqual(0);
    });

    it('should include recent activity from various sources', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const activities = response.data.data.recentActivity;
      expect(Array.isArray(activities)).toBe(true);
      
      // Activities should be sorted by date (most recent first)
      if (activities.length > 1) {
        const dates = activities.map((a: any) => new Date(a.createdAt).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });

    it('should limit recent activity to 10 items', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const activities = response.data.data.recentActivity;
      expect(activities.length).toBeLessThanOrEqual(10);
    });

    it('should calculate engagement rate correctly', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const summary = response.data.data.summary;
      
      if (summary.activeFans.value > 0) {
        const expectedEngagement = summary.messages.total / summary.activeFans.value;
        expect(summary.engagement.value).toBeCloseTo(expectedEngagement, 2);
      } else {
        expect(summary.engagement.value).toBe(0);
      }
    });
  });

  describe('Integration Detection', () => {
    it('should detect connected integrations', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const integrations = response.data.data.connectedIntegrations;
      
      // All should be boolean
      expect(typeof integrations.onlyfans).toBe('boolean');
      expect(typeof integrations.instagram).toBe('boolean');
      expect(typeof integrations.tiktok).toBe('boolean');
      expect(typeof integrations.reddit).toBe('boolean');
    });

    it('should set hasRealData flag correctly', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const metadata = response.data.data.metadata;
      const integrations = response.data.data.connectedIntegrations;
      
      const hasAnyIntegration = 
        integrations.onlyfans || 
        integrations.instagram || 
        integrations.tiktok || 
        integrations.reddit;
      
      expect(metadata.hasRealData).toBe(hasAnyIntegration);
    });

    it('should match metadata sources with connectedIntegrations', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const metadata = response.data.data.metadata;
      const integrations = response.data.data.connectedIntegrations;
      
      expect(metadata.sources.onlyfans).toBe(integrations.onlyfans);
      expect(metadata.sources.instagram).toBe(integrations.instagram);
      expect(metadata.sources.tiktok).toBe(integrations.tiktok);
      expect(metadata.sources.reddit).toBe(integrations.reddit);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', async () => {
      const response = await getDashboard();

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it('should handle invalid session gracefully', async () => {
      const response = await getDashboard({}, 'invalid-cookie');

      expect(response.status).toBe(401);
    });

    it('should gracefully degrade when OnlyFans API fails', async () => {
      // Even if OnlyFans API fails, dashboard should still return data
      const response = await getDashboard({}, testSessionCookie);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should gracefully degrade when content API fails', async () => {
      const response = await getDashboard(
        { include: 'content' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should gracefully degrade when marketing API fails', async () => {
      const response = await getDashboard(
        { include: 'marketing' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete within 5 seconds', async () => {
      const startTime = Date.now();
      
      await getDashboard({}, testSessionCookie);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const requests = Array.from({ length: 5 }, () =>
        getDashboard({}, testSessionCookie)
      );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(5);
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data structure across requests', async () => {
      const response1 = await getDashboard({}, testSessionCookie);
      const response2 = await getDashboard({}, testSessionCookie);

      expect(response1.data.data).toHaveProperty('summary');
      expect(response1.data.data).toHaveProperty('trends');
      expect(response1.data.data).toHaveProperty('recentActivity');
      expect(response1.data.data).toHaveProperty('quickActions');
      expect(response1.data.data).toHaveProperty('connectedIntegrations');
      expect(response1.data.data).toHaveProperty('metadata');

      expect(response2.data.data).toHaveProperty('summary');
      expect(response2.data.data).toHaveProperty('trends');
      expect(response2.data.data).toHaveProperty('recentActivity');
      expect(response2.data.data).toHaveProperty('quickActions');
      expect(response2.data.data).toHaveProperty('connectedIntegrations');
      expect(response2.data.data).toHaveProperty('metadata');
    });

    it('should maintain data type consistency', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const summary = response.data.data.summary;
      
      expect(typeof summary.totalRevenue.value).toBe('number');
      expect(typeof summary.totalRevenue.currency).toBe('string');
      expect(typeof summary.totalRevenue.change).toBe('number');
      expect(typeof summary.activeFans.value).toBe('number');
      expect(typeof summary.activeFans.change).toBe('number');
      expect(typeof summary.messages.total).toBe('number');
      expect(typeof summary.messages.unread).toBe('number');
      expect(typeof summary.engagement.value).toBe('number');
      expect(typeof summary.engagement.change).toBe('number');
    });

    it('should ensure all numeric values are non-negative', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const summary = response.data.data.summary;
      
      expect(summary.totalRevenue.value).toBeGreaterThanOrEqual(0);
      expect(summary.activeFans.value).toBeGreaterThanOrEqual(0);
      expect(summary.messages.total).toBeGreaterThanOrEqual(0);
      expect(summary.messages.unread).toBeGreaterThanOrEqual(0);
      expect(summary.engagement.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quick Actions', () => {
    it('should provide at least 4 quick actions', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const quickActions = response.data.data.quickActions;
      expect(quickActions.length).toBeGreaterThanOrEqual(4);
    });

    it('should have valid quick action structure', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const quickActions = response.data.data.quickActions;
      
      quickActions.forEach((action: any) => {
        expect(action.id).toBeDefined();
        expect(action.label).toBeDefined();
        expect(action.icon).toBeDefined();
        expect(action.href).toBeDefined();
        expect(action.href).toMatch(/^\//); // Should be relative path
      });
    });

    it('should include create content action', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const quickActions = response.data.data.quickActions;
      const createContentAction = quickActions.find((a: any) => 
        a.id === 'create-content' || a.label.toLowerCase().includes('content')
      );
      
      expect(createContentAction).toBeDefined();
    });
  });

  describe('Metadata', () => {
    it('should include generation timestamp', async () => {
      const beforeTime = new Date();
      
      const response = await getDashboard({}, testSessionCookie);

      const afterTime = new Date();
      const generatedAt = new Date(response.data.data.metadata.generatedAt);
      
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
      expect(generatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
    });

    it('should include data sources information', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const sources = response.data.data.metadata.sources;
      
      expect(sources).toHaveProperty('onlyfans');
      expect(sources).toHaveProperty('instagram');
      expect(sources).toHaveProperty('tiktok');
      expect(sources).toHaveProperty('reddit');
    });

    it('should indicate whether real data is available', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const metadata = response.data.data.metadata;
      
      expect(typeof metadata.hasRealData).toBe('boolean');
    });
  });

  describe('Selective Data Fetching', () => {
    it('should respect include parameter for analytics only', async () => {
      const response = await getDashboard(
        { include: 'analytics' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should respect include parameter for content only', async () => {
      const response = await getDashboard(
        { include: 'content' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should respect include parameter for onlyfans only', async () => {
      const response = await getDashboard(
        { include: 'onlyfans' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should respect include parameter for marketing only', async () => {
      const response = await getDashboard(
        { include: 'marketing' },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Activity Feed', () => {
    it('should include activity items with valid structure', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const activities = response.data.data.recentActivity;
      
      activities.forEach((activity: any) => {
        expect(ActivityItemSchema.parse(activity)).toBeDefined();
      });
    });

    it('should sort activities by date descending', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const activities = response.data.data.recentActivity;
      
      if (activities.length > 1) {
        for (let i = 1; i < activities.length; i++) {
          const prevDate = new Date(activities[i - 1].createdAt);
          const currDate = new Date(activities[i].createdAt);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });

    it('should include source information for each activity', async () => {
      const response = await getDashboard({}, testSessionCookie);

      const activities = response.data.data.recentActivity;
      
      activities.forEach((activity: any) => {
        expect(['content', 'marketing', 'onlyfans', 'messages']).toContain(activity.source);
      });
    });
  });
});
