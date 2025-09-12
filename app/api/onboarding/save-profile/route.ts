import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding, markStep } from '@/app/api/_store/onboarding';

export async function POST(request: NextRequest) {
  try {
    // In dev mode, skip auth check
    const DEV_MODE = true;
    let userId = 'dev-user';
    
    if (!DEV_MODE) {
      // In production, check auth here
      // For now, we'll skip this check
    }

    const data = await request.json();

    // Here you would save to your database
    // For now, we'll simulate saving to session storage
    // Update in-memory store for demo/dev
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value || userId;
    mergeOnboarding(token, {
      profile: {
        displayName: data.displayName,
        bio: data.bio,
        timezone: data.timezone,
        language: data.language,
        avatar: data.avatar ?? null,
      },
    });
    markStep(token, 'profile');

    return NextResponse.json({ 
      success: true,
      message: 'Profile saved successfully'
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
