import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateToken, generateRefreshToken, setAuthCookies } from '@/lib/auth/jwt';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // Create a mock user for development
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@huntaze.com',
      name: 'Dev User',
      picture: 'https://ui-avatars.com/api/?name=Dev+User&background=gradient',
      onboardingCompleted: false,
      createdAt: new Date().toISOString()
    };

    // Generate auth token
    const access = await generateToken({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      picture: mockUser.picture,
      provider: 'dev',
    });
    const refresh = await generateRefreshToken({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      picture: mockUser.picture,
      provider: 'dev',
    });

    // Set auth cookies (access_token, refresh_token)
    setAuthCookies(access, refresh);

    // Redirect based on onboarding status
    const redirectUrl = mockUser.onboardingCompleted 
      ? '/dashboard' 
      : '/onboarding/setup';

    const base = new URL(request.url);
    const res = NextResponse.redirect(new URL(redirectUrl, `${base.protocol}//${base.host}`));
    res.headers.set('X-Request-Id', requestId);
    return res;
  } catch (error: any) {
    log.error('dev_bypass_auth_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to bypass auth', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // For POST, allow choosing where to go
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@huntaze.com',
      name: 'Dev User',
      onboardingCompleted: true // Force completed
    };

    const access = await generateToken({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      provider: 'dev',
    });
    const refresh = await generateRefreshToken({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      provider: 'dev',
    });

    setAuthCookies(access, refresh);

    // Always go to dashboard for POST
    const base = new URL(request.url);
    const res = NextResponse.redirect(new URL('/dashboard', `${base.protocol}//${base.host}`));
    res.headers.set('X-Request-Id', requestId);
    return res;
  } catch (error: any) {
    log.error('dev_bypass_auth_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to bypass auth', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
