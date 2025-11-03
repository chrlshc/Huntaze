'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const onboardingStatus = {
            isComplete: result.data.progressPercentage >= 100,
            progressPercentage: result.data.progressPercentage,
            currentStep: result.data.currentStep
          };
          
          setStatus(onboardingStatus);
          
          // Redirect to onboarding if not complete and not already there
          if (!onboardingStatus.isComplete && 
              !pathname?.startsWith('/onboarding') &&
              !pathname?.startsWith('/auth')) {
            router.push('/onboarding/setup');
          }
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refetch: checkOnboardingStatus };
}
