/**
 * TikTok OAuth Init Endpoint
 * 
 * Initiates TikTok OAuth flow with proper authentication and state management
 * Uses TikTokOAuthService for consistent credential validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserFromRequest';
import { oauthStateManager } from '@/lib/oauth/stateManager';
import { handleOAuthError } from '@/lib/oauth/errorHandler';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 1. Require user authentication
    const user = await requireAuth(request);

    // 2. Lazy import TikTok OAuth service to avoid build-time instantiation
    const { tiktokOAuth } = await import('@/lib/services/tiktokOAuth');

    // 3. Generate authorization URL with state (includes credential validation)
    const { url, state } = await tiktokOAuth.getAuthorizationUrl();

    // 4. Store state in database for CSRF protection
    await oauthStateManager.storeState(user.id, 'tiktok', 10); // 10 minutes expiry

    // 5. Store state in secure cookie as backup
    const response = NextResponse.redirect(url);
    response.cookies.set('tiktok_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('TikTok OAuth init error:', error);
    
    // Use standardized error handler
    return handleOAuthError(error as Error, request, 'tiktok');
  }
}
