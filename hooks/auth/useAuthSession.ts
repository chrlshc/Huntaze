'use client';

import { useSession, signOut } from 'next-auth/react';
import { useCallback } from 'react';
import { Button } from "@/components/ui/button";

/**
 * User data from session
 */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  onboardingCompleted: boolean;
}

/**
 * Return type for useAuthSession hook
 */
export interface UseAuthSessionReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * useAuthSession Hook
 * 
 * Wrapper around NextAuth's useSession hook with additional utilities.
 * Provides convenient access to authentication state and session management.
 * 
 * @returns Authentication state and utilities
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, isAuthenticated, isLoading, logout } = useAuthSession();
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 * 
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}!</p>
 *       <Button variant="primary" onClick={logout}>Logout</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthSession(): UseAuthSessionReturn {
  const { data: session, status, update } = useSession();

  // Derive authentication state
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Extract user data
  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        onboardingCompleted: session.user.onboardingCompleted,
      }
    : null;

  /**
   * Logout function
   * Calls NextAuth signOut and redirects to /auth
   */
  const logout = useCallback(async () => {
    try {
      await signOut({
        callbackUrl: '/auth',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to auth page even if signOut fails
      window.location.href = '/auth';
    }
  }, []);

  /**
   * Refresh session function
   * Manually triggers a session refresh to get updated data from the server
   */
  const refreshSession = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, [update]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    refreshSession,
  };
}
