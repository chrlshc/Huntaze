// Smart Onboarding Analytics - Event Tracking API

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';;
// Using getServerSession without explicit authOptions to avoid pulling heavy types
import { createApiResponse } from '@/lib/smart-onboarding/utils/apiResponse';
import {
  checkRateLimit,
  trackInteraction,
  getEngagementScore,
  BehaviorEventType,
} from '@/lib/smart-onboarding/services/behavioralAnalyticsFacade';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = (await auth()) as any;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }


    // Rate limiting
    const rateLimitKey = `behavior_tracking:${userId}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 60, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        createApiResponse(null, 'Rate limit exceeded'),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '60',
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

    // Validate event structure and create properly typed InteractionEvent
    const interactionEvent = {
      id: event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId: event.sessionId || `session_${Date.now()}`,
      stepId: event.stepId || 'unknown',
      timestamp: new Date(event.timestamp || Date.now()),
      eventType: (event.type as BehaviorEventType) || 'interaction',
      interactionData: {
        timeSpent: event.timeSpent || 0,
        mouseMovements: event.mouseMovements || [],
        clickPatterns: event.clickPatterns || [],
        scrollBehavior: event.scrollBehavior || {},
        hesitationIndicators: event.hesitationIndicators || [],
        keyboardActivity: event.keyboardActivity || []
      },
      engagementScore: event.engagementScore || 0.5,
      contextualData: {
        currentUrl: event.currentUrl || '',
        referrer: event.referrer || '',
        userAgent: request.headers.get('user-agent') || '',
        screenResolution: event.screenResolution || {},
        viewportSize: event.viewportSize || {},
        deviceType: event.deviceType || 'desktop',
        browserInfo: event.browserInfo || {}
      },
      metadata: event.data || {}
    };

    // Track the interaction
    await trackInteraction(userId, interactionEvent);

    // Get updated engagement score
    const engagementScore = await getEngagementScore(userId);

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
    const session = (await auth()) as any;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }


    // Rate limiting for batch operations
    const rateLimitKey = `batch_tracking:${userId}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 10, 60);

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
          sessionId: event.sessionId || `session_${Date.now()}`,
          stepId: event.stepId || 'unknown',
          timestamp: new Date(event.timestamp || Date.now()),
          eventType: (event.type as BehaviorEventType) || 'interaction',
          interactionData: {
            timeSpent: event.timeSpent || 0,
            mouseMovements: event.mouseMovements || [],
            clickPatterns: event.clickPatterns || [],
            scrollBehavior: event.scrollBehavior || {},
            hesitationIndicators: event.hesitationIndicators || [],
            keyboardActivity: event.keyboardActivity || []
          },
          engagementScore: event.engagementScore || 0.5,
          contextualData: {
            currentUrl: event.currentUrl || '',
            referrer: event.referrer || '',
            userAgent: request.headers.get('user-agent') || '',
            screenResolution: event.screenResolution || {},
            viewportSize: event.viewportSize || {},
            deviceType: event.deviceType || 'desktop',
            browserInfo: event.browserInfo || {},
            ...event.data?.context
          },
          metadata: event.data || {}
        };

        await trackInteraction(userId, interactionEvent);
        results.push({ eventId: interactionEvent.id, success: true });
      } catch (error) {
        console.error('Error tracking individual event:', error);
        results.push({ eventId: event.id, success: false, error: 'Processing failed' });
      }
    }

    const engagementScore = await getEngagementScore(userId);

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
