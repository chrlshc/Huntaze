import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Forward to backend API
    const response = await fetch(`${API_URL}/ofm/rfm/recompute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      const r = NextResponse.json({ ...error, requestId }, { status: response.status });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Backend will handle async computation
    const r = NextResponse.json({ 
      status: 'scheduled',
      message: 'RFM segmentation recomputation has been scheduled',
      requestId,
    }, { status: 202 });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('rfm_recompute_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: error.message || 'Failed to schedule RFM recomputation', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
