/**
 * Mapping utilities for Azure AI Foundry router integration
 * 
 * These utilities map user plans to router tiers and agent types to routing hints.
 * The router uses these hints to select the optimal model for each request.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * User subscription plans
 */
export type UserPlan = 'enterprise' | 'scale' | 'pro' | 'starter' | undefined | null;

/**
 * Router client tiers - determines model access and priority
 */
export type ClientTier = 'standard' | 'vip';

/**
 * Agent type hints for router model selection
 */
export type TypeHint = 'math' | 'coding' | 'creative' | 'chat';

/**
 * Language hints for router model selection
 */
export type LanguageHint = 'fr' | 'en' | 'other';

/**
 * Agent types in the system
 */
export type AgentType = 'messaging' | 'analytics' | 'sales' | 'compliance';

// =============================================================================
// Plan to Tier Mapping
// =============================================================================

/**
 * Maps user subscription plan to router client tier.
 * 
 * Mapping rules (from Requirements 3.1, 3.2, 3.3):
 * - enterprise/scale → vip (premium model access)
 * - pro/starter → standard
 * - undefined/null → standard (default)
 * 
 * @param plan - User's subscription plan
 * @returns Client tier for router request
 */
export function planToTier(plan: UserPlan): ClientTier {
  if (plan === 'enterprise' || plan === 'scale') {
    return 'vip';
  }
  // pro, starter, undefined, null all map to standard
  return 'standard';
}

// =============================================================================
// Agent Type Hint Mapping
// =============================================================================

/**
 * Agent to type hint mapping table
 * 
 * From Requirements 2.1-2.4:
 * - MessagingAgent → chat (conversational fan interactions)
 * - AnalyticsAgent → math (data analysis requires reasoning)
 * - SalesAgent → creative (persuasive message generation)
 * - ComplianceAgent → chat (policy checking is conversational)
 */
const AGENT_TYPE_HINTS: Record<AgentType, TypeHint> = {
  messaging: 'chat',
  analytics: 'math',
  sales: 'creative',
  compliance: 'chat',
};

/**
 * Maps agent type to router type hint for optimal model selection.
 * 
 * @param agentType - The type of agent making the request
 * @returns Type hint for router request
 */
export function agentTypeHint(agentType: AgentType): TypeHint {
  const hint = AGENT_TYPE_HINTS[agentType];
  if (!hint) {
    // Default to chat for unknown agent types
    return 'chat';
  }
  return hint;
}

// =============================================================================
// French Language Detection
// =============================================================================

/**
 * Common French words and patterns for language detection.
 * These are high-frequency words that are unlikely to appear in other languages.
 */
const FRENCH_INDICATORS = [
  // Articles and determiners
  /\b(le|la|les|un|une|des|du|de la|au|aux)\b/i,
  // Common verbs
  /\b(est|sont|être|avoir|fait|faire|peut|veut|veux|suis|sommes|êtes)\b/i,
  // Pronouns
  /\b(je|tu|il|elle|nous|vous|ils|elles|ce|cette|ces|mon|ma|mes|ton|ta|tes|son|sa|ses)\b/i,
  // Prepositions and conjunctions
  /\b(dans|sur|sous|avec|pour|par|chez|entre|vers|mais|ou|et|donc|car|ni|que|qui)\b/i,
  // Common words
  /\b(bonjour|merci|salut|oui|non|bien|très|plus|moins|aussi|encore|toujours|jamais)\b/i,
  // Question words
  /\b(comment|pourquoi|quand|où|combien|quel|quelle|quels|quelles)\b/i,
  // Negation
  /\b(ne|n'|pas|plus|jamais|rien|personne)\b/i,
  // French-specific characters in words
  /[àâäéèêëïîôùûüÿœæç]/i,
];

/**
 * Minimum number of French indicators required to classify as French.
 * This threshold helps avoid false positives from borrowed words.
 */
const FRENCH_DETECTION_THRESHOLD = 2;

/**
 * Detects if the given text contains French content.
 * 
 * Uses pattern matching against common French words and characters.
 * Requires multiple indicators to avoid false positives from borrowed words.
 * 
 * From Requirements 2.5:
 * WHEN the request contains French content THEN the system SHALL include 
 * language hint "fr" for Mistral routing.
 * 
 * @param text - The text to analyze
 * @returns 'fr' if French is detected, undefined otherwise
 */
export function detectFrenchLanguage(text: string): LanguageHint | undefined {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  let matchCount = 0;
  
  for (const pattern of FRENCH_INDICATORS) {
    if (pattern.test(text)) {
      matchCount++;
      if (matchCount >= FRENCH_DETECTION_THRESHOLD) {
        return 'fr';
      }
    }
  }

  return undefined;
}

/**
 * Detects the language of the given text and returns a language hint.
 * Currently only detects French; returns undefined for other languages.
 * 
 * @param text - The text to analyze
 * @returns Language hint for router request, or undefined if not detected
 */
export function detectLanguage(text: string): LanguageHint | undefined {
  // Currently only French detection is implemented
  // Can be extended to detect other languages in the future
  return detectFrenchLanguage(text);
}

// =============================================================================
// Exports
// =============================================================================

export const mapping = {
  planToTier,
  agentTypeHint,
  detectFrenchLanguage,
  detectLanguage,
};

export default mapping;
