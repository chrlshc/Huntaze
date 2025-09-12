import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { platform, action } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    if (action === 'connect') {
      const platformRoutes: Record<string, string> = {
        instagram: `${baseUrl}/api/auth/instagram`,
        tiktok: `${baseUrl}/api/auth/tiktok`,
        reddit: `${baseUrl}/api/auth/reddit`,
        onlyfans: `${baseUrl}/api/auth/onlyfans` // You'll need to implement this
      };

      if (platformRoutes[platform]) {
        return NextResponse.json({ 
          authUrl: platformRoutes[platform],
          message: `Connecting to ${platform}...`
        });
      }
    } else if (action === 'disconnect') {
      // Handle disconnection
      return NextResponse.json({ 
        success: true,
        message: `Disconnected from ${platform}`
      });
    }

    return NextResponse.json({ error: 'Invalid platform or action' }, { status: 400 });
  } catch (error) {
    console.error('Platform connection error:', error);
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}