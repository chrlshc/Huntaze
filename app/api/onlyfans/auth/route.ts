import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { OnlyFansAuthManager } from '@/lib/onlyfans/backend-integration/auth-manager';
import { SecureSessionStorage } from '@/lib/onlyfans/backend-integration/secure-session-storage';
import { TwoFactorManager } from '@/lib/onlyfans/backend-integration/2fa-manager';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const { email, password, action } = await request.json();

    if (!email || !password) {
      const r = NextResponse.json(
        { error: 'Email and password are required', requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const authManager = new OnlyFansAuthManager();
    const sessionStorage = new SecureSessionStorage();
    const twoFactorManager = new TwoFactorManager();

    // Start authentication
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if 2FA is needed
    const needs2FA = true; // In real implementation, check after initial auth attempt

    if (needs2FA) {
      // Request 2FA code
      await twoFactorManager.request2FACode(sessionId, email, {
        method: 'websocket',
        priority: 'high'
      });

      const r = NextResponse.json({
        status: 'requires_2fa',
        sessionId,
        requestId,
        message: '2FA code has been sent. Please submit it to complete authentication.'
      });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // If no 2FA needed, complete auth
    const session = await authManager.authenticate(email, password);
    
    // Store session securely
    await sessionStorage.storeSession(email, session);

    const r = NextResponse.json({
      status: 'authenticated',
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('of_auth_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error.message || 'Authentication failed', requestId },
      { status: 500 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
