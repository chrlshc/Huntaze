import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { aiProvider } from '@/lib/ai/providers';
import { analytics } from '@/lib/analytics/realtime-analytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queueManager } from '@/lib/queue/queue-manager';

interface ReplyRequest {
  conversationId: string;
  fanId: string;
  fanTier?: 'whale' | 'vip' | 'regular' | 'new';
  message: string;
  conversationHistory?: any[];
  tone?: 'flirty' | 'sweet' | 'dominant' | 'playful';
  context?: {
    fanSpending?: number;
    lastPurchase?: string;
    interests?: string[];
    recentActivity?: string[];
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const body: ReplyRequest = await request.json();
    const { 
      conversationId,
      fanId, 
      fanTier = 'regular',
      message, 
      conversationHistory = [],
      tone = 'flirty',
      context = {}
    } = body;

    // Construct enhanced prompt with context
    const systemPrompt = buildEnhancedSystemPrompt(fanTier, tone, context);
    
    // Generate AI response
    const aiResponse = await aiProvider.generateResponse({
      fanId,
      fanTier,
      message,
      conversationHistory,
      tone,
      systemPrompt,
      maxTokens: 300,
      temperature: 0.8,
    });

    // Track analytics
    await analytics.trackEvent({
      userId: session.user.id,
      eventType: 'ai_message_reply',
      properties: {
        conversationId,
        fanId,
        fanTier,
        model: aiResponse.model,
        cost: aiResponse.cost,
        responseLength: aiResponse.content.length,
        tone,
      },
      revenue: context.fanSpending ? context.fanSpending * 0.01 : undefined, // Track potential revenue
    });

    // Queue for async processing (e.g., learning, pattern matching)
    await queueManager.queueAIProcessing({
      type: 'analyze_content',
      payload: {
        message,
        response: aiResponse.content,
        fanTier,
        context,
      },
      userId: session.user.id,
      priority: fanTier === 'whale' ? 'high' : 'normal',
    });

    // Generate multiple suggestions if requested
    const suggestions = await aiProvider.generateMultipleSuggestions({
      fanId,
      fanTier,
      message,
      conversationHistory,
      tone,
    }, 3);

    const r = NextResponse.json({
      success: true,
      primary: {
        content: aiResponse.content,
        confidence: aiResponse.confidence,
        cost: aiResponse.cost,
      },
      suggestions: suggestions.map(s => ({
        content: s.content,
        confidence: s.confidence,
      })),
      metadata: {
        model: aiResponse.model,
        cached: aiResponse.cached,
        patternId: aiResponse.patternId,
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('ai_reply_generation_failed', { error: error?.message || 'unknown_error' });
    
    // Track error
    if (session?.user?.id) {
      await analytics.trackEvent({
        userId: session.user.id,
        eventType: 'ai_reply_error',
        properties: {
          error: error.message,
        },
      });
    }

    const r = NextResponse.json({ error: 'Failed to generate AI reply', details: process.env.NODE_ENV === 'development' ? error.message : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

function buildEnhancedSystemPrompt(
  fanTier: string, 
  tone: string, 
  context: any
): string {
  let prompt = `You are an OnlyFans creator assistant. Your responses should be:
- Authentic and conversational
- ${tone} in tone
- Encouraging continued engagement
- Platform-appropriate

Fan Tier: ${fanTier}`;

  if (context.fanSpending) {
    prompt += `\nFan has spent $${context.fanSpending} total.`;
  }

  if (context.lastPurchase) {
    prompt += `\nLast purchase: ${context.lastPurchase}`;
  }

  if (context.interests?.length) {
    prompt += `\nFan interests: ${context.interests.join(', ')}`;
  }

  if (context.recentActivity?.length) {
    prompt += `\nRecent activity: ${context.recentActivity.join(', ')}`;
  }

  const tierStrategies = {
    whale: '\n\nStrategy: Provide highly personalized attention. Use their name, reference past interactions, show genuine appreciation for their support.',
    vip: '\n\nStrategy: Make them feel special and valued. Personalized messages with exclusive offers.',
    regular: '\n\nStrategy: Friendly and engaging, encourage more interaction and purchases.',
    new: '\n\nStrategy: Warm welcome, help them feel comfortable, introduce them to your content gradually.',
  };

  prompt += tierStrategies[fanTier as keyof typeof tierStrategies] || tierStrategies.regular;

  return prompt;
}
