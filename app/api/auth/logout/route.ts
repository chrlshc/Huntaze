import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  // Clear all auth cookies
  clearAuthCookies();

  // Redirect to home page
  return NextResponse.json({ success: true });
}