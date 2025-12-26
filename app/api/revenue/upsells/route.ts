import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
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
    console.log('[API] Upsell opportunities request:', {
      creatorId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (ENABLE_MOCK_DATA) {
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
            messagePreview: 'Hey Sarah! Loved the beach photos? Check out the exclusive video!',
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

      return NextResponse.json(mockData);
    }

    const emptyResponse: UpsellOpportunitiesResponse = {
      opportunities: [],
      stats: {
        totalOpportunities: 0,
        expectedRevenue: 0,
        averageBuyRate: 0,
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(emptyResponse);
  } catch (error) {
    console.error('[API] Upsells error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
