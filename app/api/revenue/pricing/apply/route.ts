import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

/**
 * POST /api/revenue/pricing/apply
 * 
 * Apply a pricing change
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, priceType, contentId, newPrice } = body;

    // Validation
    if (!creatorId || !priceType || !newPrice) {
      return NextResponse.json(
        { error: 'creatorId, priceType, and newPrice are required' },
        { status: 400 }
      );
    }

    if (!['subscription', 'ppv'].includes(priceType)) {
      return NextResponse.json(
        { error: 'priceType must be "subscription" or "ppv"' },
        { status: 400 }
      );
    }

    if (typeof newPrice !== 'number' || newPrice <= 0) {
      return NextResponse.json(
        { error: 'newPrice must be a positive number' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Pricing updates are not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Apply pricing request:', {
      creatorId,
      priceType,
      newPrice,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    console.log('[API] Pricing applied successfully:', {
      creatorId,
      priceType,
      newPrice,
      contentId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Apply pricing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
