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

    // Get unlocked feature IDs
    const unlockedIds = await featureUnlockRepository.getUnlockedFeatures(userId);

    // Get full feature details
    const features = unlockedIds
      .map(id => featureUnlocker.getFeature(id))
      .filter(f => f !== null);

    return NextResponse.json({
      success: true,
      data: features
    });
  } catch (error: any) {
    console.error('Error getting unlocked features:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get features' },
      { status: 500 }
    );
  }
}
