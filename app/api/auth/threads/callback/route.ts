import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';
import { requireUser, HttpError } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    await requireUser();
    const { code } = await request.json();
    
    if (!code) {
      const r = NextResponse.json({ error: 'Missing authorization code', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Exchange code for access token
    // Note: Threads uses Instagram's API infrastructure
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID || '',
        client_secret: process.env.THREADS_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI || 'https://huntaze.com/auth/threads/callback',
        code: code
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      log.error('threads_token_error', redactObj({ error: errorText }));
      const r = NextResponse.json({ error: 'Failed to exchange code for token', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const tokenData = await tokenResponse.json();
    
    // Get user profile with Threads data
    const profileResponse = await fetch(`https://graph.instagram.com/v18.0/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`);
    
    if (!profileResponse.ok) {
      const r = NextResponse.json({ error: 'Failed to get user profile', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const profileData = await profileResponse.json();
    
    // Get Threads-specific data (when API is available)
    // For now, we'll store the Instagram connection which gives access to Threads
    
    // TODO: Save to your database
    // await saveThreadsConnection({
    //   instagramId: profileData.id,
    //   username: profileData.username,
    //   accessToken: tokenData.access_token,
    //   accountType: profileData.account_type
    // });

    const r = NextResponse.json({ 
      success: true,
      user: {
        username: profileData.username,
        accountType: profileData.account_type,
        mediaCount: profileData.media_count
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('threads_callback_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
