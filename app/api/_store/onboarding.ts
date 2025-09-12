// Simple in-memory onboarding store for demo/dev.
// In production, replace with persistent storage (DB/API).

export type OnboardingProfile = {
  displayName?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  avatar?: string | null;
};

export type OnboardingAIConfig = {
  tone: string;
  responseSpeed: string;
  personalityTraits: string[];
  contentTypes: string[];
  voiceSample?: string | null;
  writingSamples?: string[];
  autoLearn?: boolean;
  // Optional: preset data for selected niche
  selectedNicheId?: string | null;
  price?: string | null;
  cadence?: { postsPerWeek: number; storiesPerWeek: number; dmCheckinsPerDay: number };
  upsellMenu?: { name: string; price: string; eta: string }[];
  dmSequences?: Record<'day1'|'day2'|'day3'|'day4'|'day5'|'day6'|'day7', string>;
};

export type OnboardingStatus = {
  completed: boolean;
  currentStep: string;
  current_step?: number;
  steps: {
    profile: boolean;
    aiConfig: boolean;
    payment: boolean;
  };
  checklist?: Record<string, any>;
};

export type OnboardingStoreData = {
  profile?: OnboardingProfile;
  aiConfig?: OnboardingAIConfig;
  status?: OnboardingStatus;
  abTests?: {
    selectedTests: string[];
    niche: string;
    createdAt: string;
    status: 'pending_setup' | 'running' | 'completed';
  };
  playbookDraft?: {
    niche?: string | null;
    dmSequences?: Record<'day1'|'day2'|'day3'|'day4'|'day5'|'day6'|'day7', string>;
    cadence?: { postsPerWeek: number; storiesPerWeek: number; dmCheckinsPerDay: number };
    upsellMenu?: { name: string; price: string; eta: string }[];
    updatedAt: string;
  };
};

const store = new Map<string, OnboardingStoreData>();

const defaultStatus: OnboardingStatus = {
  completed: false,
  currentStep: 'profile',
  current_step: 1,
  steps: { profile: false, aiConfig: false, payment: false },
  checklist: {
    first_message: { done: false },
    connect_ig: { done: false },
    view_analytics: { done: false },
    create_campaign: { done: false },
  },
};

export function getOnboarding(token: string): OnboardingStoreData {
  return store.get(token) || {};
}

export function getOrInitStatus(token: string): OnboardingStatus {
  const existing = store.get(token);
  if (existing?.status) return existing.status;
  const status: OnboardingStatus = { ...defaultStatus };
  const next = { ...(existing || {}), status };
  store.set(token, next);
  return status;
}

export function mergeOnboarding(token: string, data: Partial<OnboardingStoreData>) {
  const prev = store.get(token) || {};
  const merged: OnboardingStoreData = {
    ...prev,
    ...data,
    status: { ...(prev.status || defaultStatus), ...(data.status || {}) },
  };
  store.set(token, merged);
  return merged;
}

export function markStep(token: string, step: keyof OnboardingStatus['steps']) {
  const status = getOrInitStatus(token);
  status.steps[step] = true;
  // naive currentStep update
  if (step === 'profile') status.currentStep = 'niche';
  if (step === 'aiConfig') status.currentStep = 'payment';
  mergeOnboarding(token, { status });
}

export function markCompleted(token: string) {
  const status = getOrInitStatus(token);
  status.completed = true;
  status.currentStep = 'completed';
  mergeOnboarding(token, { status });
}

export function snapshot(token: string): OnboardingStoreData | undefined {
  return store.get(token);
}
