import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // If bypass cookie is set, short‑circuit as complete
    const cookieStore = await cookies();
    const bypass = cookieStore.get('onboarding_completed')?.value === 'true';

    if (bypass) {
      return NextResponse.json({
        success: true,
        data: {
          userId,
          currentStep: 'completion',
          completedSteps: [],
          skippedSteps: [],
          progress: 100,
          progressPercentage: 100,
          creatorLevel: 'intermediate',
          goals: [],
          estimatedTimeRemaining: 0,
          isComplete: true,
        },
      });
    }

    // Get current progress from orchestrator
    const progress = await onboardingOrchestrator.getProgress(userId);
    const isComplete = await onboardingOrchestrator.isOnboardingComplete(userId);

    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        // Provide a compatible progressPercentage field for consumers
        progressPercentage: (progress as any)?.progress ?? (progress as any)?.progressPercentage ?? 0,
        isComplete,
      },
    });
  } catch (error: any) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
