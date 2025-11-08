import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/lib/services/onboardingOrchestrator';
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

    // Get current progress
    const progress = await onboardingOrchestrator.getProgress(userId);

    // Check if complete
    const isComplete = await onboardingOrchestrator.isOnboardingComplete(userId);

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        isComplete
      }
    });
  } catch (error: any) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
