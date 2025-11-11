export interface HelpContext {
  stepId?: string;
  topic?: string;
  userLevel?: string;
  [key: string]: unknown;
}

export interface HelpContentMinimal {
  id: string;
  type: 'contextual' | 'tooltip' | 'documentation';
  title?: string;
  content: string;
  context?: HelpContext;
  createdAt?: string;
  lastUpdated?: string;
}

export async function generateContextualHelp(
  userId: string,
  context: HelpContext,
  _userState?: Record<string, unknown>
): Promise<HelpContentMinimal> {
  return {
    id: `help-${context.stepId ?? 'general'}-${Date.now()}`,
    type: 'contextual',
    title: 'Aide contextuelle',
    content: "Voici une aide rapide pour vous débloquer à cette étape.",
    context,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

export async function implementProgressiveDisclosure(
  _userId: string,
  baseHelp: HelpContentMinimal,
  _userInteraction: Record<string, unknown>
): Promise<{ base: HelpContentMinimal; details: string[] }> {
  return {
    base: baseHelp,
    details: [
      'Conseil 1: essayez de passer à l’étape suivante.',
      'Conseil 2: consultez la documentation liée.',
    ],
  };
}

export async function personalizeHelpContent(
  _userId: string,
  baseContent: HelpContentMinimal,
  personalization: Record<string, unknown>
): Promise<HelpContentMinimal> {
  return {
    ...baseContent,
    title: baseContent.title ?? 'Aide personnalisée',
    content: `${baseContent.content}\n\nPersonnalisation: ${Object.keys(personalization).join(', ')}`,
    lastUpdated: new Date().toISOString(),
  };
}

export async function optimizeHelpContent(
  helpContentId: string,
  _effectivenessData: Record<string, unknown>
): Promise<{ id: string; optimized: boolean; recommendations: string[] }> {
  return {
    id: helpContentId,
    optimized: true,
    recommendations: ['Raccourcir le texte', 'Ajouter un exemple visuel'],
  };
}

export async function trackHelpEffectiveness(
  _userId: string,
  _helpContent: HelpContentMinimal,
  userResponse: string
): Promise<{ successful: boolean; userResponse: string; trackedAt: string }>{
  const successful = userResponse === 'accepted' || userResponse === 'completed';
  return { successful, userResponse, trackedAt: new Date().toISOString() };
}

export async function generateExamples(
  context: HelpContext,
  count: number
): Promise<Array<{ title: string; description: string }>> {
  return Array.from({ length: Math.max(1, Math.min(count, 5)) }).map((_, i) => ({
    title: `Exemple ${i + 1}`,
    description: `Illustration rapide pour ${context.topic ?? 'le sujet'}.`,
  }));
}

export async function generateVisualAids(
  context: HelpContext
): Promise<Array<{ kind: 'image' | 'diagram'; alt: string }>> {
  return [
    { kind: 'diagram', alt: `Schéma pour ${context.topic ?? 'le sujet'}` },
  ];
}

export async function generateInteractiveElements(
  context: HelpContext
): Promise<Array<{ type: 'quiz' | 'walkthrough'; label: string }>> {
  return [
    { type: 'walkthrough', label: `Guide pour ${context.stepId ?? 'l’étape'}` },
  ];
}
