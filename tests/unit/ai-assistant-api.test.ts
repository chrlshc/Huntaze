import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generateAI, GET as getProviders } from '@/app/api/ai-assistant/generate/route';
import { POST as generateContentIdeas } from '@/app/api/ai-assistant/tools/content-ideas/route';
import { POST as generateMessage } from '@/app/api/ai-assistant/tools/message-generator/route';
import { POST as optimizePricing } from '@/app/api/ai-assistant/tools/pricing-optimizer/route';

// Mock dependencies
vi.mock('@/lib/server-auth', () => ({
  getServerAuth: vi.fn(),
}));

vi.mock('@/lib/services/ai-service', () => ({
  getAIService: vi.fn(),
  AIRequestSchema: {
    extend: vi.fn(() => ({
      safeParse: vi.fn(),
    })),
  },
}));

vi.mock('@/lib/services/sse-events', () => ({
  ContentCreationEventEmitter: {
    emitAIInsight: vi.fn(),
  },
}));

vi.mock('@/src/lib/http/errors', () => ({
  withErrorHandling: vi.fn((handler) => handler),
  jsonError: vi.fn((code, message, status, details) => 
    Response.json({ success: false, error: { code, message, details } }, { status })
  ),
}));

describe('AI Assistant API Routes', () => {
  let mockAuth: any;
  let mockAIService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAuth = {
      user: {
        id: 'user-123',
        email: 'test@huntaze.com',
        name: 'Test User',
      },
    };

    mockAIService = {
      generateText: vi.fn(),
      getAvailableProviders: vi.fn(),
      getProviderStatus: vi.fn(),
    };

    vi.mocked(require('@/lib/server-auth').getServerAuth).mockResolvedValue(mockAuth);
    vi.mocked(require('@/lib/services/ai-service').getAIService).mockReturnValue(mockAIService);
  });

  describe('AI Generate Route', () => {
    describe('POST /api/ai-assistant/generate', () => {
      it('should generate AI content successfully', async () => {
        const requestBody = {
          prompt: 'Generate a creative caption for my photo',
          context: {
            userId: 'user-123',
            contentType: 'caption',
            metadata: { platform: 'instagram' },
          },
          options: {
            temperature: 0.7,
            maxTokens: 150,
          },
          provider: 'openai',
          saveToHistory: true,
        };

        const mockAIResponse = {
          content: 'Stunning sunset vibes ✨ Living my best life! #sunset #mood',
          usage: {
            promptTokens: 25,
            completionTokens: 15,
            totalTokens: 40,
          },
          model: 'gpt-4o-mini',
          provider: 'openai',
          finishReason: 'stop',
        };

        // Mock schema validation
        const mockSchema = {
          safeParse: vi.fn().mockReturnValue({
            success: true,
            data: requestBody,
          }),
        };
        vi.mocked(require('@/lib/services/ai-service').AIRequestSchema.extend).mockReturnValue(mockSchema);

        mockAIService.generateText.mockResolvedValue(mockAIResponse);

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/generate', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateAI(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toMatchObject({
          content: mockAIResponse.content,
          provider: 'openai',
          model: 'gpt-4o-mini',
          usage: mockAIResponse.usage,
          finishReason: 'stop',
          contentType: 'caption',
        });

        expect(mockAIService.generateText).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: requestBody.prompt,
            context: expect.objectContaining({
              userId: 'user-123',
              contentType: 'caption',
            }),
          }),
          'openai'
        );

        expect(require('@/lib/services/sse-events').ContentCreationEventEmitter.emitAIInsight)
          .toHaveBeenCalledWith('user-123', expect.objectContaining({
            type: 'caption',
            title: 'AI Generated Content',
            content: mockAIResponse.content,
          }));
      });

      it('should handle validation errors', async () => {
        const invalidRequestBody = {
          prompt: '', // Invalid: empty prompt
          context: {},
        };

        const mockSchema = {
          safeParse: vi.fn().mockReturnValue({
            success: false,
            error: {
              errors: [
                { path: ['prompt'], message: 'String must contain at least 1 character(s)' },
              ],
            },
          }),
        };
        vi.mocked(require('@/lib/services/ai-service').AIRequestSchema.extend).mockReturnValue(mockSchema);

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/generate', {
          method: 'POST',
          body: JSON.stringify(invalidRequestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateAI(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle rate limit errors', async () => {
        const requestBody = {
          prompt: 'Test prompt',
          context: { userId: 'user-123' },
          options: {},
        };

        const mockSchema = {
          safeParse: vi.fn().mockReturnValue({
            success: true,
            data: requestBody,
          }),
        };
        vi.mocked(require('@/lib/services/ai-service').AIRequestSchema.extend).mockReturnValue(mockSchema);

        mockAIService.generateText.mockRejectedValue(
          new Error('Rate limit exceeded. Try again in 30 seconds.')
        );

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/generate', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateAI(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      });

      it('should handle AI service errors', async () => {
        const requestBody = {
          prompt: 'Test prompt',
          context: { userId: 'user-123' },
          options: {},
        };

        const mockSchema = {
          safeParse: vi.fn().mockReturnValue({
            success: true,
            data: requestBody,
          }),
        };
        vi.mocked(require('@/lib/services/ai-service').AIRequestSchema.extend).mockReturnValue(mockSchema);

        mockAIService.generateText.mockRejectedValue(
          new Error('OpenAI API error: Invalid API key')
        );

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/generate', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateAI(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error.code).toBe('AI_SERVICE_ERROR');
      });

      it('should require authentication', async () => {
        vi.mocked(require('@/lib/server-auth').getServerAuth).mockResolvedValue({ user: null });

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/generate', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await generateAI(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });
    });

    describe('GET /api/ai-assistant/generate', () => {
      it('should return available providers', async () => {
        mockAIService.getAvailableProviders.mockResolvedValue(['openai', 'claude']);
        mockAIService.getProviderStatus.mockReturnValue({
          openai: true,
          claude: true,
          gemini: false,
        });

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/generate');

        const response = await getProviders(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toMatchObject({
          availableProviders: ['openai', 'claude'],
          providerStatus: {
            openai: true,
            claude: true,
            gemini: false,
          },
          defaultProvider: expect.any(String),
        });
      });
    });
  });

  describe('Content Ideas Route', () => {
    describe('POST /api/ai-assistant/tools/content-ideas', () => {
      it('should generate content ideas successfully', async () => {
        const requestBody = {
          contentTypes: ['photo', 'video'],
          themes: ['fitness', 'lifestyle'],
          targetAudience: {
            demographics: {
              interests: ['fitness', 'wellness'],
              spendingBehavior: 'medium',
            },
            preferences: ['high-quality content'],
          },
          performanceData: {
            topPerformingContent: [
              {
                type: 'photo',
                title: 'Morning workout routine',
                engagement: 85,
                revenue: 150,
                tags: ['fitness', 'morning'],
              },
            ],
            trends: [
              { keyword: 'wellness', growth: 15, relevance: 90 },
            ],
          },
          numberOfIdeas: 3,
          creativityLevel: 'balanced',
        };

        const mockAIResponse = {
          content: `1. Title: "Sunrise Yoga Flow"
Content type: photo
Description: Capture a serene morning yoga session with golden hour lighting
Key elements: Yoga mat, sunrise backdrop, flowing poses
Target audience appeal: Appeals to wellness enthusiasts seeking morning inspiration
Monetization angle: Offer exclusive morning routine guide as PPV content
Production notes: Best shot during golden hour, use natural lighting

2. Title: "Healthy Meal Prep Sunday"
Content type: video
Description: Time-lapse of preparing nutritious meals for the week
Key elements: Fresh ingredients, meal containers, kitchen setup
Target audience appeal: Busy professionals wanting healthy lifestyle tips
Monetization angle: Create premium meal plan subscription service
Production notes: Use overhead camera angle, good kitchen lighting

3. Title: "Fitness Journey Transformation"
Content type: photo
Description: Before/after style content showing fitness progress
Key elements: Progress photos, workout gear, motivational quotes
Target audience appeal: Inspires followers on their own fitness journeys
Monetization angle: Offer personalized workout plans and coaching
Production notes: Consistent lighting and poses for comparison shots`,
          usage: { promptTokens: 150, completionTokens: 200, totalTokens: 350 },
          model: 'gpt-4o-mini',
          provider: 'openai',
          finishReason: 'stop',
        };

        mockAIService.generateText.mockResolvedValue(mockAIResponse);

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/content-ideas', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateContentIdeas(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.ideas).toHaveLength(3);
        
        const firstIdea = data.data.ideas[0];
        expect(firstIdea).toMatchObject({
          id: expect.stringContaining('idea-'),
          title: 'Sunrise Yoga Flow',
          contentType: 'photo',
          description: expect.stringContaining('serene morning yoga'),
          difficulty: expect.any(String),
          monetizationPotential: expect.any(Number),
          trendAlignment: expect.any(Number),
          estimatedEngagement: expect.any(Number),
        });

        expect(data.data.metadata).toMatchObject({
          totalIdeas: 3,
          contentTypes: ['photo', 'video'],
          creativityLevel: 'balanced',
          provider: 'openai',
        });

        expect(data.data.recommendations).toBeInstanceOf(Array);
      });

      it('should validate content ideas request', async () => {
        const invalidRequestBody = {
          contentTypes: [], // Invalid: empty array
          numberOfIdeas: 25, // Invalid: exceeds max
        };

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/content-ideas', {
          method: 'POST',
          body: JSON.stringify(invalidRequestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateContentIdeas(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle different creativity levels', async () => {
        const creativityLevels = ['conservative', 'balanced', 'innovative'];

        for (const level of creativityLevels) {
          const requestBody = {
            contentTypes: ['photo'],
            numberOfIdeas: 1,
            creativityLevel: level,
          };

          mockAIService.generateText.mockResolvedValue({
            content: '1. Title: Test Idea\nContent type: photo\nDescription: Test description',
            usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
            model: 'gpt-4o-mini',
            provider: 'openai',
            finishReason: 'stop',
          });

          const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/content-ideas', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' },
          });

          await generateContentIdeas(request);

          // Verify temperature is adjusted based on creativity level
          const lastCall = mockAIService.generateText.mock.calls[mockAIService.generateText.mock.calls.length - 1];
          const options = lastCall[0].options;

          switch (level) {
            case 'conservative':
              expect(options.temperature).toBe(0.5);
              break;
            case 'balanced':
              expect(options.temperature).toBe(0.7);
              break;
            case 'innovative':
              expect(options.temperature).toBe(0.9);
              break;
          }
        }
      });
    });
  });

  describe('Message Generator Route', () => {
    describe('POST /api/ai-assistant/tools/message-generator', () => {
      it('should generate personalized message successfully', async () => {
        const requestBody = {
          fanName: 'Sarah',
          fanProfile: {
            subscriptionTier: 'vip',
            totalSpent: 250,
            lastActive: '2024-01-15T10:00:00Z',
            preferences: ['fitness content', 'behind-the-scenes'],
            previousInteractions: ['Loved your workout video!', 'Thanks for the motivation'],
          },
          messageType: 'thank_you',
          tone: 'friendly',
          includeEmojis: true,
          maxLength: 200,
          callToAction: 'Check out my new exclusive content!',
        };

        const mockAIResponse = {
          content: 'Hey Sarah! 😊 Thank you so much for being such an amazing VIP supporter! Your enthusiasm for my fitness content always brightens my day. I noticed you loved the behind-the-scenes stuff, so I have something special coming up just for you! Check out my new exclusive content! 💪✨',
          usage: { promptTokens: 80, completionTokens: 45, totalTokens: 125 },
          model: 'gpt-4o-mini',
          provider: 'openai',
          finishReason: 'stop',
        };

        mockAIService.generateText.mockResolvedValue(mockAIResponse);

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/message-generator', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateMessage(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toMatchObject({
          message: mockAIResponse.content,
          metadata: {
            fanName: 'Sarah',
            messageType: 'thank_you',
            tone: 'friendly',
            length: mockAIResponse.content.length,
            provider: 'openai',
            model: 'gpt-4o-mini',
          },
          usage: mockAIResponse.usage,
          suggestions: expect.arrayContaining([
            expect.stringContaining('specific about what you\'re thanking'),
          ]),
        });

        // Verify AI service was called with correct parameters
        expect(mockAIService.generateText).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              userId: 'user-123',
              contentType: 'message',
              metadata: expect.objectContaining({
                fanName: 'Sarah',
                messageType: 'thank_you',
                tone: 'friendly',
                subscriptionTier: 'vip',
              }),
            }),
            options: expect.objectContaining({
              temperature: 0.8,
              maxTokens: 300, // 200 * 1.5
            }),
          })
        );
      });

      it('should validate message generator request', async () => {
        const invalidRequestBody = {
          fanName: '', // Invalid: empty name
          fanProfile: {
            subscriptionTier: 'invalid-tier', // Invalid: not in enum
            totalSpent: -10, // Invalid: negative
            lastActive: 'invalid-date', // Invalid: not datetime
          },
          messageType: 'invalid-type', // Invalid: not in enum
          maxLength: 25, // Invalid: below minimum
        };

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/message-generator', {
          method: 'POST',
          body: JSON.stringify(invalidRequestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await generateMessage(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should handle different message types and tones', async () => {
        const testCases = [
          { messageType: 'greeting', tone: 'friendly' },
          { messageType: 'upsell', tone: 'professional' },
          { messageType: 'ppv_offer', tone: 'flirty' },
          { messageType: 'reactivation', tone: 'playful' },
        ];

        for (const testCase of testCases) {
          const requestBody = {
            fanName: 'Alex',
            fanProfile: {
              subscriptionTier: 'basic',
              totalSpent: 50,
              lastActive: '2024-01-10T15:00:00Z',
              preferences: [],
              previousInteractions: [],
            },
            messageType: testCase.messageType,
            tone: testCase.tone,
            includeEmojis: true,
            maxLength: 150,
          };

          mockAIService.generateText.mockResolvedValue({
            content: `Generated ${testCase.messageType} message with ${testCase.tone} tone`,
            usage: { promptTokens: 40, completionTokens: 20, totalTokens: 60 },
            model: 'gpt-4o-mini',
            provider: 'openai',
            finishReason: 'stop',
          });

          const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/message-generator', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' },
          });

          const response = await generateMessage(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.data.metadata.messageType).toBe(testCase.messageType);
          expect(data.data.metadata.tone).toBe(testCase.tone);
        }
      });
    });
  });

  describe('Pricing Optimizer Route', () => {
    describe('POST /api/ai-assistant/tools/pricing-optimizer', () => {
      it('should generate pricing recommendations successfully', async () => {
        const requestBody = {
          contentType: 'ppv',
          currentPricing: {
            basePrice: 25.00,
            currency: 'USD',
            billingCycle: 'one_time',
          },
          audienceData: {
            totalSubscribers: 1500,
            activeSubscribers: 1200,
            averageSpending: 75,
            spendingDistribution: {
              low: 40,
              medium: 35,
              high: 25,
            },
            demographics: {
              primaryAgeRange: '25-35',
              disposableIncomeLevel: 'medium',
            },
          },
          performanceMetrics: {
            conversionRate: 12,
            averageOrderValue: 28,
            customerLifetimeValue: 180,
            churnRate: 8,
            recentSales: [
              { price: 25, date: '2024-01-10T10:00:00Z', contentType: 'ppv', success: true },
              { price: 30, date: '2024-01-12T14:00:00Z', contentType: 'ppv', success: false },
            ],
          },
          competitorData: {
            averageMarketPrice: 30,
            priceRange: { min: 15, max: 50 },
            topPerformers: [
              { price: 35, engagement: 90, contentQuality: 'high' },
            ],
          },
          goals: {
            primaryGoal: 'maximize_revenue',
            targetIncrease: 20,
            timeframe: 'short_term',
          },
          constraints: {
            minPrice: 20,
            maxPrice: 40,
          },
        };

        const mockAIResponse = {
          content: `Optimal Price Point: $32.00

Based on your current performance and market analysis, I recommend increasing your PPV price to $32.00. This represents a 28% increase that aligns with market positioning while maximizing revenue potential.

Pricing Strategy: Tiered pricing with premium positioning
- Standard PPV: $32.00
- Bundle deals: 3 for $85 (11% discount)
- VIP exclusive: $38.00 with bonus content

Implementation Timeline:
- Week 1: Test $30 price point with A/B testing
- Week 2-3: Analyze conversion data and adjust
- Week 4: Full rollout to $32 if metrics support

Expected Impact:
- Revenue increase: 18-22%
- Conversion rate: May decrease 3-5% initially
- Customer lifetime value: Expected 15% increase

Risk Mitigation:
- Gradual price increase to minimize churn
- Enhanced content quality to justify premium pricing
- Loyalty program for existing high-value customers`,
          usage: { promptTokens: 200, completionTokens: 180, totalTokens: 380 },
          model: 'gpt-4o-mini',
          provider: 'openai',
          finishReason: 'stop',
        };

        mockAIService.generateText.mockResolvedValue(mockAIResponse);

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/pricing-optimizer', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await optimizePricing(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        expect(data.data.currentAnalysis).toMatchObject({
          currentPerformance: expect.objectContaining({
            conversionRate: 12,
            churnRisk: 'low',
          }),
          marketPosition: expect.objectContaining({
            relativePrice: expect.any(String),
            priceGap: expect.any(String),
          }),
          audienceInsights: expect.objectContaining({
            spendingCapacity: expect.any(String),
            priceElasticity: expect.any(String),
          }),
          riskAssessment: expect.objectContaining({
            priceIncreaseRisk: expect.any(String),
            competitiveRisk: expect.any(String),
            demandRisk: expect.any(String),
          }),
        });

        expect(data.data.recommendations).toMatchObject({
          optimalPrice: 32,
          strategy: expect.stringContaining('Tiered pricing'),
          implementation: expect.stringContaining('Week 1'),
          expectedImpact: expect.stringContaining('Revenue increase'),
        });

        expect(data.data.pricingScenarios).toBeInstanceOf(Array);
        expect(data.data.pricingScenarios.length).toBeGreaterThan(0);

        const scenario = data.data.pricingScenarios[0];
        expect(scenario).toMatchObject({
          name: expect.any(String),
          price: expect.any(Number),
          priceChange: expect.any(Number),
          expectedImpact: expect.objectContaining({
            revenueChange: expect.any(Number),
            conversionChange: expect.any(Number),
            churnChange: expect.any(Number),
          }),
          riskLevel: expect.any(String),
          description: expect.any(String),
        });

        // Verify AI service was called with analytical temperature
        expect(mockAIService.generateText).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              temperature: 0.3, // Lower temperature for analytical responses
              maxTokens: 1500,
            }),
          })
        );
      });

      it('should validate pricing optimizer request', async () => {
        const invalidRequestBody = {
          contentType: 'invalid-type', // Invalid: not in enum
          currentPricing: {
            basePrice: -10, // Invalid: negative price
          },
          audienceData: {
            totalSubscribers: -5, // Invalid: negative
            activeSubscribers: 2000, // Invalid: more than total
            averageSpending: -20, // Invalid: negative
            spendingDistribution: {
              low: 50,
              medium: 30,
              high: 30, // Invalid: total > 100%
            },
          },
          performanceMetrics: {
            conversionRate: 150, // Invalid: > 100%
            averageOrderValue: -5, // Invalid: negative
            customerLifetimeValue: -10, // Invalid: negative
            churnRate: 120, // Invalid: > 100%
          },
          goals: {
            primaryGoal: 'invalid-goal', // Invalid: not in enum
            targetIncrease: 600, // Invalid: > 500%
          },
        };

        const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/pricing-optimizer', {
          method: 'POST',
          body: JSON.stringify(invalidRequestBody),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await optimizePricing(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should generate different scenarios based on goals', async () => {
        const goals = ['maximize_revenue', 'increase_subscribers', 'improve_retention'];

        for (const goal of goals) {
          const requestBody = {
            contentType: 'subscription',
            currentPricing: { basePrice: 15, currency: 'USD' },
            audienceData: {
              totalSubscribers: 1000,
              activeSubscribers: 800,
              averageSpending: 50,
              spendingDistribution: { low: 50, medium: 30, high: 20 },
            },
            performanceMetrics: {
              conversionRate: 10,
              averageOrderValue: 20,
              customerLifetimeValue: 120,
              churnRate: 12,
            },
            goals: { primaryGoal: goal, timeframe: 'short_term' },
          };

          mockAIService.generateText.mockResolvedValue({
            content: `Recommendations for ${goal}`,
            usage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
            model: 'gpt-4o-mini',
            provider: 'openai',
            finishReason: 'stop',
          });

          const request = new NextRequest('http://localhost:3000/api/ai-assistant/tools/pricing-optimizer', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' },
          });

          const response = await optimizePricing(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.data.metadata.goal).toBe(goal);

          // Check that scenarios are appropriate for the goal
          if (goal === 'increase_subscribers') {
            const volumeScenario = data.data.pricingScenarios.find(
              (s: any) => s.name === 'Volume Growth'
            );
            expect(volumeScenario).toBeDefined();
            expect(volumeScenario.priceChange).toBeLessThan(0); // Price decrease
          }
        }
      });
    });
  });

  describe('Authentication and Error Handling', () => {
    it('should require authentication for all routes', async () => {
      vi.mocked(require('@/lib/server-auth').getServerAuth).mockResolvedValue({ user: null });

      const routes = [
        { handler: generateAI, path: '/api/ai-assistant/generate' },
        { handler: generateContentIdeas, path: '/api/ai-assistant/tools/content-ideas' },
        { handler: generateMessage, path: '/api/ai-assistant/tools/message-generator' },
        { handler: optimizePricing, path: '/api/ai-assistant/tools/pricing-optimizer' },
      ];

      for (const route of routes) {
        const request = new NextRequest(`http://localhost:3000${route.path}`, {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await route.handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should handle AI service failures gracefully', async () => {
      const routes = [
        { 
          handler: generateAI, 
          body: { 
            prompt: 'test', 
            context: { userId: 'user-123' }, 
            options: {} 
          } 
        },
        { 
          handler: generateContentIdeas, 
          body: { 
            contentTypes: ['photo'], 
            numberOfIdeas: 1 
          } 
        },
        { 
          handler: generateMessage, 
          body: { 
            fanName: 'Test', 
            fanProfile: { 
              subscriptionTier: 'basic', 
              totalSpent: 0, 
              lastActive: '2024-01-01T00:00:00Z' 
            }, 
            messageType: 'greeting' 
          } 
        },
        { 
          handler: optimizePricing, 
          body: { 
            contentType: 'ppv', 
            currentPricing: { basePrice: 25 }, 
            audienceData: { 
              totalSubscribers: 100, 
              activeSubscribers: 80, 
              averageSpending: 50, 
              spendingDistribution: { low: 50, medium: 30, high: 20 } 
            }, 
            performanceMetrics: { 
              conversionRate: 10, 
              averageOrderValue: 25, 
              customerLifetimeValue: 100, 
              churnRate: 10 
            }, 
            goals: { primaryGoal: 'maximize_revenue' } 
          } 
        },
      ];

      mockAIService.generateText.mockRejectedValue(new Error('AI service unavailable'));

      for (const route of routes) {
        const request = new NextRequest('http://localhost:3000/test', {
          method: 'POST',
          body: JSON.stringify(route.body),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await route.handler(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toMatch(/_FAILED$/);
      }
    });
  });
});