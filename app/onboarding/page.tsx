'use client';

/**
 * Onboarding Page
 * 
 * Main onboarding flow using the new Huntaze onboarding system.
 * Displays the setup guide with all 8 steps for new users.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SetupGuideContainer } from '@/components/onboarding/huntaze-onboarding';

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      return;
    }

    // Allow local development access without token
    try {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        localStorage.setItem('token', 'dev');
        return;
      }
    } catch {}

    // In production, require token
    router.push('/join');
  }, [token, router]);

  const handleLearnMore = (stepId: string) => {
    console.log('[Onboarding] Learn more:', stepId);
    // TODO: Open help modal or documentation
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-12 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-white mb-3">
              Welcome to Huntaze
            </h1>
            <p className="text-base text-gray-400">
              Set up your platform in a few simple steps
            </p>
            <button
              onClick={handleComplete}
              className="mt-4 text-sm text-gray-400 hover:text-gray-300 underline transition-colors"
            >
              Skip onboarding for now
            </button>
          </div>

          {/* Onboarding Guide */}
          <SetupGuideContainer
            userId="demo-user"
            userRole="owner"
            market="US"
            onLearnMore={handleLearnMore}
            onError={(error) => {
              console.error('[Onboarding] Error:', error);
            }}
          />

          {/* Complete Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium transition-colors text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
