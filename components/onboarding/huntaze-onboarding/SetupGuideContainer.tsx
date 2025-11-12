'use client';

/**
 * SetupGuideContainer Component
 * 
 * Container component that manages state and connects SetupGuide to the API.
 * Handles loading states, error handling, and user interactions.
 * 
 * Requirements: 3.2, 3.4, 19.2
 */

import { useEffect, useCallback } from 'react';
import { useOnboarding } from './useOnboarding';
import SetupGuide from './SetupGuide';
import { UserRole } from './types';

interface SetupGuideContainerProps {
  userId: string;
  userRole: UserRole;
  market?: string;
  onLearnMore?: (stepId: string) => void;
  onError?: (error: Error) => void;
}

export default function SetupGuideContainer({
  userId,
  userRole,
  market,
  onLearnMore,
  onError,
}: SetupGuideContainerProps) {
  const {
    steps,
    progress,
    loading,
    error,
    updateStep,
    fetchOnboarding,
    retry,
  } = useOnboarding({
    userId,
    market,
    onError,
    onSuccess: (stepId, status) => {
      console.log(`[Onboarding] Step ${stepId} updated to ${status}`);
    },
  });

  // Fetch onboarding on mount
  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  // Handle learn more action
  const handleLearnMore = useCallback(
    (stepId: string) => {
      if (onLearnMore) {
        onLearnMore(stepId);
      } else {
        // Default behavior: open help documentation
        console.log(`[Onboarding] Learn more about step: ${stepId}`);
        // TODO: Implement default help modal or redirect
      }
    },
    [onLearnMore]
  );

  // Error state
  if (error && !loading) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-content-primary mb-1">
              Erreur de chargement
            </h3>
            <p className="text-sm text-content-secondary mb-3">
              {error.message || 'Impossible de charger le guide de configuration'}
            </p>
            <button
              onClick={retry}
              className="text-sm font-medium text-primary hover:text-primary-hover underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SetupGuide
      steps={steps}
      progress={progress}
      onStepUpdate={updateStep}
      onLearnMore={handleLearnMore}
      userRole={userRole}
      loading={loading}
    />
  );
}
