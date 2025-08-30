import { NextRequest, NextResponse } from 'next/server';

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

    console.log('Testing token exchange with:', {
      url: tokenUrl,
      params: Object.fromEntries(params)
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();
    
    return NextResponse.json({
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}