import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { analyzeFanMessage } from '@/lib/ai/comprehend-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      const r = NextResponse.json({ error: 'Message is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const analysis = await analyzeFanMessage(message);
    
    const r = NextResponse.json({
      analysis,
      suggestions: generateResponseSuggestions(analysis),
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('sentiment_analysis_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to analyze message', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

function generateResponseSuggestions(analysis: any) {
  const suggestions = [];
  
  if (analysis.sentiment.sentiment === 'POSITIVE') {
    suggestions.push(
      'Thank them enthusiastically! 💕',
      'Offer exclusive content while they\'re engaged',
      'Build on their positive energy'
    );
  } else if (analysis.sentiment.sentiment === 'NEGATIVE') {
    suggestions.push(
      'Address their concerns with empathy',
      'Offer a special discount to win them back',
      'Ask how you can make their experience better'
    );
  }
  
  if (analysis.insights.includes('Potential buyer')) {
    suggestions.push(
      'Present your best offer now!',
      'Create urgency with limited-time content',
      'Mention payment options casually'
    );
  }
  
  return suggestions;
}
