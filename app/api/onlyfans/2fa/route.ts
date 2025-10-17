import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { TwoFactorAuthManager } from '@/lib/onlyfans/backend-integration/2fa-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const r = NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { sessionId, code } = await req.json();

    if (!sessionId || !code) {
      const r = NextResponse.json(
        { error: 'Missing sessionId or code', requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const manager = new TwoFactorAuthManager();
    const success = await manager.submit2FACode(sessionId, code);

    const r = NextResponse.json({ success, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const log = makeReqLogger({ requestId, userId: (await getServerSession(authOptions))?.user?.id });
    log.error('of_2fa_submit_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error.message || 'Failed to submit 2FA code', requestId },
      { status: 400 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const r = NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      const r = NextResponse.json(
        { error: 'Missing sessionId', requestId },
        { status: 400 }
      );
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Check if 2FA code has been submitted
    const manager = new TwoFactorAuthManager();
    const code = await manager.getCode(sessionId);

    if (code) {
      const r = NextResponse.json({ 
        status: 'completed',
        code,
        requestId,
      });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const status = await manager.getStatus(sessionId);
    if (status === 'expired') {
      const r = NextResponse.json({ 
        status: 'expired',
        error: '2FA session expired',
        requestId,
      });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const r = NextResponse.json({ 
      status,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const log = makeReqLogger({ requestId, userId: (await getServerSession(authOptions))?.user?.id });
    log.error('of_2fa_check_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json(
      { error: error.message || 'Failed to check 2FA status', requestId },
      { status: 400 }
    );
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
