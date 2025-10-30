/**
 * Unit Tests - CampaignService
 * Tests for Campaign CRUD, Templates, A/B Testing, Lifecycle, and Multi-platform Publishing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CampaignService } from '../../../lib/services/campaign.service';

// Mock dependencies
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  campaign: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  campaignTemplate: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  aBTest: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  aBTestVariant: {
    create: vi.fn(),
    update: vi.fn(),
  },
};

const mockContentService = {
  generateContent: vi.fn(),
};

const mockPublishingService = {
  publishToPlatform: vi.fn(),
};

const mockMetrics = {
  putMetric: vi.fn(),
};

describe('CampaignService', () => {
  let campaignService: CampaignService;

  beforeEach(() => {
    vi.clearAllMocks();
    campaignService = new CampaignService(
      mockPrisma as any,
      mockContentService as any,
      mockPublishingService as any,
      mockMetrics as any
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================
  // CRUD OPERATIONS TESTS
  // ============================================

  describe('CRUD Operations', () => {
    describe('createCampaign', () => {
      it('should create a campaign with valid data', async () => {
        const mockUser = { id: 'user_123', email: 'test@example.com' };
        const mockCampaign = {
          id: 'camp_123',
          userId: 'user_123',
          name: 'Test Campaign',
          type: 'ppv',
          platforms: ['onlyfans'],
          content: { message: 'Test' },
          status: 'draft',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.campaign.create.mockResolvedValue(mockCampaign);

        const result = await campaignService.createCampaign({
          userId: 'user_123',
          name: 'Test Campaign',
          type: 'ppv',
          platforms: ['onlyfans'],
          content: { message: 'Test' },
        });

        expect(result).toEqual(mockCampaign);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user_123' },
        });
        expect(mockMetrics.putMetric).toHaveBeenCalledWith(
          'CampaignsCreated',
          1,
          expect.any(Object),
          'Count'
        );
      });

      it('should throw error if user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          campaignService.createCampaign({
            userId: 'invalid_user',
            name: 'Test',
            type: 'ppv',
            platforms: ['onlyfans'],
            content: {},
          })
        ).rejects.toThrow('User not found');
      });

      it('should throw error for invalid platforms', async () => {
        const mockUser = { id: 'user_123' };
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        await expect(
          campaignService.createCampaign({
            userId: 'user_123',
            name: 'Test',
            type: 'ppv',
            platforms: ['invalid_platform'] as any,
            content: {},
          })
        ).rejects.toThrow('Invalid platforms');
      });

      it('should set status to scheduled if scheduledFor is provided', async () => {
        const mockUser = { id: 'user_123' };
        const scheduledDate = new Date('2025-12-01');
        
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.campaign.create.mockResolvedValue({
          id: 'camp_123',
          status: 'scheduled',
        });

        await campaignService.createCampaign({
          userId: 'user_123',
          name: 'Test',
          type: 'ppv',
          platforms: ['onlyfans'],
          content: {},
          scheduledFor: scheduledDate,
        });

        expect(mockPrisma.campaign.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'scheduled',
              scheduledFor: scheduledDate,
            }),
          })
        );
      });
    });

    describe('getCampaign', () => {
      it('should retrieve campaign with relations', async () => {
        const mockCampaign = {
          id: 'camp_123',
          name: 'Test Campaign',
          user: { id: 'user_123' },
          metrics: [],
          abTest: null,
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

        const result = await campaignService.getCampaign('camp_123');

        expect(result).toEqual(mockCampaign);
        expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
          where: { id: 'camp_123' },
          include: expect.objectContaining({
            user: true,
            metrics: expect.any(Object),
            abTest: expect.any(Object),
          }),
        });
      });
    });

    describe('updateCampaign', () => {
      it('should update campaign fields', async () => {
        const mockUpdated = {
          id: 'camp_123',
          name: 'Updated Name',
          status: 'active',
        };

        mockPrisma.campaign.update.mockResolvedValue(mockUpdated);

        const result = await campaignService.updateCampaign('camp_123', {
          name: 'Updated Name',
          status: 'active',
        });

        expect(result).toEqual(mockUpdated);
        expect(mockPrisma.campaign.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'camp_123' },
            data: expect.objectContaining({
              name: 'Updated Name',
              status: 'active',
            }),
          })
        );
      });
    });

    describe('deleteCampaign', () => {
      it('should soft delete campaign by setting status to cancelled', async () => {
        mockPrisma.campaign.update.mockResolvedValue({ id: 'camp_123' });

        const result = await campaignService.deleteCampaign('camp_123');

        expect(result).toEqual({ success: true });
        expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'camp_123' },
          data: expect.objectContaining({
            status: 'cancelled',
          }),
        });
      });
    });

    describe('listCampaigns', () => {
      it('should list campaigns with pagination', async () => {
        const mockCampaigns = [
          { id: 'camp_1', name: 'Campaign 1' },
          { id: 'camp_2', name: 'Campaign 2' },
        ];

        mockPrisma.campaign.findMany.mockResolvedValue(mockCampaigns);
        mockPrisma.campaign.count.mockResolvedValue(10);

        const result = await campaignService.listCampaigns({
          limit: 2,
          offset: 0,
        });

        expect(result.campaigns).toEqual(mockCampaigns);
        expect(result.total).toBe(10);
        expect(result.hasMore).toBe(true);
      });

      it('should filter by status', async () => {
        mockPrisma.campaign.findMany.mockResolvedValue([]);
        mockPrisma.campaign.count.mockResolvedValue(0);

        await campaignService.listCampaigns({
          status: 'active',
        });

        expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'active',
            }),
          })
        );
      });

      it('should filter by platform', async () => {
        mockPrisma.campaign.findMany.mockResolvedValue([]);
        mockPrisma.campaign.count.mockResolvedValue(0);

        await campaignService.listCampaigns({
          platform: 'onlyfans',
        });

        expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              platforms: { has: 'onlyfans' },
            }),
          })
        );
      });
    });
  });

  // ============================================
  // TEMPLATE MANAGEMENT TESTS
  // ============================================

  describe('Template Management', () => {
    describe('getTemplates', () => {
      it('should retrieve all templates when no niche specified', async () => {
        const mockTemplates = [
          { id: 'tpl_1', name: 'Template 1', niche: 'fitness' },
          { id: 'tpl_2', name: 'Template 2', niche: 'gaming' },
        ];

        mockPrisma.campaignTemplate.findMany.mockResolvedValue(mockTemplates);

        const result = await campaignService.getTemplates();

        expect(result).toEqual(mockTemplates);
        expect(mockPrisma.campaignTemplate.findMany).toHaveBeenCalledWith({
          where: {},
          orderBy: [
            { avgPerformance: 'desc' },
            { usageCount: 'desc' },
          ],
        });
      });

      it('should filter templates by niche', async () => {
        const mockTemplates = [
          { id: 'tpl_1', name: 'Fitness Template', niche: 'fitness' },
        ];

        mockPrisma.campaignTemplate.findMany.mockResolvedValue(mockTemplates);

        const result = await campaignService.getTemplates('fitness');

        expect(result).toEqual(mockTemplates);
        expect(mockPrisma.campaignTemplate.findMany).toHaveBeenCalledWith({
          where: { niche: 'fitness' },
          orderBy: expect.any(Array),
        });
      });
    });

    describe('createFromTemplate', () => {
      it('should create campaign from template with customization', async () => {
        const mockTemplate = {
          id: 'tpl_123',
          name: 'Fitness Template',
          content: { message: 'Template message' },
          defaultSettings: {
            platforms: ['instagram'],
            budget: 500,
          },
        };

        const mockCampaign = {
          id: 'camp_123',
          name: 'My Fitness Campaign',
          templateId: 'tpl_123',
        };

        mockPrisma.campaignTemplate.findUnique.mockResolvedValue(mockTemplate);
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_123' });
        mockPrisma.campaign.create.mockResolvedValue(mockCampaign);
        mockPrisma.campaignTemplate.update.mockResolvedValue(mockTemplate);

        const result = await campaignService.createFromTemplate('tpl_123', {
          userId: 'user_123',
          name: 'My Fitness Campaign',
          content: { message: 'Custom message' },
        });

        expect(result.templateId).toBe('tpl_123');
        expect(mockPrisma.campaignTemplate.update).toHaveBeenCalledWith({
          where: { id: 'tpl_123' },
          data: {
            usageCount: { increment: 1 },
          },
        });
      });

      it('should throw error if template not found', async () => {
        mockPrisma.campaignTemplate.findUnique.mockResolvedValue(null);

        await expect(
          campaignService.createFromTemplate('invalid_tpl', {
            userId: 'user_123',
            name: 'Test',
          })
        ).rejects.toThrow('Template not found');
      });
    });

    describe('saveAsTemplate', () => {
      it('should save campaign as template', async () => {
        const mockCampaign = {
          id: 'camp_123',
          name: 'Great Campaign',
          description: 'Test description',
          type: 'ppv',
          content: { message: 'Test' },
          platforms: ['onlyfans'],
          budget: 1000,
          goals: { conversions: 100 },
          userId: 'user_123',
          metrics: [
            { roi: 2.5 },
            { roi: 3.0 },
          ],
        };

        const mockTemplate = {
          id: 'tpl_123',
          name: 'My Template',
          avgPerformance: 2.75,
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPrisma.campaignTemplate.create.mockResolvedValue(mockTemplate);

        const result = await campaignService.saveAsTemplate(
          'camp_123',
          'My Template',
          'fitness'
        );

        expect(result).toEqual(mockTemplate);
        expect(mockPrisma.campaignTemplate.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: 'My Template',
            niche: 'fitness',
            type: 'ppv',
            avgPerformance: 2.75,
          }),
        });
      });

      it('should calculate avgPerformance as 0 if no metrics', async () => {
        const mockCampaign = {
          id: 'camp_123',
          name: 'Campaign',
          type: 'ppv',
          content: {},
          userId: 'user_123',
          metrics: [],
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPrisma.campaignTemplate.create.mockResolvedValue({ id: 'tpl_123' });

        await campaignService.saveAsTemplate('camp_123', 'Template');

        expect(mockPrisma.campaignTemplate.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            avgPerformance: 0,
          }),
        });
      });
    });

    describe('initializeDefaultTemplates', () => {
      it('should create default templates if they do not exist', async () => {
        mockPrisma.campaignTemplate.findFirst.mockResolvedValue(null);
        mockPrisma.campaignTemplate.create.mockResolvedValue({ id: 'tpl_123' });

        const result = await campaignService.initializeDefaultTemplates();

        expect(result.length).toBeGreaterThan(0);
        expect(mockPrisma.campaignTemplate.create).toHaveBeenCalled();
      });

      it('should skip existing templates', async () => {
        mockPrisma.campaignTemplate.findFirst.mockResolvedValue({ id: 'existing' });

        const result = await campaignService.initializeDefaultTemplates();

        expect(result.length).toBe(0);
      });
    });
  });

  // ============================================
  // LIFECYCLE TESTS
  // ============================================

  describe('Campaign Lifecycle', () => {
    describe('scheduleCampaign', () => {
      it('should schedule campaign for future date', async () => {
        const scheduledDate = new Date('2025-12-01');
        const mockCampaign = {
          id: 'camp_123',
          status: 'scheduled',
          scheduledFor: scheduledDate,
        };

        mockPrisma.campaign.update.mockResolvedValue(mockCampaign);

        const result = await campaignService.scheduleCampaign('camp_123', scheduledDate);

        expect(result.status).toBe('scheduled');
        expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'camp_123' },
          data: expect.objectContaining({
            scheduledFor: scheduledDate,
            status: 'scheduled',
          }),
          include: { user: true },
        });
      });
    });

    describe('launchCampaign', () => {
      it('should launch campaign and publish to platforms', async () => {
        const mockCampaign = {
          id: 'camp_123',
          status: 'draft',
          type: 'ppv',
          userId: 'user_123',
          platforms: ['onlyfans', 'instagram'],
          content: { message: 'Test' },
          user: { id: 'user_123' },
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPrisma.campaign.update.mockResolvedValue({
          ...mockCampaign,
          status: 'active',
        });
        mockPublishingService.publishToPlatform.mockResolvedValue({
          success: true,
          postId: 'post_123',
        });

        const result = await campaignService.launchCampaign('camp_123');

        expect(result.success).toBe(true);
        expect(result.platformResults).toHaveLength(2);
        expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'camp_123' },
          data: expect.objectContaining({
            status: 'active',
          }),
        });
        expect(mockMetrics.putMetric).toHaveBeenCalledWith(
          'CampaignsLaunched',
          1,
          expect.any(Object),
          'Count'
        );
      });

      it('should throw error if campaign not found', async () => {
        mockPrisma.campaign.findUnique.mockResolvedValue(null);

        await expect(
          campaignService.launchCampaign('invalid_id')
        ).rejects.toThrow('Campaign not found');
      });

      it('should throw error if campaign status is invalid', async () => {
        mockPrisma.campaign.findUnique.mockResolvedValue({
          id: 'camp_123',
          status: 'completed',
        });

        await expect(
          campaignService.launchCampaign('camp_123')
        ).rejects.toThrow('Campaign cannot be launched from current status');
      });
    });

    describe('pauseCampaign', () => {
      it('should pause active campaign', async () => {
        const mockCampaign = {
          id: 'camp_123',
          status: 'paused',
        };

        mockPrisma.campaign.update.mockResolvedValue(mockCampaign);

        const result = await campaignService.pauseCampaign('camp_123');

        expect(result.status).toBe('paused');
      });
    });

    describe('resumeCampaign', () => {
      it('should resume paused campaign', async () => {
        const mockCampaign = {
          id: 'camp_123',
          status: 'active',
        };

        mockPrisma.campaign.update.mockResolvedValue(mockCampaign);

        const result = await campaignService.resumeCampaign('camp_123');

        expect(result.status).toBe('active');
      });
    });

    describe('completeCampaign', () => {
      it('should complete campaign with final metrics', async () => {
        const mockCampaign = {
          id: 'camp_123',
          status: 'completed',
          completedAt: expect.any(Date),
          metrics: [],
        };

        mockPrisma.campaign.update.mockResolvedValue(mockCampaign);

        const result = await campaignService.completeCampaign('camp_123');

        expect(result.status).toBe('completed');
        expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'camp_123' },
          data: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date),
          }),
          include: expect.any(Object),
        });
      });
    });
  });

  // ============================================
  // A/B TESTING TESTS
  // ============================================

  describe('A/B Testing', () => {
    describe('createABTest', () => {
      it('should create A/B test with variants', async () => {
        const mockCampaign = {
          id: 'camp_123',
          userId: 'user_123',
          name: 'Test Campaign',
        };

        const mockABTest = {
          id: 'test_123',
          name: 'Test Campaign A/B Test',
          status: 'running',
          trafficSplit: { variant0: 50, variant1: 50 },
          variants: [],
        };

        const mockVariants = [
          { id: 'var_1', name: 'Variant A', isControl: true },
          { id: 'var_2', name: 'Variant B', isControl: false },
        ];

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPrisma.aBTest.create.mockResolvedValue(mockABTest);
        mockPrisma.aBTestVariant.create.mockImplementation((data) =>
          Promise.resolve(mockVariants[0])
        );
        mockPrisma.campaign.update.mockResolvedValue({
          ...mockCampaign,
          isABTest: true,
        });

        const result = await campaignService.createABTest('camp_123', [
          { name: 'Variant A', content: { message: 'A' }, isControl: true },
          { name: 'Variant B', content: { message: 'B' } },
        ]);

        expect(result.status).toBe('running');
        expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'camp_123' },
          data: expect.objectContaining({
            isABTest: true,
          }),
        });
      });

      it('should throw error if less than 2 variants', async () => {
        mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'camp_123' });

        await expect(
          campaignService.createABTest('camp_123', [
            { name: 'Variant A', content: {} },
          ])
        ).rejects.toThrow('A/B test must have 2-5 variants');
      });

      it('should throw error if more than 5 variants', async () => {
        mockPrisma.campaign.findUnique.mockResolvedValue({ id: 'camp_123' });

        const variants = Array(6)
          .fill(null)
          .map((_, i) => ({ name: `Variant ${i}`, content: {} }));

        await expect(
          campaignService.createABTest('camp_123', variants)
        ).rejects.toThrow('A/B test must have 2-5 variants');
      });
    });

    describe('trackVariantPerformance', () => {
      it('should increment variant metrics', async () => {
        mockPrisma.aBTestVariant.update.mockResolvedValue({
          id: 'var_123',
          impressions: 100,
          clicks: 10,
        });

        await campaignService.trackVariantPerformance('var_123', {
          impressions: 50,
          clicks: 5,
          conversions: 2,
          revenue: 100,
        });

        expect(mockPrisma.aBTestVariant.update).toHaveBeenCalledWith({
          where: { id: 'var_123' },
          data: {
            impressions: { increment: 50 },
            clicks: { increment: 5 },
            conversions: { increment: 2 },
            revenue: { increment: 100 },
          },
        });
      });
    });

    describe('determineWinner', () => {
      it('should return null if not enough data', async () => {
        const mockABTest = {
          id: 'test_123',
          minSampleSize: 100,
          variants: [
            { id: 'var_1', impressions: 10, conversions: 1 },
            { id: 'var_2', impressions: 10, conversions: 2 },
          ],
        };

        mockPrisma.aBTest.findUnique.mockResolvedValue(mockABTest);

        const result = await campaignService.determineWinner('test_123');

        expect(result).toBeNull();
      });

      it('should determine winner with statistical significance', async () => {
        const mockABTest = {
          id: 'test_123',
          minSampleSize: 100,
          confidenceLevel: 0.95,
          variants: [
            {
              id: 'var_1',
              name: 'Control',
              impressions: 1000,
              conversions: 50,
            },
            {
              id: 'var_2',
              name: 'Variant B',
              impressions: 1000,
              conversions: 80,
            },
          ],
        };

        mockPrisma.aBTest.findUnique.mockResolvedValue(mockABTest);
        mockPrisma.aBTest.update.mockResolvedValue({
          ...mockABTest,
          winnerId: 'var_2',
        });

        const result = await campaignService.determineWinner('test_123');

        expect(result).toBeDefined();
        expect(result?.id).toBe('var_2');
      });
    });

    describe('applyWinner', () => {
      it('should apply winning variant to campaigns', async () => {
        const mockABTest = {
          id: 'test_123',
          winnerId: 'var_2',
          variants: [
            { id: 'var_1', content: { message: 'A' } },
            { id: 'var_2', content: { message: 'B' } },
          ],
          campaigns: [{ id: 'camp_1' }, { id: 'camp_2' }],
        };

        mockPrisma.aBTest.findUnique.mockResolvedValue(mockABTest);
        mockPrisma.campaign.update.mockResolvedValue({ id: 'camp_1' });

        const result = await campaignService.applyWinner('test_123');

        expect(result.success).toBe(true);
        expect(result.winningVariant.content.message).toBe('B');
        expect(mockPrisma.campaign.update).toHaveBeenCalledTimes(2);
      });

      it('should throw error if no winner determined', async () => {
        mockPrisma.aBTest.findUnique.mockResolvedValue({
          id: 'test_123',
          winnerId: null,
        });

        await expect(
          campaignService.applyWinner('test_123')
        ).rejects.toThrow('No winner determined for this test');
      });
    });
  });

  // ============================================
  // DUPLICATION TESTS
  // ============================================

  describe('Campaign Duplication', () => {
    describe('duplicateCampaign', () => {
      it('should duplicate campaign with all settings', async () => {
        const mockOriginal = {
          id: 'camp_123',
          userId: 'user_123',
          name: 'Original Campaign',
          description: 'Test description',
          type: 'ppv',
          platforms: ['onlyfans'],
          content: { message: 'Test' },
          mediaUrls: ['url1', 'url2'],
          budget: 1000,
          goals: { conversions: 100 },
          segmentIds: ['seg_1'],
        };

        const mockDuplicate = {
          ...mockOriginal,
          id: 'camp_456',
          name: 'Original Campaign (Copy)',
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockOriginal);
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_123' });
        mockPrisma.campaign.create.mockResolvedValue(mockDuplicate);

        const result = await campaignService.duplicateCampaign('camp_123');

        expect(result.name).toBe('Original Campaign (Copy)');
        expect(result.id).not.toBe(mockOriginal.id);
      });

      it('should allow modifications during duplication', async () => {
        const mockOriginal = {
          id: 'camp_123',
          userId: 'user_123',
          name: 'Original',
          type: 'ppv',
          platforms: ['onlyfans'],
          content: {},
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockOriginal);
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_123' });
        mockPrisma.campaign.create.mockResolvedValue({
          ...mockOriginal,
          name: 'Modified Copy',
          budget: 2000,
        });

        const result = await campaignService.duplicateCampaign('camp_123', {
          name: 'Modified Copy',
          budget: 2000,
        });

        expect(mockPrisma.campaign.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'Modified Copy',
              budget: 2000,
            }),
          })
        );
      });

      it('should throw error if original campaign not found', async () => {
        mockPrisma.campaign.findUnique.mockResolvedValue(null);

        await expect(
          campaignService.duplicateCampaign('invalid_id')
        ).rejects.toThrow('Campaign not found');
      });
    });
  });

  // ============================================
  // MULTI-PLATFORM PUBLISHING TESTS
  // ============================================

  describe('Multi-Platform Publishing', () => {
    describe('publishToPlatforms', () => {
      it('should publish to multiple platforms successfully', async () => {
        const mockCampaign = {
          id: 'camp_123',
          content: {
            message: 'Test message',
            hashtags: ['#test'],
          },
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPublishingService.publishToPlatform.mockResolvedValue({
          success: true,
          postId: 'post_123',
        });

        const result = await campaignService.publishToPlatforms('camp_123', [
          'onlyfans',
          'instagram',
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].success).toBe(true);
        expect(result[1].success).toBe(true);
        expect(mockPublishingService.publishToPlatform).toHaveBeenCalledTimes(2);
      });

      it('should handle platform-specific failures', async () => {
        const mockCampaign = {
          id: 'camp_123',
          content: { message: 'Test' },
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPublishingService.publishToPlatform
          .mockResolvedValueOnce({ success: true, postId: 'post_1' })
          .mockRejectedValueOnce(new Error('Platform error'));

        const result = await campaignService.publishToPlatforms('camp_123', [
          'onlyfans',
          'instagram',
        ]);

        expect(result[0].success).toBe(true);
        expect(result[1].success).toBe(false);
        expect(result[1].error).toBe('Platform error');
      });

      it('should adapt content for each platform', async () => {
        const mockCampaign = {
          id: 'camp_123',
          content: {
            caption: 'A'.repeat(3000), // Exceeds Instagram limit
            hashtags: Array(50).fill('#tag'), // Exceeds Instagram limit
          },
        };

        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPublishingService.publishToPlatform.mockResolvedValue({
          success: true,
          postId: 'post_123',
        });

        await campaignService.publishToPlatforms('camp_123', ['instagram']);

        const publishCall = mockPublishingService.publishToPlatform.mock.calls[0];
        const adaptedContent = publishCall[1];

        // Instagram has maxCaptionLength: 2200
        expect(adaptedContent.caption.length).toBeLessThanOrEqual(2200);
        // Instagram has maxHashtags: 30
        expect(adaptedContent.hashtags.length).toBeLessThanOrEqual(30);
      });
    });
  });
});
