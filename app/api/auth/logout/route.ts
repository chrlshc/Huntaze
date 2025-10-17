import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { signOut } from 'aws-amplify/auth';
import { clearAuthCookies } from '@/lib/cookies';
import { configureAmplify } from '@/lib/amplify-config';

// Initialize Amplify
configureAmplify();

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Sign out from Cognito
    try {
      await signOut();
      log.info('auth_logout_cognito_signed_out');
    } catch (cognitoError) {
      // Even if Cognito logout fails, we should clear local cookies
      log.error('auth_logout_cognito_error', { error: (cognitoError as any)?.message || 'unknown_error' });
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirect: '/auth',
      requestId,
    }, { status: 200 });

    // Clear all auth cookies
    clearAuthCookies(response);

    response.headers.set('X-Request-Id', requestId);
    return response;

  } catch (error: any) {
    log.error('auth_logout_failed', { error: error?.message || 'unknown_error' });
    
    // Even on error, try to clear cookies
    const errorResponse = NextResponse.json(
      { 
        error: 'Logout error occurred',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        redirect: '/auth', // Still redirect to auth page
        requestId,
      },
      { status: 500 }
    );
    
    clearAuthCookies(errorResponse);
    
    errorResponse.headers.set('X-Request-Id', requestId);
    return errorResponse;
  }
}
