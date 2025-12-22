'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { DashboardLoadingState } from '@/components/ui/DashboardLoadingState';

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        // Cleanup legacy localStorage tokens (defensive)
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      } catch {
        // ignore
      }

      try {
        await signOut({ callbackUrl: '/auth/login?loggedOut=1' });
      } catch {
        window.location.assign('/auth/login?loggedOut=1');
      }
    };

    void logout();
  }, []);

  return <DashboardLoadingState message="Signing out..." />;
}

