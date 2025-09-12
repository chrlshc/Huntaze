"use client";

import Link from 'next/link';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function ResumeBanner() {
  const { isStepCompleted } = useOnboarding();
  const completed = isStepCompleted('completed');
  if (completed) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 flex items-center justify-between">
      <div className="text-sm">
        Terminez votre configuration pour débloquer toutes les fonctionnalités.
      </div>
      <Link href="/onboarding/setup" className="text-sm font-semibold underline">
        Reprendre l’onboarding
      </Link>
    </div>
  );
}
