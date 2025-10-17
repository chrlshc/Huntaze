import { NextRequest, NextResponse } from 'next/server';
import { confirmSignUp, signIn } from 'aws-amplify/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { setAuthCookies } from '@/lib/cookies';
import { z } from 'zod';
import { configureAmplify } from '@/lib/amplify-config';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

// Initialize Amplify
configureAmplify();

// Validation schema
const confirmSignUpSchema = z.object({
  email: z.string().email(),
  confirmationCode: z.string().length(6, 'Code must be 6 digits'),
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
    const validationResult = confirmSignUpSchema.safeParse(body);
    if (!validationResult.success) {
      const r = NextResponse.json({ error: 'Validation failed', details: validationResult.error.flatten(), requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { email, confirmationCode } = validationResult.data;

    try {
      // Confirm the signup
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email,
        confirmationCode,
      });

      if (!isSignUpComplete) {
        return NextResponse.json({
          success: false,
          nextStep: nextStep?.signUpStep,
          message: 'Additional steps required',
        }, { status: 200 });
      }

      // Auto sign in after confirmation
      try {
        const { isSignedIn, nextStep: signInNextStep } = await signIn({
          username: email,
          // We need the password to auto-login, so we'll just confirm and let them login manually
          password: '', // This won't work, so we'll handle the error
        });
      } catch (autoSignInError) {
        // Expected - user needs to login with their password
        log.info('confirm_signup_auto_signin_unavailable');
      }

      const r = NextResponse.json({
        success: true,
        message: 'Email verified successfully. Please login to continue.',
        redirect: '/auth?verified=true',
        requestId,
      }, { status: 200 });
      r.headers.set('X-Request-Id', requestId);
      return r;

    } catch (cognitoError: any) {
      log.error('confirm_signup_cognito_error', { error: cognitoError?.message || 'unknown_error' });
      
      // Handle specific Cognito errors
      if (cognitoError.name === 'CodeMismatchException') {
        const r = NextResponse.json({ error: 'Invalid verification code', requestId }, { status: 400 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
      
      if (cognitoError.name === 'ExpiredCodeException') {
        const r = NextResponse.json({ error: 'Verification code has expired. Please request a new one.', requestId }, { status: 400 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      if (cognitoError.name === 'NotAuthorizedException') {
        const r = NextResponse.json({ error: 'User already confirmed', requestId }, { status: 400 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      throw cognitoError;
    }

  } catch (error: any) {
    log.error('confirm_signup_failed', { error: error?.message || 'unknown_error' });
    
    const r = NextResponse.json({ error: 'Failed to verify email', message: process.env.NODE_ENV === 'development' ? String(error) : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

// Resend confirmation code
export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Rate limiting - 3 resends per hour
    const rateLimitResponse = applyRateLimit(request, 3, 60 * 60 * 1000, 'strict');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { email } = body;

    if (!email || !z.string().email().safeParse(email).success) {
      const r = NextResponse.json({ error: 'Valid email is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Import resendSignUpCode from amplify
    const { resendSignUpCode } = await import('aws-amplify/auth');

    try {
      const { destination, attributeName, deliveryMedium } = await resendSignUpCode({
        username: email,
      });

      const r = NextResponse.json({
        success: true,
        message: `Verification code sent to ${destination}`,
        deliveryMedium,
        requestId,
      }, { status: 200 });
      r.headers.set('X-Request-Id', requestId);
      return r;

    } catch (cognitoError: any) {
      log.error('resend_code_cognito_error', { error: cognitoError?.message || 'unknown_error' });
      
      if (cognitoError.name === 'LimitExceededException') {
        const r = NextResponse.json({ error: 'Too many attempts. Please try again later.', requestId }, { status: 429 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      throw cognitoError;
    }

  } catch (error: any) {
    log.error('resend_code_failed', { error: error?.message || 'unknown_error' });
    
    const r = NextResponse.json({ error: 'Failed to resend verification code', message: process.env.NODE_ENV === 'development' ? String(error) : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
