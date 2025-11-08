import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/lib/services/onboardingOrchestrator';
import { onboardingProfileRepository } from '@/lib/db/repositories/onboardingProfileRepository';
import { OnboardingGoal } from '@/lib/services/onboardingOrchestrator';
import { CreatorLevel } from '@/lib/services/levelAssessor';
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

    // Get user profile
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Onboarding profile not found' },
        { status: 404 }
      );
    }

    // Generate personalized path
    const path = onboardingOrchestrator.generatePath(
      profile.primaryGoals as OnboardingGoal[],
      profile.creatorLevel as CreatorLevel
    );

    return NextResponse.json({
      success: true,
      data: path
    });
  } catch (error: any) {
    console.error('Error getting onboarding path:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get path' },
      { status: 500 }
    );
  }
}
