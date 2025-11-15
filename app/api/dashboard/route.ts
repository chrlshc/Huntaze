/**
 * Dashboard API Route - Optimized
 * 
 * Aggregates data from multiple sources with:
 * - Retry logic with exponential backoff
 * - Timeout protection
 * - Error handling with correlation IDs
 * - Type-safe responses
 * - Comprehensive logging
 * - Caching headers
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TypeScript Types
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

interface DashboardResponse {
  summary: DashboardSummary;
  trends: {
    revenue: TrendData[];
    fans: TrendData[];
  };
  recentActivity: ActivityItem[];
  quickActions: QuickAction[];
}

interface DashboardError {
  code: string;
  message: string;
  correlationId?: string;
  retryable?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
} as const;

const TIMEOUT_MS = 5000; // 5 seconds per request

const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
} as const;

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
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout protection
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  correlationId: string
): Promise<any> {
  let lastError: Error | undefined;
  let delay = RETRY_CONFIG.initialDelay;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      console.log(`[Dashboard] Fetching ${url} (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`, {
        correlationId,
      });

      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          console.warn(`[Dashboard] Client error ${response.status} for ${url}`, {
            correlationId,
          });
          return null;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Dashboard] Successfully fetched ${url}`, {
        correlationId,
        attempt,
      });

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(`[Dashboard] Error fetching ${url} (attempt ${attempt}):`, {
        error: lastError.message,
        correlationId,
      });

      // Last attempt - don't retry
      if (attempt === RETRY_CONFIG.maxAttempts) {
        console.error(`[Dashboard] All retry attempts failed for ${url}`, {
          correlationId,
        });
        return null;
      }

      // Wait before retry with exponential backoff
      await sleep(delay);
      delay = Math.min(
        delay * RETRY_CONFIG.backoffFactor,
        RETRY_CONFIG.maxDelay
      ) as typeof RETRY_CONFIG.initialDelay;
    }
  }

  return null;
}

/**
 * Generate mock trend data for development
 */
function generateMockTrend(range: string, type: 'revenue' | 'fans'): TrendData[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const data: TrendData[] = [];
  const now = new Date();
  
  const baseValue = type === 'revenue' ? 400 : 1200;
  const variance = type === 'revenue' ? 100 : 50;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const trend = Math.sin((days - i) / days * Math.PI) * variance;
    const random = (Math.random() - 0.5) * variance * 0.3;
    const value = Math.round(baseValue + trend + random);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value),
    });
  }
  
  return data;
}

/**
 * Build activity feed from various sources
 */
function buildActivityFeed(contentData: any, messagesData: any): ActivityItem[] {
  const activities: ActivityItem[] = [];
  
  try {
    // Add content activities
    if (contentData?.data?.items) {
      contentData.data.items.slice(0, 5).forEach((item: any) => {
        activities.push({
          id: `content_${item.id}`,
          type: 'content_published',
          title: item.title || 'New content published',
          createdAt: item.publishedAt || item.createdAt,
          source: 'content',
          meta: {
            platform: item.platform,
            type: item.type,
          },
        });
      });
    }
    
    // Add message activities
    if (messagesData?.data?.recent) {
      messagesData.data.recent.slice(0, 3).forEach((msg: any) => {
        activities.push({
          id: `message_${msg.id}`,
          type: 'message_received',
          title: `New message from ${msg.from || 'fan'}`,
          createdAt: msg.createdAt,
          source: 'messages',
          meta: {
            unread: msg.unread,
          },
        });
      });
    }
    
    // Sort by date (most recent first)
    activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return activities.slice(0, 10);
  } catch (error) {
    console.error('[Dashboard] Error building activity feed:', error);
    return [];
  }
}

/**
 * Get quick actions based on user context
 */
function getQuickActions(): QuickAction[] {
  return [
    {
      id: 'create_content',
      label: 'Create Content',
      icon: 'plus',
      href: '/content/new',
    },
    {
      id: 'launch_campaign',
      label: 'Launch Campaign',
      icon: 'campaign',
      href: '/marketing/campaigns/new',
    },
    {
      id: 'check_analytics',
      label: 'View Analytics',
      icon: 'chart',
      href: '/analytics',
    },
    {
      id: 'manage_pricing',
      label: 'Optimize Pricing',
      icon: 'dollar',
      href: '/analytics/pricing',
    },
  ];
}

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * GET /api/dashboard
 * 
 * Aggregates data from multiple sources for the dashboard
 * 
 * Query Parameters:
 * - range: '7d' | '30d' | '90d' (default: '30d')
 * - include: comma-separated list of data sources (default: all)
 * 
 * Response: DashboardResponse
 * 
 * Features:
 * - Retry logic with exponential backoff (3 attempts)
 * - Timeout protection (5s per request)
 * - Parallel data fetching
 * - Graceful degradation on partial failures
 * - Correlation IDs for debugging
 * - Caching headers (60s cache, 120s stale-while-revalidate)
 */
export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    console.log('[Dashboard] Request received', {
      correlationId,
      url: request.url,
      timestamp: new Date().toISOString(),
    });

    // Authentication check
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.warn('[Dashboard] Unauthorized request', { correlationId });
      
      return NextResponse.json(
        { 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'User not authenticated',
            correlationId,
          } 
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const include = searchParams.get('include')?.split(',') || [
      'analytics',
      'content',
      'onlyfans',
      'marketing',
    ];

    console.log('[Dashboard] Query parameters', {
      correlationId,
      userId,
      range,
      include,
    });

    // Validate range parameter
    if (!['7d', '30d', '90d'].includes(range)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid range parameter. Must be 7d, 30d, or 90d',
            correlationId,
          },
        },
        { status: 400 }
      );
    }

    // Fetch data from multiple sources in parallel
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const fetchOptions: RequestInit = {
      headers: {
        'x-user-id': userId,
        'x-correlation-id': correlationId,
      },
    };

    console.log('[Dashboard] Fetching data from sources', {
      correlationId,
      sources: include,
    });

    const [analyticsData, fansData, messagesData, contentData] = await Promise.all([
      include.includes('analytics') 
        ? fetchWithRetry(`${baseUrl}/api/analytics/overview?range=${range}`, fetchOptions, correlationId)
        : null,
      include.includes('analytics') 
        ? fetchWithRetry(`${baseUrl}/api/fans/metrics`, fetchOptions, correlationId)
        : null,
      include.includes('onlyfans') 
        ? fetchWithRetry(`${baseUrl}/api/messages/unread-count`, fetchOptions, correlationId)
        : null,
      include.includes('content') 
        ? fetchWithRetry(`${baseUrl}/api/content?limit=10&status=published`, fetchOptions, correlationId)
        : null,
    ]);

    console.log('[Dashboard] Data fetched', {
      correlationId,
      analyticsData: !!analyticsData,
      fansData: !!fansData,
      messagesData: !!messagesData,
      contentData: !!contentData,
    });

    // Build summary with fallback values
    const summary: DashboardSummary = {
      totalRevenue: {
        value: analyticsData?.data?.totalRevenue || 0,
        currency: 'USD',
        change: analyticsData?.data?.revenueChange || 0,
      },
      activeFans: {
        value: fansData?.data?.activeCount || 0,
        change: fansData?.data?.growthRate || 0,
      },
      messages: {
        total: messagesData?.data?.total || 0,
        unread: messagesData?.data?.unread || 0,
      },
      engagement: {
        value: analyticsData?.data?.engagementRate || 0,
        change: analyticsData?.data?.engagementChange || 0,
      },
    };

    // Build trends with fallback to mock data
    const trends = {
      revenue: analyticsData?.data?.revenueTrend || generateMockTrend(range, 'revenue'),
      fans: fansData?.data?.growthTrend || generateMockTrend(range, 'fans'),
    };

    // Build recent activity
    const recentActivity = buildActivityFeed(contentData, messagesData);

    // Build quick actions
    const quickActions = getQuickActions();

    const response: DashboardResponse = {
      summary,
      trends,
      recentActivity,
      quickActions,
    };

    const duration = Date.now() - startTime;

    console.log('[Dashboard] Response prepared', {
      correlationId,
      duration,
      activityCount: recentActivity.length,
      quickActionsCount: quickActions.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: {
          correlationId,
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: CACHE_HEADERS,
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error('[Dashboard] Aggregation error:', {
      error: error.message,
      stack: error.stack,
      correlationId,
      duration,
    });

    const dashboardError: DashboardError = {
      code: 'AGGREGATION_FAILED',
      message: 'Failed to aggregate dashboard data',
      correlationId,
      retryable: true,
    };

    return NextResponse.json(
      { 
        error: dashboardError,
        meta: {
          correlationId,
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
