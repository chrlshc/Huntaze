import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { rateLimit } from '@/lib/rate-limit';
import { CSRF_HEADER_NAME, generateCSRFToken, getCSRFCookieName } from '@/lib/security/csrf';

type LegacyRoute = {
  prefix: string;
  target: string;
};

const legacyAppRoutes: LegacyRoute[] = [
  { prefix: '/app/app/messages', target: '/dashboard/messages' },
  { prefix: '/app/app/analytics', target: '/dashboard/analytics' },
  { prefix: '/app/app/fans', target: '/dashboard/fans' },
  { prefix: '/app/app/settings', target: '/dashboard/settings' },
  { prefix: '/app/app/profile', target: '/dashboard/settings' },
  { prefix: '/app/app/configure', target: '/dashboard/settings' },
  { prefix: '/app/app/billing', target: '/dashboard/settings' },
  { prefix: '/app/app/huntaze-ai', target: '/dashboard/messages' },
  { prefix: '/app/app/onlyfans', target: '/dashboard/messages' },
  { prefix: '/app/app/manager-ai', target: '/dashboard/messages' },
  { prefix: '/app/app/social', target: '/dashboard/messages' },
  { prefix: '/app/app/campaigns', target: '/dashboard/messages' },
  { prefix: '/app/app/automations', target: '/dashboard/messages' },
  { prefix: '/app/app/platforms', target: '/dashboard/messages' },
  { prefix: '/app/app/content', target: '/dashboard/messages' },
  { prefix: '/app/app/cinai', target: '/dashboard/messages' },
  { prefix: '/app/messages', target: '/dashboard/messages' },
  { prefix: '/app/analytics', target: '/dashboard/analytics' },
  { prefix: '/app/fans', target: '/dashboard/fans' },
  { prefix: '/app/settings', target: '/dashboard/settings' },
  { prefix: '/app/profile', target: '/dashboard/settings' },
  { prefix: '/app/configure', target: '/dashboard/settings' },
  { prefix: '/app/billing', target: '/dashboard/settings' },
  { prefix: '/app/huntaze-ai', target: '/dashboard/messages' },
  { prefix: '/app/onlyfans', target: '/dashboard/messages' },
  { prefix: '/app/manager-ai', target: '/dashboard/messages' },
  { prefix: '/app/social', target: '/dashboard/messages' },
  { prefix: '/app/campaigns', target: '/dashboard/messages' },
  { prefix: '/app/automations', target: '/dashboard/messages' },
  { prefix: '/app/platforms', target: '/dashboard/messages' },
  { prefix: '/app/content', target: '/dashboard/messages' },
  { prefix: '/app/cinai', target: '/dashboard/messages' },
  { prefix: '/app/app', target: '/dashboard/messages' },
  { prefix: '/app', target: '/dashboard/messages' },
].sort((a, b) => b.prefix.length - a.prefix.length);

function extractHost(value: string | null | undefined): string {
  if (!value) return '';
  const host = value.split(',')[0]?.trim() || '';
  const [hostname] = host.split(':');
  return (hostname || '').toLowerCase();
}

function getAppDomains(): string[] {
  const domains = new Set<string>(['app.huntaze.com']);
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      if (parsed.hostname) domains.add(parsed.hostname.toLowerCase());
    } catch {
      // ignore malformed URLs
    }
  }
  return Array.from(domains);
}

function getRootDomains(): string[] {
  const domains = new Set<string>(['huntaze.com', 'www.huntaze.com']);
  const envUrl = process.env.NEXT_PUBLIC_MARKETING_URL || process.env.NEXT_PUBLIC_ROOT_URL;
  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      if (parsed.hostname) {
        domains.add(parsed.hostname.toLowerCase());
        if (parsed.hostname.startsWith('www.')) {
          domains.add(parsed.hostname.slice(4));
        } else {
          domains.add(`www.${parsed.hostname}`);
        }
      }
    } catch {
      // ignore malformed URLs
    }
  }
  return Array.from(domains);
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // Never intercept Next.js internals or static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.match(/\.[a-zA-Z0-9]+$/) // any file extension
  ) {
    return NextResponse.next();
  }
  const normalisedPathname =
    pathname !== '/' && pathname.endsWith('/') ? pathname.replace(/\/+$/, '') : pathname;

  // Cross-domain routing: marketing vs app subdomain
  const urlHost = extractHost(request.nextUrl.hostname);
  const headerHost = extractHost(request.headers.get('host')) || urlHost;
  const forwardedHost = extractHost(request.headers.get('x-forwarded-host')) || headerHost;
  const activeHost = forwardedHost || headerHost || urlHost;
  const appDomains = getAppDomains();
  const rootDomains = getRootDomains();
  const primaryAppDomain = appDomains[0] || 'app.huntaze.com';
  const primaryRootDomain = rootDomains.find((domain) => !domain.startsWith('www.')) || rootDomains[0] || 'huntaze.com';
  const isRootDomain = rootDomains.includes(activeHost);
  const isAppDomain = appDomains.includes(activeHost);

  const domainProtectedPrefixes = [
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
  ];

  if (isRootDomain && domainProtectedPrefixes.some((p) => normalisedPathname === p || normalisedPathname.startsWith(p + '/'))) {
    const target = new URL(request.url);
    target.hostname = primaryAppDomain;
    return NextResponse.redirect(target, { status: 302 });
  }

  if (isAppDomain && normalisedPathname === '/') {
    const to = new URL('/dashboard', request.url);
    return NextResponse.redirect(to, { status: 302 });
  }

  // On app.huntaze.com, redirect non-app marketing pages to root domain
  const isAppPath = (
    domainProtectedPrefixes.some((p) => normalisedPathname === p || normalisedPathname.startsWith(p + '/')) ||
    normalisedPathname.startsWith('/auth') ||
    normalisedPathname.startsWith('/join') ||
    normalisedPathname.startsWith('/api') ||
    normalisedPathname.startsWith('/_next') ||
    normalisedPathname.startsWith('/favicon') ||
    normalisedPathname.startsWith('/manifest') ||
    normalisedPathname.startsWith('/icons') ||
    normalisedPathname.startsWith('/fonts') ||
    normalisedPathname.startsWith('/images') ||
    normalisedPathname.startsWith('/assets') ||
    /\.[a-zA-Z0-9]+$/.test(normalisedPathname)
  );
  if (isAppDomain && !isAppPath) {
    const target = new URL(request.url);
    target.hostname = primaryRootDomain;
    return NextResponse.redirect(target, { status: 302 });
  }

  const legacyMatch = legacyAppRoutes.find(
    ({ prefix }) =>
      normalisedPathname === prefix || normalisedPathname.startsWith(`${prefix}/`),
  );

  if (legacyMatch) {
    const targetUrl = new URL(legacyMatch.target, request.url);
    const searchString = searchParams.toString();
    if (searchString) {
      targetUrl.search = `?${searchString}`;
    }
    return NextResponse.redirect(targetUrl);
  }

  const isSensitiveApi =
    pathname.startsWith('/api/onlyfans') ||
    pathname.startsWith('/api/analytics') ||
    pathname.startsWith('/api/cin');

  let rateLimitRemaining: number | undefined;
  if (isSensitiveApi) {
    const { ok, remaining } = rateLimit(request, { windowMs: 60_000, max: 60 });
    if (!ok) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
    rateLimitRemaining = remaining;
  }

  // Local dev convenience: disable auth checks on localhost/non-production
  const isLocalhost = activeHost === 'localhost' || activeHost === '127.0.0.1' || activeHost === '0.0.0.0';
  const DEV_MODE = process.env.NODE_ENV !== 'production' && isLocalhost;
  if (DEV_MODE) return NextResponse.next();

  // Production: no staging bypass. All non-local hosts are gated by the rules below.

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
    return NextResponse.redirect(new URL('/dashboard/messages', request.url));
  }

  const response = NextResponse.next();
  const cookieDomain = process.env.NEXT_PUBLIC_DOMAIN || host;
  const secureCookies = process.env.NODE_ENV === 'production';

  if (rateLimitRemaining !== undefined) {
    response.headers.set('X-RateLimit-Remaining', String(rateLimitRemaining));
    response.headers.set('X-RateLimit-Window', '60');
  }

  if (token) {
    response.cookies.set('access_token', token, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 24,
    });
  }

  const csrfCookieName = getCSRFCookieName();
  let csrfToken = request.cookies.get(csrfCookieName)?.value;
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
    response.cookies.set(csrfCookieName, csrfToken, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  if (request.method === 'GET') {
    response.headers.set(CSRF_HEADER_NAME, csrfToken ?? '');
  }

  return response;
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
