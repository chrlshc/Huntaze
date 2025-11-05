/**
 * Reddit Disconnect Endpoint
 * 
 * Allows users to disconnect their Reddit account
 * - Requires user authentication
 * - Revokes Reddit access token
 * - Removes stored tokens from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserFromRequest';
import { tokenManager } from '@/lib/services/tokenManager';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Require user authentication
    const user = await requireAuth(request);

    // Get stored account
    const account = await tokenManager.getAccount({ userId: user.id, provider: 'reddit' });
    
    if (!account) {
      return NextResponse.json(
        { 
          error: 'No Reddit account connected',
          message: 'No Reddit account found to disconnect'
        },
        { status: 404 }
      );
    }

    // Get valid token for revocation
    const accessToken = await tokenManager.getValidToken({ userId: user.id, provider: 'reddit' });

    // Revoke access token with Reddit
    if (accessToken) {
      try {
        const { RedditOAuthService } = await import('@/lib/services/redditOAuth');
        const redditOAuth = new RedditOAuthService();
        
        await redditOAuth.revokeAccess(accessToken, 'access_token');
      } catch (revokeError) {
        // Log but don't fail - we still want to remove from our database
        console.warn('Failed to revoke Reddit access token:', revokeError);
      }
    }

    // Remove account from database
    await tokenManager.deleteAccount({ userId: user.id, provider: 'reddit' });

    return NextResponse.json({
      success: true,
      message: 'Reddit account disconnected successfully'
    });

  } catch (error) {
    console.error('Reddit disconnect error:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as any;
      return NextResponse.json(
        {
          error: authError.code || 'disconnect_failed',
          message: authError.message
        },
        { status: authError.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'disconnect_failed',
        message: 'Failed to disconnect Reddit account'
      },
      { status: 500 }
    );
  }
}