/**
 * Unit Tests for Azure Cost Tracking Service
 * 
 * Feature: huntaze-ai-azure-migration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzureCostTrackingService,
  type UsageMetrics,
  type CostTrackingMetadata,
  type QuotaInfo,
} from '../../../lib/ai/azure/cost-tracking.service';

describe('AzureCostTrackingService', () => {
  let service: AzureCostTrackingService;

  beforeEach(() => {
    service = new AzureCostTrackingService();
  });

  describe('calculateCost', () => {
    it('should calculate cost for GPT-4 Turbo', () => {
      const cost = service.calculateCost({
        promptTokens: 1000,
        completionTokens: 500,
        model: 'gpt-4-turbo',
      });

      // 1000 * 0.01/1000 + 500 * 0.03/1000 = 0.01 + 0.015 = 0.025
      expect(cost).toBeCloseTo(0.025, 5);
    });

    it('should calculate cost for GPT-4', () => {
      const cost = service.calculateCost({
        promptTokens: 1000,
        completionTokens: 500,
        model: 'gpt-4',
      });

      // 1000 * 0.03/1000 + 500 * 0.06/1000 = 0.03 + 0.03 = 0.06
      expect(cost).toBeCloseTo(0.06, 5);
    });

    it('should calculate cost for GPT-3.5 Turbo', () => {
      const cost = service.calculateCost({
        promptTokens: 1000,
        completionTokens: 500,
        model: 'gpt-35-turbo',
      });

      // 1000 * 0.0005/1000 + 500 * 0.0015/1000 = 0.0005 + 0.00075 = 0.00125
      expect(cost).toBeCloseTo(0.00125, 5);
    });

    it('should calculate cost for embeddings', () => {
      const cost = service.calculateCost({
        promptTokens: 1000,
        completionTokens: 0,
        model: 'text-embedding-ada-002',
      });

      // 1000 * 0.0001/1000 = 0.0001
      expect(cost).toBeCloseTo(0.0001, 5);
    });

    it('should throw error for unknown model', () => {
      expect(() =>
        service.calculateCost({
          promptTokens: 1000,
          completionTokens: 500,
          model: 'unknown-model' as any,
        })
      ).toThrow('Unknown model for pricing');
    });
  });

  describe('logUsage', () => {
    it('should log usage without telemetry client', async () => {
      const usage: UsageMetrics = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        model: 'gpt-4-turbo',
        estimatedCost: 0.0025,
      };

      const metadata: CostTrackingMetadata = {
        accountId: 'test-account',
        operation: 'chat',
        correlationId: 'test-correlation',
        timestamp: new Date(),
      };

      await expect(service.logUsage(usage, metadata)).resolves.not.toThrow();
    });
  });

  describe('quota management', () => {
    it('should set and get quota', () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'pro',
        monthlyLimit: 100,
        currentUsage: 50,
        remainingQuota: 50,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const retrieved = service.getQuota('test-account');
      expect(retrieved).toEqual(quota);
    });

    it('should return null for non-existent quota', () => {
      const quota = service.getQuota('non-existent');
      expect(quota).toBeNull();
    });

    it('should check quota for account with no quota set', async () => {
      const check = await service.checkQuota('new-account');

      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(Infinity);
      expect(check.limit).toBe(Infinity);
    });

    it('should check quota for account under limit', async () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'starter',
        monthlyLimit: 100,
        currentUsage: 50,
        remainingQuota: 50,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const check = await service.checkQuota('test-account');

      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(50);
      expect(check.limit).toBe(100);
    });

    it('should check quota for account at limit', async () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'free',
        monthlyLimit: 10,
        currentUsage: 10,
        remainingQuota: 0,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const check = await service.checkQuota('test-account');

      expect(check.allowed).toBe(false);
      expect(check.remaining).toBe(0);
      expect(check.limit).toBe(10);
    });

    it('should check quota for account over limit', async () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'starter',
        monthlyLimit: 100,
        currentUsage: 120,
        remainingQuota: -20,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const check = await service.checkQuota('test-account');

      expect(check.allowed).toBe(false);
      expect(check.remaining).toBe(0);
    });

    it('should reset quota', () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'pro',
        monthlyLimit: 100,
        currentUsage: 75,
        remainingQuota: 25,
        resetDate: new Date('2024-12-01'),
      };

      service.setQuota(quota);
      service.resetQuota('test-account');

      const updated = service.getQuota('test-account');

      expect(updated?.currentUsage).toBe(0);
      expect(updated?.monthlyLimit).toBe(100);
      expect(updated?.resetDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('optimization recommendations', () => {
    it('should provide recommendations for high usage', async () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'starter',
        monthlyLimit: 100,
        currentUsage: 85,
        remainingQuota: 15,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const recommendations =
        await service.getOptimizationRecommendations('test-account');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.includes('upgrading'))).toBe(true);
    });

    it('should provide recommendations for medium usage', async () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'pro',
        monthlyLimit: 100,
        currentUsage: 60,
        remainingQuota: 40,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const recommendations =
        await service.getOptimizationRecommendations('test-account');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.includes('GPT-3.5'))).toBe(true);
    });

    it('should provide basic recommendations for low usage', async () => {
      const quota: QuotaInfo = {
        accountId: 'test-account',
        plan: 'enterprise',
        monthlyLimit: 1000,
        currentUsage: 100,
        remainingQuota: 900,
        resetDate: new Date('2025-01-01'),
      };

      service.setQuota(quota);

      const recommendations =
        await service.getOptimizationRecommendations('test-account');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.includes('caching'))).toBe(true);
    });

    it('should return empty array for non-existent account', async () => {
      const recommendations =
        await service.getOptimizationRecommendations('non-existent');

      expect(recommendations).toEqual([]);
    });
  });

  describe('cost aggregation', () => {
    it('should return aggregation structure', async () => {
      const aggregation = await service.aggregateCosts(
        'test-account',
        new Date('2024-12-01'),
        new Date('2024-12-31')
      );

      expect(aggregation).toHaveProperty('totalCost');
      expect(aggregation).toHaveProperty('totalTokens');
      expect(aggregation).toHaveProperty('requestCount');
      expect(aggregation).toHaveProperty('breakdown');
      expect(aggregation.breakdown).toHaveProperty('byModel');
      expect(aggregation.breakdown).toHaveProperty('byOperation');
      expect(aggregation.breakdown).toHaveProperty('byCreator');
    });
  });
});
