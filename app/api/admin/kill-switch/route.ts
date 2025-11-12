/**
 * Admin API for managing kill switch
 * POST /api/admin/kill-switch - Activate/deactivate kill switch
 * GET /api/admin/kill-switch - Get kill switch status
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import {
  checkKillSwitch,
  activateKillSwitch,
  deactivateKillSwitch,
  getKillSwitchStatus,
} from '@/lib/onboarding-kill-switch';

export const runtime = 'nodejs';

/**
 * GET /api/admin/kill-switch
 * Get current kill switch status
 */
export async function GET(req: Request) {
  const correlationId = crypto.randomUUID();

  try {
    const user = await requireUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    const status = await getKillSwitchStatus();

    return NextResponse.json({
      ...status,
      correlationId,
    });
  } catch (error) {
    console.error('[Kill Switch API] GET error:', error, { correlationId });
    return NextResponse.json(
      {
        error: 'Failed to get kill switch status',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/kill-switch
 * Activate or deactivate kill switch
 * 
 * Body:
 * {
 *   active: boolean,
 *   reason?: string
 * }
 */
export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();

  try {
    const user = await requireUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (typeof body.active !== 'boolean') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'active field is required and must be boolean',
          correlationId,
        },
        { status: 400 }
      );
    }

    const reason = body.reason || `Manual ${body.active ? 'activation' : 'deactivation'} by ${user.id}`;

    if (body.active) {
      await activateKillSwitch(reason);
      console.error('[Kill Switch API] ACTIVATED by user:', user.id, {
        reason,
        correlationId,
      });
    } else {
      await deactivateKillSwitch(reason);
      console.log('[Kill Switch API] DEACTIVATED by user:', user.id, {
        reason,
        correlationId,
      });
    }

    const status = await getKillSwitchStatus();

    return NextResponse.json({
      success: true,
      ...status,
      reason,
      correlationId,
    });
  } catch (error) {
    console.error('[Kill Switch API] POST error:', error, { correlationId });
    return NextResponse.json(
      {
        error: 'Failed to update kill switch',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}
