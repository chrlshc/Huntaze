import { NextRequest, NextResponse } from 'next/server';
import { signUp } from 'aws-amplify/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { configureAmplify } from '@/lib/amplify-config';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';

// Initialize Amplify
configureAmplify();

// Validation schema
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(14, 'Password must be at least 14 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter') 
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  marketingConsent: z.boolean().optional(),
  timezone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Rate limiting - 3 signups per hour
    const rateLimitResponse = applyRateLimit(request, 3, 60 * 60 * 1000, 'strict');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate request
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      const r = NextResponse.json({ error: 'Validation failed', details: validationResult.error.flatten(), requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { email, password, marketingConsent, timezone } = validationResult.data;

    try {
      // Create user in Cognito
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        attributes: {
          email,
          locale: request.headers.get('Accept-Language')?.split(',')[0] || 'en',
          zoneinfo: timezone || 'America/New_York',
          'custom:marketing_consent': marketingConsent ? 'true' : 'false',
        }
      });

      // Log signup event
      log.info('auth_signup_success', redactObj({ email, userId }));

      const r = NextResponse.json({
        success: true,
        userId: userId,
        nextStep: nextStep.signUpStep,
        message: 'Please check your email for verification code',
        requestId,
      }, { 
        status: 201,
        headers: {
          'X-User-Id': userId || '',
          'X-Request-Id': requestId,
        }
      });
      return r;

    } catch (cognitoError: any) {
      log.error('auth_signup_cognito_error', { error: cognitoError?.message || 'unknown_error' });
      
      // Handle specific Cognito errors
      if (cognitoError.name === 'UsernameExistsException') {
        const r = NextResponse.json({ error: 'User already exists', requestId }, { status: 409 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
      
      if (cognitoError.name === 'InvalidPasswordException') {
        const r = NextResponse.json({ error: 'Password does not meet requirements', requestId }, { status: 400 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }

      throw cognitoError;
    }

  } catch (error: any) {
    log.error('auth_signup_failed', { error: error?.message || 'unknown_error' });
    
    const r = NextResponse.json({ error: 'Failed to create account', message: process.env.NODE_ENV === 'development' ? String(error) : undefined, requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
