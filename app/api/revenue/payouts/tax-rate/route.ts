import { NextRequest } from 'next/server';
import { getSession, validateOwnership } from '@/lib/auth/session';

/**
 * POST /api/revenue/payouts/tax-rate
 * 
 * Update tax rate for payout calculations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, taxRate } = body;

    // Validation
    if (!creatorId || taxRate === undefined) {
      return Response.json(
        { error: 'creatorId and taxRate are required' },
        { status: 400 }
      );
    }

    if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 1) {
      return Response.json(
        { error: 'taxRate must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (!validateOwnership(session, creatorId)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Update tax rate request:', {
      creatorId,
      taxRate,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // await backendPayoutService.updateTaxRate(creatorId, taxRate);

    console.log('[API] Tax rate updated:', {
      creatorId,
      taxRate,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API] Update tax rate error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
