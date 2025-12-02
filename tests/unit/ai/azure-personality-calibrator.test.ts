/**
 * Azure Personality Calibrator Unit Tests
 * 
 * Tests for the Azure OpenAI-powered PersonalityCalibrator service
 * Requirements: 4.1, 4.3, 10.1, 10.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AzurePersonalityCalibrator,
  AzureCalibrationError,
  AzureCalibrationErrorCode,
  type PersonalityProfile,
  type InteractionEvent,
  type InteractionFeedback,
  type MemoryContext,
} from '../../../lib/ai/azure/personality-calibrator.azure';

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

// Mock Circuit Breaker
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

// Mock Cost Tracking Service
vi.mock('../../../lib/ai/azure/cost-tracking.service', () => {
  return {
    AzureCostTrackingService: class MockAzureCostTrackingService {
      trackUsage = vi.fn().mockResolvedValue(undefined);
    },
  };
});

describe('AzurePersonalityCalibrator', () => {
  let calibrator: AzurePersonalityCalibrator;

  beforeEach(() => {
    vi.clearAllMocks();
    calibrator = new AzurePersonalityCalibrator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock interactions
  const createMockInteractions = (count: number): InteractionEvent[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `interaction-${i}`,
      type: 'message' as const,
      timestamp: new Date(Date.now() - i * 3600000),
      content: `Test message ${i} with emoji 😊`,
    }));
  };

  describe('calibratePersonality', () => {
    it('should return default profile when insufficient interactions', async () => {
      const result = await calibrator.calibratePersonality('fan-123', []);

      expect(result.profile.fanId).toBe('fan-123');
      expect(result.profile.tone).toBe('friendly');
      expect(result.profile.confidenceScore).toBe(0.3);
      expect(result.tokensUsed).toBe(0);
      expect(result.cost).toBe(0);
    });

    it('should return default profile when less than 5 interactions', async () => {
      const interactions = createMockInteractions(3);
      const result = await calibrator.calibratePersonality('fan-123', interactions);

      expect(result.profile.interactionCount).toBe(0);
      expect(result.profile.confidenceScore).toBe(0.3);
    });

    it('should call Azure OpenAI when sufficient interactions', async () => {
      const interactions = createMockInteractions(10);
      const result = await calibrator.calibratePersonality('fan-123', interactions);

      expect(result.profile.fanId).toBe('fan-123');
      expect(result.profile.tone).toBe('friendly');
      expect(result.profile.confidenceScore).toBe(0.75);
      expect(result.tokensUsed).toBe(700);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for invalid fanId', async () => {
      await expect(
        calibrator.calibratePersonality('', [])
      ).rejects.toThrow(AzureCalibrationError);
    });

    it('should throw error for non-array interactionHistory', async () => {
      await expect(
        calibrator.calibratePersonality('fan-123', null as any)
      ).rejects.toThrow(AzureCalibrationError);
    });

    it('should include personality traits in profile', async () => {
      const interactions = createMockInteractions(10);
      const result = await calibrator.calibratePersonality('fan-123', interactions);

      expect(result.profile.personalityTraits).toBeDefined();
      expect(result.profile.personalityTraits?.openness).toBe(0.7);
      expect(result.profile.personalityTraits?.agreeableness).toBe(0.8);
    });

    it('should include communication style in profile', async () => {
      const interactions = createMockInteractions(10);
      const result = await calibrator.calibratePersonality('fan-123', interactions);

      expect(result.profile.communicationStyle).toBeDefined();
      expect(result.profile.communicationStyle?.formality).toBe(0.3);
      expect(result.profile.communicationStyle?.humor).toBe(0.6);
    });
  });

  describe('adjustTone', () => {
    const baseProfile: PersonalityProfile = {
      fanId: 'fan-123',
      tone: 'friendly',
      emojiFrequency: 0.5,
      messageLengthPreference: 'medium',
      punctuationStyle: 'casual',
      preferredEmojis: ['😊'],
      responseSpeed: 'variable',
      confidenceScore: 0.7,
      lastCalibrated: new Date(),
      interactionCount: 10,
    };

    it('should increase confidence on positive engagement', async () => {
      const feedback: InteractionFeedback = {
        fanEngaged: true,
        sentiment: 'positive',
      };

      const result = await calibrator.adjustTone(baseProfile, feedback);

      expect(result.confidenceScore).toBe(0.75);
      expect(result.interactionCount).toBe(11);
    });

    it('should decrease confidence on negative engagement', async () => {
      const feedback: InteractionFeedback = {
        fanEngaged: false,
        sentiment: 'negative',
      };

      const result = await calibrator.adjustTone(baseProfile, feedback);

      expect(result.confidenceScore).toBeCloseTo(0.68, 2);
    });

    it('should change tone on negative feedback', async () => {
      const feedback: InteractionFeedback = {
        fanEngaged: false,
        sentiment: 'negative',
      };

      const result = await calibrator.adjustTone(baseProfile, feedback);

      expect(result.tone).not.toBe(baseProfile.tone);
    });

    it('should keep tone on positive feedback', async () => {
      const feedback: InteractionFeedback = {
        fanEngaged: true,
        sentiment: 'positive',
      };

      const result = await calibrator.adjustTone(baseProfile, feedback);

      expect(result.tone).toBe(baseProfile.tone);
    });

    it('should update lastCalibrated timestamp', async () => {
      const feedback: InteractionFeedback = {
        fanEngaged: true,
        sentiment: 'positive',
      };

      const result = await calibrator.adjustTone(baseProfile, feedback);

      expect(result.lastCalibrated.getTime()).toBeGreaterThan(
        baseProfile.lastCalibrated.getTime()
      );
    });
  });

  describe('getOptimalResponseStyle', () => {
    it('should return correct max length for short preference', () => {
      const context: MemoryContext = {
        personalityProfile: {
          fanId: 'fan-123',
          tone: 'friendly',
          emojiFrequency: 0.5,
          messageLengthPreference: 'short',
          punctuationStyle: 'casual',
          preferredEmojis: ['😊'],
          responseSpeed: 'variable',
          confidenceScore: 0.7,
          lastCalibrated: new Date(),
          interactionCount: 10,
        },
        preferences: {
          topicInterests: { gaming: 0.8, sports: 0.2 },
        },
      };

      const style = calibrator.getOptimalResponseStyle('fan-123', context);

      expect(style.maxLength).toBe(100);
    });

    it('should return correct max length for long preference', () => {
      const context: MemoryContext = {
        personalityProfile: {
          fanId: 'fan-123',
          tone: 'professional',
          emojiFrequency: 0.1,
          messageLengthPreference: 'long',
          punctuationStyle: 'proper',
          preferredEmojis: [],
          responseSpeed: 'delayed',
          confidenceScore: 0.8,
          lastCalibrated: new Date(),
          interactionCount: 20,
        },
        preferences: {
          topicInterests: { business: 0.9, tech: 0.7 },
        },
      };

      const style = calibrator.getOptimalResponseStyle('fan-123', context);

      expect(style.maxLength).toBe(400);
    });

    it('should calculate emoji count from frequency', () => {
      const context: MemoryContext = {
        personalityProfile: {
          fanId: 'fan-123',
          tone: 'flirty',
          emojiFrequency: 0.8,
          messageLengthPreference: 'medium',
          punctuationStyle: 'casual',
          preferredEmojis: ['😊', '❤️', '🔥'],
          responseSpeed: 'immediate',
          confidenceScore: 0.9,
          lastCalibrated: new Date(),
          interactionCount: 30,
        },
        preferences: {
          topicInterests: {},
        },
      };

      const style = calibrator.getOptimalResponseStyle('fan-123', context);

      expect(style.emojiCount).toBe(4); // 0.8 * 5 = 4
    });

    it('should extract topics with high interest', () => {
      const context: MemoryContext = {
        personalityProfile: {
          fanId: 'fan-123',
          tone: 'friendly',
          emojiFrequency: 0.5,
          messageLengthPreference: 'medium',
          punctuationStyle: 'casual',
          preferredEmojis: ['😊'],
          responseSpeed: 'variable',
          confidenceScore: 0.7,
          lastCalibrated: new Date(),
          interactionCount: 10,
        },
        preferences: {
          topicInterests: {
            gaming: 0.9,
            music: 0.7,
            sports: 0.4,
            politics: 0.1,
          },
        },
      };

      const style = calibrator.getOptimalResponseStyle('fan-123', context);

      expect(style.topics).toContain('gaming');
      expect(style.topics).toContain('music');
      expect(style.topics).not.toContain('sports');
    });

    it('should extract topics to avoid with low interest', () => {
      const context: MemoryContext = {
        personalityProfile: {
          fanId: 'fan-123',
          tone: 'friendly',
          emojiFrequency: 0.5,
          messageLengthPreference: 'medium',
          punctuationStyle: 'casual',
          preferredEmojis: ['😊'],
          responseSpeed: 'variable',
          confidenceScore: 0.7,
          lastCalibrated: new Date(),
          interactionCount: 10,
        },
        preferences: {
          topicInterests: {
            gaming: 0.9,
            politics: 0.1,
            religion: 0.2,
          },
        },
      };

      const style = calibrator.getOptimalResponseStyle('fan-123', context);

      expect(style.avoidTopics).toContain('politics');
      expect(style.avoidTopics).toContain('religion');
      expect(style.avoidTopics).not.toContain('gaming');
    });
  });

  describe('needsRecalibration', () => {
    it('should return true when interaction count is multiple of 5', () => {
      const profile: PersonalityProfile = {
        fanId: 'fan-123',
        tone: 'friendly',
        emojiFrequency: 0.5,
        messageLengthPreference: 'medium',
        punctuationStyle: 'casual',
        preferredEmojis: ['😊'],
        responseSpeed: 'variable',
        confidenceScore: 0.7,
        lastCalibrated: new Date(),
        interactionCount: 15,
      };

      expect(calibrator.needsRecalibration(profile)).toBe(true);
    });

    it('should return true when confidence is low', () => {
      const profile: PersonalityProfile = {
        fanId: 'fan-123',
        tone: 'friendly',
        emojiFrequency: 0.5,
        messageLengthPreference: 'medium',
        punctuationStyle: 'casual',
        preferredEmojis: ['😊'],
        responseSpeed: 'variable',
        confidenceScore: 0.3,
        lastCalibrated: new Date(),
        interactionCount: 12,
      };

      expect(calibrator.needsRecalibration(profile)).toBe(true);
    });

    it('should return true when profile is older than 24 hours', () => {
      const profile: PersonalityProfile = {
        fanId: 'fan-123',
        tone: 'friendly',
        emojiFrequency: 0.5,
        messageLengthPreference: 'medium',
        punctuationStyle: 'casual',
        preferredEmojis: ['😊'],
        responseSpeed: 'variable',
        confidenceScore: 0.7,
        lastCalibrated: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        interactionCount: 12,
      };

      expect(calibrator.needsRecalibration(profile)).toBe(true);
    });

    it('should return false when no recalibration needed', () => {
      const profile: PersonalityProfile = {
        fanId: 'fan-123',
        tone: 'friendly',
        emojiFrequency: 0.5,
        messageLengthPreference: 'medium',
        punctuationStyle: 'casual',
        preferredEmojis: ['😊'],
        responseSpeed: 'variable',
        confidenceScore: 0.7,
        lastCalibrated: new Date(),
        interactionCount: 12,
      };

      expect(calibrator.needsRecalibration(profile)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw AzureCalibrationError for invalid input', async () => {
      await expect(
        calibrator.calibratePersonality('', [])
      ).rejects.toThrow(AzureCalibrationError);

      await expect(
        calibrator.calibratePersonality('fan-123', null as any)
      ).rejects.toThrow(AzureCalibrationError);
    });

    it('should have correct error code for invalid fanId', async () => {
      try {
        await calibrator.calibratePersonality('', []);
      } catch (error) {
        expect(error).toBeInstanceOf(AzureCalibrationError);
        expect((error as AzureCalibrationError).code).toBe(AzureCalibrationErrorCode.INVALID_INPUT);
      }
    });
  });
});
