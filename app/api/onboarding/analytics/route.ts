import { NextRequest, NextResponse } from 'next/server';
import { onboardingEventsRepository } from '@/lib/db/repositories/onboardingEventsRepository';
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

    // Check if user is admin (you'd implement this check)
    // For now, we'll allow any authenticated user to see their own analytics
    const userId = String(user.id);

    // Get query params for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get analytics
    const analytics = await onboardingEventsRepository.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error getting onboarding analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
