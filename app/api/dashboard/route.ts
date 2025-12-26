/**
 * Dashboard API Route
 * 
 * Provides unified dashboard data from real integrations with:
 * - Retry logic with exponential backoff
 * - Timeout protection
 * - Type-safe responses
 * - Comprehensive error handling
 * - Correlation IDs for debugging
 * - Caching headers
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { IntegrationsService } from '@/lib/services/integrations/integrations.service';
import { fetchWithRetry } from '@/lib/utils/fetch-with-retry';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

interface DashboardSummary {
  totalRevenue: {
    value: number;
    currency: string;
    change: number;
  };
  activeFans: {
    value: number;
    change: number;
  };
  messages: {
    total: number;
    unread: number;
  };
  engagement: {
    value: number;
    change: number;
  };
}

interface TrendData {
  date: string;
  value: number;
}

interface ActivityItem {
  id: string;
  type: 'content_published' | 'campaign_sent' | 'fan_subscribed' | 'message_received';
  title: string;
  createdAt: string;
  source: 'content' | 'marketing' | 'onlyfans' | 'messages';
  meta?: Record<string, any>;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
}

interface ConnectedIntegrations {
  onlyfans: boolean;
  instagram: boolean;
  tiktok: boolean;
  reddit: boolean;
}

interface DashboardData {
  summary: DashboardSummary;
  trends: {
    revenue: TrendData[];
    fans: TrendData[];
  };
  recentActivity: ActivityItem[];
  quickActions: QuickAction[];
  connectedIntegrations: ConnectedIntegrations;
  metadata: {
    sources: ConnectedIntegrations;
    hasRealData: boolean;
    generatedAt: string;
  };
}

interface DashboardResponse {
  success: true;
  data: DashboardData;
  correlationId: string;
  duration: number;
}

interface DashboardErrorResponse {
  success: false;
  error: string;
  details?: string;
  correlationId: string;
  retryable: boolean;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const QueryParamsSchema = z.object({
  range: z.enum(['7d', '30d', '90d']).default('30d'),
  include: z.string().optional(),
});

// ============================================================================
// Configuration
// ============================================================================

const logger = createLogger('dashboard-api');
const integrationsService = new IntegrationsService();

const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
} as const;

const TIMEOUT_MS = 5000; // 5 seconds per request

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `dash-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Fetch data with retry and timeout protection
 */
async function fetchDashboardData(
  url: string,
  headers: HeadersInit,
  correlationId: string
): Promise<any> {
  try {
    const data = await fetchWithRetry(url, {
      method: 'GET',
      headers,
    });
    return data;
  } catch (error) {
    logger.warn('Dashboard data fetch failed', {
      url,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Build activity feed from various sources
 */
function buildActivityFeed(
  contentData: any,
  campaignsData: any
): ActivityItem[] {
  const activities: ActivityItem[] = [];

  try {
    // Add content activities
    if (contentData?.success && contentData?.data) {
      const items = Array.isArray(contentData.data) 
        ? contentData.data 
        : contentData.data.items || [];
      
      items.slice(0, 5).forEach((item: any) => {
        activities.push({
          id: `content-${item.id}`,
          type: 'content_published',
          title: `Published: ${item.title || 'Untitled'}`,
          createdAt: item.createdAt || new Date().toISOString(),
          source: 'content',
          meta: {
            platform: item.platform,
            type: item.type,
          },
        });
      });
    }

    // Add campaign activities
    if (campaignsData?.success && campaignsData?.data) {
      const campaigns = Array.isArray(campaignsData.data)
        ? campaignsData.data
        : campaignsData.data.items || [];

      campaigns
        .filter((c: any) => c.status === 'sent')
        .slice(0, 5)
        .forEach((campaign: any) => {
          activities.push({
            id: `campaign-${campaign.id}`,
            type: 'campaign_sent',
            title: `Campaign sent: ${campaign.name || 'Untitled'}`,
            createdAt: campaign.sentAt || campaign.createdAt || new Date().toISOString(),
            source: 'marketing',
            meta: {
              recipients: campaign.recipients,
              status: campaign.status,
            },
          });
        });
    }

    // Sort by date (most recent first)
    activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return activities.slice(0, 10);
  } catch (error) {
    logger.error('Error building activity feed', error as Error);
    return [];
  }
}

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * GET /api/dashboard
 * 
 * Aggregates dashboard data from multiple sources
 * 
 * Query Parameters:
 * - range: '7d' | '30d' | '90d' (default: '30d')
 * - include: comma-separated list of sources (default: all)
 * 
 * Response: DashboardResponse | DashboardErrorResponse
 * 
 * @example
 * GET /api/dashboard?range=30d&include=onlyfans,content,marketing
 */
export async function GET(request: NextRequest): Promise<NextResponse<DashboardResponse | DashboardErrorResponse>> {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    logger.info('Dashboard request received', {
      correlationId,
      url: request.url,
    });

    // Authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      logger.warn('Dashboard request unauthorized', { correlationId });
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          correlationId,
          retryable: false,
        },
        { status: 401 }
      );
    }

    const userId = parseInt(authResult.user.id);

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const validationResult = QueryParamsSchema.safeParse({
      range: searchParams.get('range') || '30d',
      include: searchParams.get('include'),
    });

    if (!validationResult.success) {
      logger.warn('Invalid query parameters', {
        correlationId,
        errors: validationResult.error.issues,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.issues[0]?.message,
          correlationId,
          retryable: false,
        },
        { status: 400 }
      );
    }

    const { range, include } = validationResult.data;
    const includeSources = include?.split(',') || ['analytics', 'content', 'onlyfans', 'marketing'];

    logger.info('Dashboard query parameters', {
      correlationId,
      userId,
      range,
      includeSources,
    });

    // Get connected integrations with error handling
    let integrations: any[] = [];
    let hasOnlyFans = false;
    let hasInstagram = false;
    let hasTikTok = false;
    let hasReddit = false;

    try {
      integrations = await integrationsService.getConnectedIntegrations(userId);
      hasOnlyFans = integrations.some(i => i.provider === 'onlyfans' && i.isConnected);
      hasInstagram = integrations.some(i => i.provider === 'instagram' && i.isConnected);
      hasTikTok = integrations.some(i => i.provider === 'tiktok' && i.isConnected);
      hasReddit = integrations.some(i => i.provider === 'reddit' && i.isConnected);

      logger.info('Integrations fetched', {
        correlationId,
        userId,
        hasOnlyFans,
        hasInstagram,
        hasTikTok,
        hasReddit,
      });
    } catch (error) {
      logger.error('Failed to fetch integrations', error as Error, {
        correlationId,
        userId,
      });
      // Continue with no integrations
    }

    // Initialize dashboard data
    const dashboardData: DashboardData = {
      summary: {
        totalRevenue: { value: 0, currency: 'USD', change: 0 },
        activeFans: { value: 0, change: 0 },
        messages: { total: 0, unread: 0 },
        engagement: { value: 0, change: 0 },
      },
      trends: {
        revenue: [],
        fans: [],
      },
      recentActivity: [],
      quickActions: [
        { id: 'create-content', label: 'Create Content', icon: 'plus', href: '/content/create' },
        { id: 'new-campaign', label: 'New Campaign', icon: 'campaign', href: '/marketing/campaigns/new' },
        { id: 'view-analytics', label: 'View Analytics', icon: 'chart', href: '/analytics' },
        { id: 'manage-billing', label: 'Manage Billing', icon: 'dollar', href: '/billing' },
      ],
      connectedIntegrations: {
        onlyfans: hasOnlyFans,
        instagram: hasInstagram,
        tiktok: hasTikTok,
        reddit: hasReddit,
      },
      metadata: {
        sources: {
          onlyfans: hasOnlyFans,
          instagram: hasInstagram,
          tiktok: hasTikTok,
          reddit: hasReddit,
        },
        hasRealData: hasOnlyFans || hasInstagram || hasTikTok || hasReddit,
        generatedAt: new Date().toISOString(),
      },
    };

    // Prepare request headers
    const requestHeaders: HeadersInit = {
      'Cookie': request.headers.get('cookie') || '',
      'x-correlation-id': correlationId,
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Fetch data from multiple sources in parallel
    logger.info('Fetching dashboard data', {
      correlationId,
      sources: includeSources,
    });

    const [ofData, contentData, campaignsData] = await Promise.allSettled([
      // OnlyFans data
      hasOnlyFans && includeSources.includes('onlyfans')
        ? fetchDashboardData(
            `${baseUrl}/api/onlyfans/stats`,
            requestHeaders,
            correlationId
          )
        : Promise.resolve(null),

      // Content data
      includeSources.includes('content')
        ? fetchDashboardData(
            `${baseUrl}/api/content?limit=5&status=published`,
            requestHeaders,
            correlationId
          )
        : Promise.resolve(null),

      // Marketing campaigns
      includeSources.includes('marketing')
        ? fetchDashboardData(
            `${baseUrl}/api/marketing/campaigns?limit=5`,
            requestHeaders,
            correlationId
          )
        : Promise.resolve(null),
    ]);

    // Process OnlyFans data
    if (ofData.status === 'fulfilled' && ofData.value) {
      const data = ofData.value;
      if (data.success && data.data) {
        dashboardData.summary.totalRevenue.value += data.data.earnings?.total || 0;
        dashboardData.summary.totalRevenue.change = data.data.earnings?.change || 0;
        dashboardData.summary.activeFans.value += data.data.stats?.subscribersCount || 0;
        dashboardData.summary.activeFans.change = data.data.stats?.subscribersChange || 0;
        dashboardData.summary.messages.total += data.data.messages?.total || 0;
        dashboardData.summary.messages.unread += data.data.messages?.unread || 0;

        logger.info('OnlyFans data processed', {
          correlationId,
          revenue: dashboardData.summary.totalRevenue.value,
          fans: dashboardData.summary.activeFans.value,
        });
      }
    } else if (ofData.status === 'rejected') {
      logger.warn('OnlyFans data fetch failed', {
        correlationId,
        error: ofData.reason,
      });
    }

    // Build activity feed from content and campaigns
    const contentResult = contentData.status === 'fulfilled' ? contentData.value : null;
    const campaignsResult = campaignsData.status === 'fulfilled' ? campaignsData.value : null;
    
    dashboardData.recentActivity = buildActivityFeed(contentResult, campaignsResult);

    logger.info('Activity feed built', {
      correlationId,
      activityCount: dashboardData.recentActivity.length,
    });

    // Calculate engagement rate
    if (dashboardData.summary.activeFans.value > 0) {
      dashboardData.summary.engagement.value = Math.round(
        (dashboardData.summary.messages.total / dashboardData.summary.activeFans.value) * 100
      ) / 100;
    }

    const duration = Date.now() - startTime;

    logger.info('Dashboard response prepared', {
      correlationId,
      duration,
      hasRealData: dashboardData.metadata.hasRealData,
    });

    return NextResponse.json<DashboardResponse>(
      {
        success: true,
        data: dashboardData,
        correlationId,
        duration,
      },
      {
        headers: CACHE_HEADERS,
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Dashboard API error', error as Error, {
      correlationId,
      duration,
    });

    return NextResponse.json<DashboardErrorResponse>(
      { 
        success: false, 
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
        retryable: true,
      },
      { 
        status: 500,
        headers: {
          'Retry-After': '60',
        },
      }
    );
  }
}
