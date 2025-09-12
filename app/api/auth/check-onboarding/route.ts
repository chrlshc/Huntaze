import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // TODO: Check if user has completed onboarding in database
    // For now, we'll check if they have AI config set
    const hasCompletedOnboarding = false; // This should check database

    return NextResponse.json({ 
      completed: hasCompletedOnboarding,
      userId: user.userId 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
