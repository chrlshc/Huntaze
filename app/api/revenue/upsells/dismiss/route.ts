import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';;

/**
 * POST /api/revenue/upsells/dismiss
 * 
 * Dismiss an upsell opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, opportunityId } = body;

    // Validation
    if (!creatorId || !opportunityId) {
      return Response.json(
        { error: 'creatorId and opportunityId are required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Dismiss upsell request:', {
      creatorId,
      opportunityId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // await backendUpsellService.dismissOpportunity(creatorId, opportunityId);

    console.log('[API] Upsell dismissed:', {
      creatorId,
      opportunityId,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API] Dismiss upsell error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
