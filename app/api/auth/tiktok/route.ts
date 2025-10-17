import { NextRequest, NextResponse } from 'next/server';
import { requireUser, HttpError } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  // Delegate to the client page which generates a proper PKCE S256 challenge
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  try {
    await requireUser();
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 401;
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }
  return NextResponse.redirect(`${appBase}/auth/tiktok`);
}
