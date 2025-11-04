// Smart Onboarding Analytics - Event Tracking API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { BehavioralAnalyticsServiceImpl } from '@/lib/smart-onboarding/services/behavioralAnalyticsService';
import { db } from '@/lib/db';
import { createApiResponse } from '@/lib/smart-onboarding/repositories/base';
import { RATE_LIMITS } from '@/lib/smart-onboarding/config/database';
import { smartOnboardingCache } from '@/lib/smart-onboarding/config/redis';

const analyticsService = new BehavioralAnalyticsServiceImpl(db);

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting
    const rateLimitKey = `behavior_tracking:${userId}`;
    const rateLimit = await smartOnboardingCache.checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.TRACK_INTERACTION,
      60 // 1 minute window
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        createApiResponse(null, 'Rate limit exceeded'),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.TRACK_INTERACTION.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { event } = body;

    if (!event || !event.type) {
      return NextResponse.json(
        createApiResponse(null, 'Invalid event data'),
        { status: 400 }
      );
    }

    // Validate event structure
    const interactionEvent = {
      id: event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: event.type,
      data: {
        stepId: event.stepId,
        sessionId: event.sessionId,
        journeyId: event.journeyId,
        timeSpent: event.timeSpent || 0,
        mouseMovements: event.mouseMovements || [],
        clickPatterns: event.clickPatterns || [],
        scrollBehavior: event.scrollBehavior || {},
        hesitationIndicators: event.hesitationIndicators || [],
        keyboardActivity: event.keyboardActivity || [],
        context: {
          currentUrl: event.currentUrl,
          referrer: event.referrer,
          userAgent: request.headers.get('user-agent') || '',
          screenResolution: event.screenResolution || {},
          viewportSize: event.viewportSize || {},
          deviceType: event.deviceType || 'desktop',
          browserInfo: event.browserInfo || {}
        },
        ...event.data
      },
      timestamp: new Date(event.timestamp || Date.now())
    };

    // Track the interaction
    await analyticsService.trackInteraction(userId, interactionEvent);

    // Get updated engagement score
    const engagementScore = await smartOnboardingCache.getEngagementScore(userId);

    return NextResponse.json(
      createApiResponse({
        eventId: interactionEvent.id,
        engagementScore,
        tracked: true
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Batch tracking endpoint
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting for batch operations
    const rateLimitKey = `batch_tracking:${userId}`;
    const rateLimit = await smartOnboardingCache.checkRateLimit(
      rateLimitKey,
      10, // 10 batch requests per minute
      60
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        createApiResponse(null, 'Rate limit exceeded'),
        { status: 429 }
      );
    }

    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        createApiResponse(null, 'Invalid events array'),
        { status: 400 }
      );
    }

    if (events.length > 50) {
      return NextResponse.json(
        createApiResponse(null, 'Too many events in batch (max 50)'),
        { status: 400 }
      );
    }

    const results = [];
    
    for (const event of events) {
      try {
        const interactionEvent = {
          id: event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: event.type,
          data: {
            ...event.data,
            context: {
              userAgent: request.headers.get('user-agent') || '',
              ...event.data?.context
            }
          },
          timestamp: new Date(event.timestamp || Date.now())
        };

        await analyticsService.trackInteraction(userId, interactionEvent);
        results.push({ eventId: interactionEvent.id, success: true });
      } catch (error) {
        console.error('Error tracking individual event:', error);
        results.push({ eventId: event.id, success: false, error: 'Processing failed' });
      }
    }

    const engagementScore = await smartOnboardingCache.getEngagementScore(userId);

    return NextResponse.json(
      createApiResponse({
        results,
        totalEvents: events.length,
        successfulEvents: results.filter(r => r.success).length,
        engagementScore
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in batch tracking:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}