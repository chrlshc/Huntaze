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
        Finish your setup to unlock every feature.
      </div>
      <Link href="/onboarding/setup" className="text-sm font-semibold underline">
        Resume onboarding
      </Link>
    </div>
  );
}
