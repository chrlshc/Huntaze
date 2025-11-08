import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/lib/services/onboardingOrchestrator';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ stepId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(user.id);
    const { stepId } = await context.params;

    // Skip the step
    const result = await onboardingOrchestrator.skipStep(userId, stepId);

    return NextResponse.json({
      success: result.success,
      data: result
    });
  } catch (error: any) {
    console.error('Error skipping step:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to skip step' },
      { status: 500 }
    );
  }
}
