import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { aiProvider } from '@/lib/ai/providers';
import { analytics } from '@/lib/analytics/realtime-analytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const body = await request.json();
    const { message, conversationHistory, tone, useCase } = body;

    if (!message) {
      const r = NextResponse.json({ error: 'Message is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Generate AI response
    const response = await aiProvider.generateResponse({
      message,
      conversationHistory,
      tone: tone || 'professional',
      useCase: useCase || 'chat',
      temperature: 0.7,
      maxTokens: 500,
    });

    // Track analytics
    await analytics.trackEvent({
      userId: session.user.id,
      eventType: 'ai_chat',
      properties: {
        model: response.model,
        cost: response.cost,
        tone,
        useCase,
        messageLength: message.length,
        responseLength: response.content.length,
      },
    });

    const r = NextResponse.json({
      success: true,
      response: response.content,
      model: response.model,
      cost: response.cost,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('ai_chat_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to generate response', details: process.env.NODE_ENV === 'development' ? error.message : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  try {
    // Health check endpoint
    const healthCheck = await aiProvider.healthCheck();
    
    const r = NextResponse.json({
      status: 'ok',
      ai: healthCheck,
      timestamp: new Date().toISOString(),
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error) {
    const r = NextResponse.json({ status: 'error', message: 'AI service unhealthy', requestId }, { status: 503 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
