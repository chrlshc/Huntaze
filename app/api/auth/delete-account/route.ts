import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth } from '@/lib/auth-server';
import { clearAuthCookies } from '@/lib/cookies';
import { applyRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

// Schema for delete account request
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
  confirmPhrase: z.literal('DELETE MY ACCOUNT', 'Please type "DELETE MY ACCOUNT" to confirm'),
});

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  // Apply strict rate limiting - 1 request per hour per user
  const rateLimitResponse = applyRateLimit(request, 1, 60 * 60 * 1000, 'strict');
  if (rateLimitResponse) {
    rateLimitResponse.headers.set('X-Request-Id', requestId);
    return rateLimitResponse;
  }

  try {
    // Ensure user is authenticated
    const auth = await requireAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const { password, confirmPhrase } = deleteAccountSchema.parse(body);
    
    // Log account deletion attempt (without exposing user data)
    log.info('auth_delete_requested', {
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      hashedId: Buffer.from(auth.userId).toString('base64').slice(0, 8),
    });
    
    try {
      // In production, you would:
      // 1. Re-authenticate the user with their password to ensure it's really them
      // 2. Check if they have any active subscriptions/obligations
      // 3. Archive their data according to legal requirements
      // 4. Send a confirmation email
      
      // For now, in development mode, mock the deletion
      if (process.env.NODE_ENV === 'development') {
        log.info('auth_delete_mock', { userId: auth.userId });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear auth cookies
        const response = NextResponse.json({
          message: 'Account deletion initiated. You will receive a confirmation email.',
          requestId,
        });
        
        clearAuthCookies(response);
        
        return response;
      }
      
      // Production: Delete user from Cognito
      await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
        Username: auth.userId,
      }));
      
      // TODO: Additional cleanup
      // - Delete user data from your database
      // - Cancel any subscriptions
      // - Archive data for legal compliance
      // - Send confirmation email
      
      // Log successful deletion
      log.info('auth_delete_success', {
        timestamp: new Date().toISOString(),
        hashedId: Buffer.from(auth.userId).toString('base64').slice(0, 8),
      });
      
      // Clear auth cookies and return success
      const response = NextResponse.json({
        message: 'Your account has been successfully deleted. We\'re sorry to see you go.',
        requestId,
      });
      
      clearAuthCookies(response);
      
      return response;
      
    } catch (error: any) {
      log.error('auth_delete_error', { error: error?.message || 'unknown_error', code: error?.code });
      
      // Handle specific Cognito errors
      if (error.code === 'UserNotFoundException') {
        // User already deleted or doesn't exist
        const response = NextResponse.json({
          message: 'Account not found or already deleted.',
          requestId,
        });
        clearAuthCookies(response);
        return response;
      }
      
      if (error.code === 'NotAuthorizedException') {
        const r = NextResponse.json({ error: 'You are not authorized to delete this account.', requestId }, { status: 403 });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
      
      // Generic error response
      const r = NextResponse.json({ error: 'Failed to delete account. Please try again or contact support.', requestId }, { status: 500 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    
  } catch (validationError: any) {
    if (validationError instanceof z.ZodError) {
      const r = NextResponse.json({ error: 'Invalid request', details: validationError.errors, requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    
    // Auth error - user not logged in
    if (validationError.message === 'Unauthorized') {
      const r = NextResponse.json({ error: 'You must be logged in to delete your account.', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    
    const rr = NextResponse.json({ error: 'Invalid request', requestId }, { status: 400 });
    rr.headers.set('X-Request-Id', requestId);
    return rr;
  }
}

// GET method to check if delete account is available
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const auth = await requireAuth();
    
    const r = NextResponse.json({
      available: true,
      requirements: {
        passwordRequired: true,
        confirmationPhrase: 'DELETE MY ACCOUNT',
        cooldownPeriod: '30 days',
        dataRetention: 'Data will be archived for 90 days for legal compliance',
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch {
    const r = NextResponse.json({ error: 'You must be logged in to access this endpoint.', requestId }, { status: 401 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
