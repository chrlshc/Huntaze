'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchOnboardingStatus } from '@/lib/services/onboarding';

interface OnboardingStatus {
  isComplete: boolean;
  progressPercentage: number;
  currentStep: string;
}

export function useOnboardingStatus() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const result = await fetchOnboardingStatus();
      
      if (result.success && result.data) {
        const progressPercentage = result.data.progressPercentage ?? result.data.progress ?? 0;
        const onboardingStatus = {
          isComplete: progressPercentage >= 100,
          progressPercentage,
          currentStep: result.data.currentStep ?? 'profile',
        };
        
        setStatus(onboardingStatus);
        
        // Redirect to onboarding if not complete and not already there
        if (!onboardingStatus.isComplete && 
            !pathname?.startsWith('/onboarding') &&
            !pathname?.startsWith('/auth')) {
          router.push('/onboarding/setup');
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  return { status, loading, refetch: checkOnboardingStatus };
}
