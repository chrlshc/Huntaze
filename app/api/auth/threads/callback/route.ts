import { NextRequest, NextResponse } from 'next/server';
import { externalFetchJson } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

const THREADS_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const THREADS_PROFILE_URL = 'https://graph.instagram.com/v18.0/me';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const clientId = process.env.THREADS_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID || '';
    const clientSecret = process.env.THREADS_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || '';

    if (process.env.NODE_ENV === 'production' && (!clientId || !clientSecret)) {
      return NextResponse.json({ error: 'Threads not configured' }, { status: 503 });
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Threads credentials missing' }, { status: 400 });
    }

    // Exchange code for access token
    // Note: Threads uses Instagram's API infrastructure
    const redirectUri =
      process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/auth/threads/callback`;

    const tokenData = await externalFetchJson<{ access_token: string }>(
      THREADS_TOKEN_URL,
      {
        service: 'threads',
        operation: 'exchangeCode',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: String(code),
        }).toString(),
        timeoutMs: 10_000,
        retry: { maxRetries: 0 },
      }
    );
    
    // Get user profile with Threads data
    const profileData = await externalFetchJson<{
      id: string;
      username: string;
      account_type?: string;
      media_count?: number;
    }>(
      `${THREADS_PROFILE_URL}?fields=id,username,account_type,media_count&access_token=${encodeURIComponent(tokenData.access_token)}`,
      {
        service: 'threads',
        operation: 'getProfile',
        method: 'GET',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      }
    );
    
    // Get Threads-specific data (when API is available)
    // For now, we'll store the Instagram connection which gives access to Threads
    
    // TODO: Save to your database
    // await saveThreadsConnection({
    //   instagramId: profileData.id,
    //   username: profileData.username,
    //   accessToken: tokenData.access_token,
    //   accountType: profileData.account_type
    // });

    return NextResponse.json({ 
      success: true,
      user: {
        username: profileData.username,
        accountType: profileData.account_type,
        mediaCount: profileData.media_count
      }
    });
  } catch (error) {
    if (isExternalServiceError(error)) {
      const status =
        error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN' ? 401 :
        error.code === 'RATE_LIMIT' ? 429 :
        error.code === 'TIMEOUT' ? 504 :
        400;

      return NextResponse.json(
        { error: 'Threads request failed', code: error.code },
        { status }
      );
    }

    console.error('Threads callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
