"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    }),
    {
      name: 'huntaze-onboarding',
      partialize: (state) => ({
        completedSteps: Array.from(state.completedSteps),
        userData: state.userData,
        platformConnections: state.platformConnections,
        selectedPersonality: state.selectedPersonality,
        complianceSettings: state.complianceSettings,
        complianceQuizScore: state.complianceQuizScore,
        onboardingStartDate: state.onboardingStartDate,
        onboardingCompletedDate: state.onboardingCompletedDate,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted || {}),
        completedSteps: new Set(persisted?.completedSteps || []),
      }),
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

