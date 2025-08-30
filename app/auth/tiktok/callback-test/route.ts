import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  console.log('=== TikTok Callback Test ===');
  console.log('Code:', code ? 'Present' : 'Missing');
  console.log('All params:', Object.fromEntries(searchParams.entries()));
  
  // For testing, just set a simple cookie
  const cookieStore = cookies();
  cookieStore.set('tiktok_test', 'callback_received', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
  
  // Log environment variables
  console.log('Environment check:', {
    TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY ? 'Set' : 'Missing',
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ? 'Set' : 'Missing',
    NEXT_PUBLIC_TIKTOK_REDIRECT_URI: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI,
  });
  
  return NextResponse.redirect(
    new URL('/debug-tiktok-connection?callback=test', request.url)
  );
}