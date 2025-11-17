/**
 * Marketing Service - Unit Tests
 * 
 * Tests core campaign management logic
 * Requirements: 7.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketingService } from '@/lib/api/services/marketing.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('MarketingService', () => {
  let service: MarketingService;
  const mockUserId = 123;

  beforeEach(() => {
    service = new MarketingService();
    vi.clearAllMocks();
  });

  describe('listCampaigns', () => {
    it('should list campaigns with pagination', async () => {
      const mockCampaigns = [
        {
          id: '1',
          userId: mockUserId,
          name: 'Test Campaign',
          status: 'active',
          channel: 'email',
          goal: 'engagement',
          audienceSegment: 'all',
          audienceSize: 100,
          message: {},
          stats: { sent: 10, opened: 5, clicked: 2, converted: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.marketingCampaign.findMany).mockResolvedValue(
        mockCampaigns as any
      );
      vi.mocked(prisma.marketingCampaign.count).mockResolvedValue(1);

      const result = await service.listCampaigns({
        userId: mockUserId,
        limit: 10,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.items[0].stats.openRate).toBe(50); // 5/10 * 100
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.marketingCampaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.marketingCampaign.count).mockResolvedValue(0);

      await service.listCampaigns({
        userId: mockUserId,
        status: 'active',
      });

      expect(prisma.marketingCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should validate limit bounds', async () => {
      await expect(
        service.listCampaigns({
          userId: mockUserId,
          limit: 0,
        })
      ).rejects.toThrow('Limit must be between 1 and 100');
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with valid data', async () => {
      const mockCampaign = {
        id: '1',
        userId: mockUserId,
        name: 'New Campaign',
        status: 'draft',
        channel: 'email',
        goal: 'engagement',
        audienceSegment: 'all',
        audienceSize: 100,
        message: { subject: 'Test' },
        stats: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.marketingCampaign.create).mockResolvedValue(
        mockCampaign as any
      );

      const result = await service.createCampaign(mockUserId, {
        name: 'New Campaign',
        status: 'draft',
        channel: 'email',
        goal: 'engagement',
        audienceSegment: 'all',
        audienceSize: 100,
        message: { subject: 'Test' },
      });

      expect(result.name).toBe('New Campaign');
      expect(result.stats.sent).toBe(0);
    });

    it('should reject empty name', async () => {
      await expect(
        service.createCampaign(mockUserId, {
          name: '',
          status: 'draft',
          channel: 'email',
          goal: 'engagement',
          audienceSegment: 'all',
          audienceSize: 100,
          message: {},
        })
      ).rejects.toThrow('Campaign name is required');
    });

    it('should reject negative audience size', async () => {
      await expect(
        service.createCampaign(mockUserId, {
          name: 'Test',
          status: 'draft',
          channel: 'email',
          goal: 'engagement',
          audienceSegment: 'all',
          audienceSize: -1,
          message: {},
        })
      ).rejects.toThrow('Audience size must be non-negative');
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign with ownership verification', async () => {
      const mockCampaign = {
        id: '1',
        userId: mockUserId,
        name: 'Original',
        status: 'draft',
        stats: {},
      };

      vi.mocked(prisma.marketingCampaign.findFirst).mockResolvedValue(
        mockCampaign as any
      );
      vi.mocked(prisma.marketingCampaign.update).mockResolvedValue({
        ...mockCampaign,
        name: 'Updated',
      } as any);

      const result = await service.updateCampaign(mockUserId, '1', {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('should reject update for non-existent campaign', async () => {
      vi.mocked(prisma.marketingCampaign.findFirst).mockResolvedValue(null);

      await expect(
        service.updateCampaign(mockUserId, 'non-existent', { name: 'Updated' })
      ).rejects.toThrow('Campaign not found or access denied');
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign with ownership verification', async () => {
      const mockCampaign = {
        id: '1',
        userId: mockUserId,
        stats: {},
      };

      vi.mocked(prisma.marketingCampaign.findFirst).mockResolvedValue(
        mockCampaign as any
      );
      vi.mocked(prisma.marketingCampaign.delete).mockResolvedValue(
        mockCampaign as any
      );

      await service.deleteCampaign(mockUserId, '1');

      expect(prisma.marketingCampaign.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should reject delete for non-existent campaign', async () => {
      vi.mocked(prisma.marketingCampaign.findFirst).mockResolvedValue(null);

      await expect(
        service.deleteCampaign(mockUserId, 'non-existent')
      ).rejects.toThrow('Campaign not found or access denied');
    });
  });

  describe('campaign statistics', () => {
    it('should calculate rates correctly', async () => {
      const mockCampaign = {
        id: '1',
        userId: mockUserId,
        stats: { sent: 100, opened: 50, clicked: 25, converted: 10 },
      };

      vi.mocked(prisma.marketingCampaign.findFirst).mockResolvedValue(
        mockCampaign as any
      );

      const result = await service.getCampaign(mockUserId, '1');

      expect(result?.stats.openRate).toBe(50); // 50/100 * 100
      expect(result?.stats.clickRate).toBe(50); // 25/50 * 100
      expect(result?.stats.conversionRate).toBe(10); // 10/100 * 100
    });

    it('should handle zero values', async () => {
      const mockCampaign = {
        id: '1',
        userId: mockUserId,
        stats: { sent: 0, opened: 0, clicked: 0, converted: 0 },
      };

      vi.mocked(prisma.marketingCampaign.findFirst).mockResolvedValue(
        mockCampaign as any
      );

      const result = await service.getCampaign(mockUserId, '1');

      expect(result?.stats.openRate).toBe(0);
      expect(result?.stats.clickRate).toBe(0);
      expect(result?.stats.conversionRate).toBe(0);
    });
  });
});
