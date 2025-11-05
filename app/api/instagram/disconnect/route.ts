/**
 * Instagram Disconnect Endpoint
 * 
 * Allows users to disconnect their Instagram account
 * - Requires user authentication
 * - Revokes Instagram access token
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
    const account = await tokenManager.getAccount({ userId: user.id, provider: 'instagram' });
    
    if (!account) {
      return NextResponse.json(
        { 
          error: 'No Instagram account connected',
          message: 'No Instagram account found to disconnect'
        },
        { status: 404 }
      );
    }

    // Get valid token for revocation
    const accessToken = await tokenManager.getValidToken({ userId: user.id, provider: 'instagram' });

    // Revoke access token with Instagram/Facebook
    if (accessToken) {
      try {
        const { InstagramOAuthService } = await import('@/lib/services/instagramOAuth');
        const instagramOAuth = new InstagramOAuthService();
        
        await instagramOAuth.revokeAccess(accessToken);
      } catch (revokeError) {
        // Log but don't fail - we still want to remove from our database
        console.warn('Failed to revoke Instagram access token:', revokeError);
      }
    }

    // Remove account from database
    await tokenManager.deleteAccount({ userId: user.id, provider: 'instagram' });

    return NextResponse.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });

  } catch (error) {
    console.error('Instagram disconnect error:', error);
    
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
        message: 'Failed to disconnect Instagram account'
      },
      { status: 500 }
    );
  }
}