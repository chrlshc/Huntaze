'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { isMockApiMode } from '@/config/api-mode';

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
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const mockMode = isMockApiMode();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (mockMode) return;

    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // Redirect to auth if not authenticated
    if (status === 'unauthenticated' || !session) {
      const currentQuery = searchParams.toString();
      const callbackUrl = `${pathname}${currentQuery ? `?${currentQuery}` : ''}`;
      const target = new URL(redirectTo, window.location.origin);
      target.searchParams.set('callbackUrl', callbackUrl);
      target.searchParams.set('error', 'session_expired');
      router.replace(`${target.pathname}?${target.searchParams.toString()}`);
      return;
    }

    // Check onboarding status if required
    if (requireOnboarding && session.user && !session.user.onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }
  }, [mockMode, status, session, requireOnboarding, redirectTo, router, searchParams, pathname]);

  // In mock mode, bypass auth to enable demos/videos.
  if (mockMode) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return <DashboardLoadingState message="Loading session..." />;
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
