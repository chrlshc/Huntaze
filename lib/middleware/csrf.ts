/**
 * CSRF Protection Middleware for Next.js 16 App Router
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * Compatible with Next.js 16.0.3 App Router.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * Features:
 * - GET request bypass (safe methods don't need CSRF protection)
 * - Token validation via header and cookie comparison
 * - Simple and efficient implementation
 * - Proper cookie domain configuration for production
 * 
 * Usage:
 * ```typescript
 * import { withCsrf } from '@/lib/middleware/csrf';
 * 
 * export const POST = withCsrf(async (req: NextRequest) => {
 *   // Your handler logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import type { RouteHandler } from './types';

/**
 * Generate a cryptographically secure CSRF token
 * 
 * @returns 64-character hex string
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Set CSRF token cookie on response with proper security settings
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * @param response - NextResponse to set cookie on
 * @param token - CSRF token to set (if not provided, generates a new one)
 * @returns Response with CSRF cookie set
 */
export function setCsrfTokenCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken();
  
  // Requirement 8.1: Use .huntaze.com domain in production
  // Requirement 8.2: No domain in development
  const domain = process.env.NODE_ENV === 'production'
    ? '.huntaze.com'
    : undefined;
  
  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: true, // Requirement 8.3: httpOnly in production
    secure: process.env.NODE_ENV === 'production', // Requirement 8.3: secure in production
    sameSite: 'lax', // Requirement 8.4: sameSite 'lax'
    domain,
    maxAge: 60 * 60 * 24, // Requirement 8.5: 24-hour expiration
    path: '/',
  });
  
  return response;
}

/**
 * CSRF middleware wrapper following the design spec
 * 
 * Implements simple double-submit cookie pattern:
 * - Compares header token with cookie token
 * - Skips validation for GET requests (safe methods)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * @param handler - Route handler to wrap
 * @returns Wrapped route handler with CSRF protection
 */
export function withCsrf(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    // Skip for GET requests (Requirement 4.1)
    if (req.method === 'GET') {
      return handler(req);
    }

    // Get tokens (Requirement 4.3)
    const headerToken = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;

    // Validate (Requirement 4.4)
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Validation succeeded, call handler (Requirement 4.5)
    return handler(req);
  };
}
