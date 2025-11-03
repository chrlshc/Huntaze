import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { featureUnlocker } from '@/lib/services/featureUnlocker';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.payload.userId;
    const body = await request.json();
    const { platform } = body;

    // Check and trigger feature unlocks based on platform connection
    const unlockedFeatures = await featureUnlocker.checkUnlockConditions(userId);

    // If features were unlocked, return them
    if (unlockedFeatures && unlockedFeatures.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          unlockedFeatures,
          message: `${unlockedFeatures.length} feature(s) unlocked!`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        unlockedFeatures: [],
        message: 'No new features unlocked'
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
