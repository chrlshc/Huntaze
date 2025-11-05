/**
 * Reddit OAuth Init Endpoint
 * 
 * Initiates Reddit OAuth flow for content publishing
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
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET || !process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI) {
      console.warn('Reddit OAuth credentials not configured');
      throw new Error('Reddit OAuth credentials not configured. Please contact support.');
    }

    // Lazy import to avoid build-time instantiation
    const { RedditOAuthService } = await import('@/lib/services/redditOAuth');
    const redditOAuth = new RedditOAuthService();
    
    // Generate secure state and store in database
    const state = await oauthStateManager.storeState(user.id, 'reddit', 10);

    // Generate authorization URL with state
    const { url } = await redditOAuth.getAuthorizationUrl();
    
    // Add state to URL
    const authUrl = new URL(url);
    authUrl.searchParams.set('state', state);

    // Redirect to Reddit OAuth
    return Response.redirect(authUrl.toString());
  } catch (error) {
    console.error('Reddit OAuth init error:', error);
    return handleOAuthError(error as Error, request, 'reddit');
  }
}
