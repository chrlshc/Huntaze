import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

/**
 * POST /api/revenue/upsells/send
 * 
 * Send an upsell message to a fan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, opportunityId, customMessage } = body;

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
        { error: { code: 'NOT_IMPLEMENTED', message: 'Upsell sending is not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Send upsell request:', {
      creatorId,
      opportunityId,
      hasCustomMessage: !!customMessage,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    const messageId = `msg_${Date.now()}`;

    console.log('[API] Upsell sent:', {
      creatorId,
      opportunityId,
      messageId,
    });

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error('[API] Send upsell error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
