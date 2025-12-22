/**
 * Insight Generator
 * 
 * Generates actionable insights and replication recommendations
 * from viral analysis results.
 */

import type {
  ViralMechanism,
  EmotionalTrigger,
  VisualElement,
  DissonanceAnalysis,
  EngagementMetrics,
  ActionableInsight,
  ReplicationRecommendation,
  MultimodalContent,
  ReplicabilityScoreBreakdown,
} from './types';

// ============================================================================
// Insight Templates
// ============================================================================

const MECHANISM_INSIGHTS: Record<string, {
  category: ActionableInsight['category'];
  template: string;
  recommendation: string;
}> = {
  authenticity: {
    category: 'narrative',
    template: 'Content succeeds through authentic, unfiltered presentation',
    recommendation: 'Create behind-the-scenes or day-in-the-life content showing real moments',
  },
  controversy: {
    category: 'hook',
    template: 'Polarizing opinion drives engagement through debate',
    recommendation: 'Take a clear stance on industry topics (carefully consider brand alignment)',
  },
  humor: {
    category: 'narrative',
    template: 'Comedic elements increase shareability and memorability',
    recommendation: 'Incorporate relatable humor or trending meme formats',
  },
  surprise: {
    category: 'hook',
    template: 'Unexpected reveals maintain viewer attention to completion',
    recommendation: 'Structure content with a clear payoff or transformation reveal',
  },
  social_proof: {
    category: 'narrative',
    template: 'Social validation builds credibility and trust',
    recommendation: 'Feature testimonials, user-generated content, or trend participation',
  },
  curiosity_gap: {
    category: 'hook',
    template: 'Information gaps compel viewers to watch until the end',
    recommendation: 'Open with a question or teaser that gets answered at the end',
  },
  emotional_resonance: {
    category: 'narrative',
    template: 'Strong emotional connection drives deep engagement',
    recommendation: 'Share stories that evoke genuine emotional responses',
  },
  relatability: {
    category: 'narrative',
    template: 'Relatable situations create instant connection with audience',
    recommendation: 'Focus on universal experiences your target audience shares',
  },
  aspiration: {
    category: 'visual',
    template: 'Aspirational content inspires saves and follows',
    recommendation: 'Showcase achievable goals or lifestyle improvements',
  },
  fear_of_missing_out: {
    category: 'hook',
    template: 'Urgency and exclusivity drive immediate action',
    recommendation: 'Create time-sensitive or limited-access content',
  },
  nostalgia: {
    category: 'narrative',
    template: 'Nostalgic references create emotional bonds across generations',
    recommendation: 'Reference shared cultural moments relevant to your audience',
  },
  outrage: {
    category: 'hook',
    template: 'Exposing wrongdoing drives shares and calls to action',
    recommendation: 'Address industry problems or advocate for positive change',
  },
  inspiration: {
    category: 'narrative',
    template: 'Motivational content drives saves and repeat views',
    recommendation: 'Document journeys, transformations, or achievement stories',
  },
  educational_value: {
    category: 'narrative',
    template: 'Valuable information drives saves and establishes authority',
    recommendation: 'Share actionable tips, tutorials, or industry insights',
  },
};

const TIMING_INSIGHTS: Record<string, string> = {
  hook: 'Front-load the emotional impact in the first 3 seconds',
  buildup: 'Build tension gradually to maintain viewer retention',
  climax: 'Deliver the peak moment at 60-70% through the content',
  resolution: 'End with a clear takeaway or call-to-action',
  throughout: 'Maintain consistent emotional engagement throughout',
};

// ============================================================================
// Insight Generator Class
// ============================================================================

export class InsightGenerator {
  /**
   * Generate actionable insights from analysis
   */
  generateInsights(
    mechanisms: ViralMechanism[],
    triggers: EmotionalTrigger[],
    visualElements: VisualElement[],
    dissonance: DissonanceAnalysis,
    engagement: EngagementMetrics,
    content: MultimodalContent
  ): ActionableInsight[] {
    const insights: ActionableInsight[] = [];

    // Generate mechanism-based insights
    insights.push(...this.generateMechanismInsights(mechanisms));

    // Generate emotional timing insights
    insights.push(...this.generateTimingInsights(triggers));

    // Generate visual insights
    insights.push(...this.generateVisualInsights(visualElements, content));

    // Generate dissonance insights
    if (dissonance.isPresent) {
      insights.push(this.generateDissonanceInsight(dissonance));
    }

    // Generate engagement insights
    insights.push(...this.generateEngagementInsights(engagement));

    // Sort by impact and confidence
    return insights
      .sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
        if (impactDiff !== 0) return impactDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Top 10 insights
  }

  /**
   * Generate replication recommendations
   */
  generateRecommendations(
    mechanisms: ViralMechanism[],
    triggers: EmotionalTrigger[],
    visualElements: VisualElement[],
    scoreBreakdown: ReplicabilityScoreBreakdown,
    content: MultimodalContent
  ): ReplicationRecommendation[] {
    const recommendations: ReplicationRecommendation[] = [];
    let priority = 1;

    // Recommend based on top mechanisms
    for (const mechanism of mechanisms.slice(0, 3)) {
      const rec = this.createMechanismRecommendation(mechanism, priority++);
      if (rec) recommendations.push(rec);
    }

    // Recommend based on emotional triggers
    const hookTrigger = triggers.find(t => t.timing === 'hook');
    if (hookTrigger) {
      recommendations.push(this.createEmotionalRecommendation(hookTrigger, priority++));
    }

    // Recommend based on visual elements
    const impactfulVisuals = visualElements
      .filter(v => v.engagementImpact > 0.5)
      .slice(0, 2);
    for (const visual of impactfulVisuals) {
      recommendations.push(this.createVisualRecommendation(visual, priority++));
    }

    // Recommend based on score components
    recommendations.push(...this.createComponentRecommendations(scoreBreakdown, priority));

    // Sort by priority and expected impact
    return recommendations
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.expectedImpact] - impactOrder[a.expectedImpact];
      })
      .slice(0, 8); // Top 8 recommendations
  }

  /**
   * Generate insights from viral mechanisms
   */
  private generateMechanismInsights(mechanisms: ViralMechanism[]): ActionableInsight[] {
    return mechanisms.slice(0, 4).map(mechanism => {
      const template = MECHANISM_INSIGHTS[mechanism.type];
      return {
        category: template?.category || 'narrative',
        insight: template?.template || `Content leverages ${mechanism.type.replace('_', ' ')} mechanism`,
        impact: mechanism.strength > 0.7 ? 'high' : mechanism.strength > 0.4 ? 'medium' : 'low',
        recommendation: template?.recommendation || `Adapt the ${mechanism.type} approach for your brand`,
        evidence: mechanism.examples,
        confidence: mechanism.strength,
      };
    });
  }

  /**
   * Generate insights from emotional timing
   */
  private generateTimingInsights(triggers: EmotionalTrigger[]): ActionableInsight[] {
    const insights: ActionableInsight[] = [];
    const timings = new Set(triggers.map(t => t.timing));

    for (const timing of timings) {
      const timingTriggers = triggers.filter(t => t.timing === timing);
      const avgIntensity = timingTriggers.reduce((sum, t) => sum + t.intensity, 0) / timingTriggers.length;

      if (avgIntensity > 0.4) {
        insights.push({
          category: 'timing',
          insight: `Strong emotional engagement during ${timing} phase`,
          impact: avgIntensity > 0.7 ? 'high' : 'medium',
          recommendation: TIMING_INSIGHTS[timing] || `Optimize the ${timing} phase of your content`,
          evidence: timingTriggers.map(t => t.trigger),
          confidence: avgIntensity,
        });
      }
    }

    return insights;
  }

  /**
   * Generate insights from visual elements
   */
  private generateVisualInsights(
    visualElements: VisualElement[],
    content: MultimodalContent
  ): ActionableInsight[] {
    const insights: ActionableInsight[] = [];

    // High-impact visual elements
    const impactfulElements = visualElements.filter(v => v.engagementImpact > 0.6);
    if (impactfulElements.length > 0) {
      insights.push({
        category: 'visual',
        insight: `Key visual elements driving engagement: ${impactfulElements.map(v => v.type).join(', ')}`,
        impact: 'high',
        recommendation: 'Incorporate similar visual elements in your content',
        evidence: impactfulElements.map(v => v.description),
        confidence: Math.max(...impactfulElements.map(v => v.engagementImpact)),
      });
    }

    // Editing dynamics
    const editingDynamics = content.visualAnalysis?.editingDynamics;
    if (editingDynamics) {
      insights.push({
        category: 'visual',
        insight: `Content uses ${editingDynamics.pacing} pacing with ${editingDynamics.cutFrequency} cuts`,
        impact: editingDynamics.pacing === 'fast' ? 'high' : 'medium',
        recommendation: `Match the ${editingDynamics.pacing} editing rhythm for similar energy`,
        evidence: editingDynamics.transitionTypes,
        confidence: 0.7,
      });
    }

    return insights;
  }

  /**
   * Generate insight from cognitive dissonance
   */
  private generateDissonanceInsight(dissonance: DissonanceAnalysis): ActionableInsight {
    return {
      category: 'hook',
      insight: `Content creates cognitive dissonance through ${dissonance.type?.replace('_', ' ')}`,
      impact: dissonance.strength > 0.6 ? 'high' : 'medium',
      recommendation: 'Create tension between expectations and reality to capture attention',
      evidence: dissonance.elements,
      confidence: dissonance.strength,
    };
  }

  /**
   * Generate insights from engagement metrics
   */
  private generateEngagementInsights(engagement: EngagementMetrics): ActionableInsight[] {
    const insights: ActionableInsight[] = [];

    // High share ratio indicates highly shareable content
    const shareRatio = engagement.shares / engagement.views;
    if (shareRatio > 0.02) {
      insights.push({
        category: 'engagement',
        insight: 'Content has exceptional share rate, indicating high viral potential',
        impact: 'high',
        recommendation: 'Focus on creating content that viewers want to share with others',
        evidence: [`Share rate: ${(shareRatio * 100).toFixed(2)}%`],
        confidence: Math.min(1, shareRatio * 20),
      });
    }

    // High comment ratio indicates discussion-worthy content
    const commentRatio = engagement.comments / engagement.views;
    if (commentRatio > 0.01) {
      insights.push({
        category: 'engagement',
        insight: 'Content drives high comment engagement',
        impact: 'medium',
        recommendation: 'Include elements that encourage discussion or ask questions',
        evidence: [`Comment rate: ${(commentRatio * 100).toFixed(2)}%`],
        confidence: Math.min(1, commentRatio * 50),
      });
    }

    return insights;
  }

  /**
   * Create recommendation from mechanism
   */
  private createMechanismRecommendation(
    mechanism: ViralMechanism,
    priority: number
  ): ReplicationRecommendation | null {
    const template = MECHANISM_INSIGHTS[mechanism.type];
    if (!template) return null;

    return {
      priority,
      element: `${mechanism.type.replace('_', ' ')} mechanism`,
      adaptation: template.recommendation,
      rationale: mechanism.description,
      difficulty: mechanism.replicabilityFactor > 0.7 ? 'easy' : 
                  mechanism.replicabilityFactor > 0.4 ? 'medium' : 'hard',
      expectedImpact: mechanism.strength > 0.7 ? 'high' : 
                      mechanism.strength > 0.4 ? 'medium' : 'low',
    };
  }

  /**
   * Create recommendation from emotional trigger
   */
  private createEmotionalRecommendation(
    trigger: EmotionalTrigger,
    priority: number
  ): ReplicationRecommendation {
    return {
      priority,
      element: `${trigger.category} emotional hook`,
      adaptation: `Open with content that evokes ${trigger.category} in your audience`,
      rationale: `The ${trigger.category} trigger captures attention immediately`,
      difficulty: trigger.intensity > 0.7 ? 'medium' : 'easy',
      expectedImpact: trigger.intensity > 0.6 ? 'high' : 'medium',
    };
  }

  /**
   * Create recommendation from visual element
   */
  private createVisualRecommendation(
    visual: VisualElement,
    priority: number
  ): ReplicationRecommendation {
    return {
      priority,
      element: `${visual.type.replace('_', ' ')} visual element`,
      adaptation: `Incorporate ${visual.description.toLowerCase()} in your content`,
      rationale: `This visual element has ${Math.round(visual.engagementImpact * 100)}% engagement impact`,
      difficulty: visual.type === 'special_effect' ? 'hard' : 
                  visual.type === 'text_overlay' ? 'easy' : 'medium',
      expectedImpact: visual.engagementImpact > 0.7 ? 'high' : 'medium',
    };
  }

  /**
   * Create recommendations from score components
   */
  private createComponentRecommendations(
    scoreBreakdown: ReplicabilityScoreBreakdown,
    startPriority: number
  ): ReplicationRecommendation[] {
    const recommendations: ReplicationRecommendation[] = [];
    const { components } = scoreBreakdown;

    // Recommend improving weakest components
    const componentEntries = Object.entries(components) as [keyof typeof components, number][];
    const weakComponents = componentEntries
      .filter(([_, score]) => score < 50)
      .sort((a, b) => a[1] - b[1]);

    for (const [component, score] of weakComponents.slice(0, 2)) {
      recommendations.push({
        priority: startPriority++,
        element: component.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
        adaptation: this.getComponentImprovement(component),
        rationale: `Current score: ${score}/100 - room for improvement`,
        difficulty: 'medium',
        expectedImpact: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Get improvement suggestion for a component
   */
  private getComponentImprovement(component: string): string {
    const improvements: Record<string, string> = {
      hookReplicability: 'Simplify the hook to a clear, repeatable pattern',
      narrativeReplicability: 'Structure the story with a clear beginning, middle, and end',
      visualReplicability: 'Use simpler visual elements that can be recreated easily',
      contextTransferability: 'Make the content more universal and less niche-specific',
      resourceRequirements: 'Reduce production complexity for faster content creation',
    };
    return improvements[component] || 'Optimize this aspect of your content';
  }
}

// ============================================================================
// Exports
// ============================================================================

export const createInsightGenerator = () => new InsightGenerator();
