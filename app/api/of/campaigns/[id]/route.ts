import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { CampaignMetrics } from '@/lib/types/onlyfans';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

// Mock campaigns (shared with campaigns/route.ts - in production use DB)
const campaigns: any[] = [];

// GET - Get campaign details with metrics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const campaign = campaigns.find(c => c.id === params.id && c.userId === session.user!.id);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Calculate metrics
    const metrics: CampaignMetrics = {
      campaignId: campaign.id,
      status: campaign.status,
      stats: campaign.stats,
      performance: {
        deliveryRate: campaign.stats.totalRecipients > 0 
          ? (campaign.stats.sentCount / campaign.stats.totalRecipients) * 100 
          : 0,
        avgDeliveryTime: 2.3, // Mock average in seconds
        errorRate: campaign.stats.totalRecipients > 0
          ? (campaign.stats.failedCount / campaign.stats.totalRecipients) * 100
          : 0
      },
      topErrors: campaign.stats.failedCount > 0 ? [
        { error: 'User not subscribed', count: 3 },
        { error: 'Rate limit exceeded', count: 1 }
      ] : undefined
    };

    const r = NextResponse.json({
      campaign,
      metrics,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('campaign_fetch_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
