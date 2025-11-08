import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/lib/services/onboardingOrchestrator';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(user.id);

    // Start onboarding
    const progress = await onboardingOrchestrator.startOnboarding(userId);

    return NextResponse.json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    console.error('Error starting onboarding:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start onboarding' },
      { status: 500 }
    );
  }
}
