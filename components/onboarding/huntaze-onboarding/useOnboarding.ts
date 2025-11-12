'use client';

/**
 * useOnboarding Hook
 * 
 * Custom hook for managing onboarding state and API interactions.
 * Handles step updates with optimistic UI updates and error rollback.
 * 
 * Requirements: 3.2, 3.4, 19.2
 */

import { useState, useCallback } from 'react';
import { OnboardingStep, StepStatus } from './types';

interface UseOnboardingOptions {
  userId: string;
  market?: string;
  onError?: (error: Error) => void;
  onSuccess?: (stepId: string, status: StepStatus) => void;
}

interface OnboardingState {
  steps: OnboardingStep[];
  progress: number;
  loading: boolean;
  error: Error | null;
}

// Default fallback steps when API fails (Legacy Huntaze with experience/goals)
const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'creator_assessment',
    title: 'Tell us about your experience',
    description: 'Quick assessment to personalize Huntaze to your level',
    status: 'todo',
    required: true,
    weight: 25,
    version: 1,
    badge: 'Personalized',
    impact: 'High',
    timeEstimate: '2 min',
  },
  {
    id: 'goal_selection',
    title: 'Choose your goals',
    description: 'Pick what you want to achieve to shape your path',
    status: 'todo',
    required: true,
    weight: 20,
    version: 1,
    badge: 'Custom path',
    impact: 'High',
    timeEstimate: '2 min',
  },
  {
    id: 'platforms_connect',
    title: 'Connect your platforms',
    description: 'Link Instagram, TikTok, Reddit and more',
    status: 'todo',
    required: true,
    weight: 25,
    version: 1,
    badge: 'Instant unlock',
    impact: 'High',
    timeEstimate: '1 min',
  },
  {
    id: 'ai_setup',
    title: 'Configure your AI assistant',
    description: 'Tone, reply rules and safety rails',
    status: 'todo',
    required: true,
    weight: 20,
    version: 1,
    badge: 'Autopilot',
    impact: 'High',
    timeEstimate: '3 min',
  },
  {
    id: 'autopilot_enable',
    title: 'Enable growth autopilot',
    description: 'Turn on campaigns and smart replies',
    status: 'todo',
    required: false,
    weight: 10,
    version: 1,
    badge: 'Always on',
    impact: 'High',
    timeEstimate: '2 min',
  },
];

export function useOnboarding({
  userId,
  market,
  onError,
  onSuccess,
}: UseOnboardingOptions) {
  const [state, setState] = useState<OnboardingState>({
    steps: [],
    progress: 0,
    loading: true,
    error: null,
  });

  // Fetch onboarding status
  const fetchOnboarding = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (market) params.append('market', market);

      const response = await fetch(`/api/onboarding?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch onboarding: ${response.statusText}`);
      }

      const data = await response.json();

      setState({
        steps: data.steps || [],
        progress: data.progress || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      // Use default steps as fallback
      setState({
        steps: DEFAULT_STEPS,
        progress: 0,
        loading: false,
        error: null, // Don't show error, just use fallback
      });
      console.warn('[Onboarding] API failed, using default steps:', err.message);
      onError?.(err);
    }
  }, [market, onError]);

  // Update step status with optimistic UI
  const updateStep = useCallback(
    async (stepId: string, status: 'done' | 'skipped') => {
      // Store previous state for rollback
      const previousState = { ...state };

      // Optimistic update
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status,
                completedAt: status === 'done' ? new Date().toISOString() : step.completedAt,
              }
            : step
        ),
      }));

      try {
        const response = await fetch(`/api/onboarding/steps/${stepId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update step: ${response.statusText}`);
        }

        const data = await response.json();

        // Update with server response
        setState((prev) => ({
          ...prev,
          progress: data.progress || prev.progress,
          steps: prev.steps.map((step) =>
            step.id === stepId ? { ...step, ...data.step } : step
          ),
        }));

        onSuccess?.(stepId, status);
      } catch (error) {
        // Rollback on error
        setState(previousState);
        const err = error instanceof Error ? error : new Error('Unknown error');
        onError?.(err);
        throw err;
      }
    },
    [state, onError, onSuccess]
  );

  // Retry failed request
  const retry = useCallback(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  return {
    steps: state.steps,
    progress: state.progress,
    loading: state.loading,
    error: state.error,
    updateStep,
    fetchOnboarding,
    retry,
  };
}
