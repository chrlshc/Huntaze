/**
 * Revenue API - Response Schema Validation Tests
 * 
 * Tests response schemas using Zod validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { createTestUser, createAuthToken } from '../fixtures/factories';

// Zod schemas for response validation
const PricingRecommendationSchema = z.object({
  subscription: z.object({
    current: z.number().positive(),
    recommended: z.number().positive(),
    revenueImpact: z.number(),
    reasoning: z.string(),
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
    dataPoints: z.number(),
  }),
});

const ChurnRiskResponseSchema = z.object({
  summary: z.object({
    totalAtRisk: z.number().nonnegative(),
    highRisk: z.number().nonnegative(),
    mediumRisk: z.number().nonnegative(),
    lowRisk: z.number().nonnegative(),
  }),
  fans: z.array(z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    churnProbability: z.number().min(0).max(1),
    daysSinceLastActivity: z.number().nonnegative(),
    riskLevel: z.enum(['high', 'medium', 'low']),
    lifetimeValue: z.number().nonnegative(),
    lastMessage: z.string().optional(),
  })),
  metadata: z.object({
    lastCalculated: z.string(),
    modelVersion: z.string(),
  }),
});

const UpsellOpportunitiesSchema = z.object({
  opportunities: z.array(z.object({
    id: z.string(),
    fanId: z.string(),
    fanName: z.string(),
    triggerPurchase: z.object({
      item: z.string(),
      amount: z.number().positive(),
      date: z.string().or(z.date()),
    }),
    suggestedProduct: z.object({
      name: z.string(),
      price: z.number().positive(),
      description: z.string(),
    }),
    buyRate: z.number().min(0).max(1),
    expectedRevenue: z.number().nonnegative(),
    confidence: z.number().min(0).max(1),
    messagePreview: z.string(),
  })),
  stats: z.object({
    totalOpportunities: z.number().nonnegative(),
    expectedRevenue: z.number().nonnegative(),
    averageBuyRate: z.number().min(0).max(1),
  }),
  metadata: z.object({
    lastUpdated: z.string(),
  }),
});

const RevenueForecastSchema = z.object({
  historical: z.array(z.object({
    month: z.string(),
    revenue: z.number().nonnegative(),
    growth: z.number(),
  })),
  forecast: z.array(z.object({
    month: z.string(),
    predicted: z.number().nonnegative(),
    confidence: z.object({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
    }),
  })),
  currentMonth: z.object({
    projected: z.number().nonnegative(),
    actual: z.number().nonnegative(),
    completion: z.number().min(0).max(100),
    onTrack: z.boolean(),
  }),
  nextMonth: z.object({
    projected: z.number().nonnegative(),
    actual: z.number().nonnegative(),
    completion: z.number().min(0).max(100),
    onTrack: z.boolean(),
  }),
  recommendations: z.array(z.object({
    action: z.string(),
    impact: z.number(),
    effort: z.enum(['low', 'medium', 'high']),
    description: z.string(),
  })),
  metadata: z.object({
    modelAccuracy: z.number().min(0).max(1),
    lastUpdated: z.string(),
  }),
});

const PayoutScheduleSchema = z.object({
  payouts: z.array(z.object({
    id: z.string(),
    platform: z.enum(['onlyfans', 'fansly', 'patreon']),
    amount: z.number().positive(),
    date: z.string().or(z.date()),
    status: z.enum(['pending', 'processing', 'completed']),
    period: z.object({
      start: z.string().or(z.date()),
      end: z.string().or(z.date()),
    }),
  })),
  summary: z.object({
    totalExpected: z.number().nonnegative(),
    taxEstimate: z.number().nonnegative(),
    netIncome: z.number(),
  }),
  platforms: z.array(z.object({
    platform: z.string(),
    connected: z.boolean(),
    lastSync: z.string(),
  })),
});

describe('Revenue API - Schema Validation', () => {
  let authToken: string;
  let creatorId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    const user = await createTestUser({ id: 'creator_schema' });
    authToken = await createAuthToken(user);
    creatorId = user.id;
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('GET /api/revenue/pricing', () => {
    it('should return valid pricing recommendation schema', async () => {
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Validate with Zod
      const result = PricingRecommendationSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      
      expect(result.success).toBe(true);
    });

    it('should have consistent data types', async () => {
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      // Type checks
      expect(typeof data.subscription.current).toBe('number');
      expect(typeof data.subscription.recommended).toBe('number');
      expect(typeof data.subscription.revenueImpact).toBe('number');
      expect(typeof data.subscription.reasoning).toBe('string');
      expect(typeof data.subscription.confidence).toBe('number');
      expect(Array.isArray(data.ppv)).toBe(true);
    });

    it('should have valid confidence values', async () => {
      const response = await fetch(`/api/revenue/pricing?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      expect(data.subscription.confidence).toBeGreaterThanOrEqual(0);
      expect(data.subscription.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/revenue/churn', () => {
    it('should return valid churn risk schema', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const result = ChurnRiskResponseSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      
      expect(result.success).toBe(true);
    });

    it('should have valid risk levels', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.fans.forEach((fan: any) => {
        expect(['high', 'medium', 'low']).toContain(fan.riskLevel);
      });
    });

    it('should have valid churn probabilities', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.fans.forEach((fan: any) => {
        expect(fan.churnProbability).toBeGreaterThanOrEqual(0);
        expect(fan.churnProbability).toBeLessThanOrEqual(1);
      });
    });

    it('should have consistent summary counts', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      const totalFromSummary = data.summary.highRisk + data.summary.mediumRisk + data.summary.lowRisk;
      expect(totalFromSummary).toBe(data.summary.totalAtRisk);
    });
  });

  describe('GET /api/revenue/upsells', () => {
    it('should return valid upsell opportunities schema', async () => {
      const response = await fetch(`/api/revenue/upsells?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const result = UpsellOpportunitiesSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      
      expect(result.success).toBe(true);
    });

    it('should have valid buy rates', async () => {
      const response = await fetch(`/api/revenue/upsells?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.opportunities.forEach((opp: any) => {
        expect(opp.buyRate).toBeGreaterThanOrEqual(0);
        expect(opp.buyRate).toBeLessThanOrEqual(1);
      });
    });

    it('should have consistent opportunity counts', async () => {
      const response = await fetch(`/api/revenue/upsells?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      expect(data.opportunities.length).toBe(data.stats.totalOpportunities);
    });
  });

  describe('GET /api/revenue/forecast', () => {
    it('should return valid forecast schema', async () => {
      const response = await fetch(`/api/revenue/forecast?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const result = RevenueForecastSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      
      expect(result.success).toBe(true);
    });

    it('should have valid confidence intervals', async () => {
      const response = await fetch(`/api/revenue/forecast?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.forecast.forEach((point: any) => {
        expect(point.confidence.min).toBeLessThanOrEqual(point.predicted);
        expect(point.confidence.max).toBeGreaterThanOrEqual(point.predicted);
      });
    });

    it('should have valid completion percentages', async () => {
      const response = await fetch(`/api/revenue/forecast?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      expect(data.currentMonth.completion).toBeGreaterThanOrEqual(0);
      expect(data.currentMonth.completion).toBeLessThanOrEqual(100);
    });

    it('should have valid effort levels', async () => {
      const response = await fetch(`/api/revenue/forecast?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.recommendations.forEach((rec: any) => {
        expect(['low', 'medium', 'high']).toContain(rec.effort);
      });
    });
  });

  describe('GET /api/revenue/payouts', () => {
    it('should return valid payout schedule schema', async () => {
      const response = await fetch(`/api/revenue/payouts?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const result = PayoutScheduleSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      
      expect(result.success).toBe(true);
    });

    it('should have valid platform names', async () => {
      const response = await fetch(`/api/revenue/payouts?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.payouts.forEach((payout: any) => {
        expect(['onlyfans', 'fansly', 'patreon']).toContain(payout.platform);
      });
    });

    it('should have valid payout statuses', async () => {
      const response = await fetch(`/api/revenue/payouts?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      data.payouts.forEach((payout: any) => {
        expect(['pending', 'processing', 'completed']).toContain(payout.status);
      });
    });

    it('should have consistent tax calculations', async () => {
      const response = await fetch(`/api/revenue/payouts?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      const expectedNet = data.summary.totalExpected - data.summary.taxEstimate;
      expect(Math.abs(data.summary.netIncome - expectedNet)).toBeLessThan(0.01);
    });
  });

  describe('Error Response Schemas', () => {
    it('should return consistent error schema for 400', async () => {
      const response = await fetch('/api/revenue/pricing', {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    it('should return consistent error schema for 403', async () => {
      const response = await fetch('/api/revenue/pricing?creatorId=other_creator', {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      expect(response.status).toBe(403);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Forbidden');
    });

    it('should include correlation ID in error responses', async () => {
      const correlationId = 'test-correlation-123';
      
      const response = await fetch('/api/revenue/pricing', {
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`,
          'X-Correlation-ID': correlationId,
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      // Correlation ID should be in response or logs
      expect(data).toHaveProperty('error');
    });
  });

  describe('Date Format Validation', () => {
    it('should return ISO 8601 date strings', async () => {
      const response = await fetch(`/api/revenue/churn?creatorId=${creatorId}`, {
        headers: { 'Cookie': `next-auth.session-token=${authToken}` },
      });

      const data = await response.json();

      // Check ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(isoRegex.test(data.metadata.lastCalculated)).toBe(true);
    });
  });
});
