/**
 * Property Tests: Viral Analysis Completeness (Property 8)
 * 
 * Validates Requirements 7.1, 7.2, 7.3, 7.5 from design.md:
 * - Visual analysis combined with engagement metrics
 * - Cognitive dissonance and emotional triggers identified
 * - Dense captions include all required elements
 * - Structured JSON output with insights and recommendations
 * 
 * @see .kiro/specs/content-trends-ai-engine/design.md - Property 8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ViralPredictionEngine,
  MechanismDetector,
  EmotionalAnalyzer,
  ReplicabilityScorer,
  InsightGenerator,
  type MultimodalContent,
  type ViralMechanism,
  type EmotionalTrigger,
  type VisualElement,
  type EngagementMetrics,
} from '../../../lib/ai/content-trends/viral-prediction';

// ============================================================================
// Test Generators
// ============================================================================

const platformArb = fc.constantFrom('tiktok', 'instagram', 'youtube', 'twitter') as fc.Arbitrary<'tiktok' | 'instagram' | 'youtube' | 'twitter'>;
const mediaTypeArb = fc.constantFrom('video', 'image', 'carousel', 'text') as fc.Arbitrary<'video' | 'image' | 'carousel' | 'text'>;

const engagementMetricsArb: fc.Arbitrary<EngagementMetrics> = fc.record({
  views: fc.integer({ min: 100, max: 10000000 }),
  likes: fc.integer({ min: 0, max: 1000000 }),
  shares: fc.integer({ min: 0, max: 100000 }),
  comments: fc.integer({ min: 0, max: 50000 }),
  engagementRate: fc.float({ min: 0, max: 0.5, noNaN: true }),
  velocity: fc.record({
    viewsPerHour: fc.float({ min: 0, max: 100000, noNaN: true }),
    likesPerHour: fc.float({ min: 0, max: 10000, noNaN: true }),
    sharesPerHour: fc.float({ min: 0, max: 5000, noNaN: true }),
  }),
});


const visualElementArb: fc.Arbitrary<VisualElement> = fc.record({
  type: fc.constantFrom('face', 'text_overlay', 'product', 'logo', 'scene_transition', 'special_effect', 'color_scheme', 'composition', 'movement', 'lighting') as fc.Arbitrary<VisualElement['type']>,
  description: fc.string({ minLength: 5, maxLength: 100 }),
  prominence: fc.float({ min: 0, max: 1, noNaN: true }),
  engagementImpact: fc.float({ min: 0, max: 1, noNaN: true }),
});

const hashtagArb = fc.array(
  fc.string({ minLength: 3, maxLength: 20 }).map(s => `#${s.replace(/[^a-z0-9]/gi, '')}`),
  { minLength: 0, maxLength: 10 }
);

const captionWithKeywordsArb = fc.oneof(
  fc.constant('This is so funny lol 😂 wait for it'),
  fc.constant('Honest review - the truth about this product'),
  fc.constant('POV: when you realize the plot twist'),
  fc.constant('Secret hack that changed my life'),
  fc.constant('Unpopular opinion but I think this is wrong'),
  fc.constant('Goals! This luxury lifestyle is amazing'),
  fc.constant('Remember when we used to do this? Throwback'),
  fc.constant('Learn this tip to improve your skills'),
  fc.string({ minLength: 10, maxLength: 200 }),
);

const multimodalContentArb: fc.Arbitrary<MultimodalContent> = fc.record({
  id: fc.uuid(),
  platform: platformArb,
  url: fc.webUrl(),
  mediaType: mediaTypeArb,
  textContent: fc.option(fc.record({
    caption: fc.option(captionWithKeywordsArb),
    description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
    hashtags: hashtagArb,
    mentions: fc.array(fc.string({ minLength: 1, maxLength: 20 }).map(s => `@${s}`), { minLength: 0, maxLength: 5 }),
  }), { nil: undefined }),
  visualAnalysis: fc.option(fc.record({
    denseCaption: fc.string({ minLength: 20, maxLength: 500 }),
    detectedElements: fc.array(visualElementArb, { minLength: 0, maxLength: 10 }),
    ocrText: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
    facialExpressions: fc.option(fc.array(fc.record({
      expression: fc.constantFrom('happy', 'sad', 'surprised', 'angry', 'neutral'),
      confidence: fc.float({ min: 0, max: 1, noNaN: true }),
    }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
    editingDynamics: fc.option(fc.record({
      cutFrequency: fc.integer({ min: 0, max: 50 }),
      transitionTypes: fc.array(fc.constantFrom('cut', 'fade', 'dissolve', 'wipe', 'contrast'), { minLength: 0, maxLength: 5 }),
      pacing: fc.constantFrom('slow', 'medium', 'fast') as fc.Arbitrary<'slow' | 'medium' | 'fast'>,
    }), { nil: undefined }),
  }), { nil: undefined }),
  engagement: engagementMetricsArb,
  author: fc.option(fc.record({
    username: fc.string({ minLength: 3, maxLength: 30 }),
    followerCount: fc.integer({ min: 0, max: 100000000 }),
    verified: fc.boolean(),
    averageEngagement: fc.option(fc.float({ min: 0, max: 0.5, noNaN: true }), { nil: undefined }),
  }), { nil: undefined }),
  metadata: fc.record({
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    duration: fc.option(fc.integer({ min: 1, max: 600 }), { nil: undefined }),
    language: fc.option(fc.constantFrom('en', 'es', 'fr', 'de', 'pt'), { nil: undefined }),
    category: fc.option(fc.constantFrom('entertainment', 'education', 'lifestyle', 'comedy', 'music'), { nil: undefined }),
  }),
});


// ============================================================================
// Property Tests: Mechanism Detection
// ============================================================================

describe('Feature: content-trends-ai-engine, Property 8: Viral Analysis Completeness', () => {
  describe('Mechanism Detection', () => {
    it('should detect mechanisms with strength between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector(0.1);
          const mechanisms = detector.detectMechanisms(content);
          
          for (const mechanism of mechanisms) {
            expect(mechanism.strength).toBeGreaterThanOrEqual(0);
            expect(mechanism.strength).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return mechanisms sorted by strength descending', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector(0.1);
          const mechanisms = detector.detectMechanisms(content);
          
          for (let i = 1; i < mechanisms.length; i++) {
            expect(mechanisms[i - 1].strength).toBeGreaterThanOrEqual(mechanisms[i].strength);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid mechanism types', () => {
      const validTypes = [
        'authenticity', 'controversy', 'humor', 'surprise', 'social_proof',
        'curiosity_gap', 'emotional_resonance', 'relatability', 'aspiration',
        'fear_of_missing_out', 'nostalgia', 'outrage', 'inspiration', 'educational_value'
      ];

      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector(0.1);
          const mechanisms = detector.detectMechanisms(content);
          
          for (const mechanism of mechanisms) {
            expect(validTypes).toContain(mechanism.type);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have replicability factor between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector(0.1);
          const mechanisms = detector.detectMechanisms(content);
          
          for (const mechanism of mechanisms) {
            expect(mechanism.replicabilityFactor).toBeGreaterThanOrEqual(0);
            expect(mechanism.replicabilityFactor).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should include description for each mechanism', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector(0.1);
          const mechanisms = detector.detectMechanisms(content);
          
          for (const mechanism of mechanisms) {
            expect(mechanism.description).toBeDefined();
            expect(mechanism.description.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });
  });


  // ============================================================================
  // Property Tests: Cognitive Dissonance Analysis
  // ============================================================================

  describe('Cognitive Dissonance Analysis', () => {
    it('should return valid dissonance analysis structure', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector();
          const dissonance = detector.analyzeCognitiveDissonance(content);
          
          expect(typeof dissonance.isPresent).toBe('boolean');
          expect(dissonance.strength).toBeGreaterThanOrEqual(0);
          expect(dissonance.strength).toBeLessThanOrEqual(1);
          expect(typeof dissonance.description).toBe('string');
          expect(Array.isArray(dissonance.elements)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid dissonance type when present', () => {
      const validTypes = ['expectation_violation', 'belief_challenge', 'identity_conflict', 'value_contradiction'];

      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const detector = new MechanismDetector();
          const dissonance = detector.analyzeCognitiveDissonance(content);
          
          if (dissonance.isPresent && dissonance.type) {
            expect(validTypes).toContain(dissonance.type);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Property Tests: Emotional Trigger Analysis
  // ============================================================================

  describe('Emotional Trigger Analysis', () => {
    it('should detect triggers with intensity between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const analyzer = new EmotionalAnalyzer(0.1);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          
          for (const trigger of triggers) {
            expect(trigger.intensity).toBeGreaterThanOrEqual(0);
            expect(trigger.intensity).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return triggers sorted by intensity descending', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const analyzer = new EmotionalAnalyzer(0.1);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          
          for (let i = 1; i < triggers.length; i++) {
            expect(triggers[i - 1].intensity).toBeGreaterThanOrEqual(triggers[i].intensity);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid emotional categories', () => {
      const validCategories = [
        'joy', 'surprise', 'anger', 'fear', 'sadness', 'disgust',
        'anticipation', 'trust', 'curiosity', 'empathy', 'pride', 'envy'
      ];

      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const analyzer = new EmotionalAnalyzer(0.1);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          
          for (const trigger of triggers) {
            expect(validCategories).toContain(trigger.category);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid timing values', () => {
      const validTimings = ['hook', 'buildup', 'climax', 'resolution', 'throughout'];

      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const analyzer = new EmotionalAnalyzer(0.1);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          
          for (const trigger of triggers) {
            expect(validTimings).toContain(trigger.timing);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have confidence between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const analyzer = new EmotionalAnalyzer(0.1);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          
          for (const trigger of triggers) {
            expect(trigger.confidence).toBeGreaterThanOrEqual(0);
            expect(trigger.confidence).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });
  });


  // ============================================================================
  // Property Tests: Replicability Scoring
  // ============================================================================

  describe('Replicability Scoring', () => {
    it('should return overall score between 0 and 100', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const scorer = new ReplicabilityScorer();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const score = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          expect(score.overall).toBeGreaterThanOrEqual(0);
          expect(score.overall).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });

    it('should return all component scores between 0 and 100', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const scorer = new ReplicabilityScorer();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const score = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          expect(score.components.hookReplicability).toBeGreaterThanOrEqual(0);
          expect(score.components.hookReplicability).toBeLessThanOrEqual(100);
          expect(score.components.narrativeReplicability).toBeGreaterThanOrEqual(0);
          expect(score.components.narrativeReplicability).toBeLessThanOrEqual(100);
          expect(score.components.visualReplicability).toBeGreaterThanOrEqual(0);
          expect(score.components.visualReplicability).toBeLessThanOrEqual(100);
          expect(score.components.contextTransferability).toBeGreaterThanOrEqual(0);
          expect(score.components.contextTransferability).toBeLessThanOrEqual(100);
          expect(score.components.resourceRequirements).toBeGreaterThanOrEqual(0);
          expect(score.components.resourceRequirements).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });

    it('should return confidence between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const scorer = new ReplicabilityScorer();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const score = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          expect(score.confidence).toBeGreaterThanOrEqual(0);
          expect(score.confidence).toBeLessThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should include factors with valid impact direction', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const scorer = new ReplicabilityScorer();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const score = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          for (const factor of score.factors) {
            expect(['positive', 'negative']).toContain(factor.impact);
            expect(factor.weight).toBeGreaterThanOrEqual(0);
            expect(factor.weight).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });
  });


  // ============================================================================
  // Property Tests: Insight Generation
  // ============================================================================

  describe('Insight Generation', () => {
    it('should generate insights with valid impact levels', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const dissonance = detector.analyzeCognitiveDissonance(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const insights = generator.generateInsights(
            mechanisms,
            triggers,
            visualElements,
            dissonance,
            content.engagement,
            content
          );
          
          for (const insight of insights) {
            expect(['high', 'medium', 'low']).toContain(insight.impact);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate insights with valid categories', () => {
      const validCategories = ['hook', 'narrative', 'visual', 'audio', 'timing', 'engagement'];

      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const dissonance = detector.analyzeCognitiveDissonance(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const insights = generator.generateInsights(
            mechanisms,
            triggers,
            visualElements,
            dissonance,
            content.engagement,
            content
          );
          
          for (const insight of insights) {
            expect(validCategories).toContain(insight.category);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate insights with confidence between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const dissonance = detector.analyzeCognitiveDissonance(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const insights = generator.generateInsights(
            mechanisms,
            triggers,
            visualElements,
            dissonance,
            content.engagement,
            content
          );
          
          for (const insight of insights) {
            expect(insight.confidence).toBeGreaterThanOrEqual(0);
            expect(insight.confidence).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should limit insights to maximum 10', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const dissonance = detector.analyzeCognitiveDissonance(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          
          const insights = generator.generateInsights(
            mechanisms,
            triggers,
            visualElements,
            dissonance,
            content.engagement,
            content
          );
          
          expect(insights.length).toBeLessThanOrEqual(10);
        }),
        { numRuns: 100 }
      );
    });
  });


  // ============================================================================
  // Property Tests: Recommendation Generation
  // ============================================================================

  describe('Recommendation Generation', () => {
    it('should generate recommendations with valid difficulty levels', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          const scorer = new ReplicabilityScorer();
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          const scoreBreakdown = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          const recommendations = generator.generateRecommendations(
            mechanisms,
            triggers,
            visualElements,
            scoreBreakdown,
            content
          );
          
          for (const rec of recommendations) {
            expect(['easy', 'medium', 'hard']).toContain(rec.difficulty);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate recommendations with valid expected impact', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          const scorer = new ReplicabilityScorer();
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          const scoreBreakdown = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          const recommendations = generator.generateRecommendations(
            mechanisms,
            triggers,
            visualElements,
            scoreBreakdown,
            content
          );
          
          for (const rec of recommendations) {
            expect(['high', 'medium', 'low']).toContain(rec.expectedImpact);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate recommendations with positive priority', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          const scorer = new ReplicabilityScorer();
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          const scoreBreakdown = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          const recommendations = generator.generateRecommendations(
            mechanisms,
            triggers,
            visualElements,
            scoreBreakdown,
            content
          );
          
          for (const rec of recommendations) {
            expect(rec.priority).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should limit recommendations to maximum 8', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const generator = new InsightGenerator();
          const detector = new MechanismDetector(0.1);
          const analyzer = new EmotionalAnalyzer(0.1);
          const scorer = new ReplicabilityScorer();
          
          const mechanisms = detector.detectMechanisms(content);
          const triggers = analyzer.analyzeEmotionalTriggers(content);
          const visualElements = content.visualAnalysis?.detectedElements || [];
          const scoreBreakdown = scorer.calculateScore(
            mechanisms,
            triggers,
            visualElements,
            content.engagement,
            content
          );
          
          const recommendations = generator.generateRecommendations(
            mechanisms,
            triggers,
            visualElements,
            scoreBreakdown,
            content
          );
          
          expect(recommendations.length).toBeLessThanOrEqual(8);
        }),
        { numRuns: 100 }
      );
    });
  });


  // ============================================================================
  // Property Tests: Complete Viral Analysis (Integration)
  // ============================================================================

  describe('Complete Viral Analysis', () => {
    it('should return complete analysis structure', async () => {
      await fc.assert(
        fc.asyncProperty(multimodalContentArb, async (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const analysis = await engine.analyzeViralMechanisms(content);
          
          // Verify structure completeness
          expect(analysis.id).toBeDefined();
          expect(analysis.contentId).toBe(content.id);
          expect(analysis.platform).toBe(content.platform);
          expect(analysis.cognitiveDissonance).toBeDefined();
          expect(Array.isArray(analysis.emotionalTriggers)).toBe(true);
          expect(Array.isArray(analysis.visualElements)).toBe(true);
          expect(analysis.engagementMetrics).toBeDefined();
          expect(typeof analysis.replicabilityScore).toBe('number');
          expect(Array.isArray(analysis.viralMechanisms)).toBe(true);
          expect(Array.isArray(analysis.insights)).toBe(true);
          expect(Array.isArray(analysis.recommendations)).toBe(true);
          expect(analysis.metadata).toBeDefined();
        }),
        { numRuns: 50 }
      );
    });

    it('should have valid replicability score between 0 and 100', async () => {
      await fc.assert(
        fc.asyncProperty(multimodalContentArb, async (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const analysis = await engine.analyzeViralMechanisms(content);
          
          expect(analysis.replicabilityScore).toBeGreaterThanOrEqual(0);
          expect(analysis.replicabilityScore).toBeLessThanOrEqual(100);
        }),
        { numRuns: 50 }
      );
    });

    it('should include metadata with processing time', async () => {
      await fc.assert(
        fc.asyncProperty(multimodalContentArb, async (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const analysis = await engine.analyzeViralMechanisms(content);
          
          expect(analysis.metadata.analyzedAt).toBeInstanceOf(Date);
          expect(analysis.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
          expect(Array.isArray(analysis.metadata.modelsUsed)).toBe(true);
          expect(analysis.metadata.confidence).toBeGreaterThanOrEqual(0);
          expect(analysis.metadata.confidence).toBeLessThanOrEqual(1);
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve dense caption from visual analysis', async () => {
      await fc.assert(
        fc.asyncProperty(multimodalContentArb, async (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const analysis = await engine.analyzeViralMechanisms(content);
          
          if (content.visualAnalysis?.denseCaption) {
            expect(analysis.denseCaption).toBe(content.visualAnalysis.denseCaption);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should respect maxMechanisms configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          multimodalContentArb,
          fc.integer({ min: 1, max: 10 }),
          async (content, maxMechanisms) => {
            const engine = new ViralPredictionEngine({ 
              minConfidence: 0.1,
              maxMechanisms 
            });
            const analysis = await engine.analyzeViralMechanisms(content);
            
            expect(analysis.viralMechanisms.length).toBeLessThanOrEqual(maxMechanisms);
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  // ============================================================================
  // Property Tests: Viral Potential Prediction
  // ============================================================================

  describe('Viral Potential Prediction', () => {
    it('should return probability between 0 and 1', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const prediction = engine.predictViralPotential(content);
          
          expect(prediction.probability).toBeGreaterThanOrEqual(0);
          expect(prediction.probability).toBeLessThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should return valid confidence interval', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const prediction = engine.predictViralPotential(content);
          
          const [lower, upper] = prediction.confidenceInterval;
          const epsilon = 0.0001; // Small tolerance for floating point comparison
          expect(lower).toBeGreaterThanOrEqual(0);
          expect(upper).toBeLessThanOrEqual(1);
          expect(lower).toBeLessThanOrEqual(prediction.probability + epsilon);
          expect(upper).toBeGreaterThanOrEqual(prediction.probability - epsilon);
        }),
        { numRuns: 100 }
      );
    });

    it('should include key factors with valid direction', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const prediction = engine.predictViralPotential(content);
          
          for (const factor of prediction.keyFactors) {
            expect(['positive', 'negative']).toContain(factor.direction);
            expect(factor.contribution).toBeGreaterThanOrEqual(0);
            expect(factor.contribution).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should include risk factors as strings', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const prediction = engine.predictViralPotential(content);
          
          expect(Array.isArray(prediction.riskFactors)).toBe(true);
          for (const risk of prediction.riskFactors) {
            expect(typeof risk).toBe('string');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should suggest optimal timing with valid day and hour', () => {
      fc.assert(
        fc.property(multimodalContentArb, (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const prediction = engine.predictViralPotential(content);
          
          if (prediction.optimalTiming) {
            expect(prediction.optimalTiming.dayOfWeek).toBeGreaterThanOrEqual(0);
            expect(prediction.optimalTiming.dayOfWeek).toBeLessThanOrEqual(6);
            expect(prediction.optimalTiming.hourOfDay).toBeGreaterThanOrEqual(0);
            expect(prediction.optimalTiming.hourOfDay).toBeLessThanOrEqual(23);
            expect(typeof prediction.optimalTiming.timezone).toBe('string');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Property Tests: Engagement Data Processing
  // ============================================================================

  describe('Engagement Data Processing', () => {
    it('should include velocity metrics in analysis', async () => {
      await fc.assert(
        fc.asyncProperty(multimodalContentArb, async (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const analysis = await engine.analyzeViralMechanisms(content);
          
          expect(analysis.engagementMetrics.velocity).toBeDefined();
          expect(typeof analysis.engagementMetrics.velocity.viewsPerHour).toBe('number');
          expect(typeof analysis.engagementMetrics.velocity.likesPerHour).toBe('number');
          expect(typeof analysis.engagementMetrics.velocity.sharesPerHour).toBe('number');
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve original engagement metrics', async () => {
      await fc.assert(
        fc.asyncProperty(multimodalContentArb, async (content) => {
          const engine = new ViralPredictionEngine({ minConfidence: 0.1 });
          const analysis = await engine.analyzeViralMechanisms(content);
          
          expect(analysis.engagementMetrics.views).toBe(content.engagement.views);
          expect(analysis.engagementMetrics.likes).toBe(content.engagement.likes);
          expect(analysis.engagementMetrics.shares).toBe(content.engagement.shares);
          expect(analysis.engagementMetrics.comments).toBe(content.engagement.comments);
        }),
        { numRuns: 50 }
      );
    });
  });
});
