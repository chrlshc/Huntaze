'use client';

/**
 * Onboarding Setup Page
 * 
 * Main onboarding flow using the new Huntaze onboarding system.
 * Displays the setup guide with all 8 production-ready steps.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SetupGuideContainer } from '@/components/onboarding/huntaze-onboarding';

export default function OnboardingSetupPage() {
  const [userId, setUserId] = useState<string>('demo-user');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Get current user
      const userResponse = await fetch('/api/users/profile');
      const userData = await userResponse.json();
      
      if (userData.success) {
        setUserId(userData.data.id);
      }
    } catch (error) {
      console.error('Failed to get user:', error);
      // Continue with demo user
    } finally {
      setLoading(false);
    }
  };

  const handleLearnMore = (stepId: string) => {
    console.log('[Onboarding] Learn more:', stepId);
    // TODO: Open help modal or documentation
  };

  const handleSkip = () => {
    // Skip onboarding and go to dashboard
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/25">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Huntaze</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Huntaze
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Set up your platform in a few simple steps
            </p>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Skip onboarding for now
            </button>
          </div>

          {/* Onboarding Guide */}
          <SetupGuideContainer
            userId={userId}
            userRole="owner"
            market="US"
            onLearnMore={handleLearnMore}
            onError={(error) => {
              console.error('[Onboarding] Error:', error);
              // Continue anyway - don't block user
            }}
          />

          {/* Complete Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-600/25 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
