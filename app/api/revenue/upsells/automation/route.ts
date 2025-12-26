import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Upsell automation settings are not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.log('[API] Get automation settings:', { creatorId });

    const settings: AutomationSettings = {
      enabled: false,
      autoSendThreshold: 0.8,
      maxDailyUpsells: 10,
      excludedFans: [],
      customRules: [],
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API] Get automation settings error:', error);
    return NextResponse.json(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, enabled, autoSendThreshold, maxDailyUpsells, excludedFans, customRules } = body;

    // Validation
    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Upsell automation updates are not available in real mode yet' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.log('[API] Update automation settings:', {
      creatorId,
      enabled,
      autoSendThreshold,
      maxDailyUpsells,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Update automation settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
