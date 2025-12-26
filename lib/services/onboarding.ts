import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import {
  authOnboardingStatusResponseSchema,
  onboardingStatusResponseSchema,
  onboardingStepsResponseSchema,
} from '@/lib/schemas/api-responses';

export type OnboardingStatusData = {
  userId?: string;
  currentStep?: string;
  completedSteps?: string[];
  skippedSteps?: string[];
  progress?: number;
  progressPercentage?: number;
  creatorLevel?: string;
  goals?: string[];
  estimatedTimeRemaining?: number;
  isComplete?: boolean;
  nextRecommendedStep?: {
    id: string;
    title: string;
    description: string;
    estimatedMinutes?: number;
  };
};

export type OnboardingStatusResponse = {
  success: boolean;
  data?: OnboardingStatusData;
  error?: string;
};

export type AuthOnboardingStatusResponse = {
  onboarding_completed: boolean;
  correlationId: string;
};

export type OnboardingStep = {
  id: string;
  version: number;
  title: string;
  description?: string;
  required: boolean;
  weight: number;
  status: 'todo' | 'done' | 'skipped';
  completedAt?: string;
  roleRestricted?: string;
};

export type OnboardingStepsResponse = {
  progress: number;
  steps: OnboardingStep[];
};

export type OnboardingStepActionResponse = {
  success?: boolean;
  data?: {
    progress?: number;
    nextStep?: { id?: string };
  } & Record<string, unknown>;
  error?: string;
};

export type OnboardingStepUpdateResponse = {
  success?: boolean;
  step?: {
    id: string;
    status: string;
    updatedAt: string;
  };
  progress?: number;
  error?: string;
};

export type OnboardingPlatformConnectResponse = {
  authUrl?: string;
  message?: string;
  requestId?: string;
  success?: boolean;
  error?: string;
};

export type OnboardingFeatureResponse<T = unknown> = {
  success?: boolean;
  data?: T[];
  error?: string;
};

export async function fetchOnboardingStatus(
  url = '/api/onboarding/status',
): Promise<OnboardingStatusResponse> {
  return internalApiFetch<OnboardingStatusResponse>(url, {
    cache: 'no-store',
    schema: onboardingStatusResponseSchema,
  });
}

export async function fetchAuthOnboardingStatus(
  url = '/api/auth/onboarding-status',
): Promise<AuthOnboardingStatusResponse> {
  return internalApiFetch<AuthOnboardingStatusResponse>(url, {
    cache: 'no-store',
    schema: authOnboardingStatusResponseSchema,
  });
}

export async function completeAuthOnboarding(): Promise<{
  success?: boolean;
  message?: string;
  correlationId?: string;
}> {
  return internalApiFetch('/api/auth/complete-onboarding', {
    method: 'POST',
  });
}

export async function fetchOnboardingSteps(options?: {
  market?: string;
}): Promise<OnboardingStepsResponse> {
  const params = new URLSearchParams();
  if (options?.market) params.set('market', options.market);
  const query = params.toString();
  const url = query ? `/api/onboarding?${query}` : '/api/onboarding';

  return internalApiFetch<OnboardingStepsResponse>(url, {
    schema: onboardingStepsResponseSchema,
  });
}

export async function updateOnboardingStep(
  stepId: string,
  status: 'done' | 'skipped',
): Promise<OnboardingStepUpdateResponse> {
  return internalApiFetch<OnboardingStepUpdateResponse>(`/api/onboarding/steps/${stepId}`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function completeOnboardingStep(
  stepId: string,
  data?: unknown,
): Promise<OnboardingStepActionResponse> {
  return internalApiFetch<OnboardingStepActionResponse>(`/api/onboarding/step/${stepId}/complete`, {
    method: 'POST',
    body: { data },
  });
}

export async function startOnboarding(): Promise<unknown> {
  return internalApiFetch('/api/onboarding/start', {
    method: 'POST',
  });
}

export async function checkOnboardingUnlocks(platform: string): Promise<unknown> {
  return internalApiFetch('/api/onboarding/check-unlocks', {
    method: 'POST',
    body: { platform },
  });
}

export async function skipOnboardingStep(stepId: string): Promise<OnboardingStepActionResponse> {
  return internalApiFetch<OnboardingStepActionResponse>(`/api/onboarding/step/${stepId}/skip`, {
    method: 'POST',
  });
}

export async function connectOnboardingPlatform(
  platform: string,
  action: 'connect' | 'disconnect' = 'connect',
): Promise<OnboardingPlatformConnectResponse> {
  return internalApiFetch<OnboardingPlatformConnectResponse>('/api/onboarding/connect-platform', {
    method: 'POST',
    body: { platform, action },
  });
}

export async function forceCompleteOnboarding(): Promise<{ success?: boolean; message?: string }> {
  return internalApiFetch('/api/force-complete-onboarding');
}

export async function completeOnboarding(data: Record<string, unknown> = {}): Promise<unknown> {
  return internalApiFetch('/api/onboarding/complete', {
    method: 'POST',
    body: data,
  });
}

export async function trackOnboardingSkip(stepId: number): Promise<unknown> {
  return internalApiFetch('/api/onboarding/skip', {
    method: 'POST',
    body: { stepId },
  });
}

export async function trackOnboardingEvent(data: Record<string, unknown>): Promise<unknown> {
  return internalApiFetch('/api/onboarding/event', {
    method: 'POST',
    body: data,
  });
}

export async function submitOnboardingWizard(data: Record<string, unknown>): Promise<unknown> {
  return internalApiFetch('/api/onboarding/wizard', {
    method: 'POST',
    body: data,
  });
}

export async function saveOnboardingAbTests(data: {
  selectedTests: string[];
  niche: string;
}): Promise<unknown> {
  return internalApiFetch('/api/onboarding/save-ab-tests', {
    method: 'POST',
    body: data,
  });
}

export async function fetchUnlockedFeatures<T = unknown>(): Promise<OnboardingFeatureResponse<T>> {
  return internalApiFetch<OnboardingFeatureResponse<T>>('/api/features/unlocked');
}

export async function fetchLockedFeatures<T = unknown>(): Promise<OnboardingFeatureResponse<T>> {
  return internalApiFetch<OnboardingFeatureResponse<T>>('/api/features/locked');
}
