/**
 * Instagram OAuth Init Endpoint
 * 
 * Initiates Facebook OAuth flow for Instagram Business/Creator accounts
 * Requires user authentication and uses secure state management
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserFromRequest';
import { oauthStateManager } from '@/lib/oauth/stateManager';
import { handleOAuthError } from '@/lib/oauth/errorHandler';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Require user authentication
    const user = await requireAuth(request);

    // Check OAuth credentials at runtime
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI) {
      console.warn('Instagram OAuth credentials not configured');
      throw new Error('Instagram OAuth credentials not configured. Please contact support.');
    }

    // Lazy import to avoid build-time instantiation
    const { InstagramOAuthService } = await import('@/lib/services/instagramOAuth');
    const instagramOAuth = new InstagramOAuthService();
    
    // Generate secure state and store in database
    const state = await oauthStateManager.storeState(user.id, 'instagram', 10);

    // Generate authorization URL with state
    const { url } = await instagramOAuth.getAuthorizationUrl();
    
    // Add state to URL
    const authUrl = new URL(url);
    authUrl.searchParams.set('state', state);

    // Redirect to Facebook OAuth
    return Response.redirect(authUrl.toString());
  } catch (error) {
    console.error('Instagram OAuth init error:', error);
    return handleOAuthError(error as Error, request, 'instagram');
  }
}