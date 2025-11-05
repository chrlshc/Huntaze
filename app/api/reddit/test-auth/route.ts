/**
 * Reddit OAuth Test Endpoint
 * 
 * Tests Reddit OAuth configuration and credentials
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
      hasClientId: !!process.env.REDDIT_CLIENT_ID,
      hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
      hasRedirectUri: !!process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI,
      hasUserAgent: !!process.env.REDDIT_USER_AGENT,
      redirectUri: process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI,
      userAgent: process.env.REDDIT_USER_AGENT,
    };

    // Test Reddit OAuth service
    let serviceTest = {
      canInstantiate: false,
      canGenerateUrl: false,
      error: null as string | null,
    };

    try {
      const { RedditOAuthService } = await import('@/lib/services/redditOAuth');
      const redditOAuth = new RedditOAuthService();
      serviceTest.canInstantiate = true;

      // Test URL generation (this will validate credentials)
      const { url } = await redditOAuth.getAuthorizationUrl();
      serviceTest.canGenerateUrl = !!url;
    } catch (error) {
      serviceTest.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check if user has existing Reddit connection
    let connectionStatus = {
      hasConnection: false,
      username: null as string | null,
      error: null as string | null,
    };

    try {
      const { tokenManager } = await import('@/lib/services/tokenManager');
      const account = await tokenManager.getAccount({ userId: user.id, provider: 'reddit' });
      
      if (account && account.metadata) {
        connectionStatus.hasConnection = true;
        connectionStatus.username = account.metadata.username || null;
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
        !config.hasClientId && 'Set REDDIT_CLIENT_ID environment variable',
        !config.hasClientSecret && 'Set REDDIT_CLIENT_SECRET environment variable',
        !config.hasRedirectUri && 'Set NEXT_PUBLIC_REDDIT_REDIRECT_URI environment variable',
        !config.hasUserAgent && 'Set REDDIT_USER_AGENT environment variable',
        serviceTest.error && `Fix service error: ${serviceTest.error}`,
        connectionStatus.error && `Fix connection check: ${connectionStatus.error}`,
      ].filter(Boolean),
    });

  } catch (error) {
    console.error('Reddit test auth error:', error);
    
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
        message: 'Failed to test Reddit OAuth configuration'
      },
      { status: 500 }
    );
  }
}