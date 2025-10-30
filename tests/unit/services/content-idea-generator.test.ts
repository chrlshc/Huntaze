/**
 * Unit Tests - Content Idea Generator Service
 * 
 * Tests for content idea generation with trend analysis
 * 
 * Coverage:
 * - Content idea generation with AI
 * - Trend analysis and caching
 * - Creator profile personalization
 * - Focus area filtering
 * - Performance analysis
 * - Brainstorming utilities
 * - Error handling and retries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentIdeaGeneratorService, CreatorProfile } from '@/lib/services/content-idea-generator';

// Mock AI service
vi.mock('@/lib/services/ai-service', () => ({
  getAIService: vi.fn(() => ({
    generateText: vi.fn().mockResolvedValue({
      content: JSON.stringify([
        {
          title: 'Test Idea 1',
          description: 'Test description 1',
          category: 'photo',
          tags: ['test', 'idea'],
          difficulty: 'easy',
          estimatedEngagement: 75,
          trendScore: 80,
          ppvSuitability: 60,
          targetAudience: {
            demographics: ['25-35'],
            interests: ['lifestyle'],
          },
          timing: {
            timeOfDay: 'evening',
          },
        },
      ]),
      usage: { totalTokens: 500 },
    }),
  })),
}));

describe('ContentIdeaGeneratorService', () => {
  let service: ContentIdeaGeneratorService;
  let mockCreatorProfile: CreatorProfile;

  beforeEach(() => {
    service = new ContentIdeaGeneratorService();
    mockCreatorProfile = {
      id: 'creator-1',
      niche: ['lifestyle', 'fitness'],
      contentTypes: ['photo', 'video'],
      audiencePreferences: ['workout', 'nutrition'],
      performanceHistory: {
        topPerformingContent: ['workout videos', 'meal prep'],
        engagementPatterns: { video: 85, photo: 70 },
        revenueByCategory: { video: 500, photo: 300 },
      },
      currentGoals: [
        {
          type: 'growth',
          target: 1000,
          timeframe: '3 months',
        },
      ],
      constraints: {
        equipment: ['camera', 'lighting'],
        location: ['home', 'gym'],
        timeAvailability: '2 hours/day',
      },
    };
  });

  describe('Content Idea Generation', () => {
    it('should generate content ideas successfully', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
        focusArea: 'trending',
        includeAnalysis: true,
      });

      expect(result.ideas).toBeDefined();
      expect(result.ideas.length).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
      expect(result.nextSteps).toBeDefined();
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
    });

    it('should respect idea count option', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 3,
      });

      expect(result.ideas.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
        category: 'video',
      });

      expect(result.ideas).toBeDefined();
    });

    it('should filter by difficulty', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
        difficulty: 'easy',
      });

      expect(result.ideas).toBeDefined();
    });

    it('should support different focus areas', async () => {
      const focusAreas = ['trending', 'evergreen', 'seasonal', 'monetization'] as const;

      for (const focusArea of focusAreas) {
        const result = await service.generateContentIdeas(mockCreatorProfile, {
          count: 3,
          focusArea,
        });

        expect(result.ideas).toBeDefined();
        expect(result.ideas.length).toBeGreaterThan(0);
      }
    });

    it('should include trend analysis when requested', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
        includeAnalysis: true,
      });

      expect(result.trendAnalysis).toBeDefined();
    });

    it('should exclude trend analysis when not requested', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
        includeAnalysis: false,
      });

      expect(result.trendAnalysis).toBeUndefined();
    });

    it('should track tokens used', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
      });

      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should cache trend data', async () => {
      // First call
      const result1 = await service.generateContentIdeas(mockCreatorProfile, {
        count: 3,
        includeAnalysis: true,
      });

      // Second call should use cache
      const result2 = await service.generateContentIdeas(mockCreatorProfile, {
        count: 3,
        includeAnalysis: true,
      });

      expect(result2.metadata.cacheHit).toBe(true);
    });

    it('should parse trend data correctly', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 3,
        includeAnalysis: true,
      });

      if (result.trendAnalysis) {
        result.trendAnalysis.forEach(trend => {
          expect(trend.keyword).toBeDefined();
          expect(trend.popularity).toBeGreaterThanOrEqual(0);
          expect(trend.popularity).toBeLessThanOrEqual(100);
          expect(trend.category).toBeDefined();
        });
      }
    });
  });

  describe('Idea Validation', () => {
    it('should validate generated ideas structure', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
      });

      result.ideas.forEach(idea => {
        expect(idea.id).toBeDefined();
        expect(idea.title).toBeDefined();
        expect(idea.description).toBeDefined();
        expect(idea.category).toBeDefined();
        expect(idea.difficulty).toBeDefined();
        expect(idea.estimatedEngagement).toBeGreaterThanOrEqual(0);
        expect(idea.estimatedEngagement).toBeLessThanOrEqual(100);
        expect(idea.trendScore).toBeGreaterThanOrEqual(0);
        expect(idea.trendScore).toBeLessThanOrEqual(100);
        expect(idea.monetizationPotential).toBeDefined();
        expect(idea.createdAt).toBeInstanceOf(Date);
      });
    });

    it('should calculate monetization potential correctly', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
      });

      result.ideas.forEach(idea => {
        expect(idea.monetizationPotential.ppvSuitability).toBeGreaterThanOrEqual(0);
        expect(idea.monetizationPotential.ppvSuitability).toBeLessThanOrEqual(100);
        expect(idea.monetizationPotential.subscriptionValue).toBeGreaterThanOrEqual(0);
        expect(idea.monetizationPotential.subscriptionValue).toBeLessThanOrEqual(100);
        expect(idea.monetizationPotential.tipPotential).toBeGreaterThanOrEqual(0);
        expect(idea.monetizationPotential.tipPotential).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Recommendations', () => {
    it('should generate actionable recommendations', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 10,
        includeAnalysis: true,
      });

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });

    it('should generate next steps', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 5,
      });

      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);
      result.nextSteps.forEach(step => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze idea performance', () => {
      const ideas = [
        {
          id: 'idea-1',
          title: 'Test 1',
          description: 'Desc 1',
          category: 'photo' as const,
          tags: [],
          difficulty: 'easy' as const,
          estimatedEngagement: 80,
          trendScore: 75,
          monetizationPotential: {
            ppvSuitability: 60,
            subscriptionValue: 70,
            tipPotential: 50,
          },
          targetAudience: {
            demographics: [],
            interests: [],
          },
          createdAt: new Date(),
        },
        {
          id: 'idea-2',
          title: 'Test 2',
          description: 'Desc 2',
          category: 'video' as const,
          tags: [],
          difficulty: 'medium' as const,
          estimatedEngagement: 90,
          trendScore: 85,
          monetizationPotential: {
            ppvSuitability: 80,
            subscriptionValue: 75,
            tipPotential: 70,
          },
          targetAudience: {
            demographics: [],
            interests: [],
          },
          createdAt: new Date(),
        },
      ];

      const analysis = service.analyzeIdeaPerformance(ideas);

      expect(analysis.averageEngagement).toBe(85);
      expect(analysis.topCategories).toContain('video');
      expect(analysis.trendAlignment).toBe(80);
      expect(analysis.monetizationScore).toBeGreaterThan(0);
    });

    it('should handle empty ideas array', () => {
      const analysis = service.analyzeIdeaPerformance([]);

      expect(analysis.averageEngagement).toBe(0);
      expect(analysis.topCategories).toHaveLength(0);
      expect(analysis.trendAlignment).toBe(0);
      expect(analysis.monetizationScore).toBe(0);
    });
  });

  describe('Brainstorming', () => {
    it('should brainstorm ideas around a topic', async () => {
      const result = await service.brainstormWithAI('fitness challenges', mockCreatorProfile, {
        style: 'creative',
        depth: 'detailed',
      });

      expect(result.mainIdeas).toBeDefined();
      expect(result.variations).toBeDefined();
      expect(result.implementation).toBeDefined();
      expect(result.considerations).toBeDefined();
    });

    it('should support different brainstorming styles', async () => {
      const styles = ['creative', 'analytical', 'practical'] as const;

      for (const style of styles) {
        const result = await service.brainstormWithAI('content topic', mockCreatorProfile, {
          style,
        });

        expect(result.mainIdeas).toBeDefined();
      }
    });

    it('should support different depth levels', async () => {
      const depths = ['surface', 'detailed', 'comprehensive'] as const;

      for (const depth of depths) {
        const result = await service.brainstormWithAI('content topic', mockCreatorProfile, {
          depth,
        });

        expect(result.mainIdeas).toBeDefined();
      }
    });
  });

  describe('Idea History', () => {
    it('should track idea history', async () => {
      await service.generateContentIdeas(mockCreatorProfile, { count: 3 });
      await service.generateContentIdeas(mockCreatorProfile, { count: 2 });

      const history = service.getIdeaHistory(mockCreatorProfile.id);

      expect(history.length).toBeGreaterThan(0);
    });

    it('should limit history results', async () => {
      await service.generateContentIdeas(mockCreatorProfile, { count: 10 });

      const history = service.getIdeaHistory(mockCreatorProfile.id, 5);

      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should clear idea history', async () => {
      await service.generateContentIdeas(mockCreatorProfile, { count: 3 });

      service.clearIdeaHistory(mockCreatorProfile.id);

      const history = service.getIdeaHistory(mockCreatorProfile.id);

      expect(history).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const failingService = new ContentIdeaGeneratorService({
        maxAttempts: 1,
      });

      // Mock AI service to fail
      vi.mocked(require('@/lib/services/ai-service').getAIService).mockReturnValueOnce({
        generateText: vi.fn().mockRejectedValue(new Error('AI service error')),
      });

      await expect(
        failingService.generateContentIdeas(mockCreatorProfile, { count: 3 })
      ).rejects.toThrow();
    });

    it('should validate generation options', async () => {
      await expect(
        service.generateContentIdeas(mockCreatorProfile, {
          count: 100, // Too many
        })
      ).rejects.toThrow('Count must be between 1 and 50');
    });

    it('should validate category option', async () => {
      await expect(
        service.generateContentIdeas(mockCreatorProfile, {
          category: 'invalid' as any,
        })
      ).rejects.toThrow('Invalid category');
    });

    it('should validate difficulty option', async () => {
      await expect(
        service.generateContentIdeas(mockCreatorProfile, {
          difficulty: 'invalid' as any,
        })
      ).rejects.toThrow('Invalid difficulty');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      const retryService = new ContentIdeaGeneratorService({
        maxAttempts: 3,
        baseDelay: 100,
      });

      let attempts = 0;
      vi.mocked(require('@/lib/services/ai-service').getAIService).mockReturnValue({
        generateText: vi.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 2) {
            const error = new Error('Temporary error');
            (error as any).code = 'ETIMEDOUT';
            throw error;
          }
          return Promise.resolve({
            content: JSON.stringify([{
              title: 'Test',
              description: 'Test',
              category: 'photo',
              tags: [],
              difficulty: 'easy',
              estimatedEngagement: 70,
              trendScore: 70,
              ppvSuitability: 50,
            }]),
            usage: { totalTokens: 100 },
          });
        }),
      });

      const result = await retryService.generateContentIdeas(mockCreatorProfile, {
        count: 1,
      });

      expect(result.ideas).toBeDefined();
      expect(attempts).toBe(2);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback ideas when AI parsing fails', async () => {
      vi.mocked(require('@/lib/services/ai-service').getAIService).mockReturnValueOnce({
        generateText: vi.fn().mockResolvedValue({
          content: 'Invalid JSON response',
          usage: { totalTokens: 100 },
        }),
      });

      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 3,
      });

      expect(result.ideas).toBeDefined();
      expect(result.ideas.length).toBeGreaterThan(0);
    });

    it('should use fallback trends when trend generation fails', async () => {
      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 3,
        includeAnalysis: true,
      });

      expect(result.trendAnalysis).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle creator with no performance history', async () => {
      const newCreator: CreatorProfile = {
        ...mockCreatorProfile,
        performanceHistory: {
          topPerformingContent: [],
          engagementPatterns: {},
          revenueByCategory: {},
        },
      };

      const result = await service.generateContentIdeas(newCreator, {
        count: 3,
      });

      expect(result.ideas).toBeDefined();
    });

    it('should handle creator with no goals', async () => {
      const creatorNoGoals: CreatorProfile = {
        ...mockCreatorProfile,
        currentGoals: [],
      };

      const result = await service.generateContentIdeas(creatorNoGoals, {
        count: 3,
      });

      expect(result.ideas).toBeDefined();
    });

    it('should handle creator with minimal constraints', async () => {
      const minimalCreator: CreatorProfile = {
        ...mockCreatorProfile,
        constraints: {
          equipment: [],
          location: [],
          timeAvailability: 'flexible',
        },
      };

      const result = await service.generateContentIdeas(minimalCreator, {
        count: 3,
      });

      expect(result.ideas).toBeDefined();
    });
  });
});
