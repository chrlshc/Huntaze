'use client';

/**
 * Wizard Onboarding Page
 * 
 * 4-step setup wizard for new users.
 * Completes in < 30 seconds and configures AI + services automatically.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SetupWizard from '@/components/onboarding/huntaze-onboarding/SetupWizard';
import { ShopifyBackdrop } from '@/components/ui';

export default function WizardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete wizard');
      }

      const config = await response.json();

      console.log('Wizard completed successfully:', config);

      // Track completion event
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Wizard Completed', {
          platform: data.platform,
          goal: data.primary_goal,
          tone: data.ai_tone,
          time_to_complete: data.time_to_complete,
          questions_skipped: data.questions_skipped?.length || 0,
        });
      }

      // Redirect to dashboard
      router.push('/dashboard?wizard_complete=true');
    } catch (err) {
      console.error('Wizard error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Track skip event
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Wizard Skipped');
    }

    // Redirect to dashboard with default config
    router.push('/dashboard?wizard_skipped=true');
  };

  return (
    <ShopifyBackdrop accent1="#a78bfa" accent2="#f472b6">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <p className="text-sm font-medium">Error: {error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {isSubmitting ? (
            <div className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-2xl ring-1 ring-violet-500/20 p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
                <p className="text-lg font-medium text-white">
                  Configuring your AI...
                </p>
                <p className="text-sm text-neutral-400">
                  This will only take a moment
                </p>
              </div>
            </div>
          ) : (
            <SetupWizard onComplete={handleComplete} onSkip={handleSkip} />
          )}
        </div>
      </div>
    </ShopifyBackdrop>
  );
}
