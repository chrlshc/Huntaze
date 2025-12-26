import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import type { PricingRecommendation } from '@/lib/services/revenue/types';

/**
 * GET /api/revenue/pricing
 * 
 * Get pricing recommendations for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Pricing recommendations request:', {
      creatorId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (!ENABLE_MOCK_DATA) {
      const userId = Number.parseInt(creatorId, 10);
      if (!Number.isFinite(userId)) {
        return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 });
      }

      const aggregate = await prisma.subscriptions.aggregate({
        where: {
          user_id: userId,
          status: 'active',
        },
        _avg: { amount: true },
        _count: { _all: true },
      });

      const current = Math.round((aggregate._avg.amount ?? 0) * 100) / 100;
      const dataPoints = aggregate._count._all ?? 0;

      const recommendations: PricingRecommendation = {
        subscription: {
          current,
          recommended: current,
          revenueImpact: 0,
          reasoning: dataPoints > 0 ? 'Based on active subscription pricing.' : '',
          confidence: 0,
        },
        ppv: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataPoints,
        },
      };

      return NextResponse.json(recommendations);
    }

    // Mock data for dev mode only
    const recommendations: PricingRecommendation = {
      subscription: {
        current: 9.99,
        recommended: 12.99,
        revenueImpact: 30,
        reasoning: 'Based on your engagement rate and subscriber retention, you can increase your price by 30% without significant churn.',
        confidence: 0.85,
      },
      ppv: [
        {
          contentId: 'content_123',
          contentType: 'video' as const,
          recommendedRange: { min: 25, max: 35 },
          expectedRevenue: { min: 2500, max: 3500 },
        },
      ],
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataPoints: 1234,
      },
    };

    console.log('[API] Pricing recommendations sent:', {
      creatorId,
      subscriptionImpact: recommendations.subscription.revenueImpact,
      ppvCount: recommendations.ppv.length,
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('[API] Pricing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
