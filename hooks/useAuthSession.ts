'use client';

/**
 * useAuthSession Hook
 * 
 * Wrapper around NextAuth's useSession with additional utilities
 * for error handling, logout, and session refresh.
 */

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import '@/lib/types/auth'; // Import type augmentation

export interface UseAuthSessionReturn {
  user: {
    id: string;
    email: string;
    name?: string | null;
    onboardingCompleted: boolean;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Custom hook for authentication session management
 * 
 * Provides convenient access to session data and authentication utilities.
 * 
 * @returns Authentication session data and utilities
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, isAuthenticated, logout } = useAuthSession();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.email}</p>
 *       <Button variant="primary" onClick={logout}>Logout</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthSession(): UseAuthSessionReturn {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Logout function that clears session and redirects
  const logout = useCallback(async () => {
    try {
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      }
      
      // Sign out with NextAuth
      await signOut({
        redirect: false,
      });

      // Redirect to auth page
      router.push('/auth');
    } catch {
      // Still redirect even if there's an error
      router.push('/auth');
    }
  }, [router]);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      throw error;
    }
  }, [update]);

  // Extract user data with proper type handling
  const sessionUser = session?.user as any;
  const user = sessionUser ? {
    id: sessionUser.id as string,
    email: sessionUser.email as string,
    name: sessionUser.name,
    onboardingCompleted: sessionUser.onboardingCompleted as boolean,
  } : null;

  return {
    user,
    isAuthenticated: status === 'authenticated' && !!session,
    isLoading: status === 'loading',
    logout,
    refreshSession,
  };
}
