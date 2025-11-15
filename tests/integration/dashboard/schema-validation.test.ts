/**
 * Dashboard API Schema Validation Tests
 * 
 * Tests using Zod for strict schema validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { GET } from '../../../app/api/dashboard/route';
import { setupDashboardTests, createNextRequest, parseResponse } from './setup';
import { mockUserId } from './fixtures';

setupDashboardTests();

// Zod Schemas
const TrendDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().min(0),
});

const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['content_published', 'campaign_sent', 'fan_subscribed', 'message_received']),
  title: z.string(),
  createdAt: z.string().datetime(),
  source: z.enum(['content', 'marketing', 'onlyfans', 'messages']),
  meta: z.record(z.any()).optional(),
});

const QuickActionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  icon: z.string().min(1),
  href: z.string().startsWith('/'),
});

const DashboardSummarySchema = z.object({
  totalRevenue: z.object({
    value: z.number().min(0),
    currency: z.string().length(3),
    change: z.number(),
  }),
  activeFans: z.object({
    value: z.number().int().min(0),
    change: z.number(),
  }),
  messages: z.object({
    total: z.number().int().min(0),
    unread: z.number().int().min(0),
  }),
  engagement: z.object({
    value: z.number().min(0).max(100),
    change: z.number(),
  }),
});

const DashboardResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    summary: DashboardSummarySchema,
    trends: z.object({
      revenue: z.array(TrendDataSchema),
      fans: z.array(TrendDataSchema),
    }),
    recentActivity: z.array(ActivityItemSchema),
    quickActions: z.array(QuickActionSchema).min(1),
  }),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

setupDashboardTests();

describe('Dashboard API Schema Validation', () => {
  describe('Success Response Schema', () => {
    it('should validate complete dashboard response schema', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      
      const result = DashboardResponseSchema.safeParse(data);
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      expect(result.success).toBe(true);
    });

    it('should validate summary schema', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      const result = DashboardSummarySchema.safeParse(data.data.summary);
      expect(result.success).toBe(true);
    });

    it('should validate trend data schema', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      data.data.trends.revenue.forEach((trend: any) => {
        const result = TrendDataSchema.safeParse(trend);
        expect(result.success).toBe(true);
      });

      data.data.trends.fans.forEach((trend: any) => {
        const result = TrendDataSchema.safeParse(trend);
        expect(result.success).toBe(true);
      });
    });

    it('should validate activity items schema', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      data.data.recentActivity.forEach((activity: any) => {
        const result = ActivityItemSchema.safeParse(activity);
        if (!result.success) {
          console.error('Activity validation error:', result.error.errors);
        }
        expect(result.success).toBe(true);
      });
    });

    it('should validate quick actions schema', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      data.data.quickActions.forEach((action: any) => {
        const result = QuickActionSchema.safeParse(action);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Response Schema', () => {
    it('should validate error response schema', async () => {
      const request = createNextRequest('/api/dashboard');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      
      const result = ErrorResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Data Type Validation', () => {
    it('should ensure revenue value is a positive number', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.summary.totalRevenue.value).toBeGreaterThanOrEqual(0);
      expect(typeof data.data.summary.totalRevenue.value).toBe('number');
    });

    it('should ensure currency is a 3-letter code', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.summary.totalRevenue.currency).toHaveLength(3);
      expect(data.data.summary.totalRevenue.currency).toMatch(/^[A-Z]{3}$/);
    });

    it('should ensure fan count is a non-negative integer', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.summary.activeFans.value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(data.data.summary.activeFans.value)).toBe(true);
    });

    it('should ensure engagement rate is between 0 and 100', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.summary.engagement.value).toBeGreaterThanOrEqual(0);
      expect(data.data.summary.engagement.value).toBeLessThanOrEqual(100);
    });

    it('should ensure unread messages <= total messages', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.summary.messages.unread).toBeLessThanOrEqual(
        data.data.summary.messages.total
      );
    });

    it('should ensure trend dates are in ISO format', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      data.data.trends.revenue.forEach((trend: any) => {
        expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(trend.date).toString()).not.toBe('Invalid Date');
      });
    });

    it('should ensure activity timestamps are valid ISO datetimes', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      data.data.recentActivity.forEach((activity: any) => {
        expect(new Date(activity.createdAt).toString()).not.toBe('Invalid Date');
      });
    });

    it('should ensure quick action hrefs start with /', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      data.data.quickActions.forEach((action: any) => {
        expect(action.href).toMatch(/^\//);
      });
    });
  });

  describe('Array Length Validation', () => {
    it('should have at least one quick action', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.quickActions.length).toBeGreaterThan(0);
    });

    it('should limit recent activity to 10 items', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.recentActivity.length).toBeLessThanOrEqual(10);
    });

    it('should have correct trend data length for 7d range', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { range: '7d' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.trends.revenue).toHaveLength(7);
      expect(data.data.trends.fans).toHaveLength(7);
    });

    it('should have correct trend data length for 30d range', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { range: '30d' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.trends.revenue).toHaveLength(30);
      expect(data.data.trends.fans).toHaveLength(30);
    });

    it('should have correct trend data length for 90d range', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
        searchParams: { range: '90d' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(data.data.trends.revenue).toHaveLength(90);
      expect(data.data.trends.fans).toHaveLength(90);
    });
  });

  describe('Enum Validation', () => {
    it('should validate activity type enum', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      const validTypes = ['content_published', 'campaign_sent', 'fan_subscribed', 'message_received'];
      
      data.data.recentActivity.forEach((activity: any) => {
        expect(validTypes).toContain(activity.type);
      });
    });

    it('should validate activity source enum', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      const validSources = ['content', 'marketing', 'onlyfans', 'messages'];
      
      data.data.recentActivity.forEach((activity: any) => {
        expect(validSources).toContain(activity.source);
      });
    });
  });

  describe('Sorting Validation', () => {
    it('should sort recent activity by date descending', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      const activities = data.data.recentActivity;
      
      for (let i = 1; i < activities.length; i++) {
        const prevDate = new Date(activities[i - 1].createdAt);
        const currDate = new Date(activities[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    it('should sort trend data by date ascending', async () => {
      const request = createNextRequest('/api/dashboard', {
        userId: mockUserId,
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      const revenueTrends = data.data.trends.revenue;
      
      for (let i = 1; i < revenueTrends.length; i++) {
        const prevDate = new Date(revenueTrends[i - 1].date);
        const currDate = new Date(revenueTrends[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });
  });
});
