import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { markCompleted } from '@/app/api/_store/onboarding';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  const authToken = cookies().get('auth_token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  const url = new URL(req.url);
  const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // In development or localhost, allow skipping without auth cookie
  if (!authToken && !(isDev || isLocalHost)) {
    const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }

  try {
    // Force onboarding completion by creating a mock completed status
    const response = NextResponse.json({ success: true, message: 'Onboarding marked as complete', requestId });
    
    // Set a cookie to bypass onboarding check
    response.cookies.set('onboarding_completed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    // Update in-memory status (if token available)
    const token = cookies().get('access_token')?.value || cookies().get('auth_token')?.value || 'dev';
    if (token) {
      try { markCompleted(token); } catch {}
    }
    
    response.headers.set('X-Request-Id', requestId);
    return response;
  } catch (error: any) {
    log.error('onboarding_force_complete_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to complete onboarding', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
