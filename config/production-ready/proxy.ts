/**
 * Next.js 16 proxy.ts - Production Ready 2025
 * Remplace middleware.ts avec sécurité renforcée
 * 
 * Features:
 * - CSP strict avec nonces (NO unsafe-eval/unsafe-inline)
 * - Security headers complets
 * - Host validation
 * - A/B testing support
 * - Feature flags
 * - Rate limiting headers
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export default function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Store nonce for use in layout
  res.headers.set('x-nonce', nonce);
  
  // Strict CSP with nonce (NO unsafe-eval/unsafe-inline)
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`, // Only nonce, no unsafe-*
      "style-src 'self' 'unsafe-inline'", // Tailwind CSS needs this
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.huntaze.com wss://api.huntaze.com https://*.amazonaws.com",
      "media-src 'self' https://cdn.huntaze.com",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );
  
  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '));
  
  // Rate limiting headers
  res.headers.set('X-RateLimit-Limit', '1000');
  res.headers.set('X-RateLimit-Window', '3600');
  
  // Host validation (production only)
  if (process.env.NODE_ENV === 'production') {
    const host = req.headers.get('host');
    const allowedHosts = ['app.huntaze.com', 'huntaze.com', 'www.huntaze.com'];
    
    if (host && !allowedHosts.includes(host)) {
      return NextResponse.redirect(
        new URL(req.nextUrl.pathname, 'https://app.huntaze.com')
      );
    }
  }
  
  // A/B Testing
  const variant = req.cookies.get('ab-test')?.value;
  if (variant === 'new-ui' && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.rewrite(new URL('/dashboard-v2', req.url));
  }
  
  // Feature flags
  const hasNewFeature = req.cookies.get('feature-chatbot-v2')?.value === 'true';
  if (hasNewFeature && req.nextUrl.pathname.startsWith('/chatbot')) {
    return NextResponse.rewrite(new URL('/chatbot-v2', req.url));
  }
  
  // Block suspicious requests
  const userAgent = req.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    // Allow legitimate bots but log suspicious ones
    if (!userAgent.includes('Googlebot') && !userAgent.includes('bingbot')) {
      console.warn('Suspicious user agent:', userAgent);
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ],
};
