/**
 * TikTok OAuth Callback Endpoint
 * 
 * Handles TikTok OAuth callback with proper state validation and token management
 * - Validates state (CSRF protection)
 * - Exchanges code for tokens using TikTokOAuthService
 * - Stores tokens using tokenManager
 * - Associates tokens with authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { tokenManager } from '@/lib/services/tokenManager';
import { oauthStateManager } from '@/lib/oauth/stateManager';
import { handleCallbackError, createSuccessRedirect } from '@/lib/oauth/errorHandler';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handleTokenExchange(
  code: string,
  state: string,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // 1. Get user from request (should be authenticated from init flow)
    const user = await getUserFromRequest(request);
    if (!user) {
      return handleCallbackError('unauthorized', request, 'tiktok', 'User not authenticated');
    }

    // 2. Validate state parameter (CSRF protection)
    const storedState = request.cookies.get('tiktok_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return handleCallbackError('invalid_state', request, 'tiktok');
    }

    // 3. Validate state in database
    const isValidState = await oauthStateManager.validateAndConsumeState(state, user.id, 'tiktok');
    if (!isValidState) {
      return handleCallbackError('invalid_state', request, 'tiktok');
    }

    // 4. Clear state cookie
    const response = NextResponse.next();
    response.cookies.delete('tiktok_oauth_state');

    // 5. Lazy import TikTok OAuth service
    const { tiktokOAuth } = await import('@/lib/services/tiktokOAuth');

    // 6. Exchange code for tokens
    const tokens = await tiktokOAuth.exchangeCodeForTokens(code);

    // 7. Get user info from TikTok
    const userInfo = await tiktokOAuth.getUserInfo(tokens.access_token);

    // 8. Calculate expiry date
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // 9. Store tokens using tokenManager
    await tokenManager.storeTokens({
      userId: user.id,
      provider: 'tiktok',
      openId: tokens.open_id,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        metadata: {
          union_id: userInfo.union_id,
          display_name: userInfo.display_name,
          avatar_url: userInfo.avatar_url,
          token_type: tokens.token_type,
          refresh_expires_in: tokens.refresh_expires_in,
        },
      },
    });

    // 10. Redirect to success page
    return createSuccessRedirect(request, 'tiktok', userInfo.display_name);
  } catch (error) {
    console.error('TikTok token exchange error:', error);
    
    // Determine error type and handle appropriately
    if (error instanceof Error) {
      if (error.message.includes('Token exchange failed') || error.message.includes('Failed to exchange')) {
        return handleCallbackError('token_exchange_failed', request, 'tiktok', error.message);
      }
      if (error.message.includes('Failed to get user info')) {
        return handleCallbackError('platform_error', request, 'tiktok', 'Failed to get user information');
      }
    }

    return handleCallbackError('callback_failed', request, 'tiktok', 'Failed to complete authorization');
  }
}

/**
 * Handle GET callback from TikTok (standard OAuth flow)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  try {
    // Handle OAuth errors from TikTok
    if (error) {
      return handleCallbackError(error, request, 'tiktok', errorDescription || undefined);
    }

    // Validate required parameters
    if (!code) {
      return handleCallbackError('missing_code', request, 'tiktok');
    }

    if (!state) {
      return handleCallbackError('invalid_request', request, 'tiktok', 'Missing state parameter');
    }

    // Process token exchange
    return await handleTokenExchange(code, state, request);
  } catch (error) {
    console.error('TikTok GET callback error:', error);
    return handleCallbackError('callback_failed', request, 'tiktok');
  }
}

/**
 * Handle POST callback (alternative flow)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, codeVerifier } = body;

    if (!code) {
      return handleCallbackError('missing_code', request, 'tiktok');
    }

    if (!state) {
      return handleCallbackError('invalid_request', request, 'tiktok', 'Missing state parameter');
    }

    // Note: codeVerifier is not currently used in our TikTok implementation
    // but could be added for PKCE support in the future

    return await handleTokenExchange(code, state, request);
  } catch (error) {
    console.error('TikTok POST callback error:', error);
    return handleCallbackError('callback_failed', request, 'tiktok');
  }
}
