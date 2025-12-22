import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';;
import type { PricingRecommendation } from '@/lib/services/revenue/types';
import { isMockApiMode } from '@/config/api-mode';

/**
 * GET /api/revenue/pricing
 * 
 * Get pricing recommendations for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Pricing recommendations request:', {
      creatorId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (!isMockApiMode()) {
      const recommendations: PricingRecommendation = {
        subscription: {
          current: 0,
          recommended: 0,
          revenueImpact: 0,
          reasoning: '',
          confidence: 0,
        },
        ppv: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataPoints: 0,
        },
      };

      return Response.json(recommendations);
    }

    // TODO: Replace with actual backend service call
    // const recommendations = await backendPricingService.getRecommendations(creatorId);

    // Mock data for demo mode only
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

    return Response.json(recommendations);
  } catch (error) {
    console.error('[API] Pricing error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
