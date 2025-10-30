/**
 * Unit Tests - Content Generation Service
 * 
 * Tests for the main content generation orchestrator service
 * 
 * Coverage:
 * - Message generation with personalization
 * - Content idea generation
 * - Caption generation
 * - Hashtag generation
 * - Comprehensive content generation
 * - Batch processing
 * - Strategy optimization
 * - Health checks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentGenerationService, ContentGenerationRequest } from '@/lib/services/content-generation-service';

// Mock dependencies
vi.mock('@/lib/services/message-personalization', () => ({
  getMessagePersonalizationService: vi.fn(() => ({
    generatePersonalizedMessage: vi.fn().mockResolvedValue({
      message: 'Personalized message',
      personalizationScore: 85,
      suggestions: ['Test suggestion'],
    }),
  })),
}));

vi.mock('@/lib/services/content-idea-generator', () => ({
  getContentIdeaGeneratorService: vi.fn(() => ({
    generateContentIdeas: vi.fn().mockResolvedValue({
      ideas: [
        {
          id: 'idea-1',
          title: 'Test Idea',
          description: 'Test description',
          category: 'photo',
          tags: ['test'],
          difficulty: 'easy',
          estimatedEngagement: 75,
          trendScore: 80,
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
      ],
      recommendations: ['Test recommendation'],
      nextSteps: ['Test next step'],
    }),
    analyzeIdeaPerformance: vi.fn().mockReturnValue({
      averageEngagement: 75,
      topCategories: ['photo'],
      trendAlignment: 80,
      monetizationScore: 60,
    }),
  })),
}));

vi.mock('@/lib/services/caption-hashtag-generator', () => ({
  getCaptionHashtagGeneratorService: vi.fn(() => ({
    generateCaption: vi.fn().mockResolvedValue({
      captions: [
        {
          id: 'caption-1',
          text: 'Test caption',
          tone: 'friendly',
          length: 'medium',
          includesEmojis: true,
          includesHashtags: false,
          engagementScore: 80,
          createdAt: new Date(),
        },
      ],
      recommendations: ['Test caption recommendation'],
      hashtagSuggestions: ['#test'],
    }),
    generateHashtagSuggestions: vi.fn().mockResolvedValue(['#test1', '#test2', '#test3']),
  })),
}));

vi.mock('@/lib/services/ai-service', () => ({
  getAIService: vi.fn(() => ({
    generateText: vi.fn().mockResolvedValue({
      content: 'AI generated content',
      usage: { totalTokens: 100 },
    }),
  })),
}));

describe('ContentGenerationService', () => {
  let service: ContentGenerationService;

  beforeEach(() => {
    service = new ContentGenerationService();
  });

  describe('Message Generation', () => {
    it('should generate personalized messages', async () => {
      const request: ContentGenerationRequest = {
        type: 'message',
        context: {
          fanProfile: {
            id: 'fan-1',
            name: 'Test Fan',
            subscriptionTier: 'vip',
            totalSpent: 100,
            lastActive: new Date(),
            preferredContentTypes: [],
            interactionHistory: [],
            demographics: { language: 'en' },
            behaviorMetrics: {
              responseRate: 50,
              averageSpendPerSession: 20,
              contentEngagementRate: 60,
              loyaltyScore: 70,
            },
          },
        },
        options: {
          messageType: 'greeting',
          tone: 'friendly',
          variations: 3,
        },
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('message');
      expect(result.data.messages).toBeDefined();
      expect(result.data.messages).toHaveLength(3);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });

    it('should handle missing fan profile', async () => {
      const request: ContentGenerationRequest = {
        type: 'message',
        context: {},
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Fan profile is required');
    });

    it('should apply tone variations', async () => {
      const request: ContentGenerationRequest = {
        type: 'message',
        context: {
          fanProfile: {
            id: 'fan-1',
            name: 'Test Fan',
            subscriptionTier: 'basic',
            totalSpent: 50,
            lastActive: new Date(),
            preferredContentTypes: [],
            interactionHistory: [],
            demographics: { language: 'en' },
            behaviorMetrics: {
              responseRate: 30,
              averageSpendPerSession: 10,
              contentEngagementRate: 40,
              loyaltyScore: 50,
            },
          },
        },
        options: {
          tone: 'flirty',
          variations: 2,
        },
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.data.messages).toHaveLength(2);
    });
  });

  describe('Idea Generation', () => {
    it('should generate content ideas', async () => {
      const request: ContentGenerationRequest = {
        type: 'idea',
        context: {
          creatorProfile: {
            id: 'creator-1',
            niche: ['fitness', 'lifestyle'],
            contentTypes: ['photo', 'video'],
            audiencePreferences: ['workout', 'nutrition'],
            performanceHistory: {
              topPerformingContent: ['workout videos'],
              engagementPatterns: { video: 80 },
              revenueByCategory: { video: 500 },
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
          },
        },
        options: {
          ideaCount: 5,
          focusArea: 'trending',
        },
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('idea');
      expect(result.data.ideas).toBeDefined();
      expect(result.data.ideas?.ideas).toHaveLength(1);
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });

    it('should handle missing creator profile', async () => {
      const request: ContentGenerationRequest = {
        type: 'idea',
        context: {},
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Creator profile is required');
    });

    it('should support different focus areas', async () => {
      const focusAreas = ['trending', 'evergreen', 'seasonal', 'monetization'] as const;

      for (const focusArea of focusAreas) {
        const request: ContentGenerationRequest = {
          type: 'idea',
          context: {
            creatorProfile: {
              id: 'creator-1',
              niche: ['lifestyle'],
              contentTypes: ['photo'],
              audiencePreferences: [],
              performanceHistory: {
                topPerformingContent: [],
                engagementPatterns: {},
                revenueByCategory: {},
              },
              currentGoals: [],
              constraints: {
                equipment: [],
                location: [],
                timeAvailability: '1 hour/day',
              },
            },
          },
          options: {
            focusArea,
            ideaCount: 3,
          },
        };

        const result = await service.generateContent(request);

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Caption Generation', () => {
    it('should generate captions', async () => {
      const request: ContentGenerationRequest = {
        type: 'caption',
        context: {
          contentContext: {
            type: 'photo',
            description: 'Sunset beach photo',
            mood: 'relaxed',
            setting: 'beach',
            style: 'natural',
            targetAudience: {
              demographics: ['25-35'],
              interests: ['travel', 'lifestyle'],
              engagementPreferences: ['inspirational'],
            },
          },
          strategy: {
            primaryNiche: 'lifestyle',
            secondaryNiches: ['travel'],
            brandKeywords: ['authentic', 'adventure'],
            competitorAnalysis: {
              successfulHashtags: ['#lifestyle'],
              engagementPatterns: {},
            },
            audienceInsights: {
              peakEngagementTimes: ['evening'],
              preferredContentLength: 'medium',
              responseToEmojis: 'positive',
              hashtagPreferences: [],
            },
          },
        },
        options: {
          captionLength: 'medium',
          includeEmojis: true,
          includeCallToAction: true,
          variations: 3,
        },
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('caption');
      expect(result.data.captions).toBeDefined();
      expect(result.data.captions?.captions).toHaveLength(1);
    });

    it('should handle missing content context', async () => {
      const request: ContentGenerationRequest = {
        type: 'caption',
        context: {},
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Content context and strategy are required');
    });

    it('should support different caption lengths', async () => {
      const lengths = ['short', 'medium', 'long'] as const;

      for (const length of lengths) {
        const request: ContentGenerationRequest = {
          type: 'caption',
          context: {
            contentContext: {
              type: 'photo',
              description: 'Test photo',
              mood: 'happy',
              setting: 'studio',
              style: 'professional',
              targetAudience: {
                demographics: [],
                interests: [],
                engagementPreferences: [],
              },
            },
            strategy: {
              primaryNiche: 'lifestyle',
              secondaryNiches: [],
              brandKeywords: [],
              competitorAnalysis: {
                successfulHashtags: [],
                engagementPatterns: {},
              },
              audienceInsights: {
                peakEngagementTimes: [],
                preferredContentLength: length,
                responseToEmojis: 'positive',
                hashtagPreferences: [],
              },
            },
          },
          options: {
            captionLength: length,
          },
        };

        const result = await service.generateContent(request);

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Hashtag Generation', () => {
    it('should generate hashtags', async () => {
      const request: ContentGenerationRequest = {
        type: 'hashtags',
        context: {
          contentContext: {
            type: 'photo',
            description: 'Fitness workout',
            mood: 'energetic',
            setting: 'gym',
            style: 'dynamic',
            targetAudience: {
              demographics: [],
              interests: ['fitness'],
              engagementPreferences: [],
            },
          },
          strategy: {
            primaryNiche: 'fitness',
            secondaryNiches: [],
            brandKeywords: ['workout'],
            competitorAnalysis: {
              successfulHashtags: [],
              engagementPatterns: {},
            },
            audienceInsights: {
              peakEngagementTimes: [],
              preferredContentLength: 'medium',
              responseToEmojis: 'positive',
              hashtagPreferences: [],
            },
          },
        },
        options: {
          hashtagCount: 15,
          hashtagMix: 'balanced',
        },
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('hashtags');
      expect(result.data.hashtags).toBeDefined();
      expect(result.data.hashtags).toHaveLength(3);
    });

    it('should support different hashtag mixes', async () => {
      const mixes = ['trending', 'niche', 'balanced'] as const;

      for (const mix of mixes) {
        const request: ContentGenerationRequest = {
          type: 'hashtags',
          context: {
            contentContext: {
              type: 'photo',
              description: 'Test',
              mood: 'neutral',
              setting: 'studio',
              style: 'clean',
              targetAudience: {
                demographics: [],
                interests: [],
                engagementPreferences: [],
              },
            },
            strategy: {
              primaryNiche: 'lifestyle',
              secondaryNiches: [],
              brandKeywords: [],
              competitorAnalysis: {
                successfulHashtags: [],
                engagementPatterns: {},
              },
              audienceInsights: {
                peakEngagementTimes: [],
                preferredContentLength: 'medium',
                responseToEmojis: 'positive',
                hashtagPreferences: [],
              },
            },
          },
          options: {
            hashtagMix: mix,
          },
        };

        const result = await service.generateContent(request);

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Comprehensive Generation', () => {
    it('should generate comprehensive content package', async () => {
      const request: ContentGenerationRequest = {
        type: 'comprehensive',
        context: {
          creatorProfile: {
            id: 'creator-1',
            niche: ['lifestyle'],
            contentTypes: ['photo', 'video'],
            audiencePreferences: [],
            performanceHistory: {
              topPerformingContent: [],
              engagementPatterns: {},
              revenueByCategory: {},
            },
            currentGoals: [],
            constraints: {
              equipment: [],
              location: [],
              timeAvailability: '2 hours/day',
            },
          },
          contentContext: {
            type: 'photo',
            description: 'Lifestyle content',
            mood: 'positive',
            setting: 'outdoor',
            style: 'natural',
            targetAudience: {
              demographics: [],
              interests: [],
              engagementPreferences: [],
            },
          },
          strategy: {
            primaryNiche: 'lifestyle',
            secondaryNiches: [],
            brandKeywords: [],
            competitorAnalysis: {
              successfulHashtags: [],
              engagementPatterns: {},
            },
            audienceInsights: {
              peakEngagementTimes: [],
              preferredContentLength: 'medium',
              responseToEmojis: 'positive',
              hashtagPreferences: [],
            },
          },
        },
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.type).toBe('comprehensive');
      expect(result.data.comprehensive).toBeDefined();
      expect(result.data.comprehensive?.contentIdeas).toBeDefined();
      expect(result.data.comprehensive?.captions).toBeDefined();
      expect(result.data.comprehensive?.hashtags).toBeDefined();
      expect(result.data.comprehensive?.strategy).toBeDefined();
      expect(result.data.comprehensive?.strategy.performance).toBeDefined();
    });

    it('should include messages when fan profile provided', async () => {
      const request: ContentGenerationRequest = {
        type: 'comprehensive',
        context: {
          creatorProfile: {
            id: 'creator-1',
            niche: ['lifestyle'],
            contentTypes: ['photo'],
            audiencePreferences: [],
            performanceHistory: {
              topPerformingContent: [],
              engagementPatterns: {},
              revenueByCategory: {},
            },
            currentGoals: [],
            constraints: {
              equipment: [],
              location: [],
              timeAvailability: '1 hour/day',
            },
          },
          fanProfile: {
            id: 'fan-1',
            name: 'Test Fan',
            subscriptionTier: 'basic',
            totalSpent: 50,
            lastActive: new Date(),
            preferredContentTypes: [],
            interactionHistory: [],
            demographics: { language: 'en' },
            behaviorMetrics: {
              responseRate: 50,
              averageSpendPerSession: 10,
              contentEngagementRate: 50,
              loyaltyScore: 60,
            },
          },
          contentContext: {
            type: 'photo',
            description: 'Test',
            mood: 'neutral',
            setting: 'studio',
            style: 'clean',
            targetAudience: {
              demographics: [],
              interests: [],
              engagementPreferences: [],
            },
          },
          strategy: {
            primaryNiche: 'lifestyle',
            secondaryNiches: [],
            brandKeywords: [],
            competitorAnalysis: {
              successfulHashtags: [],
              engagementPatterns: {},
            },
            audienceInsights: {
              peakEngagementTimes: [],
              preferredContentLength: 'medium',
              responseToEmojis: 'positive',
              hashtagPreferences: [],
            },
          },
        },
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(true);
      expect(result.data.comprehensive?.messages).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple requests in batch', async () => {
      const requests: ContentGenerationRequest[] = [
        {
          type: 'hashtags',
          context: {
            contentContext: {
              type: 'photo',
              description: 'Test 1',
              mood: 'happy',
              setting: 'outdoor',
              style: 'natural',
              targetAudience: {
                demographics: [],
                interests: [],
                engagementPreferences: [],
              },
            },
            strategy: {
              primaryNiche: 'lifestyle',
              secondaryNiches: [],
              brandKeywords: [],
              competitorAnalysis: {
                successfulHashtags: [],
                engagementPatterns: {},
              },
              audienceInsights: {
                peakEngagementTimes: [],
                preferredContentLength: 'medium',
                responseToEmojis: 'positive',
                hashtagPreferences: [],
              },
            },
          },
          options: {},
        },
        {
          type: 'hashtags',
          context: {
            contentContext: {
              type: 'video',
              description: 'Test 2',
              mood: 'energetic',
              setting: 'gym',
              style: 'dynamic',
              targetAudience: {
                demographics: [],
                interests: [],
                engagementPreferences: [],
              },
            },
            strategy: {
              primaryNiche: 'fitness',
              secondaryNiches: [],
              brandKeywords: [],
              competitorAnalysis: {
                successfulHashtags: [],
                engagementPatterns: {},
              },
              audienceInsights: {
                peakEngagementTimes: [],
                preferredContentLength: 'medium',
                responseToEmojis: 'positive',
                hashtagPreferences: [],
              },
            },
          },
          options: {},
        },
      ];

      const results = await service.generateBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      const requests: ContentGenerationRequest[] = [
        {
          type: 'message',
          context: {}, // Missing fan profile - will fail
          options: {},
        },
        {
          type: 'hashtags',
          context: {
            contentContext: {
              type: 'photo',
              description: 'Valid request',
              mood: 'happy',
              setting: 'outdoor',
              style: 'natural',
              targetAudience: {
                demographics: [],
                interests: [],
                engagementPreferences: [],
              },
            },
            strategy: {
              primaryNiche: 'lifestyle',
              secondaryNiches: [],
              brandKeywords: [],
              competitorAnalysis: {
                successfulHashtags: [],
                engagementPatterns: {},
              },
              audienceInsights: {
                peakEngagementTimes: [],
                preferredContentLength: 'medium',
                responseToEmojis: 'positive',
                hashtagPreferences: [],
              },
            },
          },
          options: {},
        },
      ];

      const results = await service.generateBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe('Strategy Optimization', () => {
    it('should optimize content strategy based on performance', async () => {
      const creatorProfile = {
        id: 'creator-1',
        niche: ['lifestyle', 'fitness'],
        contentTypes: ['photo', 'video'],
        audiencePreferences: [],
        performanceHistory: {
          topPerformingContent: [],
          engagementPatterns: {},
          revenueByCategory: {},
        },
        currentGoals: [],
        constraints: {
          equipment: [],
          location: [],
          timeAvailability: '2 hours/day',
        },
      };

      const performanceHistory = [
        {
          contentId: 'content-1',
          type: 'video',
          engagement: 85,
          reach: 1000,
          revenue: 50,
        },
        {
          contentId: 'content-2',
          type: 'photo',
          engagement: 65,
          reach: 800,
          revenue: 30,
        },
        {
          contentId: 'content-3',
          type: 'video',
          engagement: 90,
          reach: 1200,
          revenue: 60,
        },
      ];

      const result = await service.optimizeContentStrategy(creatorProfile, performanceHistory);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.optimizedStrategy).toBeDefined();
      expect(result.expectedImprovement).toBeGreaterThanOrEqual(0);
    });

    it('should identify top performing content types', async () => {
      const creatorProfile = {
        id: 'creator-1',
        niche: ['lifestyle'],
        contentTypes: ['photo', 'video', 'story'],
        audiencePreferences: [],
        performanceHistory: {
          topPerformingContent: [],
          engagementPatterns: {},
          revenueByCategory: {},
        },
        currentGoals: [],
        constraints: {
          equipment: [],
          location: [],
          timeAvailability: '2 hours/day',
        },
      };

      const performanceHistory = [
        { contentId: '1', type: 'video', engagement: 90, reach: 1000, revenue: 100 },
        { contentId: '2', type: 'video', engagement: 85, reach: 900, revenue: 90 },
        { contentId: '3', type: 'photo', engagement: 70, reach: 700, revenue: 50 },
        { contentId: '4', type: 'story', engagement: 60, reach: 500, revenue: 20 },
      ];

      const result = await service.optimizeContentStrategy(creatorProfile, performanceHistory);

      expect(result.recommendations[0]).toContain('video');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all services available', async () => {
      const health = await service.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.services.messageService).toBe(true);
      expect(health.services.ideaService).toBe(true);
      expect(health.services.captionService).toBe(true);
      expect(health.services.aiService).toBe(true);
      expect(health.details).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported generation type', async () => {
      const request = {
        type: 'unsupported' as any,
        context: {},
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported generation type');
    });

    it('should include processing time in error responses', async () => {
      const request: ContentGenerationRequest = {
        type: 'message',
        context: {}, // Missing required context
        options: {},
      };

      const result = await service.generateContent(request);

      expect(result.success).toBe(false);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track generation performance', () => {
      const generationId = 'gen-123';
      const actualPerformance = {
        engagement: 85,
        reach: 1000,
        revenue: 50,
      };

      // Should not throw
      expect(() => {
        service.trackGenerationPerformance(generationId, actualPerformance);
      }).not.toThrow();
    });
  });
});
