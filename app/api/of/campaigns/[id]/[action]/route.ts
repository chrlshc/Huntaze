import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';

// Mock campaigns (shared - in production use DB)
const campaigns: any[] = [];

// POST - Launch or Pause campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { id, action } = params;
    
    if (!['launch', 'pause', 'resume', 'cancel'].includes(action)) {
      const r = NextResponse.json({ error: 'Invalid action', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const campaign = campaigns.find(c => c.id === id && c.userId === session.user!.id);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Validate state transitions
    switch (action) {
      case 'launch':
        if (!['draft', 'scheduled'].includes(campaign.status)) {
          return NextResponse.json({ 
            error: 'Campaign can only be launched from draft or scheduled status' 
          }, { status: 400 });
        }
        campaign.status = 'sending';
        campaign.startedAt = new Date();
        break;
        
      case 'pause':
        if (campaign.status !== 'sending') {
          return NextResponse.json({ 
            error: 'Can only pause active campaigns' 
          }, { status: 400 });
        }
        campaign.status = 'paused';
        break;
        
      case 'resume':
        if (campaign.status !== 'paused') {
          return NextResponse.json({ 
            error: 'Can only resume paused campaigns' 
          }, { status: 400 });
        }
        campaign.status = 'sending';
        break;
        
      case 'cancel':
        if (['completed', 'failed'].includes(campaign.status)) {
          return NextResponse.json({ 
            error: 'Cannot cancel completed campaigns' 
          }, { status: 400 });
        }
        campaign.status = 'cancelled';
        campaign.completedAt = new Date();
        break;
    }

    campaign.updatedAt = new Date();

    // TODO: Trigger appropriate worker actions based on state change
    log.info('campaign_action', { id, action });

    const r = NextResponse.json({
      success: true,
      campaign,
      message: `Campaign ${action} successful`,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('campaign_update_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
