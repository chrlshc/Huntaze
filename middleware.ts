import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Local dev convenience: disable auth checks on localhost/non-production
  const host = request.nextUrl.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const DEV_MODE = process.env.NODE_ENV !== 'production' && isLocalhost;
  if (DEV_MODE) return NextResponse.next();

  // Staging: allow full bypass of auth gates for easier QA
  // You can toggle by domain or env var on Amplify
  const forwardedHost = request.headers.get('x-forwarded-host') || host;
  const isStagingDomain =
    forwardedHost === 'staging.huntaze.com' ||
    (forwardedHost?.startsWith('staging.') && forwardedHost?.endsWith('.amplifyapp.com'));
  const envBypass =
    process.env.STAGING_BYPASS_AUTH === 'true' ||
    process.env.NEXT_PUBLIC_STAGING_BYPASS_AUTH === 'true';
  if (isStagingDomain || envBypass) {
    return NextResponse.next();
  }

  // Single auth cookie
  const token = request.cookies.get('access_token')?.value;

  // Gating based on protected prefixes
  const protectedPrefixes = [
    // canonical
    '/dashboard',
    '/profile',
    '/settings',
    '/configure',
    '/analytics',
    '/messages',
    '/campaigns',
    '/fans',
    '/platforms',
    '/billing',
    '/social',
    '/content',
    '/cinai',
    '/manager-ai',
    // legacy nested
    '/app/app',
    // alias under /app/*
    '/app/dashboard',
    '/app/profile',
    '/app/settings',
    '/app/configure',
    '/app/analytics',
    '/app/messages',
    '/app/campaigns',
    '/app/fans',
    '/app/platforms',
    '/app/billing',
    '/app/social',
    '/app/manager-ai',
    '/app/onlyfans',
    '/app/content',
    '/app/cinai',
  ];

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith('/onboarding');
  const isAuth = pathname.startsWith('/auth') || pathname.startsWith('/join');
  const isOAuth = ['/auth/tiktok', '/auth/instagram', '/auth/reddit', '/auth/google'].some((r) => pathname.startsWith(r));
  const isTest = pathname.includes('/test-') || pathname.includes('/tiktok-diagnostic') || pathname.includes('/debug-');

  // Not authenticated → redirect to auth for protected/onboarding
  if (!token && (isProtected || isOnboarding)) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Authenticated → enforce onboarding cookie except OAuth/test routes
  if (token && isProtected && !isOAuth && !isTest) {
    const onboarded = request.cookies.get('onboarding_completed')?.value === 'true';
    if (!onboarded) {
      const to = new URL('/onboarding', request.url);
      to.searchParams.set('next', pathname);
      return NextResponse.redirect(to);
    }
  }

  // Authenticated visiting auth routes → redirect to app
  if (token && isAuth && !isOAuth) {
    return NextResponse.redirect(new URL('/app/app/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // canonical
    '/dashboard',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/configure/:path*',
    '/analytics/:path*',
    '/messages/:path*',
    '/campaigns/:path*',
    '/fans/:path*',
    '/platforms/:path*',
    '/billing/:path*',
    '/social/:path*',
    '/content/:path*',
    '/cinai/:path*',
    '/manager-ai/:path*',
    // legacy nested
    '/app/app',
    '/app/app/:path*',
    // alias under /app/*
    '/app/dashboard',
    '/app/dashboard/:path*',
    '/app/profile/:path*',
    '/app/settings/:path*',
    '/app/configure/:path*',
    '/app/analytics/:path*',
    '/app/messages/:path*',
    '/app/campaigns/:path*',
    '/app/fans/:path*',
    '/app/platforms/:path*',
    '/app/billing/:path*',
    '/app/social/:path*',
    '/app/manager-ai/:path*',
    '/app/onlyfans/:path*',
    '/app/content/:path*',
    '/app/cinai/:path*',
    '/onboarding/:path*',
    '/auth/:path*',
    '/join/:path*',
  ],
};
