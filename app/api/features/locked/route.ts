import { NextRequest, NextResponse } from 'next/server';
import { featureUnlocker } from '@/lib/services/featureUnlocker';
import { featureUnlockRepository } from '@/lib/db/repositories/featureUnlockRepository';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(user.id);

    // Get locked feature IDs
    const lockedIds = await featureUnlockRepository.getLockedFeatures(userId);

    // Get full feature details with progress
    const featuresWithProgress = await Promise.all(
      lockedIds.map(async (id) => {
        const feature = featureUnlocker.getFeature(id);
        if (!feature) return null;

        const status = await featureUnlocker.getFeatureStatus(userId, id);

        return {
          ...feature,
          progress: status.progress,
          nextRequirement: status.nextRequirement
        };
      })
    );

    const features = featuresWithProgress.filter(f => f !== null);

    return NextResponse.json({
      success: true,
      data: features
    });
  } catch (error: any) {
    console.error('Error getting locked features:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get features' },
      { status: 500 }
    );
  }
}
