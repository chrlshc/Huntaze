import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'aws-amplify/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { setAuthCookies } from '@/lib/cookies';
import { z } from 'zod';
import { configureAmplify } from '@/lib/amplify-config';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';

// Initialize Amplify
configureAmplify();

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Rate limiting - 5 attempts per 15 minutes
    const rateLimitResponse = applyRateLimit(request, 5, 15 * 60 * 1000, 'strict');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate request
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const r = NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten(), requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { email, password, rememberMe } = validationResult.data;

    try {
      // Sign in with Cognito
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      // Handle MFA or other challenges
      if (nextStep) {
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            {
              const r = NextResponse.json({
              success: false,
              requiresMFA: true,
              mfaType: nextStep.signInStep,
              message: 'MFA code required',
              requestId,
            }, { status: 200 });
              r.headers.set('X-Request-Id', requestId);
              return r;
            }
            
          case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION':
            {
              const r = NextResponse.json({
              success: false,
              requiresMFA: true,
              mfaType: 'SELECT_MFA_TYPE',
              allowedMFATypes: nextStep.allowedMFATypes,
              message: 'Select MFA method',
              requestId,
            }, { status: 200 });
              r.headers.set('X-Request-Id', requestId);
              return r;
            }
            
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            {
              const r = NextResponse.json({
              success: false,
              requiresNewPassword: true,
              message: 'New password required',
              requestId,
            }, { status: 200 });
              r.headers.set('X-Request-Id', requestId);
              return r;
            }
            
          case 'RESET_PASSWORD':
            {
              const r = NextResponse.json({
              success: false,
              requiresPasswordReset: true,
              message: 'Password reset required',
              requestId,
            }, { status: 200 });
              r.headers.set('X-Request-Id', requestId);
              return r;
            }
        }
      }

      if (!isSignedIn) {
        throw new Error('Sign in failed');
      }

      // Get the current auth tokens from Amplify
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        throw new Error('No tokens returned from sign in');
      }

      // Prepare response
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        redirect: '/dashboard',
        user: {
          email,
          sub: session.userSub,
        },
        requestId,
      }, { status: 200 });

      // Set secure cookies with tokens
      setAuthCookies(response, {
        accessToken: session.tokens.accessToken.toString(),
        refreshToken: session.tokens.refreshToken?.toString(),
        idToken: session.tokens.idToken?.toString(),
      });

      // Log successful login
      log.info('auth_login_success', redactObj({ email }));

      response.headers.set('X-Request-Id', requestId);
      return response;

    } catch (cognitoError: any) {
      log.error('auth_login_cognito_error', { error: cognitoError?.message || 'unknown_error' });
      
      // Handle specific Cognito errors
      if (cognitoError.name === 'NotAuthorizedException') {
        const r = NextResponse.json({ error: 'Invalid email or password', requestId }, { status: 401 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
      
      if (cognitoError.name === 'UserNotConfirmedException') {
        {
          const r = NextResponse.json({ error: 'Email not verified', requiresConfirmation: true, email, requestId }, { status: 403 });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
      }

      if (cognitoError.name === 'PasswordResetRequiredException') {
        {
          const r = NextResponse.json({ error: 'Password reset required', requiresPasswordReset: true, requestId }, { status: 403 });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
      }

      if (cognitoError.name === 'UserNotFoundException') {
        // Don't reveal if user exists or not for security
        const r = NextResponse.json({ error: 'Invalid email or password', requestId }, { status: 401 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      throw cognitoError;
    }

  } catch (error: any) {
    log.error('auth_login_failed', { error: error?.message || 'unknown_error' });
    
    const r = NextResponse.json({ error: 'Failed to login', requestId, message: process.env.NODE_ENV === 'development' ? String(error) : undefined }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

// Handle MFA confirmation
export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const body = await request.json();
    const { mfaCode, mfaType } = body;

    if (!mfaCode) {
      const r = NextResponse.json({ error: 'MFA code is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { confirmSignIn } = await import('aws-amplify/auth');

    try {
      const { isSignedIn, nextStep } = await confirmSignIn({
        challengeResponse: mfaCode,
      });

      if (!isSignedIn) {
        return NextResponse.json({
          success: false,
          nextStep: nextStep?.signInStep,
          message: 'Additional steps required',
        }, { status: 200 });
      }

      // Get the current auth tokens
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        throw new Error('No tokens returned from MFA confirmation');
      }

      // Prepare response
      const response = NextResponse.json({
        success: true,
        message: 'MFA verified successfully',
        redirect: '/dashboard',
        requestId,
      }, { status: 200 });

      // Set secure cookies with tokens
      setAuthCookies(response, {
        accessToken: session.tokens.accessToken.toString(),
        refreshToken: session.tokens.refreshToken?.toString(),
        idToken: session.tokens.idToken?.toString(),
      });

      return response;

    } catch (cognitoError: any) {
      log.error('auth_mfa_cognito_error', { error: cognitoError?.message || 'unknown_error' });
      
      if (cognitoError.name === 'CodeMismatchException') {
        const r = NextResponse.json({ error: 'Invalid MFA code', requestId }, { status: 400 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      throw cognitoError;
    }

  } catch (error: any) {
    log.error('auth_mfa_failed', { error: error?.message || 'unknown_error' });
    
    const r = NextResponse.json({ error: 'Failed to verify MFA', requestId, message: process.env.NODE_ENV === 'development' ? String(error) : undefined }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
