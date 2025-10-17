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
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
  
  // Generate via centralized config
  const authUrl = generateOAuthUrl('reddit');
  // Extract state for cookie
  const state = new URL(authUrl).searchParams.get('state') || crypto.randomBytes(16).toString('hex');
  const response = NextResponse.redirect(authUrl);
  
  response.cookies.set('reddit_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  });
  
  return response;
}
