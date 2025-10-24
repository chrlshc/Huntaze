import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getContentGenerationService, ContentGenerationRequest } from '../../lib/services/content-generation-service';
import { getMessagePersonalizationService, FanProfile } from '../../lib/services/message-personalization';
import { getContentIdeaGeneratorService, CreatorProfile } from '../../lib/services/content-idea-generator';
import { getCaptionHashtagGeneratorService, ContentContext, ContentStrategy } from '../../lib/services/caption-hashtag-generator';

// Mock AI service
vi.mock('../../lib/services/ai-service', () => ({
  getAIService: () => ({
    generateText: vi.fn().mockResolvedValue({
      content: 'Generated AI content for testing',
      usage: { tokens: 100 },
    }),
  }),
}));

describe('Content Generation Services', () => {
  let contentService: ReturnType<typeof getContentGenerationService>;
  let messageService: ReturnType<typeof getMessagePersonalizationService>;
  let ideaService: ReturnType<typeof getContentIdeaGeneratorService>;
  let captionService: ReturnType<typeof getCaptionHashtagGeneratorService>;

  const mockFanProfile: FanProfile = {
    id: 'fan123',
    name: 'John Doe',
    subscriptionTier: 'vip',
    totalSpent: 150,
    lastActive: new Date('2024-01-15'),
    preferredContentTypes: ['photos', 'videos'],
    interactionHistory: [
      {
        type: 'message',
        content: 'Love your content!',
        timestamp: new Date('2024-01-10'),
      },
    ],
    demographics: {
      timezone: 'America/New_York',
      language: 'en',
    },
    behaviorMetrics: {
      responseRate: 75,
      averageSpendPerSession: 25,
      contentEngagementRate: 80,
      loyaltyScore: 85,
    },
  };

  const mockCreatorProfile: CreatorProfile = {
    id: 'creator123',
    niche: ['fitness', 'lifestyle'],
    contentTypes: ['photo', 'video', 'story'],
    audiencePreferences: ['authentic', 'motivational', 'behind-the-scenes'],
    performanceHistory: {
      topPerformingContent: ['workout videos', 'meal prep', 'progress photos'],
      engagementPatterns: { morning: 85, afternoon: 70, evening: 90 },
      revenueByCategory: { photo: 100, video: 250, ppv: 500 },
    },
    currentGoals: [
      { type: 'growth', target: 1000, timeframe: 'month' },
      { type: 'revenue', target: 5000, timeframe: 'month' },
    ],
    constraints: {
      equipment: ['camera', 'lighting'],
      location: ['home gym', 'kitchen'],
      timeAvailability: 'evenings',
    },
  };

  const mockContentContext: ContentContext = {
    type: 'photo',
    description: 'Post-workout selfie in home gym',
    mood: 'energetic',
    setting: 'home gym',
    style: 'authentic',
    targetAudience: {
      demographics: ['25-35', 'fitness enthusiasts'],
      interests: ['fitness', 'health', 'motivation'],
      engagementPreferences: ['inspirational', 'relatable'],
    },
    monetizationGoal: 'engagement',
  };

  const mockContentStrategy: ContentStrategy = {
    primaryNiche: 'fitness',
    secondaryNiches: ['lifestyle', 'wellness'],
    brandKeywords: ['fitness', 'motivation', 'authentic', 'journey'],
    competitorAnalysis: {
      successfulHashtags: ['#fitness', '#motivation', '#workout'],
      engagementPatterns: { photo: 75, video: 85, story: 60 },
    },
    audienceInsights: {
      peakEngagementTimes: ['7-9am', '6-8pm'],
      preferredContentLength: 'medium',
      responseToEmojis: 'positive',
      hashtagPreferences: ['#fitness', '#motivation', '#authentic'],
    },
  };

  beforeEach(() => {
    contentService = getContentGenerationService();
    messageService = getMessagePersonalizationService();
    ideaService = getContentIdeaGeneratorService();
    captionService = getCaptionHashtagGeneratorService();
  });

  describe('Message Personalization Service', () => {
    it('should generate personalized messages', async () => {
      const result = await messageService.generatePersonalizedMessage(
        mockFanProfile,
        'greeting',
        { tone: 'friendly', includeEmojis: true }
      );

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('personalizationScore');
      expect(result).toHaveProperty('suggestions');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.personalizationScore).toBeGreaterThanOrEqual(0);
      expect(result.personalizationScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle different message types', async () => {
      const messageTypes = ['greeting', 'upsell', 'ppv_offer', 'reactivation', 'thank_you'] as const;
      
      for (const type of messageTypes) {
        const result = await messageService.generatePersonalizedMessage(
          mockFanProfile,
          type,
          { tone: 'friendly' }
        );
        
        expect(result.message).toBeTruthy();
        expect(result.personalizationScore).toBeGreaterThan(0);
      }
    });

    it('should provide template management', () => {
      const templates = messageService.getTemplates('greeting');
      expect(Array.isArray(templates)).toBe(true);
      
      const performance = messageService.getTemplatePerformance();
      expect(Array.isArray(performance)).toBe(true);
    });
  });

  describe('Content Idea Generator Service', () => {
    it('should generate content ideas', async () => {
      const result = await ideaService.generateContentIdeas(mockCreatorProfile, {
        count: 5,
        focusArea: 'trending',
        includeAnalysis: true,
      });

      expect(result).toHaveProperty('ideas');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('nextSteps');
      expect(Array.isArray(result.ideas)).toBe(true);
      expect(result.ideas.length).toBeGreaterThan(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.nextSteps)).toBe(true);
    });

    it('should analyze idea performance', () => {
      const mockIdeas = [
        {
          id: 'idea1',
          title: 'Workout Tutorial',
          description: 'Step-by-step exercise guide',
          category: 'video' as const,
          tags: ['fitness', 'tutorial'],
          difficulty: 'medium' as const,
          estimatedEngagement: 85,
          trendScore: 70,
          targetAudience: { demographics: [], interests: [] },
          monetizationPotential: { ppvSuitability: 60, subscriptionValue: 80, tipPotential: 40 },
          createdAt: new Date(),
        },
      ];

      const analysis = ideaService.analyzeIdeaPerformance(mockIdeas);
      
      expect(analysis).toHaveProperty('averageEngagement');
      expect(analysis).toHaveProperty('topCategories');
      expect(analysis).toHaveProperty('trendAlignment');
      expect(analysis).toHaveProperty('monetizationScore');
      expect(analysis.averageEngagement).toBe(85);
      expect(Array.isArray(analysis.topCategories)).toBe(true);
    });

    it('should handle brainstorming requests', async () => {
      const result = await ideaService.brainstormWithAI(
        'morning routine',
        mockCreatorProfile,
        { style: 'creative', depth: 'detailed' }
      );

      expect(result).toHaveProperty('mainIdeas');
      expect(result).toHaveProperty('variations');
      expect(result).toHaveProperty('implementation');
      expect(result).toHaveProperty('considerations');
      expect(Array.isArray(result.mainIdeas)).toBe(true);
    });
  });

  describe('Caption and Hashtag Generator Service', () => {
    it('should generate captions', async () => {
      const result = await captionService.generateCaption(
        mockContentContext,
        mockContentStrategy,
        {
          tone: 'friendly',
          length: 'medium',
          includeEmojis: true,
          variations: 2,
        }
      );

      expect(result).toHaveProperty('captions');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('hashtagSuggestions');
      expect(Array.isArray(result.captions)).toBe(true);
      expect(result.captions.length).toBe(2);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.hashtagSuggestions)).toBe(true);
    });

    it('should generate hashtag suggestions', async () => {
      const hashtags = await captionService.generateHashtagSuggestions(
        mockContentContext,
        mockContentStrategy,
        { count: 15, mix: 'balanced' }
      );

      expect(Array.isArray(hashtags)).toBe(true);
      expect(hashtags.length).toBeGreaterThan(0);
      expect(hashtags.length).toBeLessThanOrEqual(15);
      
      // All should be valid hashtags
      hashtags.forEach(tag => {
        expect(tag.startsWith('#')).toBe(true);
        expect(tag.length).toBeGreaterThan(2);
      });
    });

    it('should analyze caption trends', () => {
      const mockCaptions = [
        {
          id: 'cap1',
          text: 'Great workout today! 💪',
          tone: 'friendly' as const,
          length: 'short' as const,
          includesEmojis: true,
          includesHashtags: false,
          engagementScore: 75,
          createdAt: new Date(),
        },
      ];

      // Mock caption history
      captionService['captionHistory'].set('creator123', mockCaptions);

      const trends = captionService.analyzeCaptionTrends('creator123');
      
      expect(trends).toHaveProperty('bestPerformingTones');
      expect(trends).toHaveProperty('optimalLength');
      expect(trends).toHaveProperty('emojiEffectiveness');
      expect(trends).toHaveProperty('ctaEffectiveness');
      expect(Array.isArray(trends.bestPerformingTones)).toBe(true);
    });
  });

  describe('Unified Content Generation Service', () => {
    it('should generate messages through unified interface', async () => {
      const request: ContentGenerationRequest = {
        type: 'message',
        context: { fanProfile: mockFanProfile },
        options: { messageType: 'greeting', variations: 2 },
      };

      const result = await contentService.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('message');
      expect(result.data.messages).toBeDefined();
      expect(Array.isArray(result.data.messages)).toBe(true);
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });

    it('should generate ideas through unified interface', async () => {
      const request: ContentGenerationRequest = {
        type: 'idea',
        context: { creatorProfile: mockCreatorProfile },
        options: { ideaCount: 3, focusArea: 'trending' },
      };

      const result = await contentService.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('idea');
      expect(result.data.ideas).toBeDefined();
      expect(result.data.ideas?.ideas).toBeDefined();
      expect(Array.isArray(result.data.ideas?.ideas)).toBe(true);
    });

    it('should generate captions through unified interface', async () => {
      const request: ContentGenerationRequest = {
        type: 'caption',
        context: { 
          contentContext: mockContentContext,
          strategy: mockContentStrategy,
        },
        options: { captionLength: 'medium', variations: 2 },
      };

      const result = await contentService.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('caption');
      expect(result.data.captions).toBeDefined();
      expect(Array.isArray(result.data.captions?.captions)).toBe(true);
    });

    it('should generate hashtags through unified interface', async () => {
      const request: ContentGenerationRequest = {
        type: 'hashtags',
        context: {
          contentContext: mockContentContext,
          strategy: mockContentStrategy,
        },
        options: { hashtagCount: 10 },
      };

      const result = await contentService.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('hashtags');
      expect(result.data.hashtags).toBeDefined();
      expect(Array.isArray(result.data.hashtags)).toBe(true);
    });

    it('should generate comprehensive content package', async () => {
      const request: ContentGenerationRequest = {
        type: 'comprehensive',
        context: {
          creatorProfile: mockCreatorProfile,
          contentContext: mockContentContext,
          strategy: mockContentStrategy,
          fanProfile: mockFanProfile,
        },
      };

      const result = await contentService.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('comprehensive');
      expect(result.data.comprehensive).toBeDefined();
      
      const comprehensive = result.data.comprehensive!;
      expect(Array.isArray(comprehensive.contentIdeas)).toBe(true);
      expect(Array.isArray(comprehensive.captions)).toBe(true);
      expect(Array.isArray(comprehensive.hashtags)).toBe(true);
      expect(Array.isArray(comprehensive.messages)).toBe(true);
      expect(comprehensive.strategy).toBeDefined();
      expect(Array.isArray(comprehensive.strategy.recommendations)).toBe(true);
    });

    it('should handle batch processing', async () => {
      const requests: ContentGenerationRequest[] = [
        {
          type: 'message',
          context: { fanProfile: mockFanProfile },
          options: { messageType: 'greeting' },
        },
        {
          type: 'hashtags',
          context: {
            contentContext: mockContentContext,
            strategy: mockContentStrategy,
          },
          options: { hashtagCount: 5 },
        },
      ];

      const results = await contentService.generateBatch(requests);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].type).toBe('message');
      expect(results[1].type).toBe('hashtags');
    });

    it('should handle errors gracefully', async () => {
      const request: ContentGenerationRequest = {
        type: 'message',
        context: {}, // Missing required fanProfile
      };

      const result = await contentService.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata.confidence).toBe(0);
    });

    it('should optimize content strategy', async () => {
      const performanceHistory = [
        { contentId: 'c1', type: 'photo', engagement: 85, reach: 1000, revenue: 50 },
        { contentId: 'c2', type: 'video', engagement: 95, reach: 1500, revenue: 100 },
        { contentId: 'c3', type: 'story', engagement: 70, reach: 800, revenue: 20 },
      ];

      const optimization = await contentService.optimizeContentStrategy(
        mockCreatorProfile,
        performanceHistory
      );

      expect(optimization).toHaveProperty('recommendations');
      expect(optimization).toHaveProperty('optimizedStrategy');
      expect(optimization).toHaveProperty('expectedImprovement');
      expect(Array.isArray(optimization.recommendations)).toBe(true);
      expect(optimization.expectedImprovement).toBeGreaterThanOrEqual(0);
    });

    it('should perform health checks', async () => {
      const health = await contentService.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('details');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(Array.isArray(health.details)).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty or minimal input gracefully', async () => {
      const minimalFanProfile: FanProfile = {
        id: 'minimal',
        name: 'Test',
        subscriptionTier: 'basic',
        totalSpent: 0,
        lastActive: new Date(),
        preferredContentTypes: [],
        interactionHistory: [],
        demographics: {},
        behaviorMetrics: {},
      };

      const result = await messageService.generatePersonalizedMessage(
        minimalFanProfile,
        'greeting'
      );

      expect(result.message).toBeTruthy();
      expect(result.personalizationScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => ({
        type: 'hashtags' as const,
        context: {
          contentContext: mockContentContext,
          strategy: mockContentStrategy,
        },
        options: { hashtagCount: 5 },
      }));

      const results = await Promise.all(
        requests.map(req => contentService.generateContent(req))
      );

      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.hashtags).toBeDefined();
      });
    });

    it('should validate processing times are reasonable', async () => {
      const request: ContentGenerationRequest = {
        type: 'caption',
        context: {
          contentContext: mockContentContext,
          strategy: mockContentStrategy,
        },
        options: { variations: 1 },
      };

      const startTime = Date.now();
      const result = await contentService.generateContent(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});