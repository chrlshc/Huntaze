import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentIdeaGeneratorService, type CreatorProfile, type ContentIdea } from '@/lib/services/content-idea-generator';

// Mock AI service
const mockAIService = {
  generateText: vi.fn(),
};

vi.mock('@/lib/services/ai-service', () => ({
  getAIService: () => mockAIService,
}));

describe('ContentIdeaGeneratorService', () => {
  let service: ContentIdeaGeneratorService;
  let mockCreatorProfile: CreatorProfile;

  beforeEach(() => {
    service = new ContentIdeaGeneratorService();
    mockCreatorProfile = {
      id: 'creator-123',
      niche: ['fitness', 'lifestyle'],
      contentTypes: ['photo', 'video', 'story'],
      audiencePreferences: ['workout', 'nutrition', 'motivation'],
      performanceHistory: {
        topPerformingContent: ['workout videos', 'meal prep'],
        engagementPatterns: { photo: 85, video: 92 },
        revenueByCategory: { ppv: 1200, subscription: 800 },
      },
      currentGoals: [
        { type: 'revenue', target: 5000, timeframe: 'month' },
        { type: 'engagement', target: 90, timeframe: 'week' },
      ],
      constraints: {
        equipment: ['camera', 'lighting'],
        location: ['home', 'gym'],
        timeAvailability: '2-3 hours daily',
      },
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateContentIdeas', () => {
    it('should generate content ideas successfully', async () => {
      const mockResponse = {
        content: JSON.stringify([
          {
            title: 'Morning Workout Routine',
            description: 'High-energy morning workout to start your day',
            category: 'video',
            tags: ['workout', 'morning', 'fitness'],
            difficulty: 'medium',
            estimatedEngagement: 85,
            trendScore: 75,
            ppvSuitability: 60,
            targetAudience: {
              demographics: ['18-35'],
              interests: ['fitness', 'health'],
              spendingLevel: 'medium',
            },
          },
        ]),
        usage: { totalTokens: 150 },
      };

      mockAIService.generateText.mockResolvedValue(mockResponse);

      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 1,
        focusArea: 'trending',
      });

      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].title).toBe('Morning Workout Routine');
      expect(result.metadata.tokensUsed).toBe(150);
      expect(result.recommendations).toBeDefined();
      expect(result.nextSteps).toBeDefined();
    });

    it('should handle AI service errors with retry', async () => {
      const error = new Error('API rate limit exceeded');
      (error as any).status = 429;
      (error as any).retryable = true;

      mockAIService.generateText
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          content: JSON.stringify([{
            title: 'Fallback Idea',
            description: 'A fallback content idea',
            category: 'photo',
            tags: ['fitness'],
            difficulty: 'easy',
            estimatedEngagement: 70,
            trendScore: 60,
            ppvSuitability: 40,
          }]),
          usage: { totalTokens: 100 },
        });

      const result = await service.generateContentIdeas(mockCreatorProfile, {
        count: 1,
      });

      expect(mockAIService.generateText).toHaveBeenCalledTimes(3);
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].title).toBe('Fallback Idea');
    });

    it('should throw error after max retry attempts', async () => {
      const error = new Error('Persistent API error');
      (error as any).status = 500;
      (error as any).retryable = true;

      mockAIService.generateText.mockRejectedValue(error);

      await expect(
        service.generateContentIdeas(mockCreatorProfile, { count: 1 })
      ).rejects.toThrow('Content idea generation failed');

      expect(mockAIService.generateText).toHaveBeenCalledTimes(3); // Default max attempts
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('Invalid API key');
      (error as any).status = 401;
      (error as any).retryable = false;

      mockAIService.generateText.mockRejectedValue(error);

      await expect(
        service.generateContentIdeas(mockCreatorProfile, { count: 1 })
      ).rejects.toThrow('Content idea generation failed');

      expect(mockAIService.generateText).toHaveBeenCalledTimes(1); // No retries
    });

    it('should validate input options', async () => {
      await expect(
        service.generateContentIdeas(mockCreatorProfile, { count: 0 })
      ).rejects.toThrow('Count must be between 1 and 50');

      await expect(
        service.generateContentIdeas(mockCreatorProfile, { count: 51 })
      ).rejects.toThrow('Count must be between 1 and 50');

      await expect(
        service.generateContentIdeas(mockCreatorProfile, { 
          category: 'invalid' as any 
        })
      ).rejects.toThrow('Invalid category specified');
    });

    it('should use cached trend data', async () => {
      const mockTrendResponse = {
        content: JSON.stringify([
          {
            keyword: 'fitness',
            popularity: 85,
            growth: 15,
            category: 'health',
            relatedKeywords: ['workout', 'exercise'],
          },
        ]),
        usage: { totalTokens: 50 },
      };

      const mockIdeaResponse = {
        content: JSON.stringify([{
          title: 'Trending Fitness Content',
          description: 'Content based on current trends',
          category: 'video',
          tags: ['fitness', 'trending'],
          difficulty: 'medium',
          estimatedEngagement: 80,
          trendScore: 90,
          ppvSuitability: 70,
        }]),
        usage: { totalTokens: 100 },
      };

      mockAIService.generateText
        .mockResolvedValueOnce(mockTrendResponse) // First call for trends
        .mockResolvedValueOnce(mockIdeaResponse); // Second call for ideas

      // First call - should fetch trends
      const result1 = await service.generateContentIdeas(mockCreatorProfile, {
        includeAnalysis: true,
      });

      // Second call - should use cached trends
      const result2 = await service.generateContentIdeas(mockCreatorProfile, {
        includeAnalysis: true,
      });

      expect(result1.metadata.cacheHit).toBe(false);
      expect(result2.metadata.cacheHit).toBe(true);
      expect(mockAIService.generateText).toHaveBeenCalledTimes(3); // 2 for first call, 1 for second
    });
  });

  describe('brainstormWithAI', () => {
    it('should generate brainstorm results', async () => {
      const mockResponse = {
        content: JSON.stringify({
          mainIdeas: ['Idea 1', 'Idea 2'],
          variations: ['Variation 1', 'Variation 2'],
          implementation: ['Step 1', 'Step 2'],
          considerations: ['Consider 1', 'Consider 2'],
        }),
        usage: { totalTokens: 200 },
      };

      mockAIService.generateText.mockResolvedValue(mockResponse);

      const result = await service.brainstormWithAI(
        'fitness motivation',
        mockCreatorProfile,
        { style: 'creative', depth: 'detailed' }
      );

      expect(result.mainIdeas).toHaveLength(2);
      expect(result.variations).toHaveLength(2);
      expect(result.implementation).toHaveLength(2);
      expect(result.considerations).toHaveLength(2);
    });

    it('should handle malformed AI response with fallback', async () => {
      const mockResponse = {
        content: 'Invalid JSON response',
        usage: { totalTokens: 50 },
      };

      mockAIService.generateText.mockResolvedValue(mockResponse);

      const result = await service.brainstormWithAI(
        'fitness motivation',
        mockCreatorProfile
      );

      // Should return fallback structure
      expect(result.mainIdeas).toEqual(['fitness motivation']);
      expect(result.variations).toContain('Create different formats of this content');
      expect(result.implementation).toContain('Plan content creation');
      expect(result.considerations).toContain('Audience engagement');
    });
  });

  describe('analyzeIdeaPerformance', () => {
    it('should analyze idea performance correctly', () => {
      const mockIdeas: ContentIdea[] = [
        {
          id: '1',
          title: 'Idea 1',
          description: 'Description 1',
          category: 'video',
          tags: ['tag1'],
          difficulty: 'medium',
          estimatedEngagement: 80,
          trendScore: 70,
          seasonality: undefined,
          targetAudience: { demographics: [], interests: [] },
          monetizationPotential: {
            ppvSuitability: 60,
            subscriptionValue: 70,
            tipPotential: 50,
          },
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Idea 2',
          description: 'Description 2',
          category: 'photo',
          tags: ['tag2'],
          difficulty: 'easy',
          estimatedEngagement: 90,
          trendScore: 80,
          seasonality: undefined,
          targetAudience: { demographics: [], interests: [] },
          monetizationPotential: {
            ppvSuitability: 80,
            subscriptionValue: 60,
            tipPotential: 70,
          },
          createdAt: new Date(),
        },
      ];

      const analysis = service.analyzeIdeaPerformance(mockIdeas);

      expect(analysis.averageEngagement).toBe(85);
      expect(analysis.trendAlignment).toBe(75);
      expect(analysis.topCategories).toContain('video');
      expect(analysis.topCategories).toContain('photo');
      expect(analysis.monetizationScore).toBeGreaterThan(0);
    });

    it('should handle empty ideas array', () => {
      const analysis = service.analyzeIdeaPerformance([]);

      expect(analysis.averageEngagement).toBe(0);
      expect(analysis.trendAlignment).toBe(0);
      expect(analysis.topCategories).toEqual([]);
      expect(analysis.monetizationScore).toBe(0);
    });
  });

  describe('idea history management', () => {
    it('should store and retrieve idea history', async () => {
      const mockResponse = {
        content: JSON.stringify([{
          title: 'Test Idea',
          description: 'Test description',
          category: 'photo',
          tags: ['test'],
          difficulty: 'easy',
          estimatedEngagement: 75,
          trendScore: 65,
          ppvSuitability: 50,
        }]),
        usage: { totalTokens: 100 },
      };

      mockAIService.generateText.mockResolvedValue(mockResponse);

      await service.generateContentIdeas(mockCreatorProfile, { count: 1 });

      const history = service.getIdeaHistory(mockCreatorProfile.id);
      expect(history).toHaveLength(1);
      expect(history[0].title).toBe('Test Idea');
    });

    it('should clear idea history', async () => {
      const mockResponse = {
        content: JSON.stringify([{
          title: 'Test Idea',
          description: 'Test description',
          category: 'photo',
          tags: ['test'],
          difficulty: 'easy',
          estimatedEngagement: 75,
          trendScore: 65,
          ppvSuitability: 50,
        }]),
        usage: { totalTokens: 100 },
      };

      mockAIService.generateText.mockResolvedValue(mockResponse);

      await service.generateContentIdeas(mockCreatorProfile, { count: 1 });
      
      service.clearIdeaHistory(mockCreatorProfile.id);
      
      const history = service.getIdeaHistory(mockCreatorProfile.id);
      expect(history).toHaveLength(0);
    });
  });
});