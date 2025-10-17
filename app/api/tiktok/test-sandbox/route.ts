import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const { code } = await request.json();
    
    // Test direct token exchange
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI!,
    });

    log.info('tiktok_sandbox_token_test', redactObj({ url: tokenUrl, params: Object.fromEntries(params) }));

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();
    
    const r = NextResponse.json({
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: String(error), requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
