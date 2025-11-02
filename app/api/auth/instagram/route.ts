/**
 * Instagram OAuth Init Endpoint
 * 
 * Initiates Facebook OAuth flow for Instagram Business/Creator accounts
 * Generates state for CSRF protection and redirects to Facebook OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { instagramOAuth } from '@/lib/services/instagramOAuth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Generate authorization URL with state
    const { url, state } = instagramOAuth.getAuthorizationUrl();

    // Store state in cookie for CSRF validation
    const cookieStore = await cookies();
    cookieStore.set('instagram_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Redirect to Facebook OAuth
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Instagram OAuth init error:', error);
    
    // Redirect to error page
    const errorUrl = new URL('/platforms/connect/instagram', request.url);
    errorUrl.searchParams.set('error', 'oauth_init_failed');
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.redirect(errorUrl);
  }
}