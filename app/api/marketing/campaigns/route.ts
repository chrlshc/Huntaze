import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { CampaignsListResponse } from '@/lib/types/marketing';

/**
 * GET /api/marketing/campaigns
 * 
 * List all campaigns for a creator
 * 
 * Query Parameters:
 * - creatorId: string (required) - Creator ID
 * - status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' (optional)
 * - channel: 'email' | 'dm' | 'push' (optional)
 * 
 * Response: CampaignsListResponse
 * {
 *   campaigns: Campaign[],
 *   metadata: {
 *     total: number,
 *     filtered: number,
 *     lastUpdated: string
 *   }
 * }
 * 
 * Errors:
 * - 400: Invalid parameters
 * - 401: Unauthorized
 * - 403: Forbidden (not your data)
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('X-Correlation-ID') || 
    `mkt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  try {
    // 1. Authentication check
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      console.warn('[API] Campaigns list - Unauthorized', {
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: 'Unauthorized',
          type: 'AUTHENTICATION_ERROR',
          correlationId,
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    // Validation
    if (!creatorId) {
      console.warn('[API] Campaigns list - Missing creatorId', {
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: 'creatorId is required',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['draft', 'scheduled', 'active', 'paused', 'completed'].includes(status)) {
      return Response.json(
        { 
          error: 'status must be one of: draft, scheduled, active, paused, completed',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    // Validate channel if provided
    if (channel && !['email', 'dm', 'push'].includes(channel)) {
      return Response.json(
        { 
          error: 'channel must be one of: email, dm, push',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    // 3. Authorization check
    if (session.user.id !== creatorId) {
      console.warn('[API] Campaigns list - Forbidden', {
        userId: session.user.id,
        requestedCreatorId: creatorId,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: 'Forbidden',
          type: 'PERMISSION_ERROR',
          correlationId,
        },
        { status: 403 }
      );
    }

    // 4. Logging
    console.log('[API] Campaigns list request:', {
      creatorId,
      status: status || 'all',
      channel: channel || 'all',
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // 5. Backend service call
    // TODO: Replace with actual backend service call
    // const campaigns = await backendMarketingService.getCampaigns(creatorId, { status, channel });
    
    // Mock data
    const allCampaigns = [
      {
        id: 'camp_1',
        creatorId,
        name: 'Welcome New Subscribers',
        status: 'active' as const,
        channel: 'email' as const,
        goal: 'engagement' as const,
        audience: { segment: 'new_subscribers', size: 150 },
        message: { body: 'Welcome to my exclusive content!' },
        stats: {
          sent: 145,
          opened: 98,
          clicked: 45,
          converted: 12,
          openRate: 67.6,
          clickRate: 45.9,
          conversionRate: 12.2,
        },
        createdAt: '2025-11-01T10:00:00Z',
        launchedAt: '2025-11-02T09:00:00Z',
      },
      {
        id: 'camp_2',
        creatorId,
        name: 'Re-engage Churned Fans',
        status: 'draft' as const,
        channel: 'dm' as const,
        goal: 'retention' as const,
        audience: { segment: 'churned', size: 89 },
        message: { body: 'We miss you! Come back for exclusive content.' },
        stats: null,
        createdAt: '2025-11-10T14:30:00Z',
        launchedAt: null,
      },
      {
        id: 'camp_3',
        creatorId,
        name: 'PPV Promotion - Holiday Special',
        status: 'scheduled' as const,
        channel: 'dm' as const,
        goal: 'revenue' as const,
        audience: { segment: 'vip', size: 234 },
        message: { body: 'Exclusive holiday content just for you!' },
        stats: null,
        createdAt: '2025-11-08T16:00:00Z',
        scheduledFor: '2025-11-15T12:00:00Z',
      },
    ];

    // 6. Filter campaigns
    let filtered = allCampaigns;
    
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    if (channel) {
      filtered = filtered.filter(c => c.channel === channel);
    }

    // 7. Build response
    const response: CampaignsListResponse = {
      campaigns: filtered,
      metadata: {
        total: allCampaigns.length,
        filtered: filtered.length,
        lastUpdated: new Date().toISOString(),
      },
    };

    // 8. Success logging
    console.log('[API] Campaigns list success:', {
      creatorId,
      totalCampaigns: allCampaigns.length,
      filteredCampaigns: filtered.length,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return Response.json(response, {
      headers: {
        'X-Correlation-ID': correlationId,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    // 9. Error handling
    console.error('[API] Campaigns list error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
      timestamp: new Date().toISOString(),
    });
    
    return Response.json(
      { 
        error: 'Internal server error',
        type: 'API_ERROR',
        correlationId,
        userMessage: 'Failed to fetch campaigns. Please try again.',
      },
      { 
        status: 500,
        headers: {
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }
}

/**
 * POST /api/marketing/campaigns
 * 
 * Create a new campaign
 * 
 * Request Body:
 * {
 *   creatorId: string,
 *   name: string,
 *   goal: 'engagement' | 'retention' | 'revenue',
 *   channel: 'email' | 'dm' | 'push',
 *   audience: { segment: string, size?: number },
 *   message?: { subject?: string, body: string },
 *   schedule?: { type: 'immediate' | 'scheduled', date?: string }
 * }
 * 
 * Response: { campaign: Campaign }
 * 
 * Errors:
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('X-Correlation-ID') || 
    `mkt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  try {
    // 1. Authentication check
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      console.warn('[API] Campaign create - Unauthorized', {
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: 'Unauthorized',
          type: 'AUTHENTICATION_ERROR',
          correlationId,
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.warn('[API] Campaign create - Invalid JSON', {
        correlationId,
        error: parseError instanceof Error ? parseError.message : 'Unknown',
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: 'Invalid JSON in request body',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    const { creatorId, name, goal, channel, audience, message, schedule } = body;

    // 3. Validate required fields
    const missingFields: string[] = [];
    if (!creatorId) missingFields.push('creatorId');
    if (!name) missingFields.push('name');
    if (!goal) missingFields.push('goal');
    if (!channel) missingFields.push('channel');
    if (!audience) missingFields.push('audience');

    if (missingFields.length > 0) {
      console.warn('[API] Campaign create - Missing fields', {
        missingFields,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    // 4. Validate field values
    if (!['engagement', 'retention', 'revenue'].includes(goal)) {
      return Response.json(
        { 
          error: 'goal must be one of: engagement, retention, revenue',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (!['email', 'dm', 'push'].includes(channel)) {
      return Response.json(
        { 
          error: 'channel must be one of: email, dm, push',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (name.length < 3 || name.length > 100) {
      return Response.json(
        { 
          error: 'name must be between 3 and 100 characters',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (!audience.segment) {
      return Response.json(
        { 
          error: 'audience.segment is required',
          type: 'VALIDATION_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }

    // 5. Authorization check
    if (session.user.id !== creatorId) {
      console.warn('[API] Campaign create - Forbidden', {
        userId: session.user.id,
        requestedCreatorId: creatorId,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        { 
          error: 'Forbidden',
          type: 'PERMISSION_ERROR',
          correlationId,
        },
        { status: 403 }
      );
    }

    // 6. Logging
    console.log('[API] Campaign create request:', {
      creatorId,
      name,
      goal,
      channel,
      audienceSegment: audience.segment,
      hasMessage: !!message,
      hasSchedule: !!schedule,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // 7. Backend service call
    // TODO: Replace with actual backend service call
    // const campaign = await backendMarketingService.createCampaign({
    //   creatorId, name, goal, channel, audience, message, schedule
    // });
    
    // Mock response
    const campaign = {
      id: `camp_${Date.now()}`,
      name,
      status: 'draft' as const,
      channel: channel as 'email' | 'dm' | 'push',
      goal: goal as 'engagement' | 'retention' | 'revenue',
      audience,
      message: message || null,
      schedule: schedule || null,
      stats: null,
      createdAt: new Date().toISOString(),
      launchedAt: null,
    };

    // 8. Success logging
    console.log('[API] Campaign create success:', {
      creatorId,
      campaignId: campaign.id,
      name: campaign.name,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      { campaign },
      { 
        status: 201,
        headers: {
          'X-Correlation-ID': correlationId,
          'Location': `/api/marketing/campaigns/${campaign.id}`,
        },
      }
    );
  } catch (error) {
    // 9. Error handling
    console.error('[API] Campaign create error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
      timestamp: new Date().toISOString(),
    });
    
    return Response.json(
      { 
        error: 'Internal server error',
        type: 'API_ERROR',
        correlationId,
        userMessage: 'Failed to create campaign. Please try again.',
      },
      { 
        status: 500,
        headers: {
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }
}
