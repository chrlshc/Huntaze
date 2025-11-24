'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShopifyBackdrop } from '@/components/onboarding/huntaze-onboarding/ShopifyBackdrop';
import SimpleOnboarding from '@/components/onboarding/huntaze-onboarding/SimpleOnboarding';

function OnboardingContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('[Onboarding] Status check:', {
      status,
      hasSession: !!session,
      userId: session?.user?.id,
      onboardingCompleted: session?.user?.onboardingCompleted,
    });

    // Redirect to auth if not authenticated (Requirement 3.3)
    if (status === 'unauthenticated') {
      console.log('[Onboarding] Not authenticated, redirecting to /auth');
      router.push('/auth');
      return;
    }

    // If already completed onboarding, redirect to dashboard (Requirement 3.4, 5.2)
    if (status === 'authenticated' && session?.user?.onboardingCompleted === true) {
      console.log('[Onboarding] Already completed, redirecting to /dashboard');
      router.push('/dashboard');
      return;
    }

    // Ready to show onboarding (Requirement 3.1)
    if (status === 'authenticated') {
      console.log('[Onboarding] Ready to show onboarding');
      setIsReady(true);
    }
  }, [status, session, router]);

  const handleComplete = async (answers: Record<string, string[]>) => {
    try {
      // Call API to mark onboarding as complete and save answers (Requirements 4.1, 4.2)
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Redirect to dashboard after successful completion (Requirements 4.3, 4.4)
      router.push('/dashboard');
    } catch (error) {
      console.error('[Onboarding] Failed to complete onboarding:', error);
      // Still redirect to dashboard even if save fails
      router.push('/dashboard');
    }
  };

  const handleSkip = async () => {
    try {
      // Call API to mark onboarding as complete with skipped flag (Requirements 4.1, 4.3)
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to skip onboarding');
      }

      // Redirect to dashboard after successful completion (Requirements 4.3, 4.4)
      router.push('/dashboard');
    } catch (error) {
      console.error('[Onboarding] Failed to skip onboarding:', error);
      // Still redirect to dashboard even if save fails
      router.push('/dashboard');
    }
  };

  // Show loading state while checking authentication (Requirement 3.1)
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ShopifyBackdrop accent1="#a78bfa" accent2="#f472b6">
      <div className="w-full max-w-3xl">
        <SimpleOnboarding onComplete={handleComplete} onSkip={handleSkip} />
      </div>
    </ShopifyBackdrop>
  );
}


export default function OnboardingClient() {
  return <OnboardingContent />;
}
