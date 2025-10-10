import { NextRequest, NextResponse } from 'next/server';

// Canonical entrypoint for "OnlyFans connect" auth flow.
// We don't have an OAuth with OnlyFans yet, so route users to the
// dedicated connect page under the app domain.
export async function GET(request: NextRequest) {
  const target = new URL('/platforms/connect/onlyfans', request.url);
  // Preserve optional plan or tracking params
  const sp = request.nextUrl.searchParams;
  sp.forEach((v, k) => {
    if (!target.searchParams.has(k)) target.searchParams.set(k, v);
  });
  return NextResponse.redirect(target, { status: 302 });
}

