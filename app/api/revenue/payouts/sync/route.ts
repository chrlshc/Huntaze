import { NextRequest, NextResponse } from 'next/server';
import { getSession, validateOwnership } from '@/lib/auth/session';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

/**
 * POST /api/revenue/payouts/sync
 * 
 * Sync platform connection for payouts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, platform } = body;

    // Validation
    if (!creatorId || !platform) {
      return NextResponse.json(
        { error: 'creatorId and platform are required' },
        { status: 400 }
      );
    }

    if (!['onlyfans', 'fansly', 'patreon'].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be "onlyfans", "fansly", or "patreon"' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (!validateOwnership(session, creatorId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Payout sync is not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Sync platform request:', {
      creatorId,
      platform,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    const lastSync = new Date().toISOString();

    console.log('[API] Platform synced:', {
      creatorId,
      platform,
      lastSync,
    });

    return NextResponse.json({
      success: true,
      lastSync,
    });
  } catch (error) {
    console.error('[API] Sync platform error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
