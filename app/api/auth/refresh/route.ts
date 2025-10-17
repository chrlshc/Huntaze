import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { applyRateLimit } from '@/lib/rate-limit';
import { setAuthCookies, extractToken } from '@/lib/cookies';
import { configureAmplify } from '@/lib/amplify-config';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

// Initialize Amplify
configureAmplify();

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Rate limiting - 10 refreshes per minute
    const rateLimitResponse = applyRateLimit(request, 10, 60 * 1000, 'normal');
    if (rateLimitResponse) return rateLimitResponse;

    // Extract refresh token from cookies
    const cookies = request.headers.get('Cookie');
    if (!cookies) {
      const r = NextResponse.json({ error: 'No refresh token provided', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const refreshToken = cookies
      .split(';')
      .find(c => c.trim().startsWith('refreshToken='))
      ?.split('=')[1];

    if (!refreshToken) {
      const r = NextResponse.json({ error: 'No refresh token provided', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    try {
      // Use AWS SDK to refresh tokens
      const command = new InitiateAuthCommand({
        ClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('No authentication result returned');
      }

      // Prepare response
      const nextResponse = NextResponse.json({
        success: true,
        message: 'Tokens refreshed successfully',
        requestId,
      }, { status: 200 });

      // Set new tokens in cookies
      setAuthCookies(nextResponse, {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        // Refresh token is not returned on refresh, keep the existing one
      });

      // Log token refresh
      log.info('auth_refresh_success');

      return nextResponse;

    } catch (cognitoError: any) {
      log.error('auth_refresh_cognito_error', { error: cognitoError?.message || 'unknown_error' });
      
      // Handle specific Cognito errors
      if (cognitoError.name === 'NotAuthorizedException') {
        const r = NextResponse.json({ error: 'Refresh token is invalid or expired', requestId }, { status: 401 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      throw cognitoError;
    }

  } catch (error: any) {
    log.error('auth_refresh_failed', { error: error?.message || 'unknown_error' });
    
    const r = NextResponse.json({ error: 'Failed to refresh tokens', requestId, message: process.env.NODE_ENV === 'development' ? String(error) : undefined }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
