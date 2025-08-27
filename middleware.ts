import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/join'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get access token from cookie
  const accessToken = request.cookies.get('access_token')?.value;
  
  // Verify token
  const user = accessToken ? await verifyToken(accessToken) : null;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if route is auth route (login/join)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const url = new URL('/join', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Add user to request headers for use in server components
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-email', user.email);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|auth).*)',
  ],
};