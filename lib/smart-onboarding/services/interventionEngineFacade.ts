// Types locaux alignés avec ce que tu as déjà normalisé côté HelpContent (tooltip)
export type InterventionType = 'tooltip' | 'nudge' | 'checklist' | 'cta';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface OnboardingContext {
  journeyId: string;
  stepId?: string;
  locale?: string;
}

export interface BehavioralSignals {
  indicators?: Array<'hesitation' | 'repeated_errors' | 'time_exceeded'>;
  lastActionAt?: string; // ISO
  errorCodes?: string[];
}

export interface ProactiveIntervention {
  id: string;
  type: InterventionType;
  title: string;
  body: string;
  relatedTopics?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // minutes
  tags?: string[];
  lastUpdated?: string; // ISO
  priority?: Priority;
}

export interface SuggestInput {
  userId: string;
  context: OnboardingContext;
  signals?: BehavioralSignals;
}

export interface SuggestResult {
  interventions: ProactiveIntervention[];
  meta?: { experimentId?: string; variant?: string | null };
}

// Implémentation simple et sûre pour la route proactive.
// ⚠️ Ne dépend pas de interventionEngine.ts : donc aucun risque de remonter ses erreurs TS.
export async function getProactiveSuggestions(input: SuggestInput): Promise<SuggestResult> {
  const { context } = input;

  const base: ProactiveIntervention = {
    id: `tip-${context.stepId ?? 'welcome'}`,
    type: 'tooltip',
    title: 'Astuce pour avancer',
    body: "Besoin d’un coup de pouce sur cette étape ? Ouvre l’aide contextuelle.",
    relatedTopics: ['smart-onboarding', 'aide-contextuelle'],
    difficulty: 'easy',
    estimatedTime: 1,
    tags: ['proactive', 'onboarding'],
    lastUpdated: new Date().toISOString(),
    priority: 'normal'
  };

  return { interventions: [base], meta: { experimentId: undefined, variant: null } };
}

// Logging/outcomes : no-op typé (remplace une dépendance à l’engine)
export type Outcome = 'shown' | 'clicked' | 'dismissed' | 'completed';
export async function recordInterventionOutcome(_args: {
  interventionId: string;
  outcome: Outcome;
  userId?: string;
  timestamp?: string; // ISO
}): Promise<void> {
  return;
}

