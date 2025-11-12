'use client';

/**
 * Onboarding Setup Page
 * 
 * Redirects to the new simple 4-step wizard
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingSetupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new simple wizard
    router.replace('/onboarding/wizard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-neutral-400">Redirecting to setup...</p>
      </div>
    </div>
  );
}
