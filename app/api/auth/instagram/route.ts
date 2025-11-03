/**
 * Instagram OAuth Init Endpoint
 * 
 * Initiates Facebook OAuth flow for Instagram Business/Creator accounts
 * Generates state for CSRF protection and redirects to Facebook OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check OAuth credentials at runtime
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI) {
      console.warn('Instagram OAuth credentials not configured');
      const errorUrl = new URL('/platforms/connect/instagram', request.url);
      errorUrl.searchParams.set('error', 'oauth_not_configured');
      errorUrl.searchParams.set('message', 'Instagram OAuth is not configured. Please contact support.');
      return NextResponse.redirect(errorUrl);
    }

    // Lazy import to avoid build-time instantiation
    const { instagramOAuth } = await import('@/lib/services/instagramOAuth');
    
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