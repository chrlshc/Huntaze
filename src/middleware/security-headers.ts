import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function addSecurityHeaders(request: NextRequest, response: NextResponse) {
  // Generate nonce for CSP (Edge Runtime compatible)
  const nonce = Buffer.from(Date.now().toString()).toString('base64');
  
  // Store nonce in response for use in scripts
  response.headers.set('X-Nonce', nonce);

  // Content Security Policy
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://app.posthog.com`,
    `style-src 'self' 'unsafe-inline'`, // Allow inline styles for now (can be stricter)
    `img-src 'self' data: https: blob:`,
    `font-src 'self'`,
    `connect-src 'self' https://api.stripe.com https://app.posthog.com wss://app.posthog.com`,
    `media-src 'self' blob:`,
    `object-src 'none'`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // Strict Transport Security (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Frame-Options (Clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options (MIME type sniffing protection)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // X-XSS-Protection (for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Cross-Origin-Embedder-Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin-Opener-Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Resource-Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Remove potentially dangerous headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}