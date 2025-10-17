import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { z } from 'zod';
import type { OfMassMessageCampaign, CreateCampaignRequest } from '@/lib/types/onlyfans';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

// Campaign validation schema
const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.object({
    text: z.string().min(1).max(1000),
    media: z.array(z.string().url()).optional()
  }),
  audienceFilter: z.object({
    type: z.enum(['all', 'custom', 'segment']),
    segments: z.array(z.string()).optional(),
    customFilters: z.array(z.object({
      field: z.enum(['spent_total', 'spent_30d', 'messages_sent', 'subscription_price', 'days_subscribed']),
      operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
      value: z.number()
    })).optional(),
    combinationLogic: z.enum(['AND', 'OR']).optional()
  }),
  scheduledAt: z.string().datetime().optional()
});

// Mock campaigns storage
const campaigns: OfMassMessageCampaign[] = [];

// GET - List campaigns
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    let filtered = campaigns.filter(c => c.userId === session.user!.id);
    
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    // Sort by creation date desc
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const r = NextResponse.json({
      campaigns: filtered,
      total: filtered.length,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('campaign_list_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

// POST - Create campaign
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const body = await request.json();
    const validated = createCampaignSchema.parse(body) as CreateCampaignRequest;

    // Calculate audience size (mock for now)
    const audienceSize = calculateAudienceSize(validated.audienceFilter);

    const campaign: OfMassMessageCampaign = {
      id: `campaign_${Date.now()}`,
      userId: session.user!.id,
      name: validated.name,
      content: validated.content,
      audienceFilter: validated.audienceFilter,
      status: validated.scheduledAt ? 'scheduled' : 'draft',
      stats: {
        totalRecipients: audienceSize,
        sentCount: 0,
        failedCount: 0,
        queuedCount: 0
      },
      scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    campaigns.push(campaign);

    const r = NextResponse.json({
      success: true,
      campaign,
      requestId,
    }, { status: 201 });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('campaign_create_failed', { error: error?.message || 'unknown_error' });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

function calculateAudienceSize(filter: any): number {
  // Mock calculation - in production, query actual database
  switch (filter.type) {
    case 'all':
      return 1250; // Mock total subscribers
    case 'segment':
      if (filter.segments?.includes('top_spenders')) return 250;
      if (filter.segments?.includes('new_subscribers_7d')) return 85;
      if (filter.segments?.includes('silent_7d')) return 320;
      return 100;
    default:
      return 50;
  }
}
