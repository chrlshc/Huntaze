import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all services for integration testing
const mockServices = {
  contentGeneration: {
    generateContent: vi.fn(),
    generateBatch: vi.fn(),
    optimizeContentStrategy: vi.fn(),
  },
  aiOptimization: {
    optimize: vi.fn(),
    optimizeBatch: vi.fn(),
  },
  apiMonitoring: {
    recordMetric: vi.fn(),
    getHealthMetrics: vi.fn(),
    getActiveAlerts: vi.fn(),
  },
  auth: {
    authenticate: vi.fn(),
    authorize: vi.fn(),
    checkRateLimit: vi.fn(),
  },
  validation: {
    validateRequest: vi.fn(),
    sanitizeInput: vi.fn(),
  },
};

// Mock service imports
vi.mock('@/lib/services/content-generation-service', () => ({
  getContentGenerationService: () => mockServices.contentGeneration,
}));

vi.mock('@/lib/services/ai-optimization-service', () => ({
  getAIOptimizationService: () => mockServices.aiOptimization,
}));

vi.mock('@/lib/services/api-monitoring-service', () => ({
  getAPIMonitoringService: () => mockServices.apiMonitoring,
}));

vi.mock('@/lib/middleware/api-auth', () => ({
  withAuthAndRateLimit: vi.fn(),
}));

vi.mock('@/lib/middleware/api-validation', () => ({
  withCompleteValidation: vi.fn(),
}));

describe('End-to-End Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockServices.contentGeneration.generateContent.mockResolvedValue({
      success: true,
      type: 'comprehensive',
      data: {
        comprehensive: {
          contentIdeas: [
            {
              id: 'idea1',
              title: 'Test Content Idea',
              description: 'Test description',
              category: 'video',
              tags: ['test'],
              difficulty: 'medium',
              estimatedEngagement: 80,
              trendScore: 70,
              targetAudience: { demographics: [], interests: [] },
              monetizationPotential: { ppvSuitability: 60, subscriptionValue: 70, tipPotential: 50 },
              createdAt: new Date(),
            },
          ],
          captions: [
            {
              id: 'caption1',
              text: 'Test caption',
              tone: 'friendly',
              length: 'medium',
              includesEmojis: true,
              includesHashtags: false,
              engagementScore: 75,
              createdAt: new Date(),
            },
          ],
          hashtags: ['#test', '#content'],
          messages: ['Test message'],
          strategy: {
            recommendations: ['Test recommendation'],
            nextSteps: ['Test next step'],
            performance: {
              expectedEngagement: 80,
              monetizationPotential: 70,
              trendAlignment: 75,
            },
          },
        },
      },
      metadata: {
        processingTime: 1500,
        confidence: 85,
        suggestions: ['Test suggestion'],
      },
    });

    mockServices.auth.authenticate.mockResolvedValue({
      userId: 'user123',
      role: 'creator',
      permissions: ['content:generate'],
      rateLimits: {
        contentGeneration: 100,
        brainstorming: 50,
        trendAnalysis: 10,
      },
    });

    mockServices.auth.checkRateLimit.mockResolvedValue(undefined);
    mockServices.validation.validateRequest.mockResolvedValue(true);
    mockServices.apiMonitoring.recordMetric.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Content Creation Workflow', () => {
    it('should execute full content creation pipeline successfully', async () => {
      // Simulate the complete workflow from API request to response
      const mockRequest = {
        type: 'comprehensive',
        context: {
          creatorProfile: {
            id: 'creator123',
            niche: ['fitness'],
            contentTypes: ['video'],
            audiencePreferences: ['motivation'],
            performanceHistory: {
              topPerformingContent: [],
              engagementPatterns: {},
              revenueByCategory: {},
            },
            currentGoals: [],
            constraints: {
              equipment: [],
              location: [],
              timeAvailability: '',
            },
          },
        },
      };

      // Step 1: Authentication
      const authContext = await mockServices.auth.authenticate();
      expect(authContext.userId).toBe('user123');
      expect(authContext.role).toBe('creator');

      // Step 2: Authorization and Rate Limiting
      await mockServices.auth.checkRateLimit(authContext, 'contentGeneration');
      expect(mockServices.auth.checkRateLimit).toHaveBeenCalledWith(authContext, 'contentGeneration');

      // Step 3: Request Validation
      const isValid = await mockServices.validation.validateRequest(mockRequest);
      expect(isValid).toBe(true);

      // Step 4: Content Generation
      const result = await mockServices.contentGeneration.generateContent(mockRequest);
      expect(result.success).toBe(true);
      expect(result.data.comprehensive).toBeDefined();
      expect(result.data.comprehensive.contentIdeas).toHaveLength(1);
      expect(result.data.comprehensive.captions).toHaveLength(1);
      expect(result.data.comprehensive.hashtags).toHaveLength(2);

      // Step 5: Monitoring
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/content-ideas/generate',
        method: 'POST',
        statusCode: 200,
        responseTime: result.metadata.processingTime,
        userId: authContext.userId,
        tokensUsed: result.metadata.tokensUsed,
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/content-ideas/generate',
          statusCode: 200,
          userId: 'user123',
        })
      );

      // Verify complete workflow execution
      expect(mockServices.auth.authenticate).toHaveBeenCalled();
      expect(mockServices.auth.checkRateLimit).toHaveBeenCalled();
      expect(mockServices.validation.validateRequest).toHaveBeenCalled();
      expect(mockServices.contentGeneration.generateContent).toHaveBeenCalled();
      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalled();
    });

    it('should handle workflow failures gracefully', async () => {
      // Simulate authentication failure
      mockServices.auth.authenticate.mockRejectedValue(new Error('Authentication failed'));

      try {
        await mockServices.auth.authenticate();
        expect.fail('Should have thrown authentication error');
      } catch (error) {
        expect(error.message).toBe('Authentication failed');
      }

      // Verify monitoring records the failure
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/content-ideas/generate',
        method: 'POST',
        statusCode: 401,
        responseTime: 50,
        errorType: 'AuthenticationError',
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          errorType: 'AuthenticationError',
        })
      );
    });

    it('should handle rate limiting correctly', async () => {
      // Simulate rate limit exceeded
      mockServices.auth.checkRateLimit.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const authContext = await mockServices.auth.authenticate();

      try {
        await mockServices.auth.checkRateLimit(authContext, 'contentGeneration');
        expect.fail('Should have thrown rate limit error');
      } catch (error) {
        expect(error.message).toBe('Rate limit exceeded');
      }

      // Verify proper error handling
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/content-ideas/generate',
        method: 'POST',
        statusCode: 429,
        responseTime: 25,
        errorType: 'RateLimitError',
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          errorType: 'RateLimitError',
        })
      );
    });
  });

  describe('Optimization Workflow Integration', () => {
    it('should execute optimization pipeline with monitoring', async () => {
      const optimizationRequest = {
        type: 'comprehensive',
        contentId: 'content123',
        data: {
          pricingData: {
            contentId: 'content123',
            currentPrice: 20,
            contentType: 'ppv',
            historicalPerformance: {
              views: 1500,
              purchases: 75,
              revenue: 1500,
              conversionRate: 5.0,
            },
            audienceData: {
              averageSpending: 50,
              priceElasticity: -1.2,
              segmentSize: 10000,
            },
            competitorPricing: [],
          },
        },
        options: {
          strategy: 'balanced',
          riskTolerance: 'moderate',
        },
      };

      mockServices.aiOptimization.optimize.mockResolvedValue({
        type: 'comprehensive',
        contentId: 'content123',
        success: true,
        data: {
          comprehensive: {
            pricing: [{
              contentId: 'content123',
              currentPrice: 20,
              recommendedPrice: 25,
              priceChange: 5,
              priceChangePercent: 25,
              expectedImpact: {
                revenueChange: 15.5,
                conversionRateChange: -2.1,
                demandChange: -8.3,
              },
              confidence: 78,
              reasoning: ['Market analysis suggests higher price point'],
              testingStrategy: {
                duration: '7 days',
                metrics: ['conversion rate', 'revenue'],
                successCriteria: ['Maintain >4% conversion rate'],
              },
            }],
            timing: {
              contentType: 'ppv',
              optimalTimes: [{
                dayOfWeek: 'Friday',
                timeRange: '8-10pm',
                expectedEngagement: 85,
                confidence: 80,
              }],
              avoidTimes: [],
              seasonalInsights: {
                bestMonths: ['March', 'April'],
                worstMonths: ['January'],
                specialEvents: [],
              },
              personalizedSchedule: [],
            },
            anomalies: [],
            overallScore: 82,
            priorityActions: ['Test new price point'],
            riskAssessment: {
              level: 'medium',
              factors: ['Price increase of 25%'],
              mitigation: ['Gradual rollout'],
            },
          },
        },
        metadata: {
          processingTime: 2500,
          confidence: 82,
          suggestions: ['Monitor closely during test period'],
        },
      });

      // Execute optimization workflow
      const authContext = await mockServices.auth.authenticate();
      await mockServices.auth.checkRateLimit(authContext, 'contentGeneration');
      
      const result = await mockServices.aiOptimization.optimize(optimizationRequest);
      
      expect(result.success).toBe(true);
      expect(result.data.comprehensive.pricing).toHaveLength(1);
      expect(result.data.comprehensive.pricing[0].recommendedPrice).toBe(25);
      expect(result.data.comprehensive.overallScore).toBe(82);

      // Verify monitoring
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/optimization/comprehensive',
        method: 'POST',
        statusCode: 200,
        responseTime: result.metadata.processingTime,
        userId: authContext.userId,
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/optimization/comprehensive',
          statusCode: 200,
          responseTime: 2500,
        })
      );
    });
  });

  describe('Batch Processing Workflow', () => {
    it('should handle batch content generation efficiently', async () => {
      const batchRequests = [
        {
          type: 'idea',
          context: { creatorProfile: { id: 'creator1', niche: ['fitness'], contentTypes: ['video'], audiencePreferences: [], performanceHistory: { topPerformingContent: [], engagementPatterns: {}, revenueByCategory: {} }, currentGoals: [], constraints: { equipment: [], location: [], timeAvailability: '' } } },
        },
        {
          type: 'caption',
          context: { contentContext: { type: 'video', description: 'workout', mood: 'energetic', setting: 'gym', style: 'authentic', targetAudience: { demographics: [], interests: [], engagementPreferences: [] } }, strategy: { primaryNiche: 'fitness', secondaryNiches: [], brandKeywords: [], competitorAnalysis: { successfulHashtags: [], engagementPatterns: {} }, audienceInsights: { peakEngagementTimes: [], preferredContentLength: 'medium', responseToEmojis: 'positive', hashtagPreferences: [] } } },
        },
        {
          type: 'hashtags',
          context: { contentContext: { type: 'video', description: 'workout', mood: 'energetic', setting: 'gym', style: 'authentic', targetAudience: { demographics: [], interests: [], engagementPreferences: [] } }, strategy: { primaryNiche: 'fitness', secondaryNiches: [], brandKeywords: [], competitorAnalysis: { successfulHashtags: [], engagementPatterns: {} }, audienceInsights: { peakEngagementTimes: [], preferredContentLength: 'medium', responseToEmojis: 'positive', hashtagPreferences: [] } } },
        },
      ];

      mockServices.contentGeneration.generateBatch.mockResolvedValue([
        {
          type: 'idea',
          success: true,
          data: { ideas: { ideas: [], recommendations: [], nextSteps: [] } },
          metadata: { processingTime: 800, confidence: 75, suggestions: [] },
        },
        {
          type: 'caption',
          success: true,
          data: { captions: { captions: [], recommendations: [], hashtagSuggestions: [] } },
          metadata: { processingTime: 600, confidence: 80, suggestions: [] },
        },
        {
          type: 'hashtags',
          success: true,
          data: { hashtags: ['#fitness', '#workout'] },
          metadata: { processingTime: 400, confidence: 85, suggestions: [] },
        },
      ]);

      // Execute batch workflow
      const authContext = await mockServices.auth.authenticate();
      await mockServices.auth.checkRateLimit(authContext, 'contentGeneration');

      const results = await mockServices.contentGeneration.generateBatch(batchRequests);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Verify all requests were processed
      expect(results[0].type).toBe('idea');
      expect(results[1].type).toBe('caption');
      expect(results[2].type).toBe('hashtags');

      // Verify monitoring for batch operation
      const totalProcessingTime = results.reduce((sum, r) => sum + r.metadata.processingTime, 0);
      
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/content/batch',
        method: 'POST',
        statusCode: 200,
        responseTime: totalProcessingTime,
        userId: authContext.userId,
        batchSize: batchRequests.length,
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/content/batch',
          batchSize: 3,
          responseTime: 1800, // 800 + 600 + 400
        })
      );
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from partial failures in batch operations', async () => {
      mockServices.contentGeneration.generateBatch.mockResolvedValue([
        {
          type: 'idea',
          success: true,
          data: { ideas: { ideas: [], recommendations: [], nextSteps: [] } },
          metadata: { processingTime: 800, confidence: 75, suggestions: [] },
        },
        {
          type: 'caption',
          success: false,
          data: {},
          metadata: { processingTime: 100, confidence: 0, suggestions: [] },
          error: 'AI service temporarily unavailable',
        },
        {
          type: 'hashtags',
          success: true,
          data: { hashtags: ['#fitness'] },
          metadata: { processingTime: 400, confidence: 85, suggestions: [] },
        },
      ]);

      const batchRequests = [
        { type: 'idea', context: {} },
        { type: 'caption', context: {} },
        { type: 'hashtags', context: {} },
      ];

      const authContext = await mockServices.auth.authenticate();
      const results = await mockServices.contentGeneration.generateBatch(batchRequests);

      // Verify partial success handling
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);

      // Verify error is properly captured
      expect(results[1].error).toBe('AI service temporarily unavailable');

      // Verify monitoring captures both successes and failures
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/content/batch',
        method: 'POST',
        statusCode: 207, // Multi-status for partial success
        responseTime: 1300,
        userId: authContext.userId,
        batchSize: 3,
        successCount: 2,
        failureCount: 1,
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 207,
          successCount: 2,
          failureCount: 1,
        })
      );
    });

    it('should handle circuit breaker activation', async () => {
      // Simulate circuit breaker open state
      mockServices.contentGeneration.generateContent.mockRejectedValue(
        new Error('Circuit breaker is open')
      );

      const authContext = await mockServices.auth.authenticate();
      
      try {
        await mockServices.contentGeneration.generateContent({
          type: 'idea',
          context: {},
        });
        expect.fail('Should have thrown circuit breaker error');
      } catch (error) {
        expect(error.message).toBe('Circuit breaker is open');
      }

      // Verify fallback monitoring
      mockServices.apiMonitoring.recordMetric({
        endpoint: '/api/content-ideas/generate',
        method: 'POST',
        statusCode: 503,
        responseTime: 50,
        errorType: 'CircuitBreakerOpenError',
        userId: authContext.userId,
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          errorType: 'CircuitBreakerOpenError',
        })
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-throughput scenarios efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
        type: 'idea',
        context: { creatorProfile: { id: `creator${i}`, niche: ['fitness'], contentTypes: ['video'], audiencePreferences: [], performanceHistory: { topPerformingContent: [], engagementPatterns: {}, revenueByCategory: {} }, currentGoals: [], constraints: { equipment: [], location: [], timeAvailability: '' } } },
      }));

      // Mock concurrent processing
      const promises = requests.map(async (request, index) => {
        mockServices.contentGeneration.generateContent.mockResolvedValueOnce({
          success: true,
          type: 'idea',
          data: { ideas: { ideas: [], recommendations: [], nextSteps: [] } },
          metadata: { processingTime: 500 + index * 10, confidence: 80, suggestions: [] },
        });

        return mockServices.contentGeneration.generateContent(request);
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Verify all requests completed successfully
      expect(results).toHaveLength(concurrentRequests);
      expect(results.every(r => r.success)).toBe(true);

      // Verify reasonable performance (should complete within 2 seconds)
      expect(totalTime).toBeLessThan(2000);

      // Verify monitoring captures performance metrics
      results.forEach((result, index) => {
        mockServices.apiMonitoring.recordMetric({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          statusCode: 200,
          responseTime: result.metadata.processingTime,
          userId: `creator${index}`,
          concurrentRequest: true,
        });
      });

      expect(mockServices.apiMonitoring.recordMetric).toHaveBeenCalledTimes(concurrentRequests);
    });
  });
});