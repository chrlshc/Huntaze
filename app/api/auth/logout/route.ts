import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Clear auth cookies
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
  });
  
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}