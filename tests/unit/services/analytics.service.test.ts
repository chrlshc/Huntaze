/**
 * Analytics Service - Unit Tests
 * 
 * Tests core analytics calculations and metrics
 * Requirements: 7.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '@/lib/api/services/analytics.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const mockUserId = 123;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should calculate metrics correctly', async () => {
      // Mock current month revenue
      vi.mocked(prisma.transaction.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 1000 } } as any)
        .mockResolvedValueOnce({ _sum: { amount: 800 } } as any);

      // Mock active subscribers
      vi.mocked(prisma.subscription.count)
        .mockResolvedValueOnce(10) // Active subscribers
        .mockResolvedValueOnce(8) // Start of month count
        .mockResolvedValueOnce(1); // Churned count

      const result = await service.getOverview(mockUserId);

      expect(result.totalRevenue).toBe(1000);
      expect(result.activeSubscribers).toBe(10);
      expect(result.arpu).toBe(100); // 1000 / 10
      expect(result.ltv).toBe(1200); // 100 * 12
      expect(result.momGrowth).toBe(25); // (1000 - 800) / 800 * 100
    });

    it('should handle zero subscribers', async () => {
      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
        _sum: { amount: 1000 },
      } as any);
      vi.mocked(prisma.subscription.count).mockResolvedValue(0);

      const result = await service.getOverview(mockUserId);

      expect(result.arpu).toBe(0);
      expect(result.ltv).toBe(0);
    });

    it('should handle zero revenue', async () => {
      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
      } as any);
      vi.mocked(prisma.subscription.count).mockResolvedValue(5);

      const result = await service.getOverview(mockUserId);

      expect(result.totalRevenue).toBe(0);
      expect(result.arpu).toBe(0);
    });
  });

  describe('getTrends', () => {
    it('should return revenue trends', async () => {
      const mockTransactions = [
        { amount: 100, createdAt: new Date('2024-01-01') },
        { amount: 200, createdAt: new Date('2024-01-02') },
      ];

      vi.mocked(prisma.transaction.findMany).mockResolvedValue(
        mockTransactions as any
      );

      const result = await service.getTrends(mockUserId, 'revenue', 'day', 7);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return subscriber trends', async () => {
      const mockSubscriptions = [
        { startedAt: new Date('2024-01-01') },
        { startedAt: new Date('2024-01-02') },
      ];

      vi.mocked(prisma.subscription.findMany).mockResolvedValue(
        mockSubscriptions as any
      );

      const result = await service.getTrends(
        mockUserId,
        'subscribers',
        'day',
        7
      );

      expect(result).toBeInstanceOf(Array);
    });

    it('should throw error for unknown metric', async () => {
      await expect(
        service.getTrends(mockUserId, 'unknown', 'day', 7)
      ).rejects.toThrow('Unknown metric: unknown');
    });
  });

  describe('churn rate calculation', () => {
    it('should calculate churn rate correctly', async () => {
      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
        _sum: { amount: 1000 },
      } as any);

      vi.mocked(prisma.subscription.count)
        .mockResolvedValueOnce(10) // Active subscribers
        .mockResolvedValueOnce(20) // Start of month
        .mockResolvedValueOnce(5); // Churned

      const result = await service.getOverview(mockUserId);

      expect(result.churnRate).toBe(25); // 5 / 20 * 100
    });

    it('should handle zero starting subscribers', async () => {
      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
        _sum: { amount: 0 },
      } as any);

      vi.mocked(prisma.subscription.count)
        .mockResolvedValueOnce(0) // Active
        .mockResolvedValueOnce(0) // Start of month
        .mockResolvedValueOnce(0); // Churned

      const result = await service.getOverview(mockUserId);

      expect(result.churnRate).toBe(0);
    });
  });
});
