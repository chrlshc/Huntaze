import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';;
import type { AutomationSettings } from '@/lib/services/revenue/types';

/**
 * GET /api/revenue/upsells/automation
 * 
 * Get automation settings for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[API] Get automation settings:', { creatorId });

    // TODO: Replace with actual backend service call
    // const settings = await backendUpsellService.getAutomationSettings(creatorId);

    const settings: AutomationSettings = {
      enabled: false,
      autoSendThreshold: 0.8,
      maxDailyUpsells: 10,
      excludedFans: [],
      customRules: [],
    };

    return Response.json(settings);
  } catch (error) {
    console.error('[API] Get automation settings error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/revenue/upsells/automation
 * 
 * Update automation settings for a creator
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, enabled, autoSendThreshold, maxDailyUpsells, excludedFans, customRules } = body;

    // Validation
    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[API] Update automation settings:', {
      creatorId,
      enabled,
      autoSendThreshold,
      maxDailyUpsells,
    });

    // TODO: Replace with actual backend service call
    // await backendUpsellService.updateAutomationSettings(creatorId, { enabled, autoSendThreshold, maxDailyUpsells, excludedFans, customRules });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API] Update automation settings error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
