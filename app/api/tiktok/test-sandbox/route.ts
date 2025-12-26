import { NextRequest, NextResponse } from 'next/server';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

export async function POST(request: NextRequest) {
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

    const response = await externalFetch(tokenUrl, {
      service: 'tiktok',
      operation: 'oauth.sandbox.exchange',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      timeoutMs: 10_000,
      retry: { maxRetries: 0, retryMethods: [] },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    
    return NextResponse.json({
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    if (isExternalServiceError(error)) {
      const status = error.code === 'TIMEOUT' ? 504 : 502;
      return NextResponse.json({ error: 'TikTok sandbox request failed', code: error.code }, { status });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
