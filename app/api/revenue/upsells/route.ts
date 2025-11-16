import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';;
import type { UpsellOpportunitiesResponse } from '@/lib/services/revenue/types';

/**
 * GET /api/revenue/upsells
 * 
 * Get upsell opportunities for a creator
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
    console.log('[API] Upsell opportunities request:', {
      creatorId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const opportunities = await backendUpsellService.getOpportunities(creatorId);

    const mockData: UpsellOpportunitiesResponse = {
      opportunities: [
        {
          id: 'upsell_1',
          fanId: 'fan_1',
          fanName: 'Sarah M.',
          triggerPurchase: {
            item: 'Beach Photos Set',
            amount: 15,
            date: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          suggestedProduct: {
            name: 'Beach Video Collection',
            price: 25,
            description: 'Exclusive behind-the-scenes footage',
          },
          buyRate: 0.78,
          expectedRevenue: 19.5,
          confidence: 0.85,
          messagePreview: 'Hey Sarah! Loved the beach photos? Check out the exclusive video! 🏖️',
        },
      ],
      stats: {
        totalOpportunities: 12,
        expectedRevenue: 450,
        averageBuyRate: 0.72,
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
      },
    };

    console.log('[API] Upsell opportunities sent:', {
      creatorId,
      count: mockData.opportunities.length,
      expectedRevenue: mockData.stats.expectedRevenue,
    });

    return Response.json(mockData);
  } catch (error) {
    console.error('[API] Upsells error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
