/**
 * Replicability Scorer
 * 
 * Calculates how easily viral content can be replicated for a brand's context.
 * Analyzes hook, narrative, visual, and context transferability components.
 */

import type {
  ViralMechanism,
  EmotionalTrigger,
  VisualElement,
  EngagementMetrics,
  ReplicabilityScoreBreakdown,
  MultimodalContent,
} from './types';

// ============================================================================
// Scoring Weights and Thresholds
// ============================================================================

const COMPONENT_WEIGHTS = {
  hookReplicability: 0.25,
  narrativeReplicability: 0.20,
  visualReplicability: 0.20,
  contextTransferability: 0.20,
  resourceRequirements: 0.15,
};

const MECHANISM_REPLICABILITY: Record<string, number> = {
  authenticity: 0.85,
  controversy: 0.40,
  humor: 0.55,
  surprise: 0.70,
  social_proof: 0.35,
  curiosity_gap: 0.90,
  emotional_resonance: 0.60,
  relatability: 0.85,
  aspiration: 0.50,
  fear_of_missing_out: 0.80,
  nostalgia: 0.75,
  outrage: 0.30,
  inspiration: 0.75,
  educational_value: 0.95,
};

const VISUAL_COMPLEXITY: Record<string, number> = {
  face: 0.9,
  text_overlay: 0.95,
  product: 0.7,
  logo: 0.6,
  scene_transition: 0.8,
  special_effect: 0.4,
  color_scheme: 0.85,
  composition: 0.7,
  movement: 0.6,
  lighting: 0.75,
};

// ============================================================================
// Replicability Scorer Class
// ============================================================================

export class ReplicabilityScorer {
  /**
   * Calculate complete replicability score breakdown
   */
  calculateScore(
    mechanisms: ViralMechanism[],
    triggers: EmotionalTrigger[],
    visualElements: VisualElement[],
    engagement: EngagementMetrics,
    content: MultimodalContent
  ): ReplicabilityScoreBreakdown {
    const components = {
      hookReplicability: this.scoreHookReplicability(mechanisms, triggers),
      narrativeReplicability: this.scoreNarrativeReplicability(mechanisms, content),
      visualReplicability: this.scoreVisualReplicability(visualElements),
      contextTransferability: this.scoreContextTransferability(mechanisms, content),
      resourceRequirements: this.scoreResourceRequirements(visualElements, content),
    };

    // Calculate weighted overall score
    const overall = Math.round(
      (components.hookReplicability * COMPONENT_WEIGHTS.hookReplicability +
        components.narrativeReplicability * COMPONENT_WEIGHTS.narrativeReplicability +
        components.visualReplicability * COMPONENT_WEIGHTS.visualReplicability +
        components.contextTransferability * COMPONENT_WEIGHTS.contextTransferability +
        components.resourceRequirements * COMPONENT_WEIGHTS.resourceRequirements)
    );

    // Identify factors affecting score
    const factors = this.identifyFactors(components, mechanisms, visualElements, engagement);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(mechanisms, triggers, visualElements, content);

    return {
      overall,
      components,
      factors,
      confidence,
    };
  }

  /**
   * Score hook replicability (how easy to recreate the attention-grabbing element)
   */
  private scoreHookReplicability(
    mechanisms: ViralMechanism[],
    triggers: EmotionalTrigger[]
  ): number {
    if (mechanisms.length === 0) return 50;

    // Find hook-related triggers
    const hookTriggers = triggers.filter(t => t.timing === 'hook');
    
    // Average mechanism replicability weighted by strength
    const mechanismScore = mechanisms.reduce((sum, m) => {
      const baseScore = MECHANISM_REPLICABILITY[m.type] || 0.5;
      return sum + (baseScore * m.strength);
    }, 0) / mechanisms.length;

    // Bonus for clear emotional hooks
    const hookBonus = hookTriggers.length > 0 
      ? Math.min(0.2, hookTriggers.length * 0.1) 
      : 0;

    return Math.round(Math.min(100, (mechanismScore + hookBonus) * 100));
  }

  /**
   * Score narrative replicability (how easy to adapt the story structure)
   */
  private scoreNarrativeReplicability(
    mechanisms: ViralMechanism[],
    content: MultimodalContent
  ): number {
    let score = 50;

    // Educational and curiosity-gap content is highly replicable
    const hasEducational = mechanisms.some(m => m.type === 'educational_value');
    const hasCuriosityGap = mechanisms.some(m => m.type === 'curiosity_gap');
    
    if (hasEducational) score += 20;
    if (hasCuriosityGap) score += 15;

    // Controversy and outrage are harder to replicate safely
    const hasControversy = mechanisms.some(m => m.type === 'controversy');
    const hasOutrage = mechanisms.some(m => m.type === 'outrage');
    
    if (hasControversy) score -= 15;
    if (hasOutrage) score -= 20;

    // Short content is easier to replicate
    if (content.metadata.duration) {
      if (content.metadata.duration < 30) score += 10;
      else if (content.metadata.duration > 120) score -= 10;
    }

    // Clear structure (hashtags, mentions) indicates replicable format
    const hashtagCount = content.textContent?.hashtags?.length || 0;
    if (hashtagCount >= 3 && hashtagCount <= 10) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score visual replicability (how easy to recreate visual elements)
   */
  private scoreVisualReplicability(visualElements: VisualElement[]): number {
    if (visualElements.length === 0) return 70; // Text-only is easy

    // Calculate average complexity of visual elements
    const complexityScores = visualElements.map(el => {
      const baseComplexity = VISUAL_COMPLEXITY[el.type] || 0.5;
      // High prominence elements matter more
      return baseComplexity * (0.5 + el.prominence * 0.5);
    });

    const avgComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;

    // More elements = more complex to replicate
    const elementPenalty = Math.min(20, visualElements.length * 2);

    return Math.round(Math.max(0, avgComplexity * 100 - elementPenalty));
  }

  /**
   * Score context transferability (how well it adapts to different brands/industries)
   */
  private scoreContextTransferability(
    mechanisms: ViralMechanism[],
    content: MultimodalContent
  ): number {
    let score = 60;

    // Universal mechanisms transfer well
    const universalMechanisms = ['curiosity_gap', 'surprise', 'educational_value', 'relatability'];
    const hasUniversal = mechanisms.some(m => universalMechanisms.includes(m.type));
    if (hasUniversal) score += 15;

    // Niche mechanisms are harder to transfer
    const nicheMechanisms = ['nostalgia', 'social_proof', 'controversy'];
    const hasNiche = mechanisms.some(m => nicheMechanisms.includes(m.type));
    if (hasNiche) score -= 10;

    // Verified/celebrity content is harder to replicate
    if (content.author?.verified) score -= 15;
    if (content.author?.followerCount && content.author.followerCount > 1000000) score -= 10;

    // Platform-specific content may not transfer
    const platformSpecificHashtags = ['fyp', 'foryou', 'viral', 'trending'];
    const hashtags = content.textContent?.hashtags || [];
    const hasPlatformSpecific = hashtags.some(h => 
      platformSpecificHashtags.includes(h.toLowerCase().replace('#', ''))
    );
    if (hasPlatformSpecific) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score resource requirements (inverse - lower requirements = higher score)
   */
  private scoreResourceRequirements(
    visualElements: VisualElement[],
    content: MultimodalContent
  ): number {
    let score = 80;

    // Special effects require more resources
    const hasSpecialEffects = visualElements.some(el => el.type === 'special_effect');
    if (hasSpecialEffects) score -= 25;

    // Complex editing requires more resources
    const editingDynamics = content.visualAnalysis?.editingDynamics;
    if (editingDynamics) {
      if (editingDynamics.pacing === 'fast') score -= 10;
      if (editingDynamics.cutFrequency > 10) score -= 15;
    }

    // Long content requires more production
    if (content.metadata.duration) {
      if (content.metadata.duration > 60) score -= 10;
      if (content.metadata.duration > 180) score -= 15;
    }

    // Multiple visual elements increase complexity
    if (visualElements.length > 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify factors affecting the score
   */
  private identifyFactors(
    components: ReplicabilityScoreBreakdown['components'],
    mechanisms: ViralMechanism[],
    visualElements: VisualElement[],
    engagement: EngagementMetrics
  ): ReplicabilityScoreBreakdown['factors'] {
    const factors: ReplicabilityScoreBreakdown['factors'] = [];

    // Hook factors
    if (components.hookReplicability >= 70) {
      factors.push({
        factor: 'Clear, replicable hook pattern',
        impact: 'positive',
        weight: 0.25,
        description: 'The attention-grabbing element can be easily adapted',
      });
    } else if (components.hookReplicability < 40) {
      factors.push({
        factor: 'Complex or unique hook',
        impact: 'negative',
        weight: 0.25,
        description: 'The hook relies on specific circumstances or talent',
      });
    }

    // Mechanism factors
    const topMechanism = mechanisms[0];
    if (topMechanism) {
      const replicability = MECHANISM_REPLICABILITY[topMechanism.type] || 0.5;
      factors.push({
        factor: `Primary mechanism: ${topMechanism.type.replace('_', ' ')}`,
        impact: replicability >= 0.7 ? 'positive' : 'negative',
        weight: topMechanism.strength * 0.3,
        description: `${topMechanism.type} content is ${replicability >= 0.7 ? 'relatively easy' : 'challenging'} to replicate`,
      });
    }

    // Visual factors
    const hasComplexVisuals = visualElements.some(el => 
      el.type === 'special_effect' || el.type === 'movement'
    );
    if (hasComplexVisuals) {
      factors.push({
        factor: 'Complex visual production',
        impact: 'negative',
        weight: 0.2,
        description: 'Requires advanced video editing or effects',
      });
    }

    // Engagement factors
    if (engagement.engagementRate > 0.1) {
      factors.push({
        factor: 'High engagement rate',
        impact: 'positive',
        weight: 0.15,
        description: 'Proven format with strong audience response',
      });
    }

    return factors;
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(
    mechanisms: ViralMechanism[],
    triggers: EmotionalTrigger[],
    visualElements: VisualElement[],
    content: MultimodalContent
  ): number {
    let confidence = 0.5;

    // More mechanisms detected = higher confidence
    if (mechanisms.length >= 2) confidence += 0.15;
    if (mechanisms.length >= 4) confidence += 0.1;

    // Emotional triggers add confidence
    if (triggers.length >= 2) confidence += 0.1;

    // Visual analysis adds confidence
    if (visualElements.length > 0) confidence += 0.1;
    if (content.visualAnalysis?.denseCaption) confidence += 0.05;

    // Engagement data adds confidence
    if (content.engagement.views > 10000) confidence += 0.05;
    if (content.engagement.engagementRate > 0) confidence += 0.05;

    return Math.min(1, confidence);
  }
}

// ============================================================================
// Exports
// ============================================================================

export const createReplicabilityScorer = () => new ReplicabilityScorer();
