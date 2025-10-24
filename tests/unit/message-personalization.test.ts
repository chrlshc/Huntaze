import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getMessagePersonalizationService, 
  MessagePersonalizationService,
  FanProfile,
  MessageTemplate 
} from '@/lib/services/message-personalization';

// Mock AI service
const mockAIService = {
  generateText: vi.fn(),
};

vi.mock('@/lib/services/ai-service', () => ({
  getAIService: () => mockAIService,
}));

describe('MessagePersonalizationService', () => {
  let service: MessagePersonalizationService;
  let mockFanProfile: FanProfile;

  beforeEach(() => {
    service = new MessagePersonalizationService();
    mockFanProfile = {
      id: 'fan-123',
      name: 'John Doe',
      subscriptionTier: 'vip',
      totalSpent: 250,
      lastActive: new Date('2024-01-15'),
      averageSessionDuration: 1800,
      preferredContentTypes: ['photos', 'videos'],
      interactionHistory: [
        {
          type: 'message',
          content: 'Love your content!',
          timestamp: new Date('2024-01-10'),
        },
        {
          type: 'tip',
          amount: 50,
          timestamp: new Date('2024-01-12'),
        },
      ],
      demographics: {
        timezone: 'America/New_York',
        language: 'en',
        estimatedAge: 28,
      },
      behaviorMetrics: {
        responseRate: 75,
        averageSpendPerSession: 25,
        contentEngagementRate: 80,
        loyaltyScore: 85,
      },
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePersonalizedMessage', () => {
    it('should generate personalized greeting message', async () => {
      const result = await service.generatePersonalizedMessage(
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

    it('should use template for message generation', async () => {
      const result = await service.generatePersonalizedMessage(
        mockFanProfile,
        'greeting',
        { tone: 'friendly' }
      );

      expect(result.template).toBeDefined();
      expect(result.template?.category).toBe('greeting');
      expect(result.message).toContain(mockFanProfile.name);
    });

    it('should generate fresh AI message when no template matches', async () => {
      mockAIService.generateText.mockResolvedValue({
        content: 'Hey John! Welcome to my exclusive content. What would you like to see first? 😘',
        usage: { totalTokens: 50 },
      });

      // Force fresh generation by mocking Math.random to return > 0.7
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.8);

      const result = await service.generatePersonalizedMessage(
        mockFanProfile,
        'greeting',
        { tone: 'flirty' }
      );

      expect(result.template).toBeUndefined();
      expect(result.message).toBeTruthy();
      expect(result.personalizationScore).toBe(85); // Fresh AI generation score

      Math.random = originalRandom;
    });

    it('should handle different message types', async () => {
      const messageTypes: MessageTemplate['category'][] = [
        'greeting', 'upsell', 'ppv_offer', 'reactivation', 'thank_you'
      ];

      for (const type of messageTypes) {
        const result = await service.generatePersonalizedMessage(
          mockFanProfile,
          type,
          { tone: 'friendly' }
        );

        expect(result.message).toBeTruthy();
        expect(result.personalizationScore).toBeGreaterThan(0);
      }
    });

    it('should adjust tone when requested', async () => {
      mockAIService.generateText.mockResolvedValue({
        content: 'Hey gorgeous! 😍 Welcome to my world!',
        usage: { totalTokens: 30 },
      });

      const result = await service.generatePersonalizedMessage(
        mockFanProfile,
        'greeting',
        { tone: 'flirty' }
      );

      expect(mockAIService.generateText).toHaveBeenCalled();
      expect(result.message).toBeTruthy();
    });

    it('should include personalization based on fan spending', async () => {
      const highSpenderProfile = {
        ...mockFanProfile,
        totalSpent: 600,
      };

      const result = await service.generatePersonalizedMessage(
        highSpenderProfile,
        'greeting'
      );

      // High spenders should get VIP treatment
      expect(result.personalizationScore).toBeGreaterThan(70);
    });

    it('should handle inactive fans appropriately', async () => {
      const inactiveFanProfile = {
        ...mockFanProfile,
        lastActive: new Date('2023-12-01'), // Over 30 days ago
      };

      const result = await service.generatePersonalizedMessage(
        inactiveFanProfile,
        'reactivation'
      );

      expect(result.message).toBeTruthy();
      expect(result.suggestions).toContain('Acknowledge their absence gently');
    });

    it('should provide relevant suggestions', async () => {
      const result = await service.generatePersonalizedMessage(
        mockFanProfile,
        'upsell'
      );

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Should include timezone-based suggestions
      if (mockFanProfile.demographics.timezone) {
        const timingSuggestion = result.suggestions.find(s => 
          s.includes('timezone') || s.includes('peak hours')
        );
        expect(timingSuggestion).toBeDefined();
      }
    });
  });

  describe('template management', () => {
    it('should add new templates', () => {
      const newTemplate: Omit<MessageTemplate, 'performance'> = {
        id: 'custom-greeting',
        name: 'Custom Greeting',
        category: 'greeting',
        template: 'Hello {{fanName}}! Custom message here.',
        variables: ['fanName'],
        toneOptions: ['friendly'],
        targetAudience: {
          subscriptionTiers: ['basic'],
          spendingLevels: ['low'],
          activityLevels: ['active'],
        },
      };

      service.addTemplate(newTemplate);
      const templates = service.getTemplates('greeting');
      
      expect(templates.some(t => t.id === 'custom-greeting')).toBe(true);
    });

    it('should update template performance', () => {
      const templateId = 'greeting-new-subscriber';
      
      service.updateTemplatePerformance(templateId, {
        responseRate: 80,
        conversionRate: 15,
        usageCount: 100,
      });

      const performance = service.getTemplatePerformance();
      const updatedTemplate = performance.find(p => p.templateId === templateId);
      
      expect(updatedTemplate).toBeDefined();
      expect(updatedTemplate?.performance.responseRate).toBe(80);
      expect(updatedTemplate?.performance.conversionRate).toBe(15);
      expect(updatedTemplate?.performance.usageCount).toBe(100);
    });

    it('should filter templates by category', () => {
      const greetingTemplates = service.getTemplates('greeting');
      const upsellTemplates = service.getTemplates('upsell');

      expect(greetingTemplates.every(t => t.category === 'greeting')).toBe(true);
      expect(upsellTemplates.every(t => t.category === 'upsell')).toBe(true);
      expect(greetingTemplates.length).toBeGreaterThan(0);
      expect(upsellTemplates.length).toBeGreaterThan(0);
    });

    it('should return all templates when no category specified', () => {
      const allTemplates = service.getTemplates();
      const greetingTemplates = service.getTemplates('greeting');
      const upsellTemplates = service.getTemplates('upsell');

      expect(allTemplates.length).toBeGreaterThanOrEqual(
        greetingTemplates.length + upsellTemplates.length
      );
    });
  });

  describe('personalization scoring', () => {
    it('should score template matches correctly', async () => {
      // VIP fan should get high score for VIP-targeted templates
      const vipResult = await service.generatePersonalizedMessage(
        mockFanProfile,
        'upsell'
      );

      // Basic fan should get lower score for VIP-targeted templates
      const basicFanProfile = {
        ...mockFanProfile,
        subscriptionTier: 'basic' as const,
        totalSpent: 20,
      };

      const basicResult = await service.generatePersonalizedMessage(
        basicFanProfile,
        'upsell'
      );

      expect(vipResult.personalizationScore).toBeGreaterThan(
        basicResult.personalizationScore
      );
    });

    it('should consider interaction history in scoring', async () => {
      const activeProfile = {
        ...mockFanProfile,
        interactionHistory: [
          { type: 'message' as const, content: 'Hi', timestamp: new Date() },
          { type: 'tip' as const, amount: 25, timestamp: new Date() },
          { type: 'purchase' as const, amount: 50, timestamp: new Date() },
        ],
      };

      const inactiveProfile = {
        ...mockFanProfile,
        interactionHistory: [],
      };

      const activeResult = await service.generatePersonalizedMessage(
        activeProfile,
        'greeting'
      );

      const inactiveResult = await service.generatePersonalizedMessage(
        inactiveProfile,
        'greeting'
      );

      expect(activeResult.personalizationScore).toBeGreaterThan(
        inactiveResult.personalizationScore
      );
    });

    it('should factor loyalty score into personalization', async () => {
      const loyalProfile = {
        ...mockFanProfile,
        behaviorMetrics: {
          ...mockFanProfile.behaviorMetrics,
          loyaltyScore: 95,
        },
      };

      const newProfile = {
        ...mockFanProfile,
        behaviorMetrics: {
          ...mockFanProfile.behaviorMetrics,
          loyaltyScore: 30,
        },
      };

      const loyalResult = await service.generatePersonalizedMessage(
        loyalProfile,
        'greeting'
      );

      const newResult = await service.generatePersonalizedMessage(
        newProfile,
        'greeting'
      );

      expect(loyalResult.personalizationScore).toBeGreaterThan(
        newResult.personalizationScore
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle minimal fan profile', async () => {
      const minimalProfile: FanProfile = {
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

      const result = await service.generatePersonalizedMessage(
        minimalProfile,
        'greeting'
      );

      expect(result.message).toBeTruthy();
      expect(result.personalizationScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle AI service errors gracefully', async () => {
      mockAIService.generateText.mockRejectedValue(new Error('AI service unavailable'));

      // Should fall back to template-based generation
      const result = await service.generatePersonalizedMessage(
        mockFanProfile,
        'greeting'
      );

      expect(result.message).toBeTruthy();
      expect(result.template).toBeDefined();
    });

    it('should handle missing template variables', async () => {
      const profileWithoutName = {
        ...mockFanProfile,
        name: '',
      };

      const result = await service.generatePersonalizedMessage(
        profileWithoutName,
        'greeting'
      );

      expect(result.message).toBeTruthy();
      // Should not contain empty variable placeholders
      expect(result.message).not.toContain('{{');
    });

    it('should validate message options', async () => {
      const result = await service.generatePersonalizedMessage(
        mockFanProfile,
        'greeting',
        { 
          tone: 'invalid-tone' as any,
          maxLength: -1,
        }
      );

      // Should handle invalid options gracefully
      expect(result.message).toBeTruthy();
    });
  });

  describe('performance and caching', () => {
    it('should handle concurrent message generation', async () => {
      const promises = Array(5).fill(null).map(() =>
        service.generatePersonalizedMessage(mockFanProfile, 'greeting')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.message).toBeTruthy();
        expect(result.personalizationScore).toBeGreaterThan(0);
      });
    });

    it('should complete message generation within reasonable time', async () => {
      const startTime = Date.now();
      
      await service.generatePersonalizedMessage(mockFanProfile, 'greeting');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = getMessagePersonalizationService();
      const instance2 = getMessagePersonalizationService();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across calls', () => {
      const service1 = getMessagePersonalizationService();
      const service2 = getMessagePersonalizationService();

      const newTemplate: Omit<MessageTemplate, 'performance'> = {
        id: 'test-singleton',
        name: 'Test Singleton',
        category: 'custom',
        template: 'Test message',
        variables: [],
        toneOptions: ['friendly'],
        targetAudience: {
          subscriptionTiers: ['basic'],
          spendingLevels: ['low'],
          activityLevels: ['active'],
        },
      };

      service1.addTemplate(newTemplate);
      
      const templates = service2.getTemplates();
      expect(templates.some(t => t.id === 'test-singleton')).toBe(true);
    });
  });
});