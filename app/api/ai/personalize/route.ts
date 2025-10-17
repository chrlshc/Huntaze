import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { 
  getContentRecommendations,
  getNextBestAction,
  getFanSegment,
  getOptimalPricing
} from '@/lib/ai/personalize-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(req.url);
  const log = makeReqLogger({ requestId, route: pathname, method: req.method });
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    
    if (!userId) {
      const r = NextResponse.json({ error: 'userId is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    switch (action) {
      case 'recommendations':
        const recommendations = await getContentRecommendations(userId);
        return NextResponse.json({ recommendations });
        
      case 'segment':
        const segment = await getFanSegment(userId);
        return NextResponse.json({ segment });
        
      case 'next-action':
        const nextAction = await getNextBestAction(userId);
        return NextResponse.json({ nextAction });
        
      case 'pricing':
        const basePrice = parseFloat(searchParams.get('basePrice') || '10');
        const contentType = searchParams.get('contentType') || 'standard';
        const optimalPrice = await getOptimalPricing(userId, contentType, basePrice);
        return NextResponse.json({ 
          basePrice,
          optimalPrice,
          discount: basePrice > optimalPrice ? Math.round((1 - optimalPrice/basePrice) * 100) : 0
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: recommendations, segment, next-action, or pricing' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    log.error('personalize_api_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to get personalization data', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
