'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ResumeBanner() {
  const { currentStep, isStepCompleted } = useOnboarding();
  const { trackEvent } = useAnalytics();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem('resume_banner_dismissed') === '1');
    }
  }, []);

  const isOnboardingCompleted = isStepCompleted('completed');

  if (isOnboardingCompleted || dismissed) return null;

  const onClick = () => {
    try { trackEvent('resume_banner_click', { step: currentStep }); } catch {}
  };

  const onDismiss = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('resume_banner_dismissed', '1');
      }
      trackEvent('resume_banner_dismiss');
    } finally {
      setDismissed(true);
    }
  };

  const stepTitle = (currentStep || 'setup').replace(/-/g, ' ');

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="font-medium text-amber-900">Complete your setup</p>
            <p className="text-sm text-amber-800">You stopped at: {stepTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/onboarding/setup" onClick={onClick} className="inline-flex items-center gap-1 text-sm font-medium text-amber-900 hover:text-amber-950">
            Continue setup
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button onClick={onDismiss} className="text-sm text-amber-800 hover:text-amber-900">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

