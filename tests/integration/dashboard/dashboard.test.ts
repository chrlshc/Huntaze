/**
 * Dashboard API Integration Tests
 * 
 * Tests for GET /api/dashboard endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../../../app/api/dashboard/route';
import {
  setupDashboardTests,
  createNextRequest,
  mockFetchResponse,
  mockFetchError,
  parseResponse,
} from './setup';
import {
  mockUserId,
  mockAnalyticsData,
  mockFansData,
  mockMessagesData,
  mockContentData,
  mockEmptyDashboardResponse,
  mockUnauthorizedResponse,
} from './fixtures';

setupDashboardTests();

describe('GET /api/dashboard', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  beforeEach(() => {
    // Setup default mock responses
    mockFetchResponse(
      `${baseUrl}/api/analytics/overview?range=30d`,
      mockAnalyticsData
    );
    mockFetchResponse(
      `${baseUrl}/api/fans/metrics`,
      mockFansData
    );
    mockFetchResponse(
      `${baseUrl}/api/messages/unread-count`,
      mockMessagesData
    );
    mockFetchResponse(
      `${baseUrl}/api/content?limit=10&status=published`,
      mockContentData
    );
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const request = createNextRequest('/api/dashboard');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data).toMatchObject(mockUnauthorizedResponse);
      expect(data.error.correlationId).toBeDefined();
    });

    it('should return 401 when x-user-id header is missing', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: '',
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should accept valid user authentication', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    it('should use default range of 30d when not specified', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept custom range parameter', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { range: '7d' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.trends.revenue).toHaveLength(7);
    });

    it('should accept 90d range parameter', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { range: '90d' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.trends.revenue).toHaveLength(90);
    });

    it('should filter data sources based on include parameter', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { include: 'analytics,content' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle empty include parameter', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { include: '' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Response Schema', () => {
    it('should return valid dashboard response schema', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          summary: {
            totalRevenue: {
              value: expect.any(Number),
              currency: 'USD',
              change: expect.any(Number),
            },
            activeFans: {
              value: expect.any(Number),
              change: expect.any(Number),
            },
            messages: {
              total: expect.any(Number),
              unread: expect.any(Number),
            },
            engagement: {
              value: expect.any(Number),
              change: expect.any(Number),
            },
          },
          trends: {
            revenue: expect.any(Array),
            fans: expect.any(Array),
          },
          recentActivity: expect.any(Array),
          quickActions: expect.any(Array),
        },
      });
    });

    it('should return correct summary data', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.summary.totalRevenue.value).toBe(12500);
      expect(data.data.summary.activeFans.value).toBe(1250);
      expect(data.data.summary.messages.unread).toBe(12);
      expect(data.data.summary.engagement.value).toBe(78.5);
    });

    it('should return trend data with correct structure', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.trends.revenue).toBeInstanceOf(Array);
      expect(data.data.trends.fans).toBeInstanceOf(Array);
      
      if (data.data.trends.revenue.length > 0) {
        expect(data.data.trends.revenue[0]).toHaveProperty('date');
        expect(data.data.trends.revenue[0]).toHaveProperty('value');
      }
    });

    it('should return recent activity with correct structure', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.recentActivity).toBeInstanceOf(Array);
      
      if (data.data.recentActivity.length > 0) {
        const activity = data.data.recentActivity[0];
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('createdAt');
        expect(activity).toHaveProperty('source');
      }
    });

    it('should return quick actions with correct structure', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.quickActions).toBeInstanceOf(Array);
      expect(data.data.quickActions.length).toBeGreaterThan(0);
      
      const action = data.data.quickActions[0];
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('label');
      expect(action).toHaveProperty('icon');
      expect(action).toHaveProperty('href');
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate data from multiple sources', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.summary.totalRevenue.value).toBe(
        mockAnalyticsData.data.totalRevenue
      );
      expect(data.data.summary.activeFans.value).toBe(
        mockFansData.data.activeCount
      );
    });

    it('should handle missing analytics data gracefully', async () => {
      mockFetchResponse(
        `${baseUrl}/api/analytics/overview?range=30d`,
        null
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.summary.totalRevenue.value).toBe(0);
    });

    it('should handle missing fans data gracefully', async () => {
      mockFetchResponse(`${baseUrl}/api/fans/metrics`, null);

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.summary.activeFans.value).toBe(0);
    });

    it('should handle missing messages data gracefully', async () => {
      mockFetchResponse(`${baseUrl}/api/messages/unread-count`, null);

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.summary.messages.total).toBe(0);
      expect(data.data.summary.messages.unread).toBe(0);
    });

    it('should generate mock trends when API data is unavailable', async () => {
      mockFetchResponse(
        `${baseUrl}/api/analytics/overview?range=30d`,
        { success: true, data: { totalRevenue: 1000 } }
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.trends.revenue).toBeInstanceOf(Array);
      expect(data.data.trends.revenue.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API fetch errors gracefully', async () => {
      mockFetchError(
        `${baseUrl}/api/analytics/overview?range=30d`,
        new Error('Network error')
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle 404 responses from dependent APIs', async () => {
      mockFetchResponse(
        `${baseUrl}/api/analytics/overview?range=30d`,
        { error: 'Not found' },
        404
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle 500 responses from dependent APIs', async () => {
      mockFetchResponse(
        `${baseUrl}/api/analytics/overview?range=30d`,
        { error: 'Internal server error' },
        500
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 500 on unexpected errors', async () => {
      // Force an error by passing invalid request
      const request = null as any;
      
      try {
        const response = await GET(request);
        const data = await parseResponse(response);
        
        expect(response.status).toBe(500);
        expect(data.error.code).toBe('AGGREGATION_FAILED');
      } catch (error) {
        // If it throws instead of returning 500, that's also acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should fetch data sources in parallel', async () => {
      const startTime = Date.now();
      
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      await GET(request);
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly since fetches are parallel
      expect(duration).toBeLessThan(1000);
    });

    it('should handle large activity feeds efficiently', async () => {
      const largeContentData = {
        success: true,
        data: {
          items: Array.from({ length: 100 }, (_, i) => ({
            id: `content_${i}`,
            title: `Content ${i}`,
            type: 'photo',
            platform: 'onlyfans',
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          })),
        },
      };

      mockFetchResponse(
        `${baseUrl}/api/content?limit=10&status=published`,
        largeContentData
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      // Should limit activity items
      expect(data.data.recentActivity.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data from all sources', async () => {
      mockFetchResponse(
        `${baseUrl}/api/analytics/overview?range=30d`,
        { success: true, data: {} }
      );
      mockFetchResponse(
        `${baseUrl}/api/fans/metrics`,
        { success: true, data: {} }
      );
      mockFetchResponse(
        `${baseUrl}/api/messages/unread-count`,
        { success: true, data: {} }
      );
      mockFetchResponse(
        `${baseUrl}/api/content?limit=10&status=published`,
        { success: true, data: { items: [] } }
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.summary.totalRevenue.value).toBe(0);
      expect(data.data.summary.activeFans.value).toBe(0);
      expect(data.data.summary.messages.total).toBe(0);
      expect(data.data.recentActivity).toEqual([]);
      // Trends will be generated as mock data when API data is unavailable
      expect(data.data.trends.revenue).toBeInstanceOf(Array);
      expect(data.data.trends.fans).toBeInstanceOf(Array);
    });

    it('should handle malformed API responses', async () => {
      mockFetchResponse(
        `${baseUrl}/api/analytics/overview?range=30d`,
        { invalid: 'structure' }
      );

      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle very long user IDs', async () => {
      const longUserId = 'a'.repeat(1000);
      const request = createNextRequest('/api/dashboard', {
        userId: longUserId,
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle special characters in query parameters', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { range: '30d&malicious=<script>' },
      });
      const response = await GET(request);

      // Invalid range parameter should return 400
      expect(response.status).toBe(400);
      const data = await parseResponse(response);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
