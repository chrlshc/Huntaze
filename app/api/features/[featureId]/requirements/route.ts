import { NextRequest, NextResponse } from 'next/server';
import { featureUnlocker } from '@/lib/services/featureUnlocker';
import { verifyAuth } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ featureId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const { featureId } = params;

    // Get feature
    const feature = featureUnlocker.getFeature(featureId);
    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Get feature status
    const status = await featureUnlocker.getFeatureStatus(userId, featureId);

    // Check unlock conditions
    const { met, progress, details } = await featureUnlocker.checkUnlockConditions(
      userId,
      featureId
    );

    return NextResponse.json({
      success: true,
      data: {
        feature,
        isUnlocked: status.isUnlocked,
        progress,
        conditionsMet: met,
        requirements: feature.unlockConditions.map((cond, index) => ({
          description: cond.description,
          met: status.conditionsMet[index],
          detail: details[index]
        })),
        nextRequirement: status.nextRequirement
      }
    });
  } catch (error: any) {
    console.error('Error getting feature requirements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get requirements' },
      { status: 500 }
    );
  }
}
