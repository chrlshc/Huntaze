import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/lib/services/onboardingOrchestrator';
import { CreatorLevel } from '@/lib/services/levelAssessor';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(user.id);
    const body = await request.json();
    const { level } = body;

    if (!level) {
      return NextResponse.json(
        { error: 'Level is required' },
        { status: 400 }
      );
    }

    // Update creator level
    const result = await onboardingOrchestrator.updateCreatorLevel(
      userId,
      level as CreatorLevel
    );

    return NextResponse.json({
      success: result.success,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error updating creator level:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update level' },
      { status: 500 }
    );
  }
}
