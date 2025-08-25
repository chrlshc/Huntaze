import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addSecurityHeaders } from './middleware/security-headers';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/login', 
  '/register', 
  '/forgot-password', 
  '/api/auth/login', 
  '/api/auth/register',
  '/api/stripe/webhook', // Stripe webhooks need to be public
];

// Rate limiting store
const rateLimitMap = new Map<string, number[]>();

// Simple in-memory rate limiter
function rateLimit(identifier: string, limit: number = 10, window: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  
  // Remove old timestamps outside the window
  const validTimestamps = timestamps.filter(ts => now - ts < window);
  
  if (validTimestamps.length >= limit) {
    return false;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const identifier = `${ip}:${pathname}`;
    
    // Different limits for different endpoints
    let limit = 100; // Default: 100 requests per minute
    if (pathname.includes('/auth/')) limit = 20; // Auth endpoints: 20 per minute
    if (pathname.includes('/stripe/')) limit = 50; // Payment endpoints: 50 per minute
    
    if (!rateLimit(identifier, limit, 60000)) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Please try again later' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }
  }
  
  // For now, skip authentication and just add security headers
  const response = NextResponse.next();
  return addSecurityHeaders(request, response);
  
  // JWT authentication disabled for now
  // TODO: Add jose dependency or implement different auth method
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};