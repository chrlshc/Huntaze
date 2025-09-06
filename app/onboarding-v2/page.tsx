"use client";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingV2Page() {
  const router = useRouter();
  const { currentStep } = useOnboarding();

  useEffect(() => {
    if (currentStep === 'completed') {
      router.push('/dashboard');
    }
  }, [currentStep, router]);

  return <OnboardingFlow />;
}