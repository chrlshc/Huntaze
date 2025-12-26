import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

/**
 * POST /api/revenue/forecast/scenario
 * 
 * Run a what-if scenario analysis
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, newSubscribers, priceIncrease, churnReduction } = body;

    // Validation
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

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Forecast scenarios are not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Scenario analysis request:', {
      creatorId,
      newSubscribers,
      priceIncrease,
      churnReduction,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // Simple calculation for demo
    const baseRevenue = 15000;
    let projectedRevenue = baseRevenue;

    if (newSubscribers) {
      projectedRevenue += newSubscribers * 10; // $10 per subscriber
    }

    if (priceIncrease) {
      projectedRevenue += baseRevenue * (priceIncrease / 100);
    }

    if (churnReduction) {
      projectedRevenue += baseRevenue * churnReduction * 0.5;
    }

    const impact = ((projectedRevenue - baseRevenue) / baseRevenue) * 100;

    console.log('[API] Scenario result:', {
      creatorId,
      projectedRevenue,
      impact,
    });

    return NextResponse.json({
      projectedRevenue: Math.round(projectedRevenue),
      impact: Math.round(impact),
    });
  } catch (error) {
    console.error('[API] Scenario error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
