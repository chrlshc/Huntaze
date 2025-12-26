import { NextRequest, NextResponse } from 'next/server';
import { getSession, validateOwnership } from '@/lib/auth/session';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import type { PayoutScheduleResponse } from '@/lib/services/revenue/types';

/**
 * GET /api/revenue/payouts
 * 
 * Get payout schedule for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
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
    if (!validateOwnership(session, creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Payout schedule is not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Payout schedule request:', {
      creatorId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    const response: PayoutScheduleResponse = {
      payouts: [
        {
          id: 'payout_1',
          platform: 'onlyfans',
          amount: 12340,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'pending',
          period: {
            start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
        {
          id: 'payout_2',
          platform: 'fansly',
          amount: 4340,
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'pending',
          period: {
            start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
      ],
      summary: {
        totalExpected: 16680,
        taxEstimate: 5004,
        netIncome: 11676,
      },
      platforms: [
        {
          platform: 'onlyfans',
          connected: true,
          lastSync: new Date().toISOString(),
        },
        {
          platform: 'fansly',
          connected: true,
          lastSync: new Date().toISOString(),
        },
        {
          platform: 'patreon',
          connected: false,
          lastSync: '',
        },
      ],
    };

    console.log('[API] Payout schedule sent:', {
      creatorId,
      payoutCount: response.payouts.length,
      totalExpected: response.summary.totalExpected,
      connectedPlatforms: response.platforms.filter(p => p.connected).length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Payouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
