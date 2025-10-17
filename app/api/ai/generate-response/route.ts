import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { GhostwriterNetwork, MessageContext } from '@/lib/ai/ghostwriter-network';
import { realtimeAnalytics } from '@/lib/analytics/realtime-analytics';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const { 
      personalityId, 
      fanId,
      fanData,
      userMessage,
      creatorProfile 
    } = await request.json();

    // Validate required fields
    if (!personalityId || !fanId || !fanData || !userMessage || !creatorProfile) {
      const r = NextResponse.json(
        { error: 'Missing required fields', requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Build message context
    const context: MessageContext = {
      fanId,
      fanData: {
        name: fanData.name || 'Fan',
        totalSpent: fanData.totalSpent || 0,
        interests: fanData.interests || [],
        messageHistory: fanData.messageHistory || [],
        lastPurchase: fanData.lastPurchase ? new Date(fanData.lastPurchase) : undefined,
        tier: fanData.tier || 'regular'
      },
      creatorProfile: {
        name: creatorProfile.name || 'Creator',
        bio: creatorProfile.bio || '',
        contentTypes: creatorProfile.contentTypes || [],
        boundaries: creatorProfile.boundaries || []
      }
    };

    // Generate AI response
    const ghostwriter = new GhostwriterNetwork();
    const response = await ghostwriter.generateResponse(
      personalityId,
      context,
      userMessage
    );

    // Track AI usage
    await realtimeAnalytics.trackAIInteraction(
      creatorProfile.name,
      fanId,
      personalityId,
      response.confidence,
      false // Not yet accepted
    );

    const r = NextResponse.json({
      message: response.message,
      personality: response.personality,
      confidence: response.confidence,
      suggestedUpsell: response.suggestedUpsell,
      metadata: {
        responseTime: response.metadata.responseTime,
        cached: response.metadata.cachehit
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('ai_generation_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error.message || 'Failed to generate AI response', requestId },
      { status: 500 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

// Track when AI suggestion is used
export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const { userId, fanId, personalityId, confidence } = await request.json();

    // Track that the AI suggestion was accepted
    await realtimeAnalytics.trackAIInteraction(
      userId,
      fanId,
      personalityId,
      confidence,
      true // Accepted
    );

    const r = NextResponse.json({ status: 'tracked', requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('ai_usage_tracking_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error.message || 'Failed to track usage', requestId },
      { status: 500 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
