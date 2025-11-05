/**
 * Instagram OAuth Test Endpoint
 * 
 * Tests Instagram OAuth configuration and credentials
 * Useful for debugging and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserFromRequest';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Require user authentication
    const user = await requireAuth(request);

    // Check environment variables
    const config = {
      hasAppId: !!process.env.FACEBOOK_APP_ID,
      hasAppSecret: !!process.env.FACEBOOK_APP_SECRET,
      hasRedirectUri: !!process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI,
      redirectUri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI,
    };

    // Test Instagram OAuth service
    let serviceTest = {
      canInstantiate: false,
      canGenerateUrl: false,
      error: null as string | null,
    };

    try {
      const { InstagramOAuthService } = await import('@/lib/services/instagramOAuth');
      const instagramOAuth = new InstagramOAuthService();
      serviceTest.canInstantiate = true;

      // Test URL generation (this will validate credentials)
      const { url } = await instagramOAuth.getAuthorizationUrl();
      serviceTest.canGenerateUrl = !!url;
    } catch (error) {
      serviceTest.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check if user has existing Instagram connection
    let connectionStatus = {
      hasConnection: false,
      username: null as string | null,
      error: null as string | null,
    };

    try {
      const { tokenManager } = await import('@/lib/services/tokenManager');
      const account = await tokenManager.getAccount({ userId: user.id, provider: 'instagram' });
      
      if (account && account.metadata) {
        connectionStatus.hasConnection = true;
        connectionStatus.username = account.metadata.ig_username || null;
      }
    } catch (error) {
      connectionStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      config,
      serviceTest,
      connectionStatus,
      recommendations: [
        !config.hasAppId && 'Set FACEBOOK_APP_ID environment variable',
        !config.hasAppSecret && 'Set FACEBOOK_APP_SECRET environment variable',
        !config.hasRedirectUri && 'Set NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI environment variable',
        serviceTest.error && `Fix service error: ${serviceTest.error}`,
        connectionStatus.error && `Fix connection check: ${connectionStatus.error}`,
      ].filter(Boolean),
    });

  } catch (error) {
    console.error('Instagram test auth error:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      const authError = error as any;
      return NextResponse.json(
        {
          error: authError.code || 'test_failed',
          message: authError.message
        },
        { status: authError.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'test_failed',
        message: 'Failed to test Instagram OAuth configuration'
      },
      { status: 500 }
    );
  }
}