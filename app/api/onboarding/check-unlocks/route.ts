import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { featureUnlocker } from '@/lib/services/featureUnlocker';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(user.id);
    const body = await request.json();
    const { platform, featureId } = body;

    if (!featureId) {
      return NextResponse.json(
        { success: false, error: 'featureId is required' },
        { status: 400 }
      );
    }

    // Check and trigger feature unlocks based on platform connection
    const result = await featureUnlocker.checkUnlockConditions(userId, featureId);

    // Return the unlock status
    return NextResponse.json({
      success: true,
      data: {
        met: result.met,
        progress: result.progress,
        details: result.details,
        message: result.met ? 'Feature unlocked!' : 'Conditions not yet met'
      }
    });
  } catch (error) {
    console.error('Check unlocks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check feature unlocks' },
      { status: 500 }
    );
  }
}
