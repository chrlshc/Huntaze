import { useEffect, useRef } from 'react';
import { useOnboardingKeyboardShortcuts } from './useKeyboardNavigation';

export interface AccessibleOnboardingOptions {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  announceStepChange?: boolean;
}

export function useAccessibleOnboarding({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  announceStepChange = true,
}: AccessibleOnboardingOptions) {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  // Enable keyboard shortcuts
  useOnboardingKeyboardShortcuts(onNext, onPrevious, onSkip);

  // Announce step changes to screen readers
  useEffect(() => {
    if (!announceStepChange) return;

    // Create live region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    // Announce current step
    const message = `Step ${currentStep} of ${totalSteps}`;
    announcerRef.current.textContent = message;

    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, [currentStep, totalSteps, announceStepChange]);

  // Focus management
  const focusFirstInput = () => {
    const firstInput = document.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
    );
    firstInput?.focus();
  };

  return {
    focusFirstInput,
    getStepAriaLabel: () => `Step ${currentStep} of ${totalSteps}`,
    getProgressAriaLabel: () => {
      const percentage = Math.round((currentStep / totalSteps) * 100);
      return `Onboarding progress: ${percentage}% complete`;
    },
  };
}

// Screen reader only utility class
export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
