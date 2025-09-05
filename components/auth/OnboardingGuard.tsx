"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useOnboarding } from "@/src/hooks/useOnboarding";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStep, completedSteps } = useOnboarding();

  useEffect(() => {
    const isOnboardingRoute = pathname?.startsWith('/onboarding');
    const isAuthRoute = pathname?.startsWith('/auth');
    const isPublicRoute = ['/', '/join', '/privacy', '/terms'].includes(pathname || '');

    if (!isOnboardingRoute && !isAuthRoute && !isPublicRoute) {
      if (currentStep !== 'completed' || !completedSteps.has('completed')) {
        router.push('/onboarding-v2');
      }
    }
  }, [pathname, currentStep, completedSteps, router]);

  return <>{children}</>;
}