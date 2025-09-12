"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SellPlanOption =
  | 'subs' | 'ppv' | 'customs' | 'sexting' | 'calls' | 'merch' | 'later';

export type OnboardingStep = 
  | 'welcome'
  | 'compliance-training'
  | 'data-collection'
  | 'gdpr-consent'
  | 'platform-connections'
  | 'ai-personality'
  | 'governance-settings'
  | 'review'
  | 'completed';

export type PlatformConnection = {
  platform: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  permissions?: string[];
};

export type AIPersonality = {
  id: string;
  name: string;
  tone: 'flirty-premium' | 'friendly-girl-next-door' | 'playful-tease' | 'custom';
  description: string;
  emojiPalette: string[];
  boldnessLevel: number;
};

export type ComplianceSettings = {
  dataRetentionDays: number;
  maxMessagesPerDay: number;
  maxPostsPerDay: Record<string, number>;
  requireApprovalAbovePrice: number;
  requireApprovalAboveRecipients: number;
  aiConfidenceThreshold: number;
};

export type OnboardingState = {
  currentStep: OnboardingStep;
  completedSteps: Set<OnboardingStep>;
  userData: {
    pseudonym?: string;
    email?: string;
    country?: string;
    acceptedTerms: boolean;
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
    consentDate?: Date;
  };
  platformConnections: PlatformConnection[];
  selectedPersonality?: AIPersonality;
  complianceSettings: ComplianceSettings;
  complianceQuizScore?: number;
  onboardingStartDate?: Date;
  onboardingCompletedDate?: Date;
  // Extended onboarding config (MVP)
  niches?: string[];
  goals?: { revenueTarget?: number | null; timeSaved?: number | null; automationLevel?: number };
  persona?: {
    stageName?: string;
    shortBio?: string;
    toneSliders?: { friendlyFlirty?: number; playfulRefined?: number; directSoft?: number };
    emojiUsage?: 'low' | 'med' | 'high';
    punctuationStyle?: 'sober' | 'energetic';
    complexity?: 'simple' | 'rich';
    signaturePhrases?: string[];
    forbiddenPhrases?: string[];
  };
  boundaries?: { nsfwLevel?: 'soft' | 'explicit'; restrictedTopics?: string[]; safeWord?: string | null; platformRulesFlags?: { OF?: boolean; IG?: boolean; TT?: boolean } };
  monetization?: {
    subPrice?: number;
    trialEnabled?: boolean;
    trialDays?: number;
    ppvRange?: { min: number; typical: number; max: number };
    bundles?: { months: number; discountPct: number }[];
    discountCapPct?: number;
    upsellMenu?: { item: string; price: number; eta?: string }[];
    customContentEnabled?: boolean;
  };
  ops?: {
    timezone?: string;
    activeHours?: { start: string; end: string }[];
    responseSLA?: { normal?: string; vip?: string };
    automationLevel?: number;
    reviewThresholds?: { ppvAmount?: number; customRequest?: boolean };
    dailyCaps?: { global?: number; vip?: number };
    reengageWindows?: string[];
    // Extended flags for welcome/connect steps
    platforms?: { onlyfans?: boolean; instagram?: boolean; tiktok?: boolean; reddit?: boolean };
    businessState?: 'new' | 'existing';
  };
  segmentation?: { whaleThreshold?: number; cohorts?: { name: string; min?: number; max?: number }[] };
  dataConsent?: { trainingConsent?: boolean; retentionDays?: number };
  funnels?: { linkHub?: string; priorityGoals?: string[] };
  // Sell plan (selected features to enable)
  sellPlan: SellPlanOption[];
};

export type OnboardingActions = {
  setCurrentStep: (step: OnboardingStep) => void;
  markStepCompleted: (step: OnboardingStep) => void;
  updateUserData: (data: Partial<OnboardingState['userData']>) => void;
  connectPlatform: (connection: PlatformConnection) => void;
  disconnectPlatform: (platform: PlatformConnection['platform']) => void;
  setAIPersonality: (personality: AIPersonality) => void;
  updateComplianceSettings: (settings: Partial<ComplianceSettings>) => void;
  setComplianceQuizScore: (score: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  isStepCompleted: (step: OnboardingStep) => boolean;
  canProceedToStep: (step: OnboardingStep) => boolean;
  // Extended setters
  setNiches: (niches: string[]) => void;
  setGoals: (goals: OnboardingState['goals']) => void;
  updatePersona: (data: Partial<NonNullable<OnboardingState['persona']>>) => void;
  updateBoundaries: (data: Partial<NonNullable<OnboardingState['boundaries']>>) => void;
  updateMonetization: (data: Partial<NonNullable<OnboardingState['monetization']>>) => void;
  updateOps: (data: Partial<NonNullable<OnboardingState['ops']>>) => void;
  updateSegmentation: (data: Partial<NonNullable<OnboardingState['segmentation']>>) => void;
  updateDataConsent: (data: Partial<NonNullable<OnboardingState['dataConsent']>>) => void;
  updateFunnels: (data: Partial<NonNullable<OnboardingState['funnels']>>) => void;
  setSellPlan: (v: SellPlanOption[]) => void;
};

const defaultComplianceSettings: ComplianceSettings = {
  dataRetentionDays: 90,
  maxMessagesPerDay: 500,
  maxPostsPerDay: {
    instagram: 5,
    tiktok: 3,
    reddit: 10,
    onlyfans: 20,
  },
  requireApprovalAbovePrice: 100,
  requireApprovalAboveRecipients: 50,
  aiConfidenceThreshold: 0.7,
};

const stepDependencies: Partial<Record<OnboardingStep, OnboardingStep[]>> = {
  'compliance-training': [],
  'data-collection': ['compliance-training'],
  'gdpr-consent': ['data-collection'],
  'platform-connections': ['gdpr-consent'],
  'ai-personality': ['platform-connections'],
  'governance-settings': ['ai-personality'],
  'review': ['governance-settings'],
  'completed': ['review'],
};

export const useOnboarding = create<OnboardingState & OnboardingActions>()(
  persist(
    (set, get) => ({
      currentStep: 'welcome',
      completedSteps: new Set<OnboardingStep>(),
      userData: {
        acceptedTerms: false,
        marketingConsent: false,
        dataProcessingConsent: false,
      },
      platformConnections: [],
      complianceSettings: defaultComplianceSettings,
      sellPlan: ['subs', 'ppv'],

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: new Set([...state.completedSteps, step]),
        })),

      updateUserData: (data) =>
        set((state) => ({
          userData: { ...state.userData, ...data },
        })),

      connectPlatform: (connection) =>
        set((state) => {
          const existing = state.platformConnections.findIndex(
            (c) => c.platform === connection.platform
          );
          const updated = [...state.platformConnections];
          
          if (existing >= 0) {
            updated[existing] = connection;
          } else {
            updated.push(connection);
          }
          
          return { platformConnections: updated };
        }),

      disconnectPlatform: (platform) =>
        set((state) => ({
          platformConnections: state.platformConnections.filter(
            (c) => c.platform !== platform
          ),
        })),

      setAIPersonality: (personality) =>
        set({ selectedPersonality: personality }),

      updateComplianceSettings: (settings) =>
        set((state) => ({
          complianceSettings: { ...state.complianceSettings, ...settings },
        })),

      setComplianceQuizScore: (score) => set({ complianceQuizScore: score }),

      completeOnboarding: () =>
        set((state) => ({
          currentStep: 'completed',
          completedSteps: new Set([...state.completedSteps, 'completed']),
          onboardingCompletedDate: new Date(),
        })),

      resetOnboarding: () =>
        set({
          currentStep: 'welcome',
          completedSteps: new Set<OnboardingStep>(),
          userData: {
            acceptedTerms: false,
            marketingConsent: false,
            dataProcessingConsent: false,
          },
          platformConnections: [],
          selectedPersonality: undefined,
          complianceSettings: defaultComplianceSettings,
          complianceQuizScore: undefined,
          onboardingStartDate: undefined,
          onboardingCompletedDate: undefined,
        }),

      isStepCompleted: (step) => {
        const state = get();
        return state.completedSteps.has(step);
      },

      canProceedToStep: (step) => {
        const state = get();
        const dependencies = stepDependencies[step] || [];
        return dependencies.every((dep) => state.completedSteps.has(dep));
      },

      // Extended setters
      setNiches: (niches) => set({ niches }),
      setGoals: (goals) => set({ goals }),
      updatePersona: (data) => set((s) => ({ persona: { ...(s.persona || {}), ...data } })),
      updateBoundaries: (data) => set((s) => ({ boundaries: { ...(s.boundaries || {}), ...data } })),
      updateMonetization: (data) => set((s) => ({ monetization: { ...(s.monetization || {}), ...data } })),
      updateOps: (data) => set((s) => ({ ops: { ...(s.ops || {}), ...data } })),
      updateSegmentation: (data) => set((s) => ({ segmentation: { ...(s.segmentation || {}), ...data } })),
      updateDataConsent: (data) => set((s) => ({ dataConsent: { ...(s.dataConsent || {}), ...data } })),
      updateFunnels: (data) => set((s) => ({ funnels: { ...(s.funnels || {}), ...data } })),

      setSellPlan: (v) => {
        set({ sellPlan: v });
        // keep ops in sync if mirrored there
        try {
          const ops = (get() as any).ops || {};
          (get() as any).updateOps?.({ ...ops, sellPlan: v });
        } catch {}
      },
    }),
    {
      name: 'huntaze-onboarding',
      version: 2,
      partialize: (state) => ({
        completedSteps: Array.from(state.completedSteps),
        userData: state.userData,
        platformConnections: state.platformConnections,
        selectedPersonality: state.selectedPersonality,
        complianceSettings: state.complianceSettings,
        complianceQuizScore: state.complianceQuizScore,
        onboardingStartDate: state.onboardingStartDate,
        onboardingCompletedDate: state.onboardingCompletedDate,
        niches: state.niches,
        goals: state.goals,
        persona: state.persona,
        boundaries: state.boundaries,
        monetization: state.monetization,
        ops: state.ops,
        segmentation: state.segmentation,
        dataConsent: state.dataConsent,
        funnels: state.funnels,
        sellPlan: state.sellPlan,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted || {}),
        completedSteps: new Set(persisted?.completedSteps || []),
      }),
      migrate: (persisted: any, _version?: number) => {
        if (!persisted) return persisted;
        if (!Array.isArray(persisted.sellPlan)) {
          persisted.sellPlan = ['subs', 'ppv'];
        }
        return persisted;
      },
    }
  )
);

export const availablePersonalities: AIPersonality[] = [
  {
    id: 'flirty-premium',
    name: 'Flirty Premium',
    tone: 'flirty-premium',
    description: 'Séductrice sophistiquée avec une touche de mystère',
    emojiPalette: ['😘', '💋', '🔥', '💕', '😈', '🌹'],
    boldnessLevel: 0.8,
  },
  {
    id: 'friendly-gnd',
    name: 'Friendly Girl Next Door',
    tone: 'friendly-girl-next-door',
    description: 'Chaleureuse et accessible, comme une amie proche',
    emojiPalette: ['😊', '💖', '🥰', '✨', '🌸', '💫'],
    boldnessLevel: 0.4,
  },
  {
    id: 'playful-tease',
    name: 'Playful Tease',
    tone: 'playful-tease',
    description: 'Espiègle et taquine, toujours avec le sourire',
    emojiPalette: ['😏', '😉', '💦', '🍑', '👅', '🎉'],
    boldnessLevel: 0.6,
  },
];
