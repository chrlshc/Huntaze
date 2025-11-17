'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, ReactNode, useState, useCallback } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to /auth.
 * Optionally checks onboarding status and redirects to /onboarding if incomplete.
 * Handles session expiration detection and provides refresh mechanism.
 * 
 * @param children - Content to render when authenticated
 * @param requireOnboarding - If true, redirects to /onboarding if not completed
 * @param redirectTo - Custom redirect path (defaults to /auth)
 */
export function ProtectedRoute({
  children,
  requireOnboarding = false,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Session refresh mechanism for active users
  // Refresh session every 5 minutes to extend active sessions
  const refreshSession = useCallback(async () => {
    if (status === 'authenticated' && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await update();
        console.log('[ProtectedRoute] Session refreshed');
      } catch (error) {
        console.error('[ProtectedRoute] Session refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [status, update, isRefreshing]);

  // Set up automatic session refresh for active users
  useEffect(() => {
    if (status === 'authenticated') {
      // Refresh session every 5 minutes
      const refreshInterval = setInterval(refreshSession, 5 * 60 * 1000);
      
      // Also refresh on user activity (mouse move, key press)
      let activityTimeout: NodeJS.Timeout;
      const handleActivity = () => {
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(refreshSession, 30 * 1000); // Refresh 30s after activity
      };
      
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keypress', handleActivity);
      
      return () => {
        clearInterval(refreshInterval);
        clearTimeout(activityTimeout);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keypress', handleActivity);
      };
    }
  }, [status, refreshSession]);

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // Redirect to auth if not authenticated
    if (status === 'unauthenticated' || !session) {
      // Add session expiration message if coming from an expired session
      const errorParam = searchParams.get('error');
      if (errorParam !== 'session_expired') {
        router.push(`${redirectTo}?error=session_expired`);
      } else {
        router.push(redirectTo);
      }
      return;
    }

    // Check onboarding status if required
    if (requireOnboarding && session.user && !session.user.onboardingCompleted) {
      router.push('/onboarding');
      return;
    }
  }, [status, session, requireOnboarding, redirectTo, router, searchParams]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  // Don't render children if onboarding is required but not completed
  if (requireOnboarding && session.user && !session.user.onboardingCompleted) {
    return null;
  }

  // Render children if authenticated (and onboarded if required)
  return <>{children}</>;
}
