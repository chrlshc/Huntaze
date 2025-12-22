/**
 * Viral Prediction Engine
 * 
 * Main orchestration service for viral content analysis.
 * Combines mechanism detection, emotional analysis, visual analysis,
 * and generates actionable insights for content replication.
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Task 5.1
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ViralAnalysis,
  MultimodalContent,
  ViralAnalysisConfig,
  ViralPotentialPrediction,
  ReplicabilityScoreBreakdown,
  EngagementData,
} from './types';
import { MechanismDetector } from './mechanism-detector';
import { EmotionalAnalyzer } from './emotional-analyzer';
import { ReplicabilityScorer } from './replicability-scorer';
import { InsightGenerator } from './insight-generator';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ViralAnalysisConfig = {
  minConfidence: 0.3,
  includeReasoning: true,
  maxMechanisms: 10,
};

// ============================================================================
// Viral Prediction Engine Class
// ============================================================================

export class ViralPredictionEngine {
  private readonly mechanismDetector: MechanismDetector;
  private readonly emotionalAnalyzer: EmotionalAnalyzer;
  private readonly replicabilityScorer: ReplicabilityScorer;
  private readonly insightGenerator: InsightGenerator;
  private readonly config: ViralAnalysisConfig;

  constructor(config: Partial<ViralAnalysisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.mechanismDetector = new MechanismDetector(this.config.minConfidence);
    this.emotionalAnalyzer = new EmotionalAnalyzer(this.config.minConfidence);
    this.replicabilityScorer = new ReplicabilityScorer();
    this.insightGenerator = new InsightGenerator();
  }

  /**
   * Perform complete viral analysis on content
   */
  async analyzeViralMechanisms(content: MultimodalContent): Promise<ViralAnalysis> {
    const startTime = Date.now();

    // Detect viral mechanisms
    const viralMechanisms = this.mechanismDetector.detectMechanisms(content);
    const filteredMechanisms = viralMechanisms.slice(0, this.config.maxMechanisms);

    // Analyze cognitive dissonance
    const cognitiveDissonance = this.mechanismDetector.analyzeCognitiveDissonance(content);

    // Identify emotional triggers
    const emotionalTriggers = this.emotionalAnalyzer.analyzeEmotionalTriggers(content);

    // Extract visual elements from visual analysis
    const visualElements = content.visualAnalysis?.detectedElements || [];

    // Build engagement data
    const engagementMetrics = this.buildEngagementData(content);

    // Calculate replicability score
    const scoreBreakdown = this.replicabilityScorer.calculateScore(
      filteredMechanisms,
      emotionalTriggers,
      visualElements,
      content.engagement,
      content
    );

    // Generate insights and recommendations
    const insights = this.insightGenerator.generateInsights(
      filteredMechanisms,
      emotionalTriggers,
      visualElements,
      cognitiveDissonance,
      content.engagement,
      content
    );

    const recommendations = this.insightGenerator.generateRecommendations(
      filteredMechanisms,
      emotionalTriggers,
      visualElements,
      scoreBreakdown,
      content
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      id: uuidv4(),
      contentId: content.id,
      platform: content.platform,
      cognitiveDissonance,
      emotionalTriggers,
      visualElements,
      engagementMetrics,
      replicabilityScore: scoreBreakdown.overall,
      viralMechanisms: filteredMechanisms,
      denseCaption: content.visualAnalysis?.denseCaption,
      insights,
      recommendations,
      metadata: {
        analyzedAt: new Date(),
        processingTimeMs,
        modelsUsed: this.getModelsUsed(content),
        confidence: this.calculateOverallConfidence(
          filteredMechanisms,
          emotionalTriggers,
          scoreBreakdown
        ),
      },
    };
  }

  /**
   * Calculate replicability score with detailed breakdown
   */
  calculateReplicabilityScore(content: MultimodalContent): ReplicabilityScoreBreakdown {
    const mechanisms = this.mechanismDetector.detectMechanisms(content);
    const triggers = this.emotionalAnalyzer.analyzeEmotionalTriggers(content);
    const visualElements = content.visualAnalysis?.detectedElements || [];

    return this.replicabilityScorer.calculateScore(
      mechanisms,
      triggers,
      visualElements,
      content.engagement,
      content
    );
  }

  /**
   * Identify emotional triggers in content
   */
  identifyEmotionalTriggers(content: MultimodalContent) {
    return this.emotionalAnalyzer.analyzeEmotionalTriggers(content);
  }

  /**
   * Generate insights from analysis
   */
  generateInsights(analysis: ViralAnalysis) {
    return this.insightGenerator.generateInsights(
      analysis.viralMechanisms,
      analysis.emotionalTriggers,
      analysis.visualElements,
      analysis.cognitiveDissonance,
      analysis.engagementMetrics,
      {
        id: analysis.contentId,
        platform: analysis.platform,
        url: '',
        mediaType: 'video',
        engagement: analysis.engagementMetrics,
        metadata: { createdAt: new Date() },
      }
    );
  }

  /**
   * Predict viral potential for content
   */
  predictViralPotential(content: MultimodalContent): ViralPotentialPrediction {
    const mechanisms = this.mechanismDetector.detectMechanisms(content);
    const triggers = this.emotionalAnalyzer.analyzeEmotionalTriggers(content);
    const scoreBreakdown = this.calculateReplicabilityScore(content);

    // Calculate base probability from mechanisms
    const mechanismScore = mechanisms.length > 0
      ? mechanisms.reduce((sum, m) => sum + m.strength, 0) / mechanisms.length
      : 0;

    // Factor in emotional intensity
    const emotionalIntensity = this.emotionalAnalyzer.calculateEmotionalIntensity(triggers);

    // Factor in engagement rate
    const engagementFactor = Math.min(1, content.engagement.engagementRate * 10);

    // Combined probability
    const probability = Math.min(1, 
      (mechanismScore * 0.4) + 
      (emotionalIntensity * 0.3) + 
      (engagementFactor * 0.3)
    );

    // Calculate confidence interval
    const confidence = scoreBreakdown.confidence;
    const margin = (1 - confidence) * 0.2;
    const roundedProbability = Math.round(probability * 100) / 100;
    const confidenceInterval: [number, number] = [
      Math.round(Math.max(0, roundedProbability - margin) * 100) / 100,
      Math.round(Math.min(1, roundedProbability + margin) * 100) / 100,
    ];

    // Identify key factors
    const keyFactors = this.identifyKeyFactors(mechanisms, triggers, content);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(mechanisms, content);

    return {
      probability: Math.round(probability * 100) / 100,
      confidenceInterval,
      keyFactors,
      riskFactors,
      optimalTiming: this.suggestOptimalTiming(content),
    };
  }

  /**
   * Build engagement data with velocity metrics
   */
  private buildEngagementData(content: MultimodalContent): EngagementData {
    const { engagement, metadata } = content;
    
    // Calculate velocity if we have creation time
    const hoursOld = metadata.createdAt 
      ? (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60)
      : 24;

    const velocity = {
      viewsPerHour: hoursOld > 0 ? engagement.views / hoursOld : 0,
      likesPerHour: hoursOld > 0 ? engagement.likes / hoursOld : 0,
      sharesPerHour: hoursOld > 0 ? engagement.shares / hoursOld : 0,
    };

    return {
      ...engagement,
      velocity,
    };
  }

  /**
   * Get models used in analysis
   */
  private getModelsUsed(content: MultimodalContent): string[] {
    const models: string[] = ['mechanism-detector', 'emotional-analyzer'];
    
    if (content.visualAnalysis) {
      models.push('llama-vision');
    }
    
    return models;
  }

  /**
   * Calculate overall confidence in analysis
   */
  private calculateOverallConfidence(
    mechanisms: { strength: number }[],
    triggers: { confidence: number }[],
    scoreBreakdown: ReplicabilityScoreBreakdown
  ): number {
    const mechanismConfidence = mechanisms.length > 0
      ? mechanisms.reduce((sum, m) => sum + m.strength, 0) / mechanisms.length
      : 0;

    const triggerConfidence = triggers.length > 0
      ? triggers.reduce((sum, t) => sum + t.confidence, 0) / triggers.length
      : 0;

    return Math.round(
      ((mechanismConfidence + triggerConfidence + scoreBreakdown.confidence) / 3) * 100
    ) / 100;
  }

  /**
   * Identify key factors for viral potential
   */
  private identifyKeyFactors(
    mechanisms: { type: string; strength: number }[],
    triggers: { category: string; intensity: number }[],
    content: MultimodalContent
  ): ViralPotentialPrediction['keyFactors'] {
    const factors: ViralPotentialPrediction['keyFactors'] = [];

    // Top mechanisms
    for (const mechanism of mechanisms.slice(0, 3)) {
      factors.push({
        factor: mechanism.type.replace('_', ' '),
        contribution: mechanism.strength,
        direction: 'positive',
      });
    }

    // Top emotional triggers
    for (const trigger of triggers.slice(0, 2)) {
      factors.push({
        factor: `${trigger.category} emotion`,
        contribution: trigger.intensity * 0.5,
        direction: 'positive',
      });
    }

    // Engagement rate
    if (content.engagement.engagementRate > 0.05) {
      factors.push({
        factor: 'High engagement rate',
        contribution: Math.min(1, content.engagement.engagementRate * 5),
        direction: 'positive',
      });
    }

    return factors.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    mechanisms: { type: string }[],
    content: MultimodalContent
  ): string[] {
    const risks: string[] = [];

    // Controversial content risks
    if (mechanisms.some(m => m.type === 'controversy' || m.type === 'outrage')) {
      risks.push('Controversial content may damage brand reputation');
    }

    // Platform-specific risks
    if (content.platform === 'tiktok' && content.metadata.duration && content.metadata.duration > 60) {
      risks.push('Long-form content may have lower completion rates on TikTok');
    }

    // Trend dependency
    const hashtags = content.textContent?.hashtags || [];
    if (hashtags.some(h => h.toLowerCase().includes('trend'))) {
      risks.push('Trend-dependent content has limited shelf life');
    }

    // Celebrity/influencer dependency
    if (content.author?.verified || (content.author?.followerCount && content.author.followerCount > 500000)) {
      risks.push('Success may be tied to creator\'s existing audience');
    }

    return risks;
  }

  /**
   * Suggest optimal posting time
   */
  private suggestOptimalTiming(content: MultimodalContent): ViralPotentialPrediction['optimalTiming'] {
    // Platform-specific optimal times (simplified)
    const platformTiming: Record<string, { dayOfWeek: number; hourOfDay: number }> = {
      tiktok: { dayOfWeek: 2, hourOfDay: 19 }, // Tuesday 7pm
      instagram: { dayOfWeek: 3, hourOfDay: 11 }, // Wednesday 11am
      youtube: { dayOfWeek: 4, hourOfDay: 14 }, // Thursday 2pm
      twitter: { dayOfWeek: 3, hourOfDay: 9 }, // Wednesday 9am
    };

    const timing = platformTiming[content.platform] || { dayOfWeek: 3, hourOfDay: 12 };

    return {
      ...timing,
      timezone: 'UTC',
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let defaultEngine: ViralPredictionEngine | null = null;

export const getViralPredictionEngine = (config?: Partial<ViralAnalysisConfig>): ViralPredictionEngine => {
  if (!defaultEngine || config) {
    defaultEngine = new ViralPredictionEngine(config);
  }
  return defaultEngine;
};

export const createViralPredictionEngine = (config?: Partial<ViralAnalysisConfig>): ViralPredictionEngine => {
  return new ViralPredictionEngine(config);
};
