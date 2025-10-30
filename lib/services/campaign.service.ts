import { PrismaClient } from '@prisma/client';
import { ContentGenerationService, getContentGenerationService } from './content-generation-service';
import { CloudWatchMetricsService } from './cloudwatch-metrics.service';

// Publishing Service (stub for now)
class PublishingService {
  async publishToPlatform(platform: string, content: any) {
    return {
      success: true,
      postId: `${platform}_${Date.now()}`
    };
  }
}

// Types and Interfaces
export interface CreateCampaignParams {
  userId: string;
  name: string;
  description?: string;
  type: 'ppv' | 'subscription' | 'promotion' | 'engagement' | 'retention';
  platforms: ('onlyfans' | 'instagram' | 'tiktok' | 'reddit')[];
  content: Record<string, any>;
  mediaUrls?: string[];
  scheduledFor?: Date;
  budget?: number;
  goals?: Record<string, any>;
  segmentIds?: string[];
  templateId?: string;
}

export interface UpdateCampaignParams {
  name?: string;
  description?: string;
  content?: Record<string, any>;
  mediaUrls?: string[];
  scheduledFor?: Date;
  budget?: number;
  goals?: Record<string, any>;
  segmentIds?: string[];
  status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface CampaignFilters {
  status?: string;
  type?: string;
  platform?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export interface PaginatedCampaigns {
  campaigns: any[];
  total: number;
  hasMore: boolean;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description?: string;
  niche: string;
  type: string;
  content: Record<string, any>;
  defaultSettings: Record<string, any>;
  usageCount: number;
  avgPerformance?: number;
}

export interface Variant {
  name: string;
  content: Record<string, any>;
  isControl?: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  status: string;
  trafficSplit: Record<string, number>;
  variants: Variant[];
  winnerId?: string;
  significance?: number;
}

export interface CampaignLaunchResult {
  success: boolean;
  campaignId: string;
  platformResults: Array<{
    platform: string;
    success: boolean;
    postId?: string;
    error?: string;
  }>;
}

export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Service for managing marketing campaigns
 * Handles CRUD operations, templates, A/B testing, and multi-platform publishing
 */
export class CampaignService {
  constructor(
    private prisma: PrismaClient,
    private contentService: ContentGenerationService,
    private publishingService: PublishingService,
    private metrics: CloudWatchMetricsService
  ) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new campaign
   */
  async createCampaign(params: CreateCampaignParams) {
    try {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId }
      });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Validate platforms
      const validPlatforms = ['onlyfans', 'instagram', 'tiktok', 'reddit'];
      const invalidPlatforms = params.platforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        throw new Error(`Invalid platforms: ${invalidPlatforms.join(', ')}`);
      }

      // Create campaign
      const campaign = await this.prisma.campaign.create({
        data: {
          userId: params.userId,
          name: params.name,
          description: params.description,
          type: params.type,
          status: params.scheduledFor ? 'scheduled' : 'draft',
          platforms: params.platforms,
          content: params.content,
          mediaUrls: params.mediaUrls || [],
          scheduledFor: params.scheduledFor,
          budget: params.budget,
          goals: params.goals || {},
          segmentIds: params.segmentIds || [],
          templateId: params.templateId,
        },
        include: {
          user: true,
          metrics: true,
        }
      });

      // Track metrics
      await this.metrics.putMetric(
        'CampaignsCreated',
        1,
        {
          Type: params.type,
          UserId: params.userId
        },
        'Count'
      );

      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Get a campaign by ID
   */
  async getCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
        include: {
          user: true,
          metrics: {
            orderBy: { recordedAt: 'desc' },
            take: 10
          },
          abTest: {
            include: {
              variants: true
            }
          }
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error getting campaign:', error);
      throw error;
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignParams) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          user: true,
          metrics: true
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Delete a campaign (soft delete)
   */
  async deleteCampaign(id: string) {
    try {
      await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * List campaigns with filters and pagination
   */
  async listCampaigns(filters: CampaignFilters): Promise<PaginatedCampaigns> {
    try {
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.platform) {
        where.platforms = {
          has: filters.platform
        };
      }
      
      if (filters.dateRange) {
        where.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        };
      }

      const [campaigns, total] = await Promise.all([
        this.prisma.campaign.findMany({
          where,
          include: {
            user: true,
            metrics: {
              take: 1,
              orderBy: { recordedAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 20,
          skip: filters.offset || 0
        }),
        this.prisma.campaign.count({ where })
      ]);

      return {
        campaigns,
        total,
        hasMore: (filters.offset || 0) + campaigns.length < total
      };
    } catch (error) {
      console.error('Error listing campaigns:', error);
      throw error;
    }
  }

  // ============================================
  // TEMPLATE MANAGEMENT (Task 2.2)
  // ============================================

  /**
   * Get campaign templates by niche
   * Supports filtering by niche (fitness, gaming, adult, fashion)
   */
  async getTemplates(niche?: string): Promise<CampaignTemplate[]> {
    try {
      const where = niche ? { niche } : {};
      
      const templates = await this.prisma.campaignTemplate.findMany({
        where,
        orderBy: [
          { avgPerformance: 'desc' },
          { usageCount: 'desc' }
        ]
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Create campaign from template with customization
   * Merges template content with user customizations
   */
  async createFromTemplate(templateId: string, customization: any) {
    try {
      const template = await this.prisma.campaignTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Merge template content with customization
      const content = {
        ...template.content,
        ...customization.content
      };

      const campaignData = {
        ...template.defaultSettings,
        ...customization,
        content,
        templateId: template.id,
        name: customization.name || template.name
      };

      const campaign = await this.createCampaign(campaignData);

      // Update template usage
      await this.prisma.campaignTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error creating campaign from template:', error);
      throw error;
    }
  }

  /**
   * Save campaign as template for reuse
   * Calculates average performance from campaign metrics
   */
  async saveAsTemplate(campaignId: string, name: string, niche?: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          user: true,
          metrics: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Calculate average performance
      const avgPerformance = campaign.metrics.length > 0
        ? campaign.metrics.reduce((sum: number, m: any) => sum + (m.roi || 0), 0) / campaign.metrics.length
        : 0;

      const template = await this.prisma.campaignTemplate.create({
        data: {
          name,
          description: campaign.description,
          niche: niche || 'general',
          type: campaign.type,
          content: campaign.content,
          defaultSettings: {
            platforms: campaign.platforms,
            budget: campaign.budget,
            goals: campaign.goals
          },
          avgPerformance
        }
      });

      return template;
    } catch (error) {
      console.error('Error saving campaign as template:', error);
      throw error;
    }
  }

  /**
   * Initialize pre-built templates for different niches
   * Creates templates for fitness, gaming, adult, and fashion
   */
  async initializeDefaultTemplates() {
    try {
      const templates = [
        // Fitness Templates
        {
          name: 'Fitness Transformation Challenge',
          description: 'Engage followers with a 30-day transformation challenge',
          niche: 'fitness',
          type: 'engagement',
          content: {
            message: '🔥 Join my 30-Day Transformation Challenge! Get exclusive workout plans, meal prep guides, and daily motivation. Limited spots available!',
            hashtags: ['#FitnessChallenge', '#TransformationTuesday', '#FitLife', '#WorkoutMotivation'],
            cta: 'Subscribe now for exclusive access',
            mediaType: 'video'
          },
          defaultSettings: {
            platforms: ['instagram', 'tiktok', 'onlyfans'],
            budget: 500,
            goals: {
              subscribers: 100,
              engagement: 1000
            }
          }
        },
        {
          name: 'Fitness PPV Content Drop',
          description: 'Premium workout video series for PPV',
          niche: 'fitness',
          type: 'ppv',
          content: {
            message: '💪 NEW: Advanced HIIT Training Series! 5 exclusive videos with detailed form breakdowns. Unlock now for $19.99',
            hashtags: ['#HIITWorkout', '#FitnessContent', '#WorkoutVideos'],
            cta: 'Unlock exclusive content',
            mediaType: 'video',
            price: 19.99
          },
          defaultSettings: {
            platforms: ['onlyfans'],
            budget: 200,
            goals: {
              sales: 50,
              revenue: 1000
            }
          }
        },
        // Gaming Templates
        {
          name: 'Gaming Stream Announcement',
          description: 'Promote upcoming gaming streams and exclusive content',
          niche: 'gaming',
          type: 'engagement',
          content: {
            message: '🎮 LIVE TONIGHT at 8PM! Playing [Game Name] with exclusive behind-the-scenes content. Subscribers get early access + special perks!',
            hashtags: ['#GamingStream', '#LiveGaming', '#GamerLife', '#TwitchStreamer'],
            cta: 'Subscribe for exclusive access',
            mediaType: 'image'
          },
          defaultSettings: {
            platforms: ['instagram', 'tiktok', 'reddit'],
            budget: 300,
            goals: {
              subscribers: 75,
              engagement: 500
            }
          }
        },
        {
          name: 'Gaming PPV Tournament',
          description: 'Exclusive tournament footage and commentary',
          niche: 'gaming',
          type: 'ppv',
          content: {
            message: '🏆 EXCLUSIVE: Full tournament VOD + pro commentary! Watch my championship run with insider tips. $14.99 for 3+ hours of content',
            hashtags: ['#GamingTournament', '#ProGamer', '#ExclusiveContent'],
            cta: 'Unlock tournament footage',
            mediaType: 'video',
            price: 14.99
          },
          defaultSettings: {
            platforms: ['onlyfans'],
            budget: 150,
            goals: {
              sales: 40,
              revenue: 600
            }
          }
        },
        // Adult Content Templates
        {
          name: 'Adult Subscription Promo',
          description: 'Limited-time subscription discount campaign',
          niche: 'adult',
          type: 'subscription',
          content: {
            message: '🔥 LIMITED TIME: 50% OFF subscription! Get instant access to 500+ exclusive photos & videos. Offer ends in 48 hours!',
            hashtags: ['#OnlyFans', '#ExclusiveContent', '#Subscribe'],
            cta: 'Subscribe now - 50% OFF',
            mediaType: 'image'
          },
          defaultSettings: {
            platforms: ['instagram', 'reddit', 'onlyfans'],
            budget: 1000,
            goals: {
              subscribers: 200,
              revenue: 2000
            }
          }
        },
        {
          name: 'Adult PPV Premium Set',
          description: 'High-value PPV content bundle',
          niche: 'adult',
          type: 'ppv',
          content: {
            message: '💎 NEW PREMIUM SET: 50 exclusive photos + 10min video. Professional photoshoot content. $29.99 - Available for 24 hours only!',
            hashtags: ['#ExclusiveContent', '#PremiumContent', '#PPV'],
            cta: 'Unlock premium content',
            mediaType: 'image',
            price: 29.99
          },
          defaultSettings: {
            platforms: ['onlyfans'],
            budget: 500,
            goals: {
              sales: 100,
              revenue: 3000
            }
          }
        },
        {
          name: 'Adult Re-engagement Campaign',
          description: 'Win back inactive subscribers',
          niche: 'adult',
          type: 'retention',
          content: {
            message: '💕 I miss you! Come back and get a FREE exclusive set + 20% off your next PPV purchase. Limited to first 50 returning subscribers!',
            hashtags: ['#ComeBack', '#ExclusiveOffer', '#Subscribers'],
            cta: 'Claim your welcome back gift',
            mediaType: 'image'
          },
          defaultSettings: {
            platforms: ['onlyfans'],
            budget: 300,
            goals: {
              reactivations: 50,
              revenue: 500
            }
          }
        },
        // Fashion Templates
        {
          name: 'Fashion Lookbook Launch',
          description: 'Seasonal lookbook and styling tips',
          niche: 'fashion',
          type: 'engagement',
          content: {
            message: '✨ NEW FALL LOOKBOOK! 20+ outfit ideas, styling tips, and exclusive shopping links. Subscribe for full access + personal styling advice!',
            hashtags: ['#FashionLookbook', '#StyleInspo', '#FallFashion', '#OOTD'],
            cta: 'Get the full lookbook',
            mediaType: 'image'
          },
          defaultSettings: {
            platforms: ['instagram', 'tiktok', 'onlyfans'],
            budget: 400,
            goals: {
              subscribers: 80,
              engagement: 800
            }
          }
        },
        {
          name: 'Fashion Haul PPV',
          description: 'Exclusive fashion haul and try-on content',
          niche: 'fashion',
          type: 'ppv',
          content: {
            message: '👗 EXCLUSIVE HAUL: $2000 fashion haul + try-on video! See everything up close with honest reviews. $12.99 for 30min of content',
            hashtags: ['#FashionHaul', '#TryOn', '#FashionContent'],
            cta: 'Watch the full haul',
            mediaType: 'video',
            price: 12.99
          },
          defaultSettings: {
            platforms: ['onlyfans'],
            budget: 250,
            goals: {
              sales: 60,
              revenue: 780
            }
          }
        },
        {
          name: 'Fashion Brand Collab',
          description: 'Promote brand collaboration and exclusive discount',
          niche: 'fashion',
          type: 'promotion',
          content: {
            message: '🎉 BRAND COLLAB ALERT! Partnered with [Brand] for exclusive content + 20% discount code for subscribers. Limited time offer!',
            hashtags: ['#BrandCollab', '#FashionPartner', '#ExclusiveDiscount'],
            cta: 'Get your discount code',
            mediaType: 'image'
          },
          defaultSettings: {
            platforms: ['instagram', 'tiktok', 'onlyfans'],
            budget: 600,
            goals: {
              subscribers: 120,
              conversions: 80
            }
          }
        }
      ];

      const createdTemplates = [];
      for (const template of templates) {
        // Check if template already exists
        const existing = await this.prisma.campaignTemplate.findFirst({
          where: {
            name: template.name,
            niche: template.niche
          }
        });

        if (!existing) {
          const created = await this.prisma.campaignTemplate.create({
            data: {
              ...template,
              usageCount: 0,
              avgPerformance: 0
            }
          });
          createdTemplates.push(created);
        }
      }

      return createdTemplates;
    } catch (error) {
      console.error('Error initializing default templates:', error);
      throw error;
    }
  }

  // ============================================
  // CAMPAIGN LIFECYCLE
  // ============================================

  /**
   * Schedule a campaign
   */
  async scheduleCampaign(id: string, scheduledFor: Date) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          scheduledFor,
          status: 'scheduled',
          updatedAt: new Date()
        },
        include: {
          user: true
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      throw error;
    }
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(id: string): Promise<CampaignLaunchResult> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new Error('Campaign cannot be launched from current status');
      }

      // Update campaign status
      await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'active',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Publish to platforms
      const platformResults = await this.publishToPlatforms(id, campaign.platforms as any);

      // Track metrics
      await this.metrics.putMetric(
        'CampaignsLaunched',
        1,
        {
          Type: campaign.type,
          UserId: campaign.userId
        },
        'Count'
      );

      return {
        success: true,
        campaignId: id,
        platformResults
      };
    } catch (error) {
      console.error('Error launching campaign:', error);
      throw error;
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'paused',
          updatedAt: new Date()
        },
        include: {
          user: true
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  /**
   * Resume a campaign
   */
  async resumeCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'active',
          updatedAt: new Date()
        },
        include: {
          user: true
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: true,
          metrics: true
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error completing campaign:', error);
      throw error;
    }
  }

  // ============================================
  // A/B TESTING
  // ============================================

  /**
   * Create A/B test for campaign
   */
  async createABTest(campaignId: string, variants: Variant[]): Promise<ABTest> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (variants.length < 2 || variants.length > 5) {
        throw new Error('A/B test must have 2-5 variants');
      }

      // Calculate traffic split
      const splitPercentage = Math.floor(100 / variants.length);
      const trafficSplit: Record<string, number> = {};
      variants.forEach((variant, index) => {
        trafficSplit[`variant${index}`] = splitPercentage;
      });

      // Create A/B test
      const abTest = await this.prisma.aBTest.create({
        data: {
          userId: campaign.userId,
          name: `${campaign.name} A/B Test`,
          status: 'running',
          trafficSplit,
          minSampleSize: 100,
          confidenceLevel: 0.95
        },
        include: {
          variants: true
        }
      });

      // Create variants
      const createdVariants = await Promise.all(
        variants.map((variant, index) => 
          this.prisma.aBTestVariant.create({
            data: {
              testId: abTest.id,
              name: variant.name,
              isControl: variant.isControl || index === 0,
              content: variant.content
            }
          })
        )
      );

      // Update campaign
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          isABTest: true,
          abTestId: abTest.id
        }
      });

      return {
        ...abTest,
        variants: createdVariants
      };
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Track variant performance
   */
  async trackVariantPerformance(variantId: string, metrics: any) {
    try {
      await this.prisma.aBTestVariant.update({
        where: { id: variantId },
        data: {
          impressions: { increment: metrics.impressions || 0 },
          clicks: { increment: metrics.clicks || 0 },
          conversions: { increment: metrics.conversions || 0 },
          revenue: { increment: metrics.revenue || 0 }
        }
      });
    } catch (error) {
      console.error('Error tracking variant performance:', error);
      throw error;
    }
  }

  /**
   * Determine A/B test winner
   */
  async determineWinner(testId: string) {
    try {
      const abTest = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true
        }
      });

      if (!abTest) {
        throw new Error('A/B test not found');
      }

      // Check if we have enough data
      const totalImpressions = abTest.variants.reduce((sum: number, v: any) => sum + v.impressions, 0);
      if (totalImpressions < abTest.minSampleSize) {
        return null; // Not enough data yet
      }

      // Calculate conversion rates
      const variantStats = abTest.variants.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        conversionRate: variant.impressions > 0 ? variant.conversions / variant.impressions : 0,
        impressions: variant.impressions,
        conversions: variant.conversions
      }));

      // Find best performing variant
      const winner = variantStats.reduce((best: any, current: any) => 
        current.conversionRate > best.conversionRate ? current : best
      );

      // Calculate statistical significance (simplified Z-test)
      const control = variantStats.find((v: any) => v.id !== winner.id);
      if (control) {
        const p1 = winner.conversionRate;
        const p2 = control.conversionRate;
        const n1 = winner.impressions;
        const n2 = control.impressions;
        
        const pooledP = (winner.conversions + control.conversions) / (n1 + n2);
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
        const z = Math.abs(p1 - p2) / se;
        const significance = 1 - (2 * (1 - this.normalCDF(z)));

        if (significance >= abTest.confidenceLevel) {
          // Update test with winner
          await this.prisma.aBTest.update({
            where: { id: testId },
            data: {
              winnerId: winner.id,
              significance,
              status: 'completed',
              completedAt: new Date()
            }
          });

          return winner;
        }
      }

      return null; // No significant winner yet
    } catch (error) {
      console.error('Error determining A/B test winner:', error);
      throw error;
    }
  }

  /**
   * Apply winning variant
   */
  async applyWinner(testId: string) {
    try {
      const abTest = await this.prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          campaigns: true
        }
      });

      if (!abTest || !abTest.winnerId) {
        throw new Error('No winner determined for this test');
      }

      const winningVariant = abTest.variants.find((v: any) => v.id === abTest.winnerId);
      if (!winningVariant) {
        throw new Error('Winning variant not found');
      }

      // Update all campaigns in this test with winning content
      await Promise.all(
        abTest.campaigns.map((campaign: any) => 
          this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              content: winningVariant.content,
              updatedAt: new Date()
            }
          })
        )
      );

      return { success: true, winningVariant };
    } catch (error) {
      console.error('Error applying A/B test winner:', error);
      throw error;
    }
  }

  // ============================================
  // DUPLICATION
  // ============================================

  /**
   * Duplicate a campaign
   */
  async duplicateCampaign(id: string, modifications?: Partial<CreateCampaignParams>) {
    try {
      const originalCampaign = await this.prisma.campaign.findUnique({
        where: { id }
      });

      if (!originalCampaign) {
        throw new Error('Campaign not found');
      }

      const duplicateData: CreateCampaignParams = {
        userId: originalCampaign.userId,
        name: `${originalCampaign.name} (Copy)`,
        description: originalCampaign.description || undefined,
        type: originalCampaign.type as any,
        platforms: originalCampaign.platforms as any,
        content: originalCampaign.content,
        mediaUrls: originalCampaign.mediaUrls,
        budget: originalCampaign.budget || undefined,
        goals: originalCampaign.goals,
        segmentIds: originalCampaign.segmentIds,
        ...modifications
      };

      return await this.createCampaign(duplicateData);
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      throw error;
    }
  }

  // ============================================
  // MULTI-PLATFORM PUBLISHING
  // ============================================

  /**
   * Publish campaign to multiple platforms
   */
  async publishToPlatforms(campaignId: string, platforms: string[]): Promise<PublishResult[]> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const results: PublishResult[] = [];

      for (const platform of platforms) {
        try {
          // Adapt content for platform
          const adaptedContent = this.adaptContentForPlatform(campaign.content, platform);
          
          // Publish to platform
          const result = await this.publishingService.publishToPlatform(platform, adaptedContent);

          results.push({
            platform,
            success: result.success,
            postId: result.postId
          });
        } catch (error) {
          results.push({
            platform,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error publishing to platforms:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Adapt content for specific platform
   */
  private adaptContentForPlatform(content: any, platform: string) {
    const adaptations: Record<string, any> = {
      instagram: {
        maxCaptionLength: 2200,
        maxHashtags: 30,
        requiresImage: true
      },
      tiktok: {
        maxCaptionLength: 150,
        maxHashtags: 100,
        requiresVideo: true
      },
      reddit: {
        maxTitleLength: 300,
        allowsMarkdown: true
      },
      onlyfans: {
        maxCaptionLength: 1000,
        allowsPPV: true
      }
    };

    const platformRules = adaptations[platform] || {};
    const adapted = { ...content };

    // Apply platform-specific adaptations
    if (platformRules.maxCaptionLength && adapted.caption) {
      adapted.caption = adapted.caption.substring(0, platformRules.maxCaptionLength);
    }

    if (platformRules.maxHashtags && adapted.hashtags) {
      adapted.hashtags = adapted.hashtags.slice(0, platformRules.maxHashtags);
    }

    return adapted;
  }

  /**
   * Normal CDF approximation for statistical calculations
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

// Singleton instance
let campaignService: CampaignService | null = null;

export function getCampaignService(): CampaignService {
  if (!campaignService) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const contentService = getContentGenerationService();
    const publishingService = new PublishingService();
    const metrics = new CloudWatchMetricsService();
    
    campaignService = new CampaignService(prisma, contentService, publishingService, metrics);
  }
  return campaignService;
}
