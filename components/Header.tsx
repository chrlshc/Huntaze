'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuthSession } from '@/hooks/useAuthSession';

/**
 * Header Component
 * 
 * Global header with navigation, theme toggle, and logout functionality.
 */

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthSession();

  const handleLogout = async () => {
    try {
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      }

      // Sign out with NextAuth
      await signOut({ redirect: false });

      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('[Header] Logout error:', error);
      // Still redirect even if there's an error
      router.push('/auth');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-theme-surface border-b border-theme-border backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-theme-text">Huntaze</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Logout button - only show when authenticated */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
