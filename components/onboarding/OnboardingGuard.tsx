'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchOnboardingStatus } from '@/lib/services/onboarding';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkOnboarding = useCallback(async () => {
    // Skip check for auth and onboarding pages
    if (pathname?.startsWith('/auth') || 
        pathname?.startsWith('/onboarding') ||
        pathname === '/skip-onboarding' ||
        pathname === '/complete-onboarding' ||
        pathname === '/') {
      setShouldRender(true);
      setIsChecking(false);
      return;
    }

    try {
      // Quick client-side bypass via cookie (set by /api/force-complete-onboarding)
      try {
        const hasBypass = document.cookie.split('; ').some(c => c.startsWith('onboarding_completed=true'));
        if (hasBypass) {
          setShouldRender(true);
          setIsChecking(false);
          return;
        }
      } catch {}

      const result = await fetchOnboardingStatus();
      if (result.success && result.data) {
        const progressPercentage =
          result.data.progressPercentage ?? result.data.progress ?? 0;
        const isComplete =
          Boolean(result.data.isComplete) || progressPercentage >= 100;

        if (!isComplete) {
          router.push('/onboarding/setup');
          return;
        }
      }

      setShouldRender(true);
    } catch (error) {
      console.error('Onboarding check failed:', error);
      // Allow access on error
      setShouldRender(true);
    } finally {
      setIsChecking(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return shouldRender ? <>{children}</> : null;
}
