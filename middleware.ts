import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token
  const authToken = request.cookies.get('auth_token')?.value;
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/configure',
    '/analytics',
    '/messages',
    '/campaigns',
    '/fans',
    '/platforms',
    '/billing'
  ];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Onboarding route
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  
  // Auth routes
  const authRoutes = ['/auth', '/join'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If no auth token and trying to access protected route, redirect to auth
  if (!authToken && (isProtectedRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // If authenticated and accessing protected routes (not onboarding)
  if (authToken && isProtectedRoute) {
    try {
      // Check onboarding status
      const response = await fetch(new URL('/api/users/onboarding-status', request.url), {
        headers: {
          Cookie: `auth_token=${authToken}`,
        },
      });
      
      if (response.ok) {
        const status = await response.json();
        
        // If onboarding not completed, redirect to onboarding
        if (!status.completed) {
          return NextResponse.redirect(new URL('/onboarding/setup', request.url));
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  }
  
  // If authenticated and trying to access auth routes, redirect to dashboard
  if (authToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - static files
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|static).*)',
  ],
};
