import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/marketing/campaigns/[id]
 * 
 * Get a specific campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16
    const { id } = await params;
    
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaignId = id;

    console.log('[API] Campaign get request:', {
      creatorId,
      campaignId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const campaign = await backendMarketingService.getCampaign(creatorId, campaignId);
    
    // Mock data
    const campaign = {
      id: campaignId,
      name: 'Welcome New Subscribers',
      status: 'active',
      channel: 'email',
      goal: 'engagement',
      audience: { 
        segment: 'new_subscribers', 
        size: 150,
        criteria: { subscribed_within: '7_days' }
      },
      message: {
        subject: 'Welcome to my exclusive content!',
        body: 'Hey {{name}}! Thanks for subscribing...',
        template: 'welcome_v1',
      },
      stats: {
        sent: 145,
        opened: 98,
        clicked: 45,
        converted: 12,
        openRate: 0.676,
        clickRate: 0.31,
        conversionRate: 0.083,
      },
      recipients: [
        { id: 'fan_1', name: 'John D.', status: 'opened', openedAt: '2025-11-02T10:15:00Z' },
        { id: 'fan_2', name: 'Sarah M.', status: 'clicked', clickedAt: '2025-11-02T11:30:00Z' },
        { id: 'fan_3', name: 'Mike R.', status: 'converted', convertedAt: '2025-11-02T14:00:00Z' },
      ],
      createdAt: '2025-11-01T10:00:00Z',
      launchedAt: '2025-11-02T09:00:00Z',
    };

    return Response.json({ campaign });
  } catch (error) {
    console.error('[API] Campaign get error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketing/campaigns/[id]
 * 
 * Update a campaign
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16
    const { id } = await params;
    
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, ...updates } = body;

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaignId = id;

    console.log('[API] Campaign update request:', {
      creatorId,
      campaignId,
      updates: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const campaign = await backendMarketingService.updateCampaign(creatorId, campaignId, updates);
    
    // Mock response
    const campaign = {
      id: campaignId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return Response.json({ campaign });
  } catch (error) {
    console.error('[API] Campaign update error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketing/campaigns/[id]
 * 
 * Delete a campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16
    const { id } = await params;
    
    const session = await getSession(request);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaignId = id;

    console.log('[API] Campaign delete request:', {
      creatorId,
      campaignId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // await backendMarketingService.deleteCampaign(creatorId, campaignId);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('[API] Campaign delete error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
