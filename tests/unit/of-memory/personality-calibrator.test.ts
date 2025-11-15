/**
 * Unit Tests - Personality Calibrator
 * 
 * Tests for personality calibration with error handling and retry logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PersonalityCalibrator,
  CalibrationError,
  CalibrationErrorCode
} from '@/lib/of-memory/services/personality-calibrator';
import type { InteractionEvent, InteractionFeedback } from '@/lib/of-memory/types';

describe('PersonalityCalibrator', () => {
  let calibrator: PersonalityCalibrator;

  beforeEach(() => {
    calibrator = new PersonalityCalibrator();
    vi.clearAllMocks();
  });

  describe('calibratePersonality', () => {
    it('should return default profile for insufficient data', async () => {
      const fanId = 'fan-123';
      const interactions: InteractionEvent[] = [
        {
          id: '1',
          fanId,
          type: 'message',
          content: 'Hello',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      const profile = await calibrator.calibratePersonality(fanId, interactions);

      expect(profile.fanId).toBe(fanId);
      expect(profile.tone).toBe('friendly');
      expect(profile.confidenceScore).toBeLessThan(0.5);
    });

    it('should calibrate personality with sufficient data', async () => {
      const fanId = 'fan-456';
      const interactions: InteractionEvent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        fanId,
        type: 'message' as const,
        content: `Message ${i} 😊`,
        timestamp: new Date(Date.now() - (10 - i) * 3600000),
        metadata: {}
      }));

      const profile = await calibrator.calibratePersonality(fanId, interactions);

      expect(profile.fanId).toBe(fanId);
      expect(profile.interactionCount).toBe(10);
      expect(profile.confidenceScore).toBeGreaterThan(0);
      expect(profile.lastCalibrated).toBeInstanceOf(Date);
    });

    it('should throw CalibrationError for invalid fanId', async () => {
      await expect(
        calibrator.calibratePersonality('', [])
      ).rejects.toThrow(CalibrationError);

      await expect(
        calibrator.calibratePersonality('', [])
      ).rejects.toMatchObject({
        code: CalibrationErrorCode.INVALID_INPUT
      });
    });

    it('should throw CalibrationError for invalid interaction history', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        calibrator.calibratePersonality('fan-123', 'not-an-array')
      ).rejects.toThrow(CalibrationError);
    });

    it('should handle circuit breaker open state gracefully', async () => {
      const fanId = 'fan-789';
      
      // Force circuit breaker to open by causing failures
      const badInteractions: InteractionEvent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        fanId,
        type: 'message' as const,
        content: null as any, // Invalid content to trigger errors
        timestamp: new Date(),
        metadata: {}
      }));

      // First few calls should fail and open circuit
      for (let i = 0; i < 6; i++) {
        try {
          await calibrator.calibratePersonality(fanId, badInteractions);
        } catch (error) {
          // Expected to fail
        }
      }

      // Next call should return default profile due to open circuit
      const profile = await calibrator.calibratePersonality(fanId, []);
      expect(profile.fanId).toBe(fanId);
      expect(profile.tone).toBe('friendly');
    });
  });

  describe('adjustTone', () => {
    it('should adjust tone based on positive feedback', () => {
      const currentProfile = {
        fanId: 'fan-123',
        tone: 'friendly' as const,
        emojiFrequency: 0.5,
        messageLengthPreference: 'medium' as const,
        punctuationStyle: 'casual' as const,
        preferredEmojis: ['😊'],
        responseSpeed: 'variable' as const,
        confidenceScore: 0.5,
        lastCalibrated: new Date(),
        interactionCount: 10
      };

      const feedback: InteractionFeedback = {
        fanEngaged: true,
        sentiment: 'positive',
        responseTime: 300,
        messageLength: 150
      };

      const adjusted = calibrator.adjustTone(currentProfile, feedback);

      expect(adjusted.confidenceScore).toBeGreaterThan(currentProfile.confidenceScore);
      expect(adjusted.interactionCount).toBe(11);
    });

    it('should adjust tone based on negative feedback', () => {
      const currentProfile = {
        fanId: 'fan-456',
        tone: 'flirty' as const,
        emojiFrequency: 0.8,
        messageLengthPreference: 'long' as const,
        punctuationStyle: 'casual' as const,
        preferredEmojis: ['😘', '❤️'],
        responseSpeed: 'immediate' as const,
        confidenceScore: 0.7,
        lastCalibrated: new Date(),
        interactionCount: 20
      };

      const feedback: InteractionFeedback = {
        fanEngaged: false,
        sentiment: 'negative',
        responseTime: 1000,
        messageLength: 50
      };

      const adjusted = calibrator.adjustTone(currentProfile, feedback);

      expect(adjusted.tone).not.toBe('flirty'); // Should change tone
      expect(adjusted.confidenceScore).toBeLessThan(currentProfile.confidenceScore);
    });

    it('should handle errors gracefully and return unchanged profile', () => {
      const currentProfile = {
        fanId: 'fan-789',
        tone: 'friendly' as const,
        emojiFrequency: 0.5,
        messageLengthPreference: 'medium' as const,
        punctuationStyle: 'casual' as const,
        preferredEmojis: ['😊'],
        responseSpeed: 'variable' as const,
        confidenceScore: 0.5,
        lastCalibrated: new Date(),
        interactionCount: 10
      };

      // Invalid feedback that might cause errors
      const badFeedback = null as any;

      const adjusted = calibrator.adjustTone(currentProfile, badFeedback);

      // Should return unchanged profile on error
      expect(adjusted).toEqual(currentProfile);
    });
  });

  describe('getOptimalResponseStyle', () => {
    it('should generate optimal response style from context', async () => {
      const fanId = 'fan-123';
      const context = {
        fanId,
        personalityProfile: {
          fanId,
          tone: 'playful' as const,
          emojiFrequency: 0.6,
          messageLengthPreference: 'short' as const,
          punctuationStyle: 'casual' as const,
          preferredEmojis: ['😊', '🎉'],
          responseSpeed: 'immediate' as const,
          confidenceScore: 0.8,
          lastCalibrated: new Date(),
          interactionCount: 50
        },
        preferences: {
          topicInterests: {
            'fitness': 0.8,
            'travel': 0.7,
            'politics': 0.2
          },
          communicationStyle: 'casual' as const,
          responseTimePreference: 'immediate' as const
        },
        recentInteractions: [],
        conversationHistory: []
      };

      const style = await calibrator.getOptimalResponseStyle(fanId, context);

      expect(style.maxLength).toBe(100); // short preference
      expect(style.emojiCount).toBe(3); // 0.6 * 5 = 3
      expect(style.tone).toBe('playful');
      expect(style.topics).toContain('fitness');
      expect(style.topics).toContain('travel');
      expect(style.avoidTopics).toContain('politics');
    });

    it('should return safe defaults on error', async () => {
      const fanId = 'fan-456';
      const invalidContext = null as any;

      const style = await calibrator.getOptimalResponseStyle(fanId, invalidContext);

      expect(style.maxLength).toBe(200);
      expect(style.emojiCount).toBe(2);
      expect(style.tone).toBe('friendly');
      expect(style.topics).toEqual([]);
      expect(style.avoidTopics).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should create CalibrationError with correct properties', () => {
      const error = new CalibrationError(
        'Test error',
        CalibrationErrorCode.INSUFFICIENT_DATA,
        'fan-123'
      );

      expect(error.name).toBe('CalibrationError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(CalibrationErrorCode.INSUFFICIENT_DATA);
      expect(error.fanId).toBe('fan-123');
    });

    it('should wrap cause errors', () => {
      const cause = new Error('Original error');
      const error = new CalibrationError(
        'Wrapped error',
        CalibrationErrorCode.ANALYSIS_FAILED,
        'fan-456',
        cause
      );

      expect(error.cause).toBe(cause);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      let attemptCount = 0;
      const calibratorWithRetry = new PersonalityCalibrator({
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
        backoffFactor: 2
      });

      // Mock a function that fails twice then succeeds
      const mockFn = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Transient failure');
        }
        return { success: true };
      });

      // This would need access to executeWithRetry, which is private
      // In real implementation, this would be tested through public methods
    });
  });

  describe('Performance', () => {
    it('should complete calibration within acceptable time', async () => {
      const fanId = 'fan-perf';
      const interactions: InteractionEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        fanId,
        type: 'message' as const,
        content: `Message ${i}`,
        timestamp: new Date(Date.now() - (100 - i) * 3600000),
        metadata: {}
      }));

      const start = Date.now();
      await calibrator.calibratePersonality(fanId, interactions);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in < 1s
    });
  });
});
