import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUser, HttpError } from '@/lib/server-auth';
import { generateOAuthUrl } from '@/lib/platform-auth';

export async function GET(request: NextRequest) {
  try {
    await requireUser();
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 401;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Instagram app not configured' }, { status: 500 });
  }

  // Use centralized generator (adds state)
  const authUrl = generateOAuthUrl('instagram');
  // Extract state (query param) to store in cookie
  const state = new URL(authUrl).searchParams.get('state') || crypto.randomBytes(16).toString('hex');

  const res = NextResponse.redirect(authUrl);
  res.cookies.set('instagram_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });
  return res;
}
