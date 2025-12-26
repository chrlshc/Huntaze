'use client';

/**
 * Simplified Onboarding Client Component
 * Handles client-side onboarding logic
 */

import { useRouter } from 'next/navigation';
import { SimplifiedOnboardingWizard } from '@/components/onboarding/SimplifiedOnboardingWizard';
import { useState } from 'react';
import { completeOnboarding, trackOnboardingSkip } from '@/lib/services/onboarding';

export function SimplifiedOnboardingClient() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // Mark onboarding as completed
      await completeOnboarding();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
      // Still redirect to dashboard even if API call fails
      router.push('/dashboard');
    }
  };

  const handleSkip = async (stepId: number) => {
    // Track skipped step for later completion
    try {
      await trackOnboardingSkip(stepId);
    } catch (error) {
      console.error('Error tracking skipped step:', error);
    }
  };

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SimplifiedOnboardingWizard 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
