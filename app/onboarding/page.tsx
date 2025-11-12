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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 pt-16 pb-12 px-4 pb-safe">
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
              Bienvenue sur Huntaze
            </h1>
            <p className="text-xl text-gray-600">
              Configurez votre plateforme en quelques étapes simples
            </p>
          </div>

          {/* Onboarding Guide */}
          <SetupGuideContainer
            userId="demo-user"
            userRole="owner"
            market="FR"
            onLearnMore={handleLearnMore}
          />

          {/* Complete Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-600/25 transition-all"
            >
              Aller au tableau de bord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
