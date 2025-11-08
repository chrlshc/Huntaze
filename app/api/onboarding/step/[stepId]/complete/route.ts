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

    // Get step data from request body
    const body = await request.json().catch(() => ({}));

    // Complete the step
    const result = await onboardingOrchestrator.completeStep(
      userId,
      stepId,
      body.data
    );

    return NextResponse.json({
      success: result.success,
      data: result
    });
  } catch (error: any) {
    console.error('Error completing step:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete step' },
      { status: 500 }
    );
  }
}
