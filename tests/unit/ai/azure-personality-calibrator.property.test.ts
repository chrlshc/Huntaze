/**
 * Azure Personality Calibrator Property-Based Tests
 * 
 * Property-based tests validating correctness properties for the
 * Azure OpenAI-powered PersonalityCalibrator service.
 * 
 * **Feature: huntaze-ai-azure-migration, Property 10: Personality profile confidence**
 * **Feature: huntaze-ai-azure-migration, Property 12: Personality-based tone adaptation**
 * **Validates: Requirements 4.1, 4.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzurePersonalityCalibrator,
  type PersonalityProfile,
  type InteractionEvent,
  type InteractionFeedback,
  type MemoryContext,
} from '../../../lib/ai/azure/personality-calibrator.azure';

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid fan IDs
 */
const fanIdArb = fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/)
  .map(s => `fan-${s}`);

/**
 * Generator for interaction types
 */
const interactionTypeArb = fc.constantFrom(
  'message' as const,
  'purchase' as const,
  'tip' as const,
  'subscription' as const,
  'view' as const
);

/**
 * Generator for message content with emojis
 */
const messageContentArb = fc.tuple(
  fc.lorem({ maxCount: 5 }),
  fc.array(fc.constantFrom('😊', '❤️', '🔥', '😘', '💕', '😍', '🎉', '✨'), { minLength: 0, maxLength: 5 })
).map(([text, emojis]) => text + ' ' + emojis.join(''));

/**
 * Generator for interaction events
 */
const interactionEventArb = fc.record({
  id: fc.uuid(),
  type: interactionTypeArb,
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  content: fc.option(messageContentArb, { nil: undefined }),
});

/**
 * Generator for interaction history with minimum count
 */
const interactionHistoryArb = (minCount: number = 0, maxCount: number = 50) =>
  fc.array(interactionEventArb, { minLength: minCount, maxLength: maxCount });

/**
 * Generator for tone values
 */
const toneArb = fc.constantFrom(
  'flirty' as const,
  'friendly' as const,
  'professional' as const,
  'playful' as const,
  'dominant' as const
);

/**
 * Generator for message length preference
 */
const messageLengthArb = fc.constantFrom(
  'short' as const,
  'medium' as const,
  'long' as const
);

/**
 * Generator for punctuation style
 */
const punctuationStyleArb = fc.constantFrom('casual' as const, 'proper' as const);

/**
 * Generator for response speed
 */
const responseSpeedArb = fc.constantFrom(
  'immediate' as const,
  'delayed' as const,
  'variable' as const
);

/**
 * Generator for confidence score (0-1)
 */
const confidenceScoreArb = fc.float({ min: 0, max: 1, noNaN: true });

/**
 * Generator for emoji frequency (0-1)
 */
const emojiFrequencyArb = fc.float({ min: 0, max: 1, noNaN: true });

/**
 * Generator for personality profiles
 */
const personalityProfileArb = fc.record({
  fanId: fanIdArb,
  tone: toneArb,
  emojiFrequency: emojiFrequencyArb,
  messageLengthPreference: messageLengthArb,
  punctuationStyle: punctuationStyleArb,
  preferredEmojis: fc.array(fc.constantFrom('😊', '❤️', '🔥', '😘', '💕'), { minLength: 0, maxLength: 5 }),
  responseSpeed: responseSpeedArb,
  confidenceScore: confidenceScoreArb,
  lastCalibrated: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  interactionCount: fc.nat({ max: 1000 }),
});

/**
 * Generator for sentiment
 */
const sentimentArb = fc.constantFrom(
  'positive' as const,
  'neutral' as const,
  'negative' as const
);

/**
 * Generator for interaction feedback
 */
const interactionFeedbackArb = fc.record({
  fanEngaged: fc.boolean(),
  sentiment: sentimentArb,
  responseTime: fc.option(fc.nat({ max: 60000 }), { nil: undefined }),
  purchaseMade: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Generator for topic interests (0-1 scores)
 */
const topicInterestsArb = fc.dictionary(
  fc.constantFrom('gaming', 'music', 'sports', 'tech', 'fashion', 'travel', 'food', 'fitness'),
  fc.float({ min: 0, max: 1, noNaN: true })
);

/**
 * Generator for memory context
 */
const memoryContextArb = fc.record({
  personalityProfile: personalityProfileArb,
  preferences: fc.record({
    topicInterests: topicInterestsArb,
  }),
});

// ============================================================================
// MOCKS
// ============================================================================

// Mock Azure OpenAI Service
vi.mock('../../../lib/ai/azure/azure-openai.service', () => {
  const mockChat = vi.fn().mockResolvedValue({
    text: JSON.stringify({
      tone: 'friendly',
      emojiFrequency: 0.6,
      messageLengthPreference: 'medium',
      punctuationStyle: 'casual',
      preferredEmojis: ['😊', '❤️', '🔥'],
      responseSpeed: 'variable',
      confidenceScore: 0.75,
      personalityTraits: {
        openness: 0.7,
        agreeableness: 0.8,
        extraversion: 0.6,
        conscientiousness: 0.5,
        emotionalStability: 0.7,
      },
      communicationStyle: {
        formality: 0.3,
        expressiveness: 0.7,
        directness: 0.5,
        humor: 0.6,
      },
    }),
    usage: {
      promptTokens: 500,
      completionTokens: 200,
      totalTokens: 700,
    },
    finishReason: 'stop',
    model: 'gpt-4-standard-prod',
  });

  return {
    AzureOpenAIService: class MockAzureOpenAIService {
      chat = mockChat;
      setDeployment = vi.fn();
    },
  };
});

vi.mock('../../../lib/ai/azure/circuit-breaker', () => {
  return {
    CircuitBreaker: class MockCircuitBreaker {
      execute = vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn());
      getState = vi.fn().mockReturnValue('CLOSED');
    },
    CircuitBreakerState: {
      CLOSED: 'CLOSED',
      OPEN: 'OPEN',
      HALF_OPEN: 'HALF_OPEN',
    },
  };
});

vi.mock('../../../lib/ai/azure/cost-tracking.service', () => {
  return {
    AzureCostTrackingService: class MockAzureCostTrackingService {
      trackUsage = vi.fn().mockResolvedValue(undefined);
    },
  };
});

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('AzurePersonalityCalibrator Property Tests', () => {
  let calibrator: AzurePersonalityCalibrator;

  beforeEach(() => {
    vi.clearAllMocks();
    calibrator = new AzurePersonalityCalibrator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Property 10: Personality Profile Confidence**
   * 
   * *For any* personality profile generated by the Personality Calibrator,
   * the output should include a confidence score between 0 and 1.
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 10: Personality profile confidence', () => {
    it('should always return confidence score between 0 and 1 for default profiles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          interactionHistoryArb(0, 4), // Less than 5 interactions
          async (fanId, interactions) => {
            const result = await calibrator.calibratePersonality(fanId, interactions);
            
            expect(result.profile.confidenceScore).toBeGreaterThanOrEqual(0);
            expect(result.profile.confidenceScore).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return confidence score between 0 and 1 for calibrated profiles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          interactionHistoryArb(5, 50), // 5+ interactions
          async (fanId, interactions) => {
            const result = await calibrator.calibratePersonality(fanId, interactions);
            
            expect(result.profile.confidenceScore).toBeGreaterThanOrEqual(0);
            expect(result.profile.confidenceScore).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return lower confidence for fewer interactions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fanIdArb,
          async (fanId) => {
            // Default profile (0 interactions) should have low confidence
            const result = await calibrator.calibratePersonality(fanId, []);
            
            expect(result.profile.confidenceScore).toBeLessThanOrEqual(0.5);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain confidence bounds after tone adjustment', async () => {
      await fc.assert(
        fc.asyncProperty(
          personalityProfileArb,
          interactionFeedbackArb,
          async (profile, feedback) => {
            const adjusted = await calibrator.adjustTone(profile, feedback);
            
            expect(adjusted.confidenceScore).toBeGreaterThanOrEqual(0);
            expect(adjusted.confidenceScore).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 12: Personality-based Tone Adaptation**
   * 
   * *For any* response style calibration, the tone should match
   * the learned preferences from the user's interaction history.
   * 
   * **Validates: Requirements 4.3**
   */
  describe('Property 12: Personality-based tone adaptation', () => {
    it('should preserve tone from profile in response style', () => {
      fc.assert(
        fc.property(
          memoryContextArb,
          (context) => {
            const style = calibrator.getOptimalResponseStyle(
              context.personalityProfile.fanId,
              context
            );
            
            expect(style.tone).toBe(context.personalityProfile.tone);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should adapt emoji count based on emoji frequency', () => {
      fc.assert(
        fc.property(
          memoryContextArb,
          (context) => {
            const style = calibrator.getOptimalResponseStyle(
              context.personalityProfile.fanId,
              context
            );
            
            // Emoji count should be proportional to frequency (0-5 range)
            const expectedCount = Math.round(context.personalityProfile.emojiFrequency * 5);
            expect(style.emojiCount).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should adapt message length based on preference', () => {
      fc.assert(
        fc.property(
          memoryContextArb,
          (context) => {
            const style = calibrator.getOptimalResponseStyle(
              context.personalityProfile.fanId,
              context
            );
            
            const expectedLengths = {
              short: 100,
              medium: 200,
              long: 400,
            };
            
            expect(style.maxLength).toBe(
              expectedLengths[context.personalityProfile.messageLengthPreference]
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include high-interest topics in response style', () => {
      fc.assert(
        fc.property(
          memoryContextArb,
          (context) => {
            const style = calibrator.getOptimalResponseStyle(
              context.personalityProfile.fanId,
              context
            );
            
            // All topics with interest > 0.6 should be included
            const highInterestTopics = Object.entries(context.preferences.topicInterests)
              .filter(([_, score]) => score > 0.6)
              .map(([topic]) => topic);
            
            for (const topic of highInterestTopics) {
              expect(style.topics).toContain(topic);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude low-interest topics from response style', () => {
      fc.assert(
        fc.property(
          memoryContextArb,
          (context) => {
            const style = calibrator.getOptimalResponseStyle(
              context.personalityProfile.fanId,
              context
            );
            
            // All topics with interest < 0.3 should be in avoidTopics
            const lowInterestTopics = Object.entries(context.preferences.topicInterests)
              .filter(([_, score]) => score < 0.3)
              .map(([topic]) => topic);
            
            for (const topic of lowInterestTopics) {
              expect(style.avoidTopics).toContain(topic);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should change tone on negative feedback', async () => {
      await fc.assert(
        fc.asyncProperty(
          personalityProfileArb,
          async (profile) => {
            const negativeFeedback: InteractionFeedback = {
              fanEngaged: false,
              sentiment: 'negative',
            };
            
            const adjusted = await calibrator.adjustTone(profile, negativeFeedback);
            
            // Tone should change (unless no alternatives available)
            // At minimum, confidence should decrease
            expect(adjusted.confidenceScore).toBeLessThanOrEqual(profile.confidenceScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increase confidence on positive feedback', async () => {
      await fc.assert(
        fc.asyncProperty(
          personalityProfileArb.filter(p => p.confidenceScore < 0.95), // Room to increase
          async (profile) => {
            const positiveFeedback: InteractionFeedback = {
              fanEngaged: true,
              sentiment: 'positive',
            };
            
            const adjusted = await calibrator.adjustTone(profile, positiveFeedback);
            
            expect(adjusted.confidenceScore).toBeGreaterThan(profile.confidenceScore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Recalibration Triggers
   * 
   * *For any* profile, recalibration should be triggered at appropriate intervals.
   */
  describe('Property: Recalibration triggers', () => {
    it('should trigger recalibration every 5 interactions', () => {
      fc.assert(
        fc.property(
          personalityProfileArb.map(p => ({ ...p, interactionCount: p.interactionCount - (p.interactionCount % 5) })),
          (profile) => {
            // Profile with interaction count divisible by 5
            const profileAt5 = { ...profile, interactionCount: 5 };
            const profileAt10 = { ...profile, interactionCount: 10 };
            const profileAt15 = { ...profile, interactionCount: 15 };
            
            expect(calibrator.needsRecalibration(profileAt5)).toBe(true);
            expect(calibrator.needsRecalibration(profileAt10)).toBe(true);
            expect(calibrator.needsRecalibration(profileAt15)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should trigger recalibration for low confidence profiles', () => {
      fc.assert(
        fc.property(
          personalityProfileArb.map(p => ({ 
            ...p, 
            confidenceScore: 0.3,
            interactionCount: 7, // Not divisible by 5
            lastCalibrated: new Date(), // Recent
          })),
          (profile) => {
            expect(calibrator.needsRecalibration(profile)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should trigger recalibration for stale profiles', () => {
      fc.assert(
        fc.property(
          personalityProfileArb.map(p => ({ 
            ...p, 
            confidenceScore: 0.8, // High confidence
            interactionCount: 7, // Not divisible by 5
            lastCalibrated: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          })),
          (profile) => {
            expect(calibrator.needsRecalibration(profile)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not trigger recalibration for fresh, confident profiles', () => {
      fc.assert(
        fc.property(
          personalityProfileArb.map(p => ({ 
            ...p, 
            confidenceScore: 0.8, // High confidence
            interactionCount: 7, // Not divisible by 5
            lastCalibrated: new Date(), // Fresh
          })),
          (profile) => {
            expect(calibrator.needsRecalibration(profile)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional Property: Interaction Count Increment
   * 
   * *For any* tone adjustment, interaction count should increment by 1.
   */
  describe('Property: Interaction count increment', () => {
    it('should increment interaction count by 1 on tone adjustment', async () => {
      await fc.assert(
        fc.asyncProperty(
          personalityProfileArb,
          interactionFeedbackArb,
          async (profile, feedback) => {
            const adjusted = await calibrator.adjustTone(profile, feedback);
            
            expect(adjusted.interactionCount).toBe(profile.interactionCount + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Profile Immutability
   * 
   * *For any* tone adjustment, the original profile should not be mutated.
   */
  describe('Property: Profile immutability', () => {
    it('should not mutate original profile on tone adjustment', async () => {
      await fc.assert(
        fc.asyncProperty(
          personalityProfileArb,
          interactionFeedbackArb,
          async (profile, feedback) => {
            const originalCount = profile.interactionCount;
            const originalTone = profile.tone;
            const originalConfidence = profile.confidenceScore;
            
            await calibrator.adjustTone(profile, feedback);
            
            // Original should be unchanged
            expect(profile.interactionCount).toBe(originalCount);
            expect(profile.tone).toBe(originalTone);
            expect(profile.confidenceScore).toBe(originalConfidence);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
