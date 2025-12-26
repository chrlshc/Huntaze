'use client';

/**
 * Onboarding Page
 * 
 * Main onboarding flow using simple Shopify-style questions.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShopifyBackdrop } from '@/components/onboarding/huntaze-onboarding/ShopifyBackdrop';
import SimpleOnboarding from '@/components/onboarding/huntaze-onboarding/SimpleOnboarding';

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

  const handleComplete = (answers: Record<string, string[]>) => {
    console.log('[Onboarding] Answers:', answers);
    // TODO: Save answers to backend
    router.push('/dashboard');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <ShopifyBackdrop accent1="#a78bfa" accent2="#f472b6">
      <div className="w-full max-w-3xl">
        <SimpleOnboarding onComplete={handleComplete} onSkip={handleSkip} />
      </div>
    </ShopifyBackdrop>
  );
}
