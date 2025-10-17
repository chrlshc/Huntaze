import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { 
  sendNotification,
  batchSendWithCasinoEffect,
  createDripCampaign,
  CasinoNotification
} from '@/lib/notifications/casino-notifications';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'send':
        await sendNotification(data as CasinoNotification);
        {
          const r = NextResponse.json({ success: true, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
        
      case 'batch':
        await batchSendWithCasinoEffect(data.notifications, data.spacingMs);
        {
          const r = NextResponse.json({ success: true, count: data.notifications.length, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
        
      case 'drip-campaign':
        await createDripCampaign(data.userId, data.campaignType);
        {
          const r = NextResponse.json({ success: true, campaign: data.campaignType, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
        
      case 'simulate-casino':
        // Simulate casino-style notifications
        const notifications = generateCasinoSimulation(data.count || 5);
        await batchSendWithCasinoEffect(notifications, 3000);
        {
          const r = NextResponse.json({ success: true, notifications: notifications.length, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
        
      default:
        {
          const r = NextResponse.json({ error: 'Invalid action', requestId }, { status: 400 });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
    }
  } catch (error: any) {
    log.error('casino_notification_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to process notification', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

function generateCasinoSimulation(count: number): CasinoNotification[] {
  const names = ['Jessica', 'Mike', 'Sarah', 'Alex', 'Emma'];
  const amounts = [5, 10, 20, 50, 100];
  const types: CasinoNotification['type'][] = ['new_fan', 'new_message', 'new_tip'];
  
  const notifications: CasinoNotification[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    
    notifications.push({
      type,
      title: `New ${type.replace('_', ' ')}!`,
      message: '',
      data: {
        name,
        amount: type === 'new_tip' ? amount : undefined,
        milestone: type === 'milestone' ? `${(i + 1) * 100} fans` : undefined
      },
      priority: amount > 20 || type === 'new_fan' ? 'high' : 'medium'
    });
  }
  
  return notifications;
}
