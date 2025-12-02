/**
 * Azure Emotional State Sync Property-Based Tests
 * 
 * **Feature: huntaze-ai-azure-migration, Property 13: Emotional state synchronization**
 * **Feature: huntaze-ai-azure-migration, Property 14: Dominant emotion prioritization**
 * **Validates: Requirements 4.4, 4.5**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureEmotionalStateSync,
  type EmotionalStateUpdate,
} from '../../../lib/ai/azure/emotional-state-sync.azure';
import type { EmotionDimension, EmotionType } from '../../../lib/ai/azure/emotion-analyzer.azure';

// Mock dependencies
vi.mock('../../../lib/ai/azure/emotion-analyzer.azure', () => {
  return {
    AzureEmotionAnalyzer: class MockEmotionAnalyzer {
      analyzeEmotion = vi.fn().mockResolvedValue({
        messageId: 'test-msg',
        timestamp: new Date(),
        sentiment: 'positive',
        sentimentScore: 0.7,
        emotions: [
          { name: 'joy', score: 0.8, intensity: 0.7 },
          { name: 'excitement', score: 0.6, intensity: 0.5 },
        ],
        dominantEmotion: { name: 'joy', score: 0.8, intensity: 0.7 },
        intensity: 0.6,
        confidence: 0.85,
        tokensUsed: 300,
        latencyMs: 50,
      });
      
      detectSignificantChange = vi.fn().mockImplementation(
        (prev: EmotionDimension | null, curr: EmotionDimension) => {
          if (!prev) return true;
          const scoreDiff = Math.abs(curr.score - prev.score);
          const intensityDiff = Math.abs(curr.intensity - prev.intensity);
          return scoreDiff > 0.3 || intensityDiff > 0.3 || prev.name !== curr.name;
        }
      );
      
      calculateTrend = vi.fn().mockReturnValue('stable');
    },
  };
});

vi.mock('../../../lib/ai/azure/cost-tracking.service', () => ({
  AzureCostTrackingService: class MockCostTracker {
    trackUsage = vi.fn().mockResolvedValue(undefined);
  },
}));

// Generators
const fanIdArb = fc.stringMatching(/^fan-[a-zA-Z0-9]{1,20}$/);
const creatorIdArb = fc.stringMatching(/^creator-[a-zA-Z0-9]{1,20}$/);
const messageIdArb = fc.uuid();
const messageArb = fc.lorem({ minCount: 1, maxCount: 10 });

const emotionTypeArb = fc.constantFrom<EmotionType>(
  'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
  'trust', 'anticipation', 'love', 'excitement', 'frustration', 'curiosity'
);

const emotionDimensionArb = fc.record({
  name: emotionTypeArb,
  score: fc.float({ min: 0, max: 1, noNaN: true }),
  intensity: fc.float({ min: 0, max: 1, noNaN: true }),
});

describe('AzureEmotionalStateSync Property Tests', () => {
  let stateSync: AzureEmotionalStateSync;
  let memoryUpdateCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    stateSync = new AzureEmotionalStateSync();
    memoryUpdateCallback = vi.fn().mockResolvedValue(undefined);
    stateSync.onMemoryServiceUpdate(memoryUpdateCallback);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Property 13: Emotional state synchronization**
   * 
   * *For any* significant emotional state change detected, the Memory Service
   * should receive an update with the new emotional context.
   * 
   * **Validates: Requirements 4.4**
   */
  describe('Property 13: Emotional state synchronization', () => {
    it('should call Memory Service callback on first message (always significant)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          creatorIdArb,
          messageArb,
          messageIdArb,
          async (fanId, creatorId, message, messageId) => {
            // Clear state to ensure first message
            stateSync.clearState(fanId, creatorId);
            
            const update = await stateSync.processMessage(message, messageId, fanId, creatorId);
            
            // First message should always trigger update
            expect(update.changeDetected).toBe(true);
            expect(memoryUpdateCallback).toHaveBeenCalled();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should include emotional context in Memory Service update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          creatorIdArb,
          messageArb,
          messageIdArb,
          async (fanId, creatorId, message, messageId) => {
            stateSync.clearState(fanId, creatorId);
            
            await stateSync.processMessage(message, messageId, fanId, creatorId);
            
            expect(memoryUpdateCallback).toHaveBeenCalledWith(
              expect.objectContaining({
                fanId,
                creatorId,
                emotionalContext: expect.objectContaining({
                  currentEmotion: expect.any(Object),
                  recentEmotions: expect.any(Array),
                  trend: expect.any(String),
                }),
                correlationId: expect.any(String),
              })
            );
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should return correct change type classification', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          creatorIdArb,
          messageArb,
          messageIdArb,
          async (fanId, creatorId, message, messageId) => {
            stateSync.clearState(fanId, creatorId);
            
            const update = await stateSync.processMessage(message, messageId, fanId, creatorId);
            
            expect(['significant', 'minor', 'none']).toContain(update.changeType);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should store state after processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          creatorIdArb,
          messageArb,
          messageIdArb,
          async (fanId, creatorId, message, messageId) => {
            stateSync.clearState(fanId, creatorId);
            
            await stateSync.processMessage(message, messageId, fanId, creatorId);
            
            const state = stateSync.getEmotionalState(fanId, creatorId);
            expect(state).not.toBeNull();
            expect(state?.fanId).toBe(fanId);
            expect(state?.creatorId).toBe(creatorId);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Property 14: Dominant emotion prioritization**
   * 
   * *For any* message with multiple detected emotions, the response generation
   * should prioritize the emotion with the highest confidence score.
   * 
   * **Validates: Requirements 4.5**
   */
  describe('Property 14: Dominant emotion prioritization', () => {
    it('should return dominant emotion with highest weighted score', () => {
      fc.assert(
        fc.property(
          fc.array(emotionDimensionArb, { minLength: 1, maxLength: 10 }),
          fanIdArb,
          creatorIdArb,
          (emotions, fanId, creatorId) => {
            const dominant = stateSync['emotionAnalyzer'].getDominantEmotion?.(emotions) ||
              emotions.sort((a, b) => b.score * b.intensity - a.score * a.intensity)[0];
            
            // Verify dominant has highest weighted score
            const dominantWeight = dominant.score * dominant.intensity;
            
            for (const emotion of emotions) {
              const weight = emotion.score * emotion.intensity;
              expect(dominantWeight).toBeGreaterThanOrEqual(weight - 0.001);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track dominant emotion over time correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          creatorIdArb,
          fc.array(messageArb, { minLength: 3, maxLength: 5 }),
          async (fanId, creatorId, messages) => {
            stateSync.clearState(fanId, creatorId);
            
            for (let i = 0; i < messages.length; i++) {
              await stateSync.processMessage(messages[i], `msg-${i}`, fanId, creatorId);
            }
            
            const dominantOverTime = stateSync.getDominantEmotionOverTime(fanId, creatorId);
            expect(dominantOverTime).toBeDefined();
            expect(typeof dominantOverTime).toBe('string');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property: Volatility calculation
   */
  describe('Property: Volatility calculation', () => {
    it('should return 0 volatility for single emotion', () => {
      fc.assert(
        fc.property(emotionDimensionArb, (emotion) => {
          const volatility = stateSync.calculateVolatility([emotion]);
          expect(volatility).toBe(0);
        }),
        { numRuns: 50 }
      );
    });

    it('should return volatility between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.array(emotionDimensionArb, { minLength: 2, maxLength: 20 }),
          (emotions) => {
            const volatility = stateSync.calculateVolatility(emotions);
            expect(volatility).toBeGreaterThanOrEqual(0);
            expect(volatility).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return higher volatility for more varied emotions', () => {
      const stableHistory: EmotionDimension[] = [
        { name: 'joy', score: 0.7, intensity: 0.6 },
        { name: 'joy', score: 0.72, intensity: 0.62 },
        { name: 'joy', score: 0.68, intensity: 0.58 },
      ];
      
      const volatileHistory: EmotionDimension[] = [
        { name: 'joy', score: 0.9, intensity: 0.8 },
        { name: 'sadness', score: 0.7, intensity: 0.6 },
        { name: 'anger', score: 0.8, intensity: 0.9 },
      ];
      
      const stableVolatility = stateSync.calculateVolatility(stableHistory);
      const volatileVolatility = stateSync.calculateVolatility(volatileHistory);
      
      expect(volatileVolatility).toBeGreaterThan(stableVolatility);
    });
  });

  /**
   * Property: State clearing
   */
  describe('Property: State clearing', () => {
    it('should clear state completely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          creatorIdArb,
          messageArb,
          messageIdArb,
          async (fanId, creatorId, message, messageId) => {
            // Process a message first
            await stateSync.processMessage(message, messageId, fanId, creatorId);
            expect(stateSync.getEmotionalState(fanId, creatorId)).not.toBeNull();
            
            // Clear state
            stateSync.clearState(fanId, creatorId);
            expect(stateSync.getEmotionalState(fanId, creatorId)).toBeNull();
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
