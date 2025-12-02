/**
 * Azure Emotion Analyzer Property-Based Tests
 * 
 * **Feature: huntaze-ai-azure-migration, Property 11: Multi-dimensional emotion detection**
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureEmotionAnalyzer,
  type EmotionAnalysisResult,
  type EmotionDimension,
  type EmotionType,
} from '../../../lib/ai/azure/emotion-analyzer.azure';

// Mock Azure OpenAI Service
vi.mock('../../../lib/ai/azure/azure-openai.service', () => {
  return {
    AzureOpenAIService: class MockAzureOpenAIService {
      chat = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          sentiment: 'positive',
          sentimentScore: 0.7,
          emotions: [
            { name: 'joy', score: 0.8, intensity: 0.7 },
            { name: 'excitement', score: 0.6, intensity: 0.5 },
            { name: 'trust', score: 0.4, intensity: 0.3 },
          ],
          overallIntensity: 0.6,
          confidence: 0.85,
        }),
        usage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
        finishReason: 'stop',
        model: 'gpt-35-turbo-prod',
      });
      setDeployment = vi.fn();
    },
  };
});

vi.mock('../../../lib/ai/azure/circuit-breaker', () => ({
  CircuitBreaker: class MockCircuitBreaker {
    execute = vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn());
    getState = vi.fn().mockReturnValue('CLOSED');
  },
  CircuitBreakerState: { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' },
}));

vi.mock('../../../lib/ai/azure/cost-tracking.service', () => ({
  AzureCostTrackingService: class MockCostTracker {
    trackUsage = vi.fn().mockResolvedValue(undefined);
  },
}));

// Generators
const emotionTypeArb = fc.constantFrom<EmotionType>(
  'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
  'trust', 'anticipation', 'love', 'excitement', 'frustration', 'curiosity'
);

const emotionDimensionArb = fc.record({
  name: emotionTypeArb,
  score: fc.float({ min: 0, max: 1, noNaN: true }),
  intensity: fc.float({ min: 0, max: 1, noNaN: true }),
});

const messageArb = fc.lorem({ minCount: 1, maxCount: 20 });
const messageIdArb = fc.uuid();

describe('AzureEmotionAnalyzer Property Tests', () => {
  let analyzer: AzureEmotionAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new AzureEmotionAnalyzer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Property 11: Multi-dimensional emotion detection**
   * 
   * *For any* message processed by the Emotion Analyzer, the output should
   * contain multiple emotional dimensions (e.g., sentiment, intensity, valence).
   * 
   * **Validates: Requirements 4.2**
   */
  describe('Property 11: Multi-dimensional emotion detection', () => {
    it('should always return sentiment with valid values', async () => {
      await fc.assert(
        fc.asyncProperty(messageArb, messageIdArb, async (message, messageId) => {
          const result = await analyzer.analyzeEmotion(message, messageId);
          
          expect(['positive', 'neutral', 'negative']).toContain(result.sentiment);
          expect(result.sentimentScore).toBeGreaterThanOrEqual(-1);
          expect(result.sentimentScore).toBeLessThanOrEqual(1);
        }),
        { numRuns: 50 }
      );
    });

    it('should always return emotions array with valid dimensions', async () => {
      await fc.assert(
        fc.asyncProperty(messageArb, messageIdArb, async (message, messageId) => {
          const result = await analyzer.analyzeEmotion(message, messageId);
          
          expect(Array.isArray(result.emotions)).toBe(true);
          
          for (const emotion of result.emotions) {
            expect(emotion.name).toBeDefined();
            expect(emotion.score).toBeGreaterThanOrEqual(0);
            expect(emotion.score).toBeLessThanOrEqual(1);
            expect(emotion.intensity).toBeGreaterThanOrEqual(0);
            expect(emotion.intensity).toBeLessThanOrEqual(1);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should always return dominant emotion', async () => {
      await fc.assert(
        fc.asyncProperty(messageArb, messageIdArb, async (message, messageId) => {
          const result = await analyzer.analyzeEmotion(message, messageId);
          
          expect(result.dominantEmotion).toBeDefined();
          expect(result.dominantEmotion.name).toBeDefined();
          expect(result.dominantEmotion.score).toBeGreaterThanOrEqual(0);
          expect(result.dominantEmotion.score).toBeLessThanOrEqual(1);
        }),
        { numRuns: 50 }
      );
    });

    it('should always return intensity between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(messageArb, messageIdArb, async (message, messageId) => {
          const result = await analyzer.analyzeEmotion(message, messageId);
          
          expect(result.intensity).toBeGreaterThanOrEqual(0);
          expect(result.intensity).toBeLessThanOrEqual(1);
        }),
        { numRuns: 50 }
      );
    });

    it('should always return confidence between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(messageArb, messageIdArb, async (message, messageId) => {
          const result = await analyzer.analyzeEmotion(message, messageId);
          
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        }),
        { numRuns: 50 }
      );
    });

    it('should return emotions sorted by score descending', async () => {
      await fc.assert(
        fc.asyncProperty(messageArb, messageIdArb, async (message, messageId) => {
          const result = await analyzer.analyzeEmotion(message, messageId);
          
          for (let i = 1; i < result.emotions.length; i++) {
            expect(result.emotions[i - 1].score).toBeGreaterThanOrEqual(
              result.emotions[i].score
            );
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Significant change detection
   */
  describe('Property: Significant change detection', () => {
    it('should detect significant change when score differs by >0.3', () => {
      // Test with explicit large differences
      const testCases = [
        { prev: { name: 'joy' as EmotionType, score: 0.2, intensity: 0.5 }, 
          curr: { name: 'joy' as EmotionType, score: 0.6, intensity: 0.5 } },
        { prev: { name: 'sadness' as EmotionType, score: 0.8, intensity: 0.3 }, 
          curr: { name: 'sadness' as EmotionType, score: 0.3, intensity: 0.3 } },
        { prev: { name: 'anger' as EmotionType, score: 0.5, intensity: 0.2 }, 
          curr: { name: 'anger' as EmotionType, score: 0.5, intensity: 0.7 } },
      ];
      
      for (const { prev, curr } of testCases) {
        const isSignificant = analyzer.detectSignificantChange(prev, curr);
        expect(isSignificant).toBe(true);
      }
    });

    it('should detect significant change when emotion type changes', () => {
      fc.assert(
        fc.property(
          emotionDimensionArb,
          emotionTypeArb,
          (prevEmotion, newType) => {
            if (prevEmotion.name === newType) return; // Skip same type
            
            const newEmotion: EmotionDimension = {
              ...prevEmotion,
              name: newType,
            };
            
            const isSignificant = analyzer.detectSignificantChange(prevEmotion, newEmotion);
            expect(isSignificant).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect significant change for minor variations', () => {
      // Test with explicit small differences (same emotion, small score/intensity changes)
      const testCases = [
        { prev: { name: 'joy' as EmotionType, score: 0.5, intensity: 0.5 }, 
          curr: { name: 'joy' as EmotionType, score: 0.55, intensity: 0.52 } },
        { prev: { name: 'sadness' as EmotionType, score: 0.7, intensity: 0.6 }, 
          curr: { name: 'sadness' as EmotionType, score: 0.65, intensity: 0.58 } },
        { prev: { name: 'trust' as EmotionType, score: 0.3, intensity: 0.4 }, 
          curr: { name: 'trust' as EmotionType, score: 0.35, intensity: 0.45 } },
      ];
      
      for (const { prev, curr } of testCases) {
        const isSignificant = analyzer.detectSignificantChange(prev, curr);
        expect(isSignificant).toBe(false);
      }
    });
  });

  /**
   * Property: Dominant emotion prioritization
   */
  describe('Property 14: Dominant emotion prioritization', () => {
    it('should return emotion with highest weighted score as dominant', () => {
      fc.assert(
        fc.property(
          fc.array(emotionDimensionArb, { minLength: 1, maxLength: 5 }),
          (emotions) => {
            const dominant = analyzer.getDominantEmotion(emotions);
            
            // Dominant should have highest score * intensity
            const dominantWeight = dominant.score * dominant.intensity;
            
            for (const emotion of emotions) {
              const weight = emotion.score * emotion.intensity;
              expect(dominantWeight).toBeGreaterThanOrEqual(weight - 0.001); // Small tolerance
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return neutral for empty emotions array', () => {
      const dominant = analyzer.getDominantEmotion([]);
      expect(dominant.name).toBe('neutral');
    });
  });

  /**
   * Property: Trend calculation
   */
  describe('Property: Trend calculation', () => {
    it('should return stable for single emotion', () => {
      fc.assert(
        fc.property(emotionDimensionArb, (emotion) => {
          const trend = analyzer.calculateTrend([emotion]);
          expect(trend).toBe('stable');
        }),
        { numRuns: 50 }
      );
    });

    it('should detect improving trend for increasing positive emotions', () => {
      const improvingHistory: EmotionDimension[] = [
        { name: 'sadness', score: 0.8, intensity: 0.7 },
        { name: 'neutral' as EmotionType, score: 0.5, intensity: 0.5 },
        { name: 'joy', score: 0.7, intensity: 0.6 },
        { name: 'joy', score: 0.9, intensity: 0.8 },
      ];
      
      const trend = analyzer.calculateTrend(improvingHistory);
      expect(trend).toBe('improving');
    });

    it('should detect declining trend for increasing negative emotions', () => {
      const decliningHistory: EmotionDimension[] = [
        { name: 'joy', score: 0.9, intensity: 0.8 },
        { name: 'joy', score: 0.6, intensity: 0.5 },
        { name: 'sadness', score: 0.5, intensity: 0.5 },
        { name: 'sadness', score: 0.8, intensity: 0.7 },
      ];
      
      const trend = analyzer.calculateTrend(decliningHistory);
      expect(trend).toBe('declining');
    });
  });
});
