/**
 * Content Recommendation Engine
 * Task 5.3: Generate personalized content recommendations
 * Main orchestration service for content recommendations
 */

import type {
  BrandProfile,
  ContentRecommendation,
  RecommendationConfig,
  RecommendationResult,
  ContentBrief,
  HookSuggestion,
  NarrativeSuggestion,
  CallToActionSuggestion,
  VisualElementSuggestion,
  AudioSuggestion,
  TrendReference,
  ViralMechanismSuggestion,
  ContentGap,
  RecommendationPriority,
  ContentType,
} from './types';
import type { Trend, TrendAnalysisResult } from '../trend-detection/types';
import type { ViralAnalysis, ViralMechanism } from '../viral-prediction/types';
import { BrandAlignmentScorer } from './brand-alignment-scorer';
import { TimingOptimizer } from './timing-optimizer';

const DEFAULT_CONFIG: RecommendationConfig = {
  maxRecommendations: 10,
  minBrandAlignmentScore: 0.4,
  minViralPotentialScore: 0.3,
  prioritizeTrending: true,
  includeExpiringTrends: true,
  lookAheadDays: 7,
};

export interface RecommendationInput {
  trends: Trend[];
  viralAnalyses?: Map<string, ViralAnalysis>;
}

export class RecommendationEngine {
  private config: RecommendationConfig;
  private alignmentScorer: BrandAlignmentScorer;
  private timingOptimizer: TimingOptimizer;

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.alignmentScorer = new BrandAlignmentScorer();
    this.timingOptimizer = new TimingOptimizer();
  }

  /**
   * Generate content recommendations for a brand
   */
  async generateRecommendations(
    brand: BrandProfile,
    input: RecommendationInput
  ): Promise<RecommendationResult> {
    const { trends, viralAnalyses } = input;
    const recommendations: ContentRecommendation[] = [];
    const trendsCovered: string[] = [];

    // Score and filter trends
    const scoredTrends = this.scoreTrends(brand, trends, viralAnalyses);

    // Generate recommendations for top trends
    for (const { trend, alignmentResult, viralAnalysis } of scoredTrends) {
      if (recommendations.length >= this.config.maxRecommendations) break;

      const recommendation = this.createRecommendation(
        brand,
        trend,
        alignmentResult,
        viralAnalysis
      );

      if (this.meetsThresholds(recommendation)) {
        recommendations.push(recommendation);
        trendsCovered.push(trend.id);
      }
    }

    // Identify content gaps
    const contentGaps = this.identifyContentGaps(brand, trends, recommendations);

    return {
      recommendations: recommendations.sort((a, b) => b.overallScore - a.overallScore),
      brandProfile: brand,
      analysisTimestamp: new Date(),
      trendsCovered,
      contentGaps,
      nextRefreshAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Score trends for brand relevance
   */
  private scoreTrends(
    brand: BrandProfile,
    trends: Trend[],
    viralAnalyses?: Map<string, ViralAnalysis>
  ) {
    const scored = trends.map((trend) => {
      const viralAnalysis = viralAnalyses?.get(trend.id);
      const mechanisms = viralAnalysis?.viralMechanisms || this.inferMechanisms(trend);
      const alignmentResult = this.alignmentScorer.calculateAlignment(brand, trend, mechanisms);

      return {
        trend,
        alignmentResult,
        viralAnalysis,
        combinedScore: this.calculateCombinedScore(trend, alignmentResult.score),
      };
    });

    return scored.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * Calculate combined score for ranking
   */
  private calculateCombinedScore(trend: Trend, alignmentScore: number): number {
    const viralWeight = this.config.prioritizeTrending ? 0.4 : 0.3;
    const alignmentWeight = 0.35;
    const freshnessWeight = 0.15;
    const confidenceWeight = 0.1;

    const freshnessScore = this.calculateFreshnessScore(trend);

    return (
      trend.viralScore * viralWeight +
      alignmentScore * alignmentWeight +
      freshnessScore * freshnessWeight +
      trend.confidenceScore * confidenceWeight
    );
  }

  /**
   * Calculate freshness score based on trend phase
   */
  private calculateFreshnessScore(trend: Trend): number {
    const phaseScores: Record<string, number> = {
      emerging: 1.0,
      growing: 0.9,
      peak: 0.6,
      declining: 0.3,
      saturated: 0.1,
    };
    return phaseScores[trend.phase] || 0.5;
  }

  /**
   * Create a content recommendation
   */
  private createRecommendation(
    brand: BrandProfile,
    trend: Trend,
    alignmentResult: ReturnType<BrandAlignmentScorer['calculateAlignment']>,
    viralAnalysis?: ViralAnalysis
  ): ContentRecommendation {
    const platform = trend.signal.platform;
    const contentType = this.determineContentType(trend, brand);
    const timing = this.timingOptimizer.generateRecommendation(brand, trend, platform);

    const mechanisms = viralAnalysis?.viralMechanisms || this.inferMechanisms(trend);
    const contentBrief = this.generateContentBrief(brand, trend, mechanisms);

    const viralPotentialScore = trend.viralScore * trend.replicabilityScore;
    const timingScore = this.calculateTimingScore(timing, trend);
    const overallScore = this.calculateOverallScore(
      alignmentResult.score,
      viralPotentialScore,
      timingScore
    );

    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateTitle(trend, brand),
      description: this.generateDescription(trend, brand, mechanisms),
      contentType,
      platform,
      priority: this.determinePriority(overallScore, trend),
      brandAlignmentScore: alignmentResult.score,
      viralPotentialScore,
      timingScore,
      overallScore,
      trendReference: this.createTrendReference(trend),
      viralMechanisms: this.createMechanismSuggestions(mechanisms, brand),
      contentBrief,
      timing,
      reasoning: this.generateReasoning(trend, alignmentResult, mechanisms),
      createdAt: new Date(),
      expiresAt: this.calculateExpirationDate(trend),
    };
  }

  /**
   * Determine best content type for trend
   */
  private determineContentType(trend: Trend, brand: BrandProfile): ContentType {
    const platformPref = brand.platforms.find(
      (p) => p.platform.toLowerCase() === trend.signal.platform.toLowerCase()
    );

    const preferredTypes = platformPref?.contentTypes || ['video'];

    // Map trend categories to content types
    const categoryTypeMap: Record<string, ContentType[]> = {
      sound: ['video', 'story'],
      hashtag: ['video', 'image', 'carousel'],
      format: ['video'],
      topic: ['video', 'carousel', 'image'],
      challenge: ['video'],
      meme: ['image', 'video'],
    };

    const trendTypes = categoryTypeMap[trend.signal.category] || ['video'];

    // Find intersection
    const compatible = preferredTypes.filter((t) => trendTypes.includes(t));
    return compatible[0] || trendTypes[0] || 'video';
  }

  /**
   * Generate content brief
   */
  private generateContentBrief(
    brand: BrandProfile,
    trend: Trend,
    mechanisms: ViralMechanism[]
  ): ContentBrief {
    return {
      hook: this.generateHookSuggestion(trend, mechanisms, brand),
      narrative: this.generateNarrativeSuggestion(trend, brand),
      callToAction: this.generateCTASuggestion(brand),
      visualElements: this.generateVisualSuggestions(trend, mechanisms),
      audioSuggestions: this.generateAudioSuggestions(trend),
      hashtags: this.generateHashtags(trend, brand),
      duration: this.suggestDuration(trend),
    };
  }

  /**
   * Generate hook suggestion
   */
  private generateHookSuggestion(
    trend: Trend,
    mechanisms: ViralMechanism[],
    brand: BrandProfile
  ): HookSuggestion {
    // Determine hook type based on mechanisms and brand tone
    const hookTypes: Record<string, string> = {
      authenticity: 'pointed_truth',
      controversy: 'pointed_truth',
      humor: 'micro_scenario',
      surprise: 'fast_reward',
      social_proof: 'statistic',
    };

    const primaryMechanism = mechanisms.sort((a, b) => b.strength - a.strength)[0];
    const hookType = (hookTypes[primaryMechanism?.type] || 'question') as HookSuggestion['type'];

    const hookTemplates: Record<string, string> = {
      pointed_truth: `The truth about ${trend.signal.name} that nobody talks about...`,
      micro_scenario: `POV: You just discovered ${trend.signal.name}...`,
      fast_reward: `Here's what happens when you try ${trend.signal.name}...`,
      constraint_negative: `Stop doing this with ${trend.signal.name}...`,
      question: `Have you tried ${trend.signal.name} yet?`,
      statistic: `${Math.floor(trend.metrics.totalViews / 1000)}K people are talking about ${trend.signal.name}...`,
    };

    return {
      type: hookType,
      text: hookTemplates[hookType],
      timing: '0-3s',
      emotionalTrigger: primaryMechanism?.type || 'curiosity',
    };
  }

  /**
   * Generate narrative suggestion
   */
  private generateNarrativeSuggestion(trend: Trend, brand: BrandProfile): NarrativeSuggestion {
    const goalStructureMap: Record<string, NarrativeSuggestion['structure']> = {
      awareness: 'story_arc',
      engagement: 'comparison',
      conversion: 'problem_solution',
      retention: 'behind_scenes',
      education: 'tutorial',
    };

    const primaryGoal = brand.contentGoals.sort((a, b) => b.priority - a.priority)[0];
    const structure = goalStructureMap[primaryGoal?.type] || 'story_arc';

    const structureKeyPoints: Record<string, string[]> = {
      problem_solution: [
        'Identify the problem your audience faces',
        `Show how ${trend.signal.name} relates to the solution`,
        'Demonstrate the transformation',
      ],
      story_arc: [
        'Set the scene with relatable context',
        'Build tension or curiosity',
        'Deliver the payoff',
      ],
      listicle: [
        'Start with the most impactful point',
        'Keep each point concise',
        'End with a memorable takeaway',
      ],
      comparison: [
        'Show the before state',
        'Introduce the change',
        'Highlight the difference',
      ],
      tutorial: [
        'State what viewers will learn',
        'Break down into simple steps',
        'Show the final result',
      ],
      behind_scenes: [
        'Create intimacy with exclusive access',
        'Show authentic moments',
        'Connect to brand values',
      ],
    };

    return {
      structure,
      keyPoints: structureKeyPoints[structure] || [],
      transitionTips: [
        'Use visual transitions to maintain flow',
        'Keep energy consistent throughout',
        'Build to a clear conclusion',
      ],
      retentionTechniques: [
        'Tease upcoming content early',
        'Use pattern interrupts every 5-7 seconds',
        'End with a question or cliffhanger',
      ],
    };
  }

  /**
   * Generate CTA suggestion
   */
  private generateCTASuggestion(brand: BrandProfile): CallToActionSuggestion {
    const primaryGoal = brand.contentGoals.sort((a, b) => b.priority - a.priority)[0];

    const goalCTAs: Record<string, { primary: string; secondary: string }> = {
      awareness: {
        primary: 'Follow for more content like this',
        secondary: 'Share with someone who needs to see this',
      },
      engagement: {
        primary: 'Drop a comment with your thoughts',
        secondary: 'Save this for later',
      },
      conversion: {
        primary: 'Link in bio to learn more',
        secondary: 'DM us for details',
      },
      retention: {
        primary: 'Turn on notifications',
        secondary: 'Join our community',
      },
      education: {
        primary: 'Save this for reference',
        secondary: 'Share with your team',
      },
    };

    const cta = goalCTAs[primaryGoal?.type] || goalCTAs.engagement;

    return {
      primary: cta.primary,
      secondary: cta.secondary,
      placement: 'end',
      urgencyLevel: 'medium',
    };
  }

  /**
   * Generate visual element suggestions
   */
  private generateVisualSuggestions(
    trend: Trend,
    mechanisms: ViralMechanism[]
  ): VisualElementSuggestion[] {
    const suggestions: VisualElementSuggestion[] = [
      {
        element: 'Text overlay',
        purpose: 'Reinforce key message for sound-off viewers',
        timing: 'Throughout',
      },
      {
        element: 'Brand colors',
        purpose: 'Maintain brand recognition',
        timing: 'Subtle throughout',
      },
    ];

    // Add mechanism-specific suggestions
    for (const mechanism of mechanisms) {
      if (mechanism.type === 'authenticity') {
        suggestions.push({
          element: 'Behind-the-scenes footage',
          purpose: 'Build authenticity and trust',
        });
      }
      if (mechanism.type === 'surprise') {
        suggestions.push({
          element: 'Unexpected visual transition',
          purpose: 'Create pattern interrupt',
          timing: '3-5s mark',
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate audio suggestions
   */
  private generateAudioSuggestions(trend: Trend): AudioSuggestion[] {
    const suggestions: AudioSuggestion[] = [];

    if (trend.signal.category === 'sound') {
      suggestions.push({
        type: 'trending_sound',
        suggestion: `Use trending sound: ${trend.signal.name}`,
        source: trend.signal.identifier,
        trendingScore: trend.viralScore,
      });
    } else {
      suggestions.push({
        type: 'voiceover',
        suggestion: 'Add engaging voiceover to guide viewers',
      });
      suggestions.push({
        type: 'music',
        suggestion: 'Use upbeat background music matching content energy',
      });
    }

    return suggestions;
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(trend: Trend, brand: BrandProfile): string[] {
    const hashtags: string[] = [];

    // Trend-related hashtag
    if (trend.signal.category === 'hashtag') {
      hashtags.push(`#${trend.signal.identifier}`);
    }

    // Platform-specific trending hashtags
    hashtags.push(`#${trend.signal.name.replace(/\s+/g, '')}`);

    // Industry hashtags
    hashtags.push(`#${brand.industry.replace(/\s+/g, '')}`);

    // Generic engagement hashtags
    const platformHashtags: Record<string, string[]> = {
      tiktok: ['#fyp', '#foryou', '#viral'],
      instagram: ['#reels', '#explore', '#trending'],
      youtube: ['#shorts', '#trending'],
      twitter: ['#trending'],
    };

    const platformTags = platformHashtags[trend.signal.platform] || [];
    hashtags.push(...platformTags.slice(0, 2));

    return [...new Set(hashtags)].slice(0, 10);
  }

  /**
   * Suggest content duration
   */
  private suggestDuration(trend: Trend): number {
    const platformDurations: Record<string, number> = {
      tiktok: 30,
      instagram: 45,
      youtube: 60,
      twitter: 30,
    };

    return platformDurations[trend.signal.platform] || 30;
  }

  /**
   * Create trend reference
   */
  private createTrendReference(trend: Trend): TrendReference {
    return {
      trendId: trend.id,
      trendName: trend.signal.name,
      platform: trend.signal.platform,
      relevanceScore: trend.viralScore,
      adaptationNotes: `Adapt ${trend.signal.category} trend while maintaining brand voice`,
    };
  }

  /**
   * Create mechanism suggestions
   */
  private createMechanismSuggestions(
    mechanisms: ViralMechanism[],
    brand: BrandProfile
  ): ViralMechanismSuggestion[] {
    return mechanisms.slice(0, 3).map((m) => ({
      mechanism: m.type,
      description: m.description,
      applicationTip: this.getMechanismTip(m.type, brand.tone),
    }));
  }

  /**
   * Get mechanism application tip
   */
  private getMechanismTip(mechanismType: string, brandTone: string): string {
    const tips: Record<string, Record<string, string>> = {
      authenticity: {
        professional: 'Share industry insights with genuine expertise',
        casual: 'Show the real, unfiltered side of your brand',
        humorous: 'Use self-deprecating humor authentically',
        authoritative: 'Back claims with data and experience',
        inspirational: 'Share genuine success stories',
      },
      controversy: {
        professional: 'Challenge industry assumptions respectfully',
        casual: 'Take a bold stance on relatable topics',
        humorous: 'Use satire to highlight contradictions',
        authoritative: 'Present contrarian views with evidence',
        inspirational: 'Challenge limiting beliefs',
      },
      humor: {
        professional: 'Use wit and clever observations',
        casual: 'Embrace relatable, everyday humor',
        humorous: 'Go all-in on comedy',
        authoritative: 'Use dry humor sparingly',
        inspirational: 'Balance humor with uplifting messages',
      },
      surprise: {
        professional: 'Reveal unexpected industry insights',
        casual: 'Create unexpected twists in storytelling',
        humorous: 'Use comedic misdirection',
        authoritative: 'Present surprising data or facts',
        inspirational: 'Share unexpected transformation stories',
      },
      social_proof: {
        professional: 'Showcase client testimonials and results',
        casual: 'Feature user-generated content',
        humorous: 'Playfully highlight community engagement',
        authoritative: 'Present case studies and statistics',
        inspirational: 'Share community success stories',
      },
    };

    return tips[mechanismType]?.[brandTone] || 'Apply this mechanism authentically to your brand';
  }

  /**
   * Calculate timing score
   */
  private calculateTimingScore(
    timing: ReturnType<TimingOptimizer['generateRecommendation']>,
    trend: Trend
  ): number {
    let score = 0.5;

    // Boost for immediate/trend-aligned strategies
    if (timing.strategy === 'immediate' || timing.strategy === 'trend-aligned') {
      score += 0.2;
    }

    // Boost for trends with remaining window
    if (timing.trendWindowRemaining && timing.trendWindowRemaining > 48) {
      score += 0.2;
    }

    // Boost for emerging/growing trends
    if (trend.phase === 'emerging' || trend.phase === 'growing') {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate overall recommendation score
   */
  private calculateOverallScore(
    alignmentScore: number,
    viralPotentialScore: number,
    timingScore: number
  ): number {
    return (
      alignmentScore * 0.35 +
      viralPotentialScore * 0.4 +
      timingScore * 0.25
    );
  }

  /**
   * Determine recommendation priority
   */
  private determinePriority(score: number, trend: Trend): RecommendationPriority {
    if (score > 0.8 || trend.phase === 'emerging') return 'urgent';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendation title
   */
  private generateTitle(trend: Trend, brand: BrandProfile): string {
    return `${trend.signal.name} - ${brand.industry} Adaptation`;
  }

  /**
   * Generate recommendation description
   */
  private generateDescription(
    trend: Trend,
    brand: BrandProfile,
    mechanisms: ViralMechanism[]
  ): string {
    const primaryMechanism = mechanisms[0];
    return `Leverage the "${trend.signal.name}" trend on ${trend.signal.platform} using ${primaryMechanism?.type || 'viral'} mechanics adapted for ${brand.tone} brand voice.`;
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    trend: Trend,
    alignmentResult: ReturnType<BrandAlignmentScorer['calculateAlignment']>,
    mechanisms: ViralMechanism[]
  ): string {
    const parts: string[] = [];

    parts.push(`Trend "${trend.signal.name}" is in ${trend.phase} phase with ${(trend.viralScore * 100).toFixed(0)}% viral potential.`);

    if (alignmentResult.score > 0.7) {
      parts.push('Strong brand alignment detected.');
    } else if (alignmentResult.score > 0.5) {
      parts.push('Moderate brand alignment with adaptation potential.');
    }

    if (mechanisms.length > 0) {
      parts.push(`Key viral mechanisms: ${mechanisms.slice(0, 2).map((m) => m.type).join(', ')}.`);
    }

    if (alignmentResult.warnings.length > 0) {
      parts.push(`Note: ${alignmentResult.warnings[0]}`);
    }

    return parts.join(' ');
  }

  /**
   * Calculate expiration date for recommendation
   */
  private calculateExpirationDate(trend: Trend): Date {
    const phaseExpiration: Record<string, number> = {
      emerging: 7,
      growing: 5,
      peak: 3,
      declining: 1,
      saturated: 0,
    };

    const days = phaseExpiration[trend.phase] || 3;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Check if recommendation meets thresholds
   */
  private meetsThresholds(recommendation: ContentRecommendation): boolean {
    return (
      recommendation.brandAlignmentScore >= this.config.minBrandAlignmentScore &&
      recommendation.viralPotentialScore >= this.config.minViralPotentialScore
    );
  }

  /**
   * Infer mechanisms from trend data
   */
  private inferMechanisms(trend: Trend): ViralMechanism[] {
    const mechanisms: ViralMechanism[] = [];

    // Infer based on engagement patterns
    const { averageEngagementRate } = trend.metrics;

    if (averageEngagementRate > 0.1) {
      mechanisms.push({
        type: 'authenticity',
        strength: 0.7,
        description: 'High engagement suggests authentic content resonance',
        replicabilityFactor: 0.6,
        examples: ['High engagement rate indicates genuine audience connection'],
      });
    }

    if (trend.metrics.velocity.sharesPerHour > 100) {
      mechanisms.push({
        type: 'social_proof',
        strength: 0.8,
        description: 'High share velocity indicates social proof mechanism',
        replicabilityFactor: 0.7,
        examples: ['Rapid sharing suggests content worth spreading'],
      });
    }

    if (trend.phase === 'emerging') {
      mechanisms.push({
        type: 'surprise',
        strength: 0.6,
        description: 'Emerging trends often leverage novelty and surprise',
        replicabilityFactor: 0.5,
        examples: ['New trend format creates novelty effect'],
      });
    }

    return mechanisms;
  }

  /**
   * Identify content gaps
   */
  private identifyContentGaps(
    brand: BrandProfile,
    trends: Trend[],
    recommendations: ContentRecommendation[]
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Check for platform coverage gaps
    const coveredPlatforms = new Set(recommendations.map((r) => r.platform));
    for (const pref of brand.platforms) {
      if (!coveredPlatforms.has(pref.platform.toLowerCase()) && pref.priority > 5) {
        gaps.push({
          area: 'Platform Coverage',
          description: `No recommendations for ${pref.platform}`,
          opportunity: `Explore trends on ${pref.platform} for this brand`,
          suggestedAction: `Monitor ${pref.platform} trends more closely`,
        });
      }
    }

    // Check for content type gaps
    const coveredTypes = new Set(recommendations.map((r) => r.contentType));
    const preferredTypes = brand.platforms.flatMap((p) => p.contentTypes);
    for (const type of preferredTypes) {
      if (!coveredTypes.has(type)) {
        gaps.push({
          area: 'Content Type',
          description: `No ${type} content recommendations`,
          opportunity: `Create ${type} content to diversify`,
          suggestedAction: `Look for trends suitable for ${type} format`,
        });
      }
    }

    // Check for goal alignment gaps
    const goalsCovered = new Set<string>();
    for (const rec of recommendations) {
      if (rec.brandAlignmentScore > 0.6) {
        // Infer covered goals from high-alignment recommendations
        goalsCovered.add('engagement');
      }
    }

    for (const goal of brand.contentGoals) {
      if (!goalsCovered.has(goal.type) && goal.priority > 5) {
        gaps.push({
          area: 'Goal Alignment',
          description: `Limited content for ${goal.type} goal`,
          opportunity: `Create content specifically targeting ${goal.type}`,
          suggestedAction: `Prioritize trends that support ${goal.type}`,
        });
      }
    }

    return gaps;
  }
}
