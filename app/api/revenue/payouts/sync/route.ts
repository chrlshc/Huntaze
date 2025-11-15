import { NextRequest } from 'next/server';
import { getSession, validateOwnership } from '@/lib/auth/session';

/**
 * POST /api/revenue/payouts/sync
 * 
 * Sync platform connection for payouts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, platform } = body;

    // Validation
    if (!creatorId || !platform) {
      return Response.json(
        { error: 'creatorId and platform are required' },
        { status: 400 }
      );
    }

    if (!['onlyfans', 'fansly', 'patreon'].includes(platform)) {
      return Response.json(
        { error: 'platform must be "onlyfans", "fansly", or "patreon"' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (!validateOwnership(session, creatorId)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Sync platform request:', {
      creatorId,
      platform,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const result = await backendPayoutService.syncPlatform(creatorId, platform);

    const lastSync = new Date().toISOString();

    console.log('[API] Platform synced:', {
      creatorId,
      platform,
      lastSync,
    });

    return Response.json({
      success: true,
      lastSync,
    });
  } catch (error) {
    console.error('[API] Sync platform error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
