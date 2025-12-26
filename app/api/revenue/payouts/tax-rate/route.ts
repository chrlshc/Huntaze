import { NextRequest, NextResponse } from 'next/server';
import { getSession, validateOwnership } from '@/lib/auth/session';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

/**
 * POST /api/revenue/payouts/tax-rate
 * 
 * Update tax rate for payout calculations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, taxRate } = body;

    // Validation
    if (!creatorId || taxRate === undefined) {
      return NextResponse.json(
        { error: 'creatorId and taxRate are required' },
        { status: 400 }
      );
    }

    if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 1) {
      return NextResponse.json(
        { error: 'taxRate must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (!validateOwnership(session, creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Tax rate updates are not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Update tax rate request:', {
      creatorId,
      taxRate,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    console.log('[API] Tax rate updated:', {
      creatorId,
      taxRate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Update tax rate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
