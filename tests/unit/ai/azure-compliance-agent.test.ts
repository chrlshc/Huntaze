/**
 * Unit Tests - Azure ComplianceAgent
 * 
 * Feature: huntaze-ai-azure-migration, Task 13
 * Requirements: 2.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('../../../lib/ai/azure/azure-openai-router', () => ({
  azureOpenAIRouter: {
    chat: vi.fn(),
    generateText: vi.fn(),
  },
}));

vi.mock('../../../lib/ai/azure/cost-tracking.service', () => ({
  getCostTrackingService: vi.fn(),
}));

vi.mock('../../../lib/ai/knowledge-network', () => ({
  AIKnowledgeNetwork: vi.fn().mockImplementation(() => ({
    queryInsights: vi.fn(),
    broadcastInsight: vi.fn(),
  })),
}));

import { AzureComplianceAgent } from '../../../lib/ai/agents/compliance.azure';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';
import { azureOpenAIRouter } from '../../../lib/ai/azure/azure-openai-router';
import { getCostTrackingService } from '../../../lib/ai/azure/cost-tracking.service';

describe('AzureComplianceAgent', () => {
  let agent: AzureComplianceAgent;
  let mockNetwork: any;
  let mockCostTracker: any;

  beforeEach(() => {
    mockNetwork = {
      queryInsights: vi.fn().mockResolvedValue([]),
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
    };
    mockCostTracker = {
      logUsage: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(getCostTrackingService).mockReturnValue(mockCostTracker);
    
    // Create agent AFTER mocking getCostTrackingService
    agent = new AzureComplianceAgent();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Configuration', () => {
    it('should use GPT-3.5 Turbo model (economy tier)', () => {
      expect(agent.model).toBe('gpt-35-turbo');
    });

    it('should have correct agent ID', () => {
      expect(agent.id).toBe('compliance-agent-azure');
    });

    it('should have content_compliance role', () => {
      expect(agent.role).toBe('content_compliance');
    });

    it('should list compliance capabilities', () => {
      const capabilities = agent.getCapabilities();
      expect(capabilities).toContain('content_compliance_check');
      expect(capabilities).toContain('policy_violation_detection');
      expect(capabilities).toContain('compliant_alternative_generation');
    });
  });

  describe('Initialization', () => {
    it('should initialize with Knowledge Network', async () => {
      await agent.initialize(mockNetwork);
      expect(agent['network']).toBe(mockNetwork);
    });
  });

  describe('Compliance Checking', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
      
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
      vi.mocked(mockNetwork.broadcastInsight).mockResolvedValue(undefined);
    });

    it('should detect compliant content', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.95,
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.checkCompliance(
        123,
        'Hey! Thanks for subscribing. Looking forward to sharing content with you!',
        'message'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should detect policy violations', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: false,
          violations: [
            {
              type: 'explicit_content',
              severity: 'high',
              description: 'Contains explicit sexual language',
              location: 'inappropriate phrase',
            },
          ],
          compliant_alternative: 'Hey! Thanks for your support. Check out my latest content!',
          confidence: 0.92,
        }),
        usage: {
          promptTokens: 180,
          completionTokens: 80,
          totalTokens: 260,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.checkCompliance(
        123,
        'Some inappropriate content here',
        'message'
      );

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('explicit_content');
      expect(result.violations[0].severity).toBe('high');
      expect(result.compliantAlternative).toBeDefined();
    });

    it('should provide compliant alternatives for violations', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: false,
          violations: [
            {
              type: 'spam',
              severity: 'medium',
              description: 'Excessive promotional language',
            },
          ],
          compliant_alternative: 'Check out my new content! Link in bio.',
          confidence: 0.88,
        }),
        usage: {
          promptTokens: 160,
          completionTokens: 70,
          totalTokens: 230,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.checkCompliance(
        123,
        'BUY NOW!!! LIMITED TIME!!! CLICK HERE!!!',
        'post'
      );

      expect(result.isCompliant).toBe(false);
      expect(result.compliantAlternative).toBeDefined();
      expect(result.compliantAlternative).not.toContain('!!!');
    });

    it('should handle multiple violations', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: false,
          violations: [
            {
              type: 'hate_speech',
              severity: 'critical',
              description: 'Contains discriminatory language',
            },
            {
              type: 'harassment',
              severity: 'high',
              description: 'Bullying or threatening language',
            },
          ],
          compliant_alternative: 'Please be respectful in your communications.',
          confidence: 0.96,
        }),
        usage: {
          promptTokens: 200,
          completionTokens: 90,
          totalTokens: 290,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.checkCompliance(
        123,
        'Offensive content with multiple issues',
        'comment'
      );

      expect(result.violations).toHaveLength(2);
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true);
    });
  });

  describe('Platform-Specific Rules', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
    });

    it('should apply OnlyFans-specific rules', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.90,
        }),
        usage: {
          promptTokens: 170,
          completionTokens: 60,
          totalTokens: 230,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(
        123,
        'Adult content with proper warnings',
        'post',
        { platform: 'onlyfans' }
      );

      const chatCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const systemPrompt = chatCall[0][0].content;
      expect(systemPrompt).toContain('OnlyFans');
    });

    it('should apply Instagram-specific rules', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.91,
        }),
        usage: {
          promptTokens: 165,
          completionTokens: 55,
          totalTokens: 220,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(
        123,
        'Family-friendly content',
        'post',
        { platform: 'instagram' }
      );

      const chatCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const systemPrompt = chatCall[0][0].content;
      expect(systemPrompt).toContain('Instagram');
    });
  });

  describe('Content Filtering', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
    });

    it('should use Azure OpenAI content filtering', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.93,
        }),
        usage: {
          promptTokens: 155,
          completionTokens: 52,
          totalTokens: 207,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(123, 'Test content', 'message');

      const routerCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const options = routerCall[1];
      
      expect(options.tier).toBe('economy');
      expect(options.responseFormat).toEqual({ type: 'json_object' });
    });

    it('should use low temperature for consistent checks', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.94,
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(123, 'Test content', 'message');

      const routerCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const options = routerCall[1];
      
      expect(options.temperature).toBe(0.3);
    });
  });

  describe('Knowledge Network Integration', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
    });

    it('should query compliance insights from network', async () => {
      const mockInsights = [
        {
          id: 'insight-1',
          agentId: 'compliance-agent-azure',
          topic: 'compliance_patterns',
          content: 'Common spam pattern detected',
          confidence: 0.85,
          timestamp: new Date(),
        },
      ];

      vi.mocked(mockNetwork.queryInsights).mockResolvedValue(mockInsights);
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.90,
        }),
        usage: {
          promptTokens: 180,
          completionTokens: 60,
          totalTokens: 240,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(123, 'Test content', 'message');

      expect(mockNetwork.queryInsights).toHaveBeenCalledWith({
        agentId: 'compliance-agent-azure',
        topic: 'compliance_patterns',
        limit: 5,
      });
    });

    it('should broadcast high-confidence violations', async () => {
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: false,
          violations: [
            {
              type: 'spam',
              severity: 'high',
              description: 'Excessive promotional content',
            },
          ],
          confidence: 0.92,
        }),
        usage: {
          promptTokens: 170,
          completionTokens: 70,
          totalTokens: 240,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(123, 'Spam content', 'post');

      expect(mockNetwork.broadcastInsight).toHaveBeenCalled();
      const broadcastCall = vi.mocked(mockNetwork.broadcastInsight).mock.calls[0];
      const insight = broadcastCall[0];
      
      expect(insight.topic).toBe('compliance_patterns');
      expect(insight.confidence).toBeGreaterThan(0.8);
    });

    it('should not broadcast low-confidence results', async () => {
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: false,
          violations: [
            {
              type: 'unclear',
              severity: 'low',
              description: 'Potentially problematic',
            },
          ],
          confidence: 0.65,
        }),
        usage: {
          promptTokens: 160,
          completionTokens: 65,
          totalTokens: 225,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(123, 'Ambiguous content', 'message');

      expect(mockNetwork.broadcastInsight).not.toHaveBeenCalled();
    });
  });

  describe('Cost Tracking', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
    });

    it('should log usage to cost tracker', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.90,
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await agent.checkCompliance(
        123,
        'Test content',
        'message',
        undefined,
        'test-account',
        'pro'
      );

      expect(mockCostTracker.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'test-account',
          plan: 'pro',
          deployment: 'gpt-35-turbo',
          tier: 'economy',
          operation: 'compliance_check',
          tokensInput: 150,
          tokensOutput: 50,
          success: true,
        })
      );
    });

    it('should calculate costs correctly', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.90,
        }),
        usage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      const result = await agent.checkCompliance(123, 'Test content', 'message');

      // GPT-3.5 Turbo: $0.0015/1K input, $0.002/1K output
      const expectedCost = (1000 / 1000) * 0.0015 + (500 / 1000) * 0.002;
      expect(result.usage.estimatedCost).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
    });

    it('should handle Azure OpenAI errors gracefully', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockRejectedValue(
        new Error('Azure OpenAI service unavailable')
      );

      const response = await agent.processRequest({
        creatorId: 123,
        content: 'Test content',
        contentType: 'message',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Azure OpenAI service unavailable');
    });

    it('should handle invalid JSON responses', async () => {
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: 'Invalid JSON',
        usage: {
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });

      await expect(
        agent.checkCompliance(123, 'Test content', 'message')
      ).rejects.toThrow();
    });
  });

  describe('Content Type Handling', () => {
    beforeEach(async () => {
      await agent.initialize(mockNetwork);
      vi.mocked(mockNetwork.queryInsights).mockResolvedValue([]);
      vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
        text: JSON.stringify({
          is_compliant: true,
          violations: [],
          confidence: 0.90,
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 50,
          totalTokens: 200,
        },
        model: 'gpt-35-turbo',
        finishReason: 'stop',
      });
    });

    it('should handle message content type', async () => {
      await agent.checkCompliance(123, 'Test message', 'message');
      
      const chatCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const userPrompt = chatCall[0][1].content;
      expect(userPrompt).toContain('message');
    });

    it('should handle post content type', async () => {
      await agent.checkCompliance(123, 'Test post', 'post');
      
      const chatCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const userPrompt = chatCall[0][1].content;
      expect(userPrompt).toContain('post');
    });

    it('should handle caption content type', async () => {
      await agent.checkCompliance(123, 'Test caption', 'caption');
      
      const chatCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[0];
      const userPrompt = chatCall[0][1].content;
      expect(userPrompt).toContain('caption');
    });
  });
});
