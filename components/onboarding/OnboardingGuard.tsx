'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkOnboarding();
  }, [pathname]);

  const checkOnboarding = async () => {
    // Skip check for auth and onboarding pages
    if (pathname?.startsWith('/auth') || 
        pathname?.startsWith('/onboarding') ||
        pathname === '/') {
      setShouldRender(true);
      setIsChecking(false);
      return;
    }

    try {
      const response = await fetch('/api/onboarding/status');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const isComplete = result.data.progressPercentage >= 100;
          
          if (!isComplete) {
            // Redirect to onboarding if not complete
            router.push('/onboarding/setup');
            return;
          }
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
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return shouldRender ? <>{children}</> : null;
}
