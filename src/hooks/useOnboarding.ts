"use client";

import { useEffect, useState } from "react";

export type OnboardingStatus = {
  completed: boolean;
  currentStep: string;
  steps: {
    profile: boolean;
    aiConfig: boolean;
    payment: boolean;
  };
};

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/users/onboarding-status', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load onboarding status');
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { status, loading, error };
}

