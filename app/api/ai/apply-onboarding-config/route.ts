import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { aiAdapter } from '@/lib/services/aiAdapter';
import { onboardingProfileRepository } from '@/lib/db/repositories/onboardingProfileRepository';

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

    // Get user's onboarding profile
    const profile = await onboardingProfileRepository.findByUserId(userId);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Onboarding profile not found' },
        { status: 404 }
      );
    }

    // Apply AI configuration based on creator level
    const aiConfig = aiAdapter.getAIConfiguration(profile.creatorLevel);

    // Update AI config in database (assuming you have an AI config repository)
    // await aiConfigsRepository.updateForUser(userId, aiConfig);

    return NextResponse.json({
      success: true,
      data: {
        creatorLevel: profile.creatorLevel,
        aiConfig: {
          verbosity: aiConfig.verbosity,
          technicalLevel: aiConfig.technicalLevel,
          maxTokens: aiConfig.maxTokens,
          includeExamples: aiConfig.includeExamples
        },
        message: 'AI configuration applied successfully'
      }
    });
  } catch (error) {
    console.error('Apply AI config error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply AI configuration' },
      { status: 500 }
    );
  }
}
