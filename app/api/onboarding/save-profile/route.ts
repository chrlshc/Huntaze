import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding, markStep } from '@/app/api/_store/onboarding';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // In dev mode, skip auth check
    const DEV_MODE = true;
    const userId = 'dev-user';
    
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

    const r = NextResponse.json({ 
      success: true,
      message: 'Profile saved successfully',
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('onboarding_save_profile_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to save profile', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = withMonitoring('onboarding.save-profile', handler as any);
