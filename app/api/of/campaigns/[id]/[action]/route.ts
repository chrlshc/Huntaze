import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// Mock campaigns (shared - in production use DB)
const campaigns: any[] = [];

// POST - Launch or Pause campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = params;
    
    if (!['launch', 'pause', 'resume', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const userId = session.user?.id as string | undefined;
    const campaign = campaigns.find(c => c.id === id && c.userId === userId);
    
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
    console.log(`Campaign ${id} action: ${action}`);

    return NextResponse.json({
      success: true,
      campaign,
      message: `Campaign ${action} successful`
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
