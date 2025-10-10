import { NextRequest, NextResponse } from 'next/server';

// Canonical entrypoint for "OnlyFans connect" auth flow.
// Always build absolute URL against app domain to avoid localhost leaks.
export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
  const target = new URL('/platforms/connect/onlyfans', base);
  // Preserve optional plan or tracking params
  const sp = request.nextUrl.searchParams;
  sp.forEach((v, k) => {
    if (!target.searchParams.has(k)) target.searchParams.set(k, v);
  });
  return NextResponse.redirect(target, { status: 302 });
}
