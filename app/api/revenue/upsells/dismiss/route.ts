import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

/**
 * POST /api/revenue/upsells/dismiss
 * 
 * Dismiss an upsell opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, opportunityId } = body;

    // Validation
    if (!creatorId || !opportunityId) {
      return NextResponse.json(
        { error: 'creatorId and opportunityId are required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Upsell dismissal is not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Dismiss upsell request:', {
      creatorId,
      opportunityId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    console.log('[API] Upsell dismissed:', {
      creatorId,
      opportunityId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Dismiss upsell error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
