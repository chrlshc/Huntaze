import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { CampaignMetrics } from '@/lib/types/onlyfans';

// Mock campaigns (shared with campaigns/route.ts - in production use DB)
const campaigns: any[] = [];

// GET - Get campaign details with metrics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
      campaign,
      metrics
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
