import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { analytics } from '@/lib/analytics/realtime-analytics';
import { requireUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const user = await requireUser();

    const body = await request.json();
    const { eventType, properties, revenue, platform } = body;

    if (!eventType) {
      const r = NextResponse.json({ error: 'eventType is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Track event
    await analytics.trackEvent({
      userId: user.id,
      eventType,
      properties,
      revenue,
      platform,
      timestamp: Date.now(),
    });

    const r = NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('analytics_track_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to track event', details: process.env.NODE_ENV === 'development' ? error.message : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const user = await requireUser();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate time range
    const now = Date.now();
    const ranges: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    
    const start = now - (ranges[timeRange] || ranges['7d']);

    // Get user metrics
    const metrics = await analytics.getUserMetrics(user.id);

    // Get revenue analytics
    const revenueData = await analytics.getRevenueAnalytics(
      user.id,
      { start, end: now }
    );

    // Get trending content
    const trendingContent = await analytics.getTrendingContent(5);

    const r = NextResponse.json({
      success: true,
      metrics,
      revenue: revenueData,
      trending: trendingContent,
      timeRange: {
        start: new Date(start).toISOString(),
        end: new Date(now).toISOString(),
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('analytics_fetch_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to fetch analytics', details: process.env.NODE_ENV === 'development' ? error.message : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
