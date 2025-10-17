import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import {
  generateOptimizedContent,
  optimizeExistingContent,
  analyzeTopContent,
  generateContentCalendar
} from '@/lib/ai/content-optimizer';
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
    const { action } = body;

    switch (action) {
      case 'generate':
        // Generate new optimized content
        const { contentType, theme, targetAudience } = body;
        const optimized = await generateOptimizedContent(
          contentType,
          theme,
          targetAudience
        );
        {
          const r = NextResponse.json({ optimized, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }

      case 'optimize':
        // Optimize existing content
        const { title, description, performance } = body;
        const improved = await optimizeExistingContent(
          title,
          description,
          performance
        );
        {
          const r = NextResponse.json({ improved, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }

      case 'analyze':
        // Analyze top performing content
        const { contents } = body;
        const analysis = await analyzeTopContent(contents);
        {
          const r = NextResponse.json({ analysis, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }

      case 'calendar':
        // Generate content calendar
        const { creatorNiche, days } = body;
        const calendar = await generateContentCalendar(creatorNiche, days);
        {
          const r = NextResponse.json({ calendar, requestId });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }

      case 'quick-optimize':
        // Quick optimization for a single post
        const quickResult = await quickOptimize(body);
        {
          const r = NextResponse.json({ result: quickResult, requestId });
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
    log.error('content_optimize_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to optimize content', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

async function quickOptimize(data: any) {
  const { content, goal } = data;
  
  // Quick optimizations based on goal
  const optimizations = {
    'more_tips': {
      addToTitle: '💦',
      addToDescription: '💕 Tip to see more exclusive content!',
      suggestedPrice: data.currentPrice * 1.2
    },
    'more_views': {
      addToTitle: '🔥 LIMITED TIME',
      addToDescription: '24h only! Don\'t miss out 👀',
      suggestedPrice: data.currentPrice * 0.8
    },
    'new_fans': {
      addToTitle: '👋 Welcome Special',
      addToDescription: '50% off for new subscribers! 🎁',
      suggestedPrice: data.currentPrice * 0.5
    }
  };

  return optimizations[goal] || optimizations.more_tips;
}
