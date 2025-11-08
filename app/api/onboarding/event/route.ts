import { NextRequest, NextResponse } from 'next/server';
import { onboardingEventsRepository } from '@/lib/db/repositories/onboardingEventsRepository';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

export async function POST(request: NextRequest) {
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
    const { eventType, stepId, duration, metadata } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Log event
    const event = await onboardingEventsRepository.create({
      userId,
      eventType,
      stepId,
      duration,
      metadata
    });

    return NextResponse.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    console.error('Error logging onboarding event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log event' },
      { status: 500 }
    );
  }
}
