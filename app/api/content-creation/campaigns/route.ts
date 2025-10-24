import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { PPVCampaignSchema, PaginatedResponseSchema } from '@/src/lib/api/schemas';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';

// Campaign query schema
const CampaignQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['active', 'paused', 'completed', 'draft']).optional(),
  sortBy: z.enum(['createdAt', 'launchDate', 'revenue', 'openRate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Create campaign schema
const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  targetAudience: z.object({
    segments: z.array(z.enum(['vip', 'new_subscribers', 'inactive', 'high_spenders'])),
    minSpent: z.number().min(0).optional(),
    lastActiveWithin: z.number().optional(), // days
    excludeRecent: z.boolean().default(false)
  }),
  content: z.array(z.string()), // media asset IDs
  pricing: z.object({
    basePrice: z.number().min(0),
    discountTiers: z.array(z.object({
      threshold: z.number(),
      discount: z.number().min(0).max(100)
    })).default([])
  }),
  schedule: z.object({
    launchDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    timezone: z.string().default('UTC')
  }),
  settings: z.object({
    autoResend: z.boolean().default(false),
    resendDelay: z.number().min(1).max(168).default(24), // hours
    maxResends: z.number().min(0).max(5).default(1)
  }).default({})
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedQuery = CampaignQuerySchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid query parameters', 400, {
        errors: validatedQuery.error.errors
      });
    }

    const { page, limit, status, sortBy, sortOrder } = validatedQuery.data;

    // Mock campaigns data
    const mockCampaigns = [
      {
        id: '1',
        name: 'Weekend Special PPV',
        description: 'Exclusive weekend content for VIP subscribers',
        launchDate: new Date('2024-01-26T18:00:00Z'),
        targetAudience: {
          segments: ['vip', 'high_spenders'],
          minSpent: 100,
          estimatedReach: 245
        },
        status: 'active' as const,
        metrics: {
          sent: 245,
          opened: 189,
          purchased: 67,
          openRate: 77.1,
          purchaseRate: 27.3,
          revenue: 1675.00,
          roi: 234.5,
          conversions: 67
        },
        content: [
          {
            id: '1',
            title: 'Exclusive Beach Set',
            type: 'photo',
            thumbnailUrl: '/mockups/beach-set-thumb.jpg'
          },
          {
            id: '2',
            title: 'Behind Scenes Video',
            type: 'video',
            thumbnailUrl: '/mockups/bts-video-thumb.jpg'
          }
        ],
        pricing: {
          basePrice: 25.00,
          finalPrice: 25.00
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-26')
      },
      {
        id: '2',
        name: 'New Subscriber Welcome',
        description: 'Welcome package for new subscribers',
        launchDate: new Date('2024-01-15T12:00:00Z'),
        targetAudience: {
          segments: ['new_subscribers'],
          estimatedReach: 89
        },
        status: 'completed' as const,
        metrics: {
          sent: 89,
          opened: 76,
          purchased: 34,
          openRate: 85.4,
          purchaseRate: 38.2,
          revenue: 510.00,
          roi: 156.8,
          conversions: 34
        },
        content: [
          {
            id: '3',
            title: 'Welcome Message',
            type: 'photo',
            thumbnailUrl: '/mockups/welcome-thumb.jpg'
          }
        ],
        pricing: {
          basePrice: 15.00,
          finalPrice: 15.00
        },
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        name: 'Valentine\'s Day Special',
        description: 'Romantic themed content for Valentine\'s Day',
        launchDate: new Date('2024-02-14T20:00:00Z'),
        targetAudience: {
          segments: ['vip', 'high_spenders', 'inactive'],
          minSpent: 50,
          estimatedReach: 156
        },
        status: 'draft' as const,
        metrics: {
          sent: 0,
          opened: 0,
          purchased: 0,
          openRate: 0,
          purchaseRate: 0,
          revenue: 0,
          roi: 0,
          conversions: 0
        },
        content: [
          {
            id: '4',
            title: 'Valentine\'s Lingerie Set',
            type: 'photo',
            thumbnailUrl: '/mockups/valentine-thumb.jpg'
          }
        ],
        pricing: {
          basePrice: 30.00,
          finalPrice: 30.00
        },
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      }
    ];

    // Apply filters
    let filteredCampaigns = mockCampaigns;
    
    if (status) {
      filteredCampaigns = filteredCampaigns.filter(campaign => campaign.status === status);
    }

    // Apply sorting
    filteredCampaigns.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'launchDate':
          aValue = a.launchDate;
          bValue = b.launchDate;
          break;
        case 'revenue':
          aValue = a.metrics.revenue;
          bValue = b.metrics.revenue;
          break;
        case 'openRate':
          aValue = a.metrics.openRate;
          bValue = b.metrics.openRate;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = filteredCampaigns.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

    // Add AI insights for active campaigns
    const campaignsWithInsights = paginatedCampaigns.map(campaign => ({
      ...campaign,
      aiInsights: campaign.status === 'active' ? [
        {
          type: 'pricing_optimization',
          confidence: 87,
          recommendation: 'Consider increasing price to $30 based on high engagement',
          estimatedImpact: '+15% revenue'
        },
        {
          type: 'timing_optimization',
          confidence: 92,
          recommendation: 'Send follow-up at 8 PM for 23% higher conversion',
          estimatedImpact: '+23% conversions'
        }
      ] : []
    }));

    return Response.json({
      success: true,
      data: {
        items: campaignsWithInsights,
        pagination: {
          page,
          limit,
          total,
          hasNext: endIndex < total,
          hasPrev: page > 1
        }
      },
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = CreateCampaignSchema.safeParse(body);

    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid campaign data', 400, {
        errors: validatedData.error.errors
      });
    }

    const campaignData = validatedData.data;

    // Validate content assets exist
    // Mock validation - replace with actual database checks
    const assetsExist = true;
    if (!assetsExist) {
      return jsonError('NOT_FOUND', 'One or more content assets not found', 404);
    }

    // Calculate estimated reach based on audience segments
    const estimatedReach = 150; // Mock calculation

    // Create campaign
    const newCampaign = {
      id: crypto.randomUUID(),
      name: campaignData.name,
      description: campaignData.description,
      launchDate: new Date(campaignData.schedule.launchDate),
      endDate: campaignData.schedule.endDate ? new Date(campaignData.schedule.endDate) : undefined,
      targetAudience: {
        ...campaignData.targetAudience,
        estimatedReach
      },
      status: 'draft' as const,
      metrics: {
        sent: 0,
        opened: 0,
        purchased: 0,
        openRate: 0,
        purchaseRate: 0,
        revenue: 0,
        roi: 0,
        conversions: 0
      },
      content: campaignData.content,
      pricing: campaignData.pricing,
      settings: campaignData.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return Response.json({
      success: true,
      data: newCampaign,
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}