import { test, expect } from '@playwright/test';

// Mock API responses for E2E tests
const mockAIResponses = {
  contentIdeas: {
    success: true,
    data: {
      ideas: [
        {
          id: 'idea-1',
          title: 'Morning Workout Motivation',
          contentType: 'photo',
          description: 'Capture your pre-workout energy with natural lighting',
          keyElements: ['workout gear', 'natural light', 'motivational pose'],
          targetAppeal: 'Fitness enthusiasts looking for morning inspiration',
          monetizationAngle: 'Offer exclusive workout plans as PPV content',
          productionNotes: 'Best shot during golden hour for optimal lighting',
          difficulty: 'easy',
          monetizationPotential: 85,
          trendAlignment: 78,
          estimatedEngagement: 92,
        },
        {
          id: 'idea-2',
          title: 'Behind-the-Scenes Content Creation',
          contentType: 'video',
          description: 'Show your creative process and setup',
          keyElements: ['camera setup', 'lighting equipment', 'creative process'],
          targetAppeal: 'Fans interested in your creative journey',
          monetizationAngle: 'Create premium behind-the-scenes subscription tier',
          productionNotes: 'Use multiple camera angles for dynamic footage',
          difficulty: 'medium',
          monetizationPotential: 75,
          trendAlignment: 65,
          estimatedEngagement: 88,
        },
      ],
      metadata: {
        totalIdeas: 2,
        contentTypes: ['photo', 'video'],
        creativityLevel: 'balanced',
        generatedAt: new Date().toISOString(),
        provider: 'openai',
        model: 'gpt-4o-mini',
      },
      recommendations: [
        'Start with "Morning Workout Motivation" - it\'s easy to create and has high monetization potential',
        'Consider creating a content calendar to plan implementation',
      ],
    },
  },
  messageGenerator: {
    success: true,
    data: {
      message: 'Hey Sarah! 😊 Thank you so much for being such an amazing VIP supporter! Your enthusiasm for my fitness content always brightens my day. I noticed you loved the behind-the-scenes stuff, so I have something special coming up just for you! Check out my new exclusive content! 💪✨',
      metadata: {
        fanName: 'Sarah',
        messageType: 'thank_you',
        tone: 'friendly',
        length: 234,
        provider: 'openai',
        model: 'gpt-4o-mini',
      },
      suggestions: [
        'Be specific about what you\'re thanking them for',
        'Share how their support helps you create better content',
        'Hint at upcoming content they might enjoy',
      ],
    },
  },
  pricingOptimizer: {
    success: true,
    data: {
      currentAnalysis: {
        currentPerformance: {
          conversionRate: 12,
          revenuePerSubscriber: 28,
          customerValue: 180,
          churnRisk: 'low',
        },
        marketPosition: {
          relativePrice: 'competitive',
          priceGap: '-16.7',
          marketPriceRange: { min: 15, max: 50 },
        },
        audienceInsights: {
          spendingCapacity: 'medium',
          priceElasticity: 'medium',
          segmentOpportunity: ['Premium tier opportunity for high spenders'],
        },
        riskAssessment: {
          priceIncreaseRisk: 'low',
          competitiveRisk: 'low',
          demandRisk: 'low',
        },
      },
      recommendations: {
        optimalPrice: 32,
        strategy: 'Tiered pricing with premium positioning',
        implementation: 'Week 1: Test $30 price point with A/B testing',
        expectedImpact: 'Revenue increase: 18-22%',
        risks: ['Gradual price increase to minimize churn'],
        testingPlan: 'A/B test with 20% of audience for 2 weeks',
      },
      pricingScenarios: [
        {
          name: 'Conservative Growth',
          price: 26.88,
          priceChange: 7.5,
          expectedImpact: {
            revenueChange: 5,
            conversionChange: -2,
            churnChange: 1,
          },
          riskLevel: 'low',
          description: 'Small price increase to test market response with minimal risk',
        },
        {
          name: 'Market Alignment',
          price: 30,
          priceChange: 20,
          expectedImpact: {
            revenueChange: 15,
            conversionChange: -5,
            churnChange: 3,
          },
          riskLevel: 'medium',
          description: 'Align with market pricing for better positioning',
        },
      ],
    },
  },
};

test.describe('AI Assistant Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@huntaze.com',
            name: 'Test Creator',
          },
        }),
      });
    });

    // Mock AI service availability
    await page.route('**/api/ai-assistant/generate', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              availableProviders: ['openai', 'claude'],
              providerStatus: {
                openai: true,
                claude: true,
                gemini: false,
              },
              defaultProvider: 'openai',
            },
          }),
        });
      }
    });
  });

  test.describe('Content Ideas Generation', () => {
    test('should generate and display content ideas', async ({ page }) => {
      // Mock content ideas API
      await page.route('**/api/ai-assistant/tools/content-ideas', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAIResponses.contentIdeas),
        });
      });

      // Navigate to AI assistant page
      await page.goto('/ai-assistant');
      
      // Wait for page to load
      await expect(page.locator('h1')).toContainText('AI Assistant');

      // Click on Content Ideas tool
      await page.click('[data-testid="content-ideas-tool"]');

      // Fill out the content ideas form
      await page.selectOption('[data-testid="content-types"]', ['photo', 'video']);
      await page.fill('[data-testid="themes-input"]', 'fitness, lifestyle');
      await page.selectOption('[data-testid="creativity-level"]', 'balanced');
      await page.fill('[data-testid="number-of-ideas"]', '2');

      // Add audience preferences
      await page.fill('[data-testid="audience-interests"]', 'fitness, wellness');
      await page.selectOption('[data-testid="spending-behavior"]', 'medium');

      // Add performance data
      await page.fill('[data-testid="top-content-title"]', 'Morning workout routine');
      await page.fill('[data-testid="top-content-engagement"]', '85');
      await page.fill('[data-testid="top-content-revenue"]', '150');

      // Generate ideas
      await page.click('[data-testid="generate-ideas-btn"]');

      // Wait for loading to complete
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();

      // Verify ideas are displayed
      await expect(page.locator('[data-testid="idea-card"]')).toHaveCount(2);

      // Check first idea details
      const firstIdea = page.locator('[data-testid="idea-card"]').first();
      await expect(firstIdea.locator('[data-testid="idea-title"]')).toContainText('Morning Workout Motivation');
      await expect(firstIdea.locator('[data-testid="idea-type"]')).toContainText('photo');
      await expect(firstIdea.locator('[data-testid="idea-difficulty"]')).toContainText('easy');

      // Check monetization potential indicator
      await expect(firstIdea.locator('[data-testid="monetization-score"]')).toContainText('85');

      // Check recommendations section
      await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendation-item"]')).toHaveCount(2);

      // Test idea interaction - expand details
      await firstIdea.click();
      await expect(firstIdea.locator('[data-testid="idea-description"]')).toBeVisible();
      await expect(firstIdea.locator('[data-testid="production-notes"]')).toContainText('golden hour');

      // Test save idea functionality
      await firstIdea.locator('[data-testid="save-idea-btn"]').click();
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Idea saved');
    });

    test('should handle content ideas generation errors', async ({ page }) => {
      // Mock API error
      await page.route('**/api/ai-assistant/tools/content-ideas', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'CONTENT_IDEAS_GENERATION_FAILED',
              message: 'Failed to generate content ideas',
            },
          }),
        });
      });

      await page.goto('/ai-assistant');
      await page.click('[data-testid="content-ideas-tool"]');

      // Fill minimal form and submit
      await page.selectOption('[data-testid="content-types"]', ['photo']);
      await page.click('[data-testid="generate-ideas-btn"]');

      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to generate content ideas');
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    });

    test('should validate form inputs', async ({ page }) => {
      await page.goto('/ai-assistant');
      await page.click('[data-testid="content-ideas-tool"]');

      // Try to submit without required fields
      await page.click('[data-testid="generate-ideas-btn"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Please select at least one content type');

      // Fill invalid number of ideas
      await page.selectOption('[data-testid="content-types"]', ['photo']);
      await page.fill('[data-testid="number-of-ideas"]', '25'); // Exceeds max

      await page.click('[data-testid="generate-ideas-btn"]');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Maximum 20 ideas allowed');
    });
  });

  test.describe('Message Generator', () => {
    test('should generate personalized fan messages', async ({ page }) => {
      // Mock message generator API
      await page.route('**/api/ai-assistant/tools/message-generator', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAIResponses.messageGenerator),
        });
      });

      await page.goto('/ai-assistant');
      await page.click('[data-testid="message-generator-tool"]');

      // Fill fan information
      await page.fill('[data-testid="fan-name"]', 'Sarah');
      await page.selectOption('[data-testid="subscription-tier"]', 'vip');
      await page.fill('[data-testid="total-spent"]', '250');
      await page.fill('[data-testid="last-active"]', '2024-01-15T10:00:00Z');

      // Add preferences and interactions
      await page.fill('[data-testid="fan-preferences"]', 'fitness content, behind-the-scenes');
      await page.fill('[data-testid="previous-interactions"]', 'Loved your workout video!');

      // Select message type and tone
      await page.selectOption('[data-testid="message-type"]', 'thank_you');
      await page.selectOption('[data-testid="tone"]', 'friendly');
      await page.check('[data-testid="include-emojis"]');

      // Set message length
      await page.fill('[data-testid="max-length"]', '200');

      // Add call to action
      await page.fill('[data-testid="call-to-action"]', 'Check out my new exclusive content!');

      // Generate message
      await page.click('[data-testid="generate-message-btn"]');

      // Wait for generation
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();

      // Verify generated message
      const messageOutput = page.locator('[data-testid="generated-message"]');
      await expect(messageOutput).toBeVisible();
      await expect(messageOutput).toContainText('Hey Sarah!');
      await expect(messageOutput).toContainText('VIP supporter');
      await expect(messageOutput).toContainText('😊');

      // Check message metadata
      await expect(page.locator('[data-testid="message-length"]')).toContainText('234');
      await expect(page.locator('[data-testid="message-provider"]')).toContainText('openai');

      // Verify suggestions are shown
      await expect(page.locator('[data-testid="suggestions-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="suggestion-item"]')).toHaveCount(3);

      // Test copy message functionality
      await page.click('[data-testid="copy-message-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Message copied');

      // Test regenerate functionality
      await page.click('[data-testid="regenerate-btn"]');
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });

    test('should handle different message types', async ({ page }) => {
      const messageTypes = ['greeting', 'upsell', 'ppv_offer', 'reactivation'];

      for (const messageType of messageTypes) {
        // Mock API response for each message type
        await page.route('**/api/ai-assistant/tools/message-generator', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...mockAIResponses.messageGenerator,
              data: {
                ...mockAIResponses.messageGenerator.data,
                message: `Generated ${messageType} message for testing`,
                metadata: {
                  ...mockAIResponses.messageGenerator.data.metadata,
                  messageType,
                },
              },
            }),
          });
        });

        await page.goto('/ai-assistant');
        await page.click('[data-testid="message-generator-tool"]');

        // Fill basic info
        await page.fill('[data-testid="fan-name"]', 'TestFan');
        await page.selectOption('[data-testid="subscription-tier"]', 'basic');
        await page.fill('[data-testid="total-spent"]', '50');
        await page.fill('[data-testid="last-active"]', '2024-01-10T15:00:00Z');

        // Select message type
        await page.selectOption('[data-testid="message-type"]', messageType);

        // Generate and verify
        await page.click('[data-testid="generate-message-btn"]');
        await expect(page.locator('[data-testid="generated-message"]')).toContainText(`Generated ${messageType} message`);
      }
    });
  });

  test.describe('Pricing Optimizer', () => {
    test('should generate pricing recommendations', async ({ page }) => {
      // Mock pricing optimizer API
      await page.route('**/api/ai-assistant/tools/pricing-optimizer', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAIResponses.pricingOptimizer),
        });
      });

      await page.goto('/ai-assistant');
      await page.click('[data-testid="pricing-optimizer-tool"]');

      // Fill current pricing info
      await page.selectOption('[data-testid="content-type"]', 'ppv');
      await page.fill('[data-testid="current-price"]', '25');
      await page.selectOption('[data-testid="currency"]', 'USD');

      // Fill audience data
      await page.fill('[data-testid="total-subscribers"]', '1500');
      await page.fill('[data-testid="active-subscribers"]', '1200');
      await page.fill('[data-testid="average-spending"]', '75');

      // Set spending distribution
      await page.fill('[data-testid="low-spenders"]', '40');
      await page.fill('[data-testid="medium-spenders"]', '35');
      await page.fill('[data-testid="high-spenders"]', '25');

      // Fill performance metrics
      await page.fill('[data-testid="conversion-rate"]', '12');
      await page.fill('[data-testid="average-order-value"]', '28');
      await page.fill('[data-testid="customer-lifetime-value"]', '180');
      await page.fill('[data-testid="churn-rate"]', '8');

      // Add competitor data
      await page.fill('[data-testid="market-average-price"]', '30');
      await page.fill('[data-testid="price-range-min"]', '15');
      await page.fill('[data-testid="price-range-max"]', '50');

      // Set goals
      await page.selectOption('[data-testid="primary-goal"]', 'maximize_revenue');
      await page.fill('[data-testid="target-increase"]', '20');
      await page.selectOption('[data-testid="timeframe"]', 'short_term');

      // Generate recommendations
      await page.click('[data-testid="optimize-pricing-btn"]');

      // Wait for analysis
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();

      // Verify current analysis section
      const analysisSection = page.locator('[data-testid="current-analysis"]');
      await expect(analysisSection).toBeVisible();
      await expect(analysisSection.locator('[data-testid="conversion-rate"]')).toContainText('12');
      await expect(analysisSection.locator('[data-testid="churn-risk"]')).toContainText('low');
      await expect(analysisSection.locator('[data-testid="market-position"]')).toContainText('competitive');

      // Verify recommendations section
      const recommendationsSection = page.locator('[data-testid="recommendations"]');
      await expect(recommendationsSection).toBeVisible();
      await expect(recommendationsSection.locator('[data-testid="optimal-price"]')).toContainText('$32');
      await expect(recommendationsSection.locator('[data-testid="strategy"]')).toContainText('Tiered pricing');
      await expect(recommendationsSection.locator('[data-testid="expected-impact"]')).toContainText('18-22%');

      // Verify pricing scenarios
      const scenariosSection = page.locator('[data-testid="pricing-scenarios"]');
      await expect(scenariosSection).toBeVisible();
      await expect(scenariosSection.locator('[data-testid="scenario-card"]')).toHaveCount(2);

      // Check scenario details
      const firstScenario = scenariosSection.locator('[data-testid="scenario-card"]').first();
      await expect(firstScenario.locator('[data-testid="scenario-name"]')).toContainText('Conservative Growth');
      await expect(firstScenario.locator('[data-testid="scenario-price"]')).toContainText('$26.88');
      await expect(firstScenario.locator('[data-testid="risk-level"]')).toContainText('low');

      // Test scenario selection
      await firstScenario.click();
      await expect(firstScenario.locator('[data-testid="scenario-details"]')).toBeVisible();
      await expect(firstScenario.locator('[data-testid="revenue-change"]')).toContainText('5%');

      // Test implementation plan
      await page.click('[data-testid="create-implementation-plan"]');
      await expect(page.locator('[data-testid="implementation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="implementation-steps"]')).toContainText('Week 1');
    });

    test('should handle different optimization goals', async ({ page }) => {
      const goals = ['maximize_revenue', 'increase_subscribers', 'improve_retention'];

      for (const goal of goals) {
        // Mock API response for each goal
        await page.route('**/api/ai-assistant/tools/pricing-optimizer', async (route) => {
          const scenarios = goal === 'increase_subscribers' 
            ? [
                ...mockAIResponses.pricingOptimizer.data.pricingScenarios,
                {
                  name: 'Volume Growth',
                  price: 21.25,
                  priceChange: -15,
                  expectedImpact: {
                    revenueChange: -5,
                    conversionChange: 25,
                    churnChange: -5,
                  },
                  riskLevel: 'low',
                  description: 'Lower price to attract more subscribers',
                },
              ]
            : mockAIResponses.pricingOptimizer.data.pricingScenarios;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...mockAIResponses.pricingOptimizer,
              data: {
                ...mockAIResponses.pricingOptimizer.data,
                pricingScenarios: scenarios,
              },
            }),
          });
        });

        await page.goto('/ai-assistant');
        await page.click('[data-testid="pricing-optimizer-tool"]');

        // Fill minimal required data
        await page.selectOption('[data-testid="content-type"]', 'subscription');
        await page.fill('[data-testid="current-price"]', '15');
        await page.fill('[data-testid="total-subscribers"]', '1000');
        await page.fill('[data-testid="active-subscribers"]', '800');
        await page.fill('[data-testid="average-spending"]', '50');
        await page.fill('[data-testid="conversion-rate"]', '10');
        await page.fill('[data-testid="churn-rate"]', '12');

        // Set specific goal
        await page.selectOption('[data-testid="primary-goal"]', goal);

        // Generate and verify goal-specific scenarios
        await page.click('[data-testid="optimize-pricing-btn"]');
        await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();

        if (goal === 'increase_subscribers') {
          await expect(page.locator('[data-testid="scenario-card"]')).toHaveCount(3);
          await expect(page.locator('[data-testid="scenario-name"]')).toContainText('Volume Growth');
        }
      }
    });
  });

  test.describe('AI Assistant Integration', () => {
    test('should handle provider switching', async ({ page }) => {
      // Mock provider status
      await page.route('**/api/ai-assistant/generate', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                availableProviders: ['openai', 'claude'],
                providerStatus: {
                  openai: true,
                  claude: true,
                  gemini: false,
                },
                defaultProvider: 'openai',
              },
            }),
          });
        }
      });

      await page.goto('/ai-assistant');

      // Check provider status indicator
      await expect(page.locator('[data-testid="provider-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="openai-status"]')).toHaveClass(/available/);
      await expect(page.locator('[data-testid="claude-status"]')).toHaveClass(/available/);
      await expect(page.locator('[data-testid="gemini-status"]')).toHaveClass(/unavailable/);

      // Test provider switching
      await page.click('[data-testid="provider-selector"]');
      await page.selectOption('[data-testid="provider-selector"]', 'claude');

      // Verify provider change is reflected
      await expect(page.locator('[data-testid="current-provider"]')).toContainText('claude');
    });

    test('should handle rate limiting gracefully', async ({ page }) => {
      // Mock rate limit error
      await page.route('**/api/ai-assistant/tools/content-ideas', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded. Try again in 30 seconds.',
            },
          }),
        });
      });

      await page.goto('/ai-assistant');
      await page.click('[data-testid="content-ideas-tool"]');

      // Fill form and submit
      await page.selectOption('[data-testid="content-types"]', ['photo']);
      await page.click('[data-testid="generate-ideas-btn"]');

      // Verify rate limit handling
      await expect(page.locator('[data-testid="rate-limit-message"]')).toContainText('Rate limit exceeded');
      await expect(page.locator('[data-testid="retry-countdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="generate-ideas-btn"]')).toBeDisabled();
    });

    test('should save and load user preferences', async ({ page }) => {
      await page.goto('/ai-assistant');

      // Set preferences
      await page.selectOption('[data-testid="default-provider"]', 'claude');
      await page.selectOption('[data-testid="default-creativity"]', 'innovative');
      await page.check('[data-testid="auto-save-results"]');

      // Save preferences
      await page.click('[data-testid="save-preferences-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Preferences saved');

      // Reload page and verify preferences persist
      await page.reload();
      await expect(page.locator('[data-testid="default-provider"]')).toHaveValue('claude');
      await expect(page.locator('[data-testid="default-creativity"]')).toHaveValue('innovative');
      await expect(page.locator('[data-testid="auto-save-results"]')).toBeChecked();
    });

    test('should track usage and show limits', async ({ page }) => {
      await page.goto('/ai-assistant');

      // Check usage indicator
      await expect(page.locator('[data-testid="usage-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="requests-used"]')).toContainText(/\d+/);
      await expect(page.locator('[data-testid="requests-remaining"]')).toContainText(/\d+/);

      // Check usage details
      await page.click('[data-testid="usage-details-btn"]');
      await expect(page.locator('[data-testid="usage-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="daily-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="monthly-usage"]')).toBeVisible();
    });
  });

  test.describe('Accessibility and Performance', () => {
    test('should be accessible', async ({ page }) => {
      await page.goto('/ai-assistant');

      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toHaveCount.greaterThan(0);

      // Check for proper form labels
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        if (id) {
          await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
        }
      }

      // Check for proper ARIA attributes
      await expect(page.locator('[role="button"]')).toHaveCount.greaterThan(0);
      await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0);
    });

    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/ai-assistant');
      await expect(page.locator('h1')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/ai-assistant');

      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Test Enter key on buttons
      await page.focus('[data-testid="content-ideas-tool"]');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="content-ideas-form"]')).toBeVisible();

      // Test Escape key to close modals
      await page.keyboard.press('Escape');
      // Should close any open modals or return to main view
    });
  });
});